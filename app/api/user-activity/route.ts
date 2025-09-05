import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user activity logs
    const { data: activities, error: fetchError } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (fetchError) {
      logger.error('Error fetching user activity logs:', fetchError)
      // Return empty array instead of error for now
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({ data: activities || [] })
  } catch (error: any) {
    logger.error('Error fetching user activity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { activity_type, description, metadata } = body

    // Get user's current account
    const { data: membership } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Insert the activity log
    const { data: activity, error: insertError } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        account_id: membership?.account_id,
        activity_type,
        description,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error inserting user activity log:', insertError)
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: activity })
  } catch (error: any) {
    logger.error('Error logging user activity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to log activity' },
      { status: 500 }
    )
  }
}
