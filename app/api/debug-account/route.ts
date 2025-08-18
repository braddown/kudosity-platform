import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: 'Not authenticated',
        userError: userError?.message,
        sessionError: sessionError?.message,
        hasSession: !!session,
        sessionDetails: session ? {
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user_email: session.user?.email
        } : null,
        debugInfo: {
          message: 'You are not authenticated. Please log in first.',
          nextStep: 'Go to /auth/login to sign in'
        }
      }, { status: 200 }) // Return 200 so the page can display this info
    }
    
    // Get all account memberships for this user
    const { data: memberships, error: memberError } = await supabase
      .from('account_members')
      .select(`
        *,
        account:accounts(*)
      `)
      .eq('user_id', user.id)
    
    // Get current account cookie
    const cookieStore = await cookies()
    const currentAccountId = cookieStore.get('current_account')?.value
    
    // Try to get a specific membership if account cookie exists
    let currentMembership = null
    if (currentAccountId) {
      const { data: memberData } = await supabase
        .from('account_members')
        .select(`
          *,
          account:accounts(*)
        `)
        .eq('user_id', user.id)
        .eq('account_id', currentAccountId)
        .eq('status', 'active')
        .single()
      
      currentMembership = memberData
    }
    
    // Check what the middleware query would return
    const { data: middlewareCheck } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      currentAccountId,
      currentMembership,
      allMemberships: memberships,
      membershipCount: memberships?.length || 0,
      middlewareCheckResult: middlewareCheck,
      middlewareWouldRedirect: !middlewareCheck || middlewareCheck.length === 0,
      debug: {
        memberError: memberError?.message,
        query: `
          SELECT * FROM account_members 
          WHERE user_id = '${user.id}' 
          AND status = 'active'
        `
      }
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

// POST endpoint to fix account membership if needed
export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        userError: userError?.message
      }, { status: 401 })
    }
    
    // Check if user has any accounts
    const { data: memberships } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
    
    if (memberships && memberships.length > 0) {
      return NextResponse.json({
        message: 'User already has active account memberships',
        memberships
      })
    }
    
    // Check if there's an existing Kudosity account we can add the user to
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('slug', 'kudosity')
      .single()
    
    if (existingAccount) {
      // Add user as a member to the existing account
      const { data: newMembership, error: memberError } = await supabase
        .from('account_members')
        .insert({
          account_id: existingAccount.id,
          user_id: user.id,
          role: 'admin',
          status: 'active'
        })
        .select()
        .single()
      
      if (memberError) {
        return NextResponse.json({
          error: 'Failed to add user to existing account',
          details: memberError
        }, { status: 500 })
      }
      
      // Set the account cookie
      const response = NextResponse.json({
        message: 'Added user to existing Kudosity account',
        account: existingAccount,
        membership: newMembership
      })
      
      response.cookies.set('current_account', existingAccount.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
      
      return response
    }
    
    // Create a new account for the user
    const accountName = user.email?.split('@')[0] || 'My Workspace'
    const slug = accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Create account
    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: `${accountName}'s Workspace`,
        slug: `${slug}-${Date.now()}`,
        created_by: user.id
      })
      .select()
      .single()
    
    if (accountError) {
      return NextResponse.json({
        error: 'Failed to create account',
        details: accountError
      }, { status: 500 })
    }
    
    // Create membership
    const { data: newMembership, error: memberError } = await supabase
      .from('account_members')
      .insert({
        account_id: newAccount.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      })
      .select()
      .single()
    
    if (memberError) {
      // Clean up account if membership creation fails
      await supabase.from('accounts').delete().eq('id', newAccount.id)
      
      return NextResponse.json({
        error: 'Failed to create membership',
        details: memberError
      }, { status: 500 })
    }
    
    // Set the account cookie
    const response = NextResponse.json({
      message: 'Created new account and membership',
      account: newAccount,
      membership: newMembership
    })
    
    response.cookies.set('current_account', newAccount.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    return response
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
