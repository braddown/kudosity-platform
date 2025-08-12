#!/usr/bin/env npx tsx

/**
 * Test script for account creation flow
 * Tests the RLS policies and ensures no infinite recursion
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAccountCreation() {
  console.log('🧪 Testing Account Creation Flow\n')
  console.log('================================\n')

  try {
    // Step 1: Sign up a test user
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    console.log(`1️⃣  Creating test user: ${testEmail}`)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message)
      return
    }

    console.log('✅ User created successfully')
    console.log(`   User ID: ${authData.user?.id}`)

    // Step 2: Create an account
    const accountName = `Test Account ${Date.now()}`
    const accountSlug = accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    console.log(`\n2️⃣  Creating account: ${accountName}`)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: accountName,
        slug: accountSlug,
        billing_email: testEmail,
        support_email: testEmail,
      })
      .select()
      .single()

    if (accountError) {
      console.error('❌ Account creation failed:', accountError.message)
      console.error('   Details:', accountError)
      return
    }

    console.log('✅ Account created successfully')
    console.log(`   Account ID: ${account.id}`)

    // Step 3: Create account membership
    console.log(`\n3️⃣  Creating account membership`)
    const { data: membership, error: membershipError } = await supabase
      .from('account_members')
      .insert({
        account_id: account.id,
        user_id: authData.user!.id,
        role: 'owner',
        status: 'active',
      })
      .select()
      .single()

    if (membershipError) {
      console.error('❌ Membership creation failed:', membershipError.message)
      console.error('   Details:', membershipError)
      
      // Try to clean up the account
      await supabase.from('accounts').delete().eq('id', account.id)
      return
    }

    console.log('✅ Membership created successfully')
    console.log(`   Role: ${membership.role}`)

    // Step 4: Test reading account members (this is where recursion would occur)
    console.log(`\n4️⃣  Testing read access (checking for recursion)`)
    const { data: members, error: readError } = await supabase
      .from('account_members')
      .select(`
        *,
        accounts (
          id,
          name,
          slug
        )
      `)
      .eq('account_id', account.id)

    if (readError) {
      console.error('❌ Read failed (possible recursion):', readError.message)
      console.error('   Details:', readError)
      
      // Clean up
      await supabase.from('account_members').delete().eq('id', membership.id)
      await supabase.from('accounts').delete().eq('id', account.id)
      return
    }

    console.log('✅ Read successful - No recursion detected!')
    console.log(`   Found ${members.length} member(s)`)

    // Step 5: Clean up test data
    console.log(`\n5️⃣  Cleaning up test data`)
    
    // Delete membership first (due to foreign key)
    await supabase.from('account_members').delete().eq('id', membership.id)
    
    // Delete account
    await supabase.from('accounts').delete().eq('id', account.id)
    
    // Delete user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
      authData.user!.id
    )
    
    if (deleteUserError) {
      console.log('⚠️  Note: User cleanup requires service role key')
    } else {
      console.log('✅ Test data cleaned up')
    }

    console.log('\n✨ All tests passed successfully!')
    console.log('================================\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testAccountCreation().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
