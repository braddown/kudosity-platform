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
      // Check if user needs to create an organization
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has any organizations
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')

        // If no organizations, redirect to organization setup
        if (!memberships || memberships.length === 0) {
          return NextResponse.redirect(`${origin}/auth/setup-organization`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}

