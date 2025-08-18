import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear all cookies
    const cookieStore = await cookies()
    
    // Create response that redirects to login
    const response = NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'))
    
    // Clear the current_account cookie
    response.cookies.set('current_account', '', {
      path: '/',
      expires: new Date(0)
    })
    
    // Clear Supabase auth cookies
    response.cookies.set('sb-access-token', '', {
      path: '/',
      expires: new Date(0)
    })
    
    response.cookies.set('sb-refresh-token', '', {
      path: '/',
      expires: new Date(0)
    })
    
    return response
  } catch (error: any) {
    // Even if there's an error, still redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'))
    
    // Clear cookies anyway
    response.cookies.set('current_account', '', {
      path: '/',
      expires: new Date(0)
    })
    
    return response
  }
}
