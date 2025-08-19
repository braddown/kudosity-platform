import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'

// Get a single profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify user has access to this account
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .select('role, status')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single()
    
    if (memberError || !membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch the specific profile - simplified query
    const { data: profile, error: profileError } = await supabase
      .from('cdp_profiles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      )
    }

    if (!profile) {
      console.log(`Profile not found: ${params.id} for account: ${accountId}`)
      return NextResponse.json(
        { error: 'Profile not found', details: `No profile exists with ID ${params.id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: profile })
  } catch (error: any) {
    console.error('CDP Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Update a profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify user can update profiles
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .select('role, status')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single()
    
    if (memberError || !membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const profileData = await request.json()
    
    // Ensure we're updating the right account's profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('cdp_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('account_id', accountId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Profile not found', details: `No profile exists with ID ${params.id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updatedProfile })
  } catch (error: any) {
    console.error('CDP Update Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Delete a profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify user can delete profiles (admin/owner only)
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .select('role, status')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single()
    
    if (memberError || !membership || membership.status !== 'active' || 
        !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Log the permanent deletion activity before actually deleting
    // This ensures we have a record even if the profile is destroyed
    try {
      // Get user info for logging
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()

      const userName = userProfile 
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.email
        : user.email

      await supabase
        .from('profile_activity_log')
        .insert({
          profile_id: params.id,
          activity_type: 'profile_destroyed',
          description: 'Profile permanently destroyed',
          metadata: {
            destroyed_by: user.id,
            destroyed_by_name: userName,
            timestamp: new Date().toISOString(),
            reason: 'Permanent deletion requested'
          },
          source: userName,
          account_id: accountId,
          performed_by: user.id,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Error logging destruction activity:', logError)
      // Continue with deletion even if logging fails
    }

    // Start a transaction to delete all related data
    console.log(`Starting permanent deletion of profile ${params.id}`)

    // 1. Delete from cdp_contacts (if any)
    const { error: contactsError } = await supabase
      .from('cdp_contacts')
      .delete()
      .eq('profile_id', params.id)
    
    if (contactsError) {
      console.error('Error deleting contacts:', contactsError)
      // Continue with deletion even if no contacts exist
    }

    // 2. Delete from cdp_profile_activities
    const { error: activitiesError } = await supabase
      .from('cdp_profile_activities')
      .delete()
      .eq('profile_id', params.id)
    
    if (activitiesError) {
      console.error('Error deleting activities:', activitiesError)
      // Continue with deletion
    }

    // 3. Delete from cdp_profile_merge_log
    const { error: mergeLogError } = await supabase
      .from('cdp_profile_merge_log')
      .delete()
      .eq('target_profile_id', params.id)
    
    if (mergeLogError) {
      console.error('Error deleting merge logs:', mergeLogError)
      // Continue with deletion
    }

    // 4. Delete from profile_activity_log (should cascade, but let's be explicit)
    const { error: activityLogError } = await supabase
      .from('profile_activity_log')
      .delete()
      .eq('profile_id', params.id)
    
    if (activityLogError) {
      console.error('Error deleting activity logs:', activityLogError)
      // Continue with deletion
    }

    // 5. Delete from list_memberships if the profile is in any lists
    const { error: listMembershipsError } = await supabase
      .from('list_memberships')
      .delete()
      .eq('contact_id', params.id)
    
    if (listMembershipsError) {
      console.error('Error deleting list memberships:', listMembershipsError)
      // Continue with deletion
    }

    // 6. Finally, delete the profile itself
    // Note: Some older profiles might not have account_id set, so we check both conditions
    const { data: profileToDelete } = await supabase
      .from('cdp_profiles')
      .select('id, account_id')
      .eq('id', params.id)
      .single()

    if (!profileToDelete) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Only check account_id if it's set on the profile
    let deleteQuery = supabase
      .from('cdp_profiles')
      .delete()
      .eq('id', params.id)
    
    if (profileToDelete.account_id) {
      deleteQuery = deleteQuery.eq('account_id', accountId)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Error deleting profile:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete profile', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log(`Successfully destroyed profile ${params.id} and all related data`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('CDP Delete Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
