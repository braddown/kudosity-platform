import { createClient } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/overview'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user needs to create an account
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has any accounts
        const { data: memberships } = await supabase
          .from('account_members')
          .select('account_id')
          .eq('user_id', user.id)
          .eq('status', 'active')

        // If no accounts, redirect to account setup
        if (!memberships || memberships.length === 0) {
          return NextResponse.redirect(`${origin}/auth/setup-account`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}

