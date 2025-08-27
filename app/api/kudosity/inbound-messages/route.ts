import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user - for inbound messages, we might not have user association
    // so we'll check if user is authenticated but not filter by user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch inbound messages
    const { data: messages, error } = await supabase
      .from('inbound_messages')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching inbound messages:', error)
      return NextResponse.json({ error: 'Failed to fetch inbound messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error in inbound-messages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
