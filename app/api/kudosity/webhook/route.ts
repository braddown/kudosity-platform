import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Get webhook payload
    const payload = await request.json()
    
    // Log the webhook event
    console.log('Received Kudosity webhook:', payload)
    
    // Verify webhook signature (if Kudosity provides one)
    // const signature = request.headers.get('x-kudosity-signature')
    // if (!verifyWebhookSignature(payload, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }
    
    const supabase = createClient()
    
    // Store the webhook event
    const { error: eventError } = await supabase
      .from('kudosity_webhook_events')
      .insert({
        event_type: payload.event_type || payload.type,
        event_id: payload.event_id || payload.id,
        message_id: payload.message_id,
        payload,
        received_at: new Date().toISOString(),
      })
    
    if (eventError) {
      console.error('Failed to store webhook event:', eventError)
    }
    
    // Process the event based on type
    switch (payload.event_type || payload.type) {
      case 'sms.sent':
        await handleSmsSent(payload)
        break
        
      case 'sms.delivered':
        await handleSmsDelivered(payload)
        break
        
      case 'sms.failed':
      case 'sms.bounced':
        await handleSmsFailed(payload)
        break
        
      case 'link.clicked':
        await handleLinkClicked(payload)
        break
        
      default:
        console.log('Unknown webhook event type:', payload.event_type || payload.type)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function handleSmsSent(payload: any) {
  const supabase = createClient()
  
  // Update message status to sent
  const { error } = await supabase
    .from('message_history')
    .update({
      status: 'sent',
      sent_at: payload.sent_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('message_id', payload.message_id)
  
  if (error) {
    console.error('Failed to update message status to sent:', error)
  }
}

async function handleSmsDelivered(payload: any) {
  const supabase = createClient()
  
  // Update message status to delivered
  const { error } = await supabase
    .from('message_history')
    .update({
      status: 'delivered',
      delivered_at: payload.delivered_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('message_id', payload.message_id)
  
  if (error) {
    console.error('Failed to update message status to delivered:', error)
  }
}

async function handleSmsFailed(payload: any) {
  const supabase = createClient()
  
  // Update message status to failed or bounced
  const { error } = await supabase
    .from('message_history')
    .update({
      status: payload.event_type === 'sms.bounced' ? 'bounced' : 'failed',
      failed_at: payload.failed_at || new Date().toISOString(),
      error_message: payload.error || payload.reason,
      updated_at: new Date().toISOString(),
    })
    .eq('message_id', payload.message_id)
  
  if (error) {
    console.error('Failed to update message status to failed:', error)
  }
}

async function handleLinkClicked(payload: any) {
  const supabase = createClient()
  
  // First, find the message
  const { data: message } = await supabase
    .from('message_history')
    .select('id, click_count, first_clicked_at')
    .eq('message_id', payload.message_id)
    .single()
  
  if (!message) {
    console.error('Message not found for link click:', payload.message_id)
    return
  }
  
  // Record the click
  const { error: clickError } = await supabase
    .from('message_link_clicks')
    .insert({
      message_id: message.id,
      url: payload.url,
      short_url: payload.short_url,
      clicked_at: payload.clicked_at || new Date().toISOString(),
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
      device_type: payload.device_type,
      country: payload.country,
      city: payload.city,
    })
  
  if (clickError) {
    console.error('Failed to record link click:', clickError)
  }
  
  // Update message click count
  const { error: updateError } = await supabase
    .from('message_history')
    .update({
      click_count: (message.click_count || 0) + 1,
      first_clicked_at: message.first_clicked_at || payload.clicked_at || new Date().toISOString(),
      last_clicked_at: payload.clicked_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', message.id)
  
  if (updateError) {
    console.error('Failed to update message click count:', updateError)
  }
}
