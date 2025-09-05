import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'
import { logger } from "@/lib/utils/logger"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the account ID from cookie
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify the profile exists (allowing cross-account access for compatibility)
    const { data: profile, error: profileError } = await supabase
      .from('cdp_profiles')
      .select('id, account_id')
      .eq('id', params.id)
      .maybeSingle()

    if (profileError) {
      logger.error('Error fetching profile for activity:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get the request body
    const body = await request.json()
    const { activity_type, description, metadata, channel, channel_type } = body

    // Get user's name for the source field
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    const userName = userProfile 
      ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.email
      : user.email

    // Insert the activity log directly
    const { data: activity, error: insertError } = await supabase
      .from('profile_activity_log')
      .insert({
        profile_id: params.id,
        activity_type,
        channel: channel || null,
        channel_type: channel_type || null,
        description,
        metadata: {
          ...metadata,
          user_id: user.id,
          user_email: user.email,
          timestamp: new Date().toISOString()
        },
        source: userName,
        account_id: accountId,
        performed_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error inserting activity log:', insertError)
      // Don't fail the whole operation if activity logging fails
      // Just log the error and return success
      return NextResponse.json({ 
        success: true, 
        warning: 'Activity not logged',
        error: insertError.message 
      })
    }

    return NextResponse.json({ success: true, activity_id: activity?.id })
  } catch (error: any) {
    logger.error('Error logging activity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to log activity' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch activity history for a profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the account ID from cookie
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify the profile exists (allowing cross-account access for compatibility)
    const { data: profile, error: profileError } = await supabase
      .from('cdp_profiles')
      .select('id, account_id')
      .eq('id', params.id)
      .maybeSingle()

    if (profileError) {
      logger.error('Error fetching profile for activity:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Fetch activity logs directly
    const { data: activities, error: fetchError } = await supabase
      .from('profile_activity_log')
      .select('*')
      .eq('profile_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (fetchError) {
      logger.error('Error fetching activity logs:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch activity history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: activities || [] })
  } catch (error: any) {
    logger.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
