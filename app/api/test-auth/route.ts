import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get cookies
    const cookieStore = await cookies()
    const currentAccount = cookieStore.get('current_account')?.value
    
    // Get user profile if user exists
    let profile = null
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      profile = profileData
      
      console.log('Profile query error:', profileError)
    }
    
    // Get account membership if user and account exist
    let membership = null
    if (user && currentAccount) {
      const { data: memberData, error: memberError } = await supabase
        .from('account_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', currentAccount)
        .single()
      
      membership = memberData
      
      console.log('Membership query error:', memberError)
    }
    
    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      currentAccount,
      profile,
      membership,
      sessionError: sessionError?.message,
      userError: userError?.message,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
