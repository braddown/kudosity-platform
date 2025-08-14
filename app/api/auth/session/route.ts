import { createClient } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    // Get user profile with accounts
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(`
        *,
        account_members!inner (
          account_id,
          role,
          status,
          accounts (
            id,
            name,
            slug,
            logo_url,
            plan,
            plan_status
          )
        )
      `)
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      session,
      user: {
        ...session.user,
        profile,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

