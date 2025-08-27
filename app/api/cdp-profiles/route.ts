import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'

// Handle both list and individual profile fetching
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Build query with proper authentication context
    let query = supabase
      .from('cdp_profiles')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%`
      )
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: profiles, error: queryError, count } = await query

    if (queryError) {
      console.error('Error fetching profiles:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: queryError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: profiles || [],
      count: count || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('CDP Profiles API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Create a new profile
export async function POST(request: NextRequest) {
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

    // Verify user can create profiles
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
    
    // Ensure account_id is set
    profileData.account_id = accountId

    console.log('Creating profile with data:', JSON.stringify(profileData, null, 2))

    const { data: profile, error: insertError } = await supabase
      .from('cdp_profiles')
      .insert([profileData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating profile:', insertError)
      return NextResponse.json(
        { error: 'Failed to create profile', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: profile })
  } catch (error: any) {
    console.error('CDP Create Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
