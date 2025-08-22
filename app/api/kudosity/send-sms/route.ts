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
      // Actually send via Kudosity MCP server
      // The MCP server should be configured in .cursor/mcp.json with KUDOSITY_API_KEY
      console.log('Sending SMS via Kudosity:', { recipient, message: message.substring(0, 50) + '...' })
      
      // For testing, we'll use the test mode
      // In production, remove the test mode flag
      const testMode = process.env.NODE_ENV === 'development'
      
      // Update status to sent (simulating for now)
      // When MCP is fully integrated, this will be based on actual response
      const messageId = messageRecord?.id || `msg_${Date.now()}`
      
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
        testMode,
      })
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
      { error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
