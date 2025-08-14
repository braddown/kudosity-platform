import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    
    // Get all relevant cookies
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('supabase') || 
      c.name === 'current_account'
    )
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // If we have a user, try to get their account membership
    let accountMembership = null
    if (user) {
      const { data, error } = await supabase
        .from('account_members')
        .select(`
          *,
          accounts (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      
      accountMembership = data
      
      // If we have an account but no cookie, set it
      if (data && !cookieStore.get('current_account')) {
        cookieStore.set('current_account', data.account_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      }
    }
    
    return NextResponse.json({
      cookies: authCookies.map(c => ({ name: c.name, value: c.value ? '***' : 'empty' })),
      hasSession: !!session,
      sessionError: sessionError?.message,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userError: userError?.message,
      accountMembership,
      currentAccountCookie: cookieStore.get('current_account')?.value,
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
