import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { logger } from "@/lib/utils/logger"

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: userError
      }, { status: 401 })
    }
    
    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const slug = `${baseSlug}-${Date.now()}`
    
    logger.debug('Creating account directly:', { name, slug, userId: user.id })
    
    // Create account directly
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name,
        slug,
        created_by: user.id
      })
      .select()
      .single()
    
    if (accountError) {
      logger.error('Account creation error:', accountError)
      return NextResponse.json({
        error: 'Failed to create account',
        details: accountError
      }, { status: 500 })
    }
    
    logger.debug('Account created:', account)
    
    // Create membership
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .insert({
        account_id: account.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      })
      .select()
      .single()
    
    if (memberError) {
      logger.error('Membership creation error:', memberError)
      // Try to clean up the account
      await supabase.from('accounts').delete().eq('id', account.id)
      
      return NextResponse.json({
        error: 'Failed to create membership',
        details: memberError
      }, { status: 500 })
    }
    
    logger.debug('Membership created:', membership)
    
    // Set cookie
    const response = NextResponse.json({
      success: true,
      account,
      membership
    })
    
    response.cookies.set('current_account', account.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    return response
  } catch (error: any) {
    logger.error('Unexpected error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
