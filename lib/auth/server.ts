import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions, hasPermission } from './config'

// Create Supabase server client for server components
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Get current user from server
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Get user profile with account memberships
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
    .eq('id', user.id)
    .single()

  return {
    ...user,
    profile,
  }
}

// Get current account from cookies or user's default
export async function getCurrentAccount() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('current_account')?.value
  
  const user = await getCurrentUser()
  if (!user || !user.profile) return null

  const memberships = user.profile.account_members || []
  
  if (accountId) {
    // Try to find the account from user's memberships
    const membership = memberships.find(
      (m: any) => m.account_id === accountId && m.status === 'active'
    )
    if (membership) {
      return {
        ...membership.accounts,
        role: membership.role,
      }
    }
  }

  // Return first active account
  const firstMembership = memberships.find((m: any) => m.status === 'active')
  if (firstMembership) {
    return {
      ...firstMembership.accounts,
      role: firstMembership.role,
    }
  }

  return null
}

// Check if user has permission in current account
export async function checkPermission(permission: string): Promise<boolean> {
  const account = await getCurrentAccount()
  if (!account) return false
  
  return hasPermission(account.role, permission)
}

// Require authentication - redirect to login if not authenticated
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

// Require specific permission - throw error if not authorized
export async function requirePermission(permission: string) {
  const user = await requireAuth()
  const hasAccess = await checkPermission(permission)
  
  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission}`)
  }
  
  return user
}

// Switch account context
export async function switchAccount(accountId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = await createClient()
  
  // Check if user is member of the account
  const { data: membership } = await supabase
    .from('account_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('account_id', accountId)
    .eq('status', 'active')
    .single()

  if (!membership) {
    throw new Error('Not a member of this account')
  }

  // Set account in cookie
  const cookieStore = await cookies()
  cookieStore.set('current_account', accountId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return membership
}

