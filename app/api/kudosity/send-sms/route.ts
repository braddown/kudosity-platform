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

    // Here we would call the Kudosity MCP server
    // For now, we'll simulate the response
    // In production, this would use the actual MCP connection
    
    // Log the message to database
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

    // Simulate successful send (replace with actual MCP call)
    const messageId = messageRecord?.id || `msg_${Date.now()}`
    
    // In production, this would be:
    // const result = await mcpClient.sendSMS({ recipient, message, sender, trackLinks })
    
    // Update status to sent
    if (messageRecord) {
      await supabase
        .from('message_history')
        .update({ 
          status: 'sent',
          message_id: messageId,
          sent_at: new Date().toISOString()
        })
        .eq('id', messageRecord.id)
    }

    return NextResponse.json({
      success: true,
      messageId,
      segments: Math.ceil(message.length / 160),
      cost: Math.ceil(message.length / 160) * 0.05,
    })

  } catch (error) {
    console.error('SMS sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
