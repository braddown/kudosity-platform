import { createBrowserClient } from '@supabase/ssr'
import { authConfig } from './config'

// Create Supabase client for browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Sign up with email and password
export async function signUp({
  email,
  password,
  fullName,
  firstName,
  lastName,
}: {
  email: string
  password: string
  fullName?: string
  firstName?: string
  lastName?: string
}) {
  const supabase = createClient()
  
  // Create user account
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        display_name: firstName || fullName?.split(' ')[0] || email.split('@')[0],
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

// Sign in with email and password
export async function signIn({
  email,
  password,
}: {
  email: string
  password: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// Sign in with OAuth provider
export async function signInWithProvider(provider: 'google' | 'github') {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

// Sign out
export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  
  // Clear account cookie
  document.cookie = 'current_account=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  
  // Redirect to login
  window.location.href = authConfig.redirects.afterLogout
}

// Send password reset email
export async function resetPassword(email: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
  return data
}

// Update password
export async function updatePassword(newPassword: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}

// Get current session
export async function getSession() {
  const supabase = createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  
  return session
}

// Get current user
export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  
  // Get user profile separately to avoid complex joins
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's accounts using the database function to avoid RLS recursion
  const { data: accounts } = await supabase
    .rpc('get_user_accounts', {
      p_user_id: user.id
    })

  return {
    ...user,
    profile,
    accounts: accounts || []
  }
}

// Create account (for new signups)
export async function createAccount(name: string) {
  const supabase = createClient()
  
  // Get just the basic user without profile/orgs to avoid recursion
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) throw new Error('Not authenticated')

  // Generate slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Use the database function to create account and membership atomically
  // This bypasses RLS and avoids recursion issues
  const { data, error } = await supabase
    .rpc('create_account_with_owner', {
      p_name: name,
      p_slug: slug,
      p_user_id: user.id,
      p_user_email: user.email || ''
    })

  if (error) {
    console.error('Account creation error:', error)
    throw new Error(error.message || 'Failed to create account')
  }

  if (!data || data.length === 0) {
    throw new Error('Account creation failed - no data returned')
  }

  const account = {
    id: data[0].account_id,
    name: data[0].account_name,
    slug: data[0].account_slug
  }

  // Set as current account
  document.cookie = `current_account=${account.id}; path=/; max-age=${60 * 60 * 24 * 30}`

  return account
}

// Switch account
export async function switchAccount(accountId: string) {
  const supabase = createClient()
  const user = await getCurrentUser()
  
  if (!user) throw new Error('Not authenticated')

  // Verify membership
  const { data: membership, error } = await supabase
    .from('account_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('account_id', accountId)
    .eq('status', 'active')
    .single()

  if (error || !membership) {
    throw new Error('Not a member of this account')
  }

  // Set account cookie
  document.cookie = `current_account=${accountId}; path=/; max-age=${60 * 60 * 24 * 30}`

  // Reload to refresh context
  window.location.reload()
  
  return membership
}
