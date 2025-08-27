import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch webhook events
    const { data: events, error } = await supabase
      .from('kudosity_webhook_events')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching webhook events:', error)
      return NextResponse.json({ error: 'Failed to fetch webhook events' }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Error in webhook-events API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
