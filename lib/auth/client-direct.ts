import { createBrowserClient } from '@supabase/ssr'
import { logger } from "@/lib/utils/logger"

// Create Supabase client for browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Create account using direct inserts (bypassing RPC)
export async function createAccountDirect(name: string) {
  const supabase = createClient()
  
  logger.debug('Creating account directly with name:', name)
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  logger.debug('Current user:', user?.id, user?.email)
  
  if (userError || !user) {
    logger.error('User error:', userError)
    throw new Error('Not authenticated')
  }

  // Generate unique slug with timestamp
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const slug = `${baseSlug}-${Date.now()}`
  
  logger.debug('Generated unique slug:', slug)

  try {
    // First, create the account
    logger.debug('Creating account...')
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: name,
        slug: slug,
        created_by: user.id
      })
      .select()
      .single()
    
    if (accountError) {
      logger.error('Account creation failed:', accountError)
      throw accountError
    }
    
    logger.debug('Account created:', accountData)
    
    // Then create the membership
    logger.debug('Creating membership...')
    const { data: membershipData, error: membershipError } = await supabase
      .from('account_members')
      .insert({
        account_id: accountData.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (membershipError) {
      logger.error('Membership creation failed:', membershipError)
      // Try to clean up the account
      await supabase.from('accounts').delete().eq('id', accountData.id)
      throw membershipError
    }
    
    logger.debug('Membership created:', membershipData)
    
    const account = {
      id: accountData.id,
      name: accountData.name,
      slug: accountData.slug
    }
    
    logger.debug('Account created successfully:', account)
    
    // Set as current account
    document.cookie = `current_account=${account.id}; path=/; max-age=${60 * 60 * 24 * 30}`
    
    logger.debug('Cookie set, redirecting...')
    
    // Force redirect
    window.location.href = '/overview'
    
    return account
  } catch (error: any) {
    logger.error('Account creation error:', error)
    throw new Error(error.message || 'Failed to create account')
  }
}
