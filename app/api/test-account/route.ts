import { createClient } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Test 1: Try to create account
    console.log('Creating account for user:', user.id)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name,
        slug,
        billing_email: user.email,
        support_email: user.email,
      })
      .select()
      .single()

    if (accountError) {
      console.error('Account creation error:', accountError)
      return NextResponse.json({ 
        error: 'Failed to create account',
        details: accountError.message,
        code: accountError.code,
        hint: accountError.hint
      }, { status: 400 })
    }

    // Test 2: Try to add membership
    console.log('Adding membership for account:', account.id)
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .insert({
        account_id: account.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('Membership creation error:', memberError)
      // Try to clean up the account
      await supabase.from('accounts').delete().eq('id', account.id)
      
      return NextResponse.json({ 
        error: 'Failed to create membership',
        details: memberError.message,
        code: memberError.code,
        hint: memberError.hint
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      account: account,
      membership
    })
  } catch (error: any) {
    console.error('Test org error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

