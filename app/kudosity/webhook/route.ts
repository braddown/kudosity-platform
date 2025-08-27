// This file handles webhooks directly
// Kudosity webhooks are configured to hit /kudosity/webhook

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Get webhook payload
    const payload = await request.json()
    
    // Log the webhook event
    console.log('Received Kudosity webhook at /kudosity/webhook:', JSON.stringify(payload, null, 2))
    
    // Use service role client for webhooks (no auth needed)
    const supabase = supabaseServer
    
    // Store the webhook event and get its ID
    const { data: webhookEvent, error: eventError } = await supabase
      .from('kudosity_webhook_events')
      .insert({
        event_type: payload.event || payload.event_type || payload.type,
        event_id: payload.event_id || payload.id || payload.message_id,
        message_id: payload.message_id || payload.message_ref,
        payload,
        received_at: new Date().toISOString(),
        processed: false
      })
      .select('id')
      .single()
    
    if (eventError) {
      console.error('Failed to store webhook event:', eventError)
      throw eventError
    }
    
    const eventType = payload.event || payload.event_type || payload.type
    const recordId = webhookEvent?.id
    console.log('Processing webhook event type:', eventType, 'Record ID:', recordId)
    
    // Process the event based on type
    let processed = false
    try {
      switch (eventType) {
        case 'SMS_STATUS':
          await handleSmsStatus(payload, supabase)
          processed = true
          break
        case 'SMS_INBOUND':
          await handleSmsInbound(payload, supabase)
          processed = true
          break
        case 'LINK_HIT':
          await handleLinkHit(payload, supabase)
          processed = true
          break
        default:
          console.log('Unknown event type:', eventType)
      }
    } catch (processingError) {
      console.error(`Failed to process ${eventType} event:`, processingError)
      processed = false // Don't mark as processed if handler failed
    }
    
    // Mark the event as processed if we handled it
    if (processed && recordId) {
      const { error: updateError } = await supabase
        .from('kudosity_webhook_events')
        .update({ processed: true })
        .eq('id', recordId)
      
      if (updateError) {
        console.error('Failed to mark event as processed:', updateError)
      } else {
        console.log('Marked webhook event as processed:', recordId)
      }
    }
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      event_type: eventType,
      message: 'Webhook received and processed'
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Kudosity webhook endpoint is active',
    actual_handler: '/api/kudosity/webhook'
  })
}

// Handler functions for different event types
async function handleSmsStatus(payload: any, supabase: any) {
  // Extract status data from nested structure
  const statusData = payload.status || payload
  
  console.log('Processing SMS_STATUS:', {
    status: statusData.status,
    message_ref: statusData.message_ref,
    message_id: statusData.id
  })
  
  const messageRef = statusData.message_ref || statusData.message_id
  if (!messageRef) {
    console.error('No message_ref in SMS_STATUS payload')
    return // Not an error, just skip
  }
  
  // Update message status in database
  const updateData: any = {
    status: statusData.status?.toLowerCase() || 'unknown',
    updated_at: new Date().toISOString()
  }
  
  if (statusData.status === 'DELIVERED') {
    updateData.delivered_at = payload.timestamp || new Date().toISOString()
  } else if (statusData.status === 'FAILED' || statusData.status === 'REJECTED') {
    updateData.failed_at = payload.timestamp || new Date().toISOString()
    updateData.error_message = statusData.error || 'Delivery failed'
  } else if (statusData.status === 'SENT') {
    updateData.sent_at = payload.timestamp || new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('message_history')
    .update(updateData)
    .or(`message_id.eq.${messageRef},message_ref.eq.${messageRef}`)
  
  if (error) {
    console.error('Failed to update message status:', error)
    // Don't throw for status updates as the message might not exist yet
  }
}

async function handleSmsInbound(payload: any, supabase: any) {
  // Extract inbound message data from nested structure
  const moData = payload.mo || payload
  
  console.log('Processing SMS_INBOUND:', {
    sender: moData.sender,
    recipient: moData.recipient,
    message: moData.message?.substring(0, 50)
  })
  
  // Store inbound message
  const { error } = await supabase
    .from('inbound_messages')
    .insert({
      sender: moData.sender || moData.from,
      recipient: moData.recipient || moData.to,
      message: moData.message || moData.body || moData.text,
      message_id: moData.id || moData.message_id,
      message_ref: moData.last_message?.message_ref,
      original_message_id: moData.last_message?.id,
      received_at: payload.timestamp || new Date().toISOString(),
      intent: detectIntent(moData.message || moData.body || ''),
      metadata: payload
    })
  
  if (error) {
    console.error('Failed to store inbound message:', error)
    throw error // Throw error so event won't be marked as processed
  }
}

async function handleLinkHit(payload: any, supabase: any) {
  // Extract link hit data from nested structure
  const linkData = payload.link_hit || payload
  
  console.log('Processing LINK_HIT:', {
    url: linkData.url,
    hits: linkData.hits,
    source_message: linkData.source_message
  })
  
  // Store link click (one entry per hit if multiple)
  const hits = linkData.hits || 1
  for (let i = 0; i < hits; i++) {
    const { error } = await supabase
      .from('message_link_clicks')
      .insert({
        message_ref: linkData.source_message?.message_ref || linkData.source_message?.id || linkData.message_id,
        url: linkData.url || linkData.link,
        clicked_at: payload.timestamp || new Date().toISOString(),
        ip_address: linkData.ip_address,
        user_agent: linkData.user_agent,
        device_type: linkData.device_type,
        location: linkData.location,
        metadata: payload
      })
    
    if (error) {
      console.error('Failed to store link click:', error)
    }
  }
  
  // Update click count in message history
  if (linkData.source_message?.message_ref) {
    // Update click count directly
    const { data: message } = await supabase
      .from('message_history')
      .select('click_count, first_clicked_at')
      .eq('message_ref', linkData.source_message.message_ref)
      .single()
    
    if (message) {
      await supabase
        .from('message_history')
        .update({
          click_count: (message.click_count || 0) + hits,
          first_clicked_at: message.first_clicked_at || payload.timestamp || new Date().toISOString(),
          last_clicked_at: payload.timestamp || new Date().toISOString()
        })
        .eq('message_ref', linkData.source_message.message_ref)
    }
  }
}

function detectIntent(message: string): string | null {
  const msg = message.toUpperCase()
  if (msg === 'STOP' || msg === 'UNSUBSCRIBE' || msg === 'QUIT') {
    return 'OPT_OUT'
  }
  if (msg === 'START' || msg === 'SUBSCRIBE' || msg === 'YES') {
    return 'OPT_IN'
  }
  if (msg === 'HELP' || msg === 'INFO') {
    return 'HELP'
  }
  return null
}
