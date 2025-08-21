import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/callback',
    '/auth/error',
    '/debug-account', // Temporary debug route
    '/auth/setup-account-alt', // Alternative setup page for debugging
  ]

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // API routes that should be accessible with authentication but not redirect to login
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  
  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !isApiRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // For API routes without authentication, return 401 instead of redirecting
  // Allow certain API endpoints that handle their own authentication
  const allowedApiRoutes = [
    '/api/auth',
    '/api/debug-account',
    '/api/force-logout',
    '/api/test-db',
    '/api/lists',  // Lists API handles its own auth
  ]
  
  const isAllowedApiRoute = allowedApiRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (!user && isApiRoute && !isAllowedApiRoute) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user needs to set up account (but not if they're on setup pages or trying to logout)
  if (user && 
      !request.nextUrl.pathname.includes('auth/setup-account') && 
      !request.nextUrl.pathname.includes('/api/force-logout') &&
      !request.nextUrl.pathname.includes('/debug-account') &&
      !request.nextUrl.pathname.includes('/api/create-account-direct')) {
    
    // Try to check memberships, but handle RLS errors gracefully
    try {
      const { data: memberships, error: membershipError } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      if (membershipError) {
        console.error('Middleware: Error checking memberships:', membershipError)
        // If there's an RLS error, assume user might have accounts and continue
        // The actual pages will handle the authorization
      } else if (!memberships || memberships.length === 0) {
        // User has no accounts, redirect to setup (unless they're already on an auth page)
        if (!request.nextUrl.pathname.startsWith('/auth/')) {
          return NextResponse.redirect(new URL('/auth/setup-account', request.url))
        }
      } else {
        // User has accounts
        // Check if current_account cookie is set, if not set it to the first account
        const currentAccountCookie = request.cookies.get('current_account')
        if (!currentAccountCookie && memberships.length > 0) {
          response.cookies.set('current_account', memberships[0].account_id, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
          })
        }
        
        // Don't let them access login/signup pages
        if (user && isPublicRoute && !request.nextUrl.pathname.includes('setup-account')) {
          return NextResponse.redirect(new URL('/overview', request.url))
        }
      }
    } catch (error) {
      console.error('Middleware: Unexpected error checking memberships:', error)
      // Continue without redirecting on error
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

