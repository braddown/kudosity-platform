import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { recipient, message, sender, messageRef, trackLinks } = body

    // Validate required fields
    if (!recipient || !message) {
      return NextResponse.json(
        { error: 'Recipient and message are required' },
        { status: 400 }
      )
    }

    // Log the message to database first
    const { data: messageRecord, error: dbError } = await supabase
      .from('message_history')
      .insert({
        user_id: user.id,
        recipient,
        message,
        sender: sender || 'KUDOSITY',
        status: 'pending',
        segments: Math.ceil(message.length / 160),
        track_links: trackLinks !== false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to log message:', dbError)
    }

    try {
      // Use the v2 API as shown in the MCP server
      const apiKey = process.env.KUDOSITY_API_KEY || '53ec769b09dd4331797240f0c7be430f'
      
      console.log('Sending SMS via Kudosity v2 API:', { 
        recipient, 
        sender,
        message: message.substring(0, 50) + '...' 
      })
      
      // Format the request payload exactly as the MCP server does
      // Clean up the recipient - remove spaces and + sign
      const cleanRecipient = recipient.replace(/[\s+]/g, '')
      
      const payload = {
        recipient: cleanRecipient,
        message: message,
        sender: String(sender || 'KUDOSITY'), // Ensure sender is always a string
        message_ref: messageRef || `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        track_links: trackLinks !== false
      }
      
      console.log('SMS payload:', payload)
      
      // Call the v2 API to send SMS - using exact same endpoint and headers as MCP
      const sendResponse = await fetch('https://api.transmitmessage.com/v2/sms', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Kudosity-Platform/1.0.0'
        },
        body: JSON.stringify(payload),
      })
      
      let sendResult
      try {
        sendResult = await sendResponse.json()
      } catch (e) {
        console.error('Failed to parse response as JSON:', e)
        const text = await sendResponse.text()
        console.error('Response text:', text)
        sendResult = { error: text }
      }
      
      console.log('Kudosity send response:', {
        status: sendResponse.status,
        statusText: sendResponse.statusText,
        result: sendResult
      })
      
      // Check for success - v2 API returns message_id or id on success
      if (sendResponse.ok && (sendResult.message_id || sendResult.id)) {
        const messageId = sendResult.message_id || sendResult.id
        
        // Update status to sent with real message ID
        if (messageRecord) {
          await supabase
            .from('message_history')
            .update({ 
              status: 'sent',
              message_id: messageId,
              sent_at: new Date().toISOString(),
              cost: sendResult.cost || Math.ceil(message.length / 160) * 0.05
            })
            .eq('id', messageRecord.id)
        }

        return NextResponse.json({
          success: true,
          messageId: messageId,
          segments: sendResult.message_parts || sendResult.segments || Math.ceil(message.length / 160),
          cost: sendResult.cost || Math.ceil(message.length / 160) * 0.05,
          response: sendResult // Include full response for debugging
        })
      } else {
        // Log the full error for debugging
        console.error('SMS send failed:', {
          status: sendResponse.status,
          statusText: sendResponse.statusText,
          result: sendResult
        })
        
        // Extract error message from response
        const errorMessage = sendResult.message || sendResult.error || sendResult.error_message || 
                           `Failed to send SMS (HTTP ${sendResponse.status})`
        throw new Error(errorMessage)
      }
    } catch (sendError) {
      // Update status to failed
      if (messageRecord) {
        await supabase
          .from('message_history')
          .update({ 
            status: 'failed',
            error_message: sendError instanceof Error ? sendError.message : 'Unknown error',
            failed_at: new Date().toISOString()
          })
          .eq('id', messageRecord.id)
      }
      
      throw sendError
    }

  } catch (error) {
    console.error('SMS sending error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
