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

    // Delete the profile
    const { error: deleteError } = await supabase
      .from('cdp_profiles')
      .delete()
      .eq('id', params.id)
      .eq('account_id', accountId)

    if (deleteError) {
      console.error('Error deleting profile:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete profile', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('CDP Delete Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
