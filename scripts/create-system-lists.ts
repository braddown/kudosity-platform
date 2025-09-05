#!/usr/bin/env tsx
/**
 * Script to create missing system lists
 * Run with: npx tsx scripts/create-system-lists.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { logger } from "@/lib/utils/logger"

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Missing required environment variables')
  logger.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Clean the service key
const cleanKey = supabaseServiceKey.replace(/\s+/g, '')

const supabase = createClient(supabaseUrl, cleanKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createSystemLists() {
  logger.debug('🔧 Creating missing system lists...\n')

  // Define system lists that should exist
  const systemLists = [
    {
      name: 'Active',
      description: 'All active profiles',
      type: 'System',
      source: 'System',
      tags: ['system', 'active'],
      shared: true
    },
    {
      name: 'Inactive', 
      description: 'All inactive profiles',
      type: 'System',
      source: 'System',
      tags: ['system', 'inactive'],
      shared: true
    },
    {
      name: 'Deleted',
      description: 'All deleted profiles',
      type: 'System',
      source: 'System',
      tags: ['system', 'deleted'],
      shared: true
    },
    {
      name: 'Marketing Enabled',
      description: 'Profiles with marketing channels enabled',
      type: 'System',
      source: 'System',
      tags: ['system', 'marketing'],
      shared: true
    },
    {
      name: 'Unsubscribed',
      description: 'Profiles that have unsubscribed from all marketing',
      type: 'System',
      source: 'System',
      tags: ['system', 'unsubscribed'],
      shared: true
    },
    {
      name: 'Suppressed',
      description: 'Suppressed profiles',
      type: 'System',
      source: 'System',
      tags: ['system', 'suppressed'],
      shared: true
    },
    {
      name: 'Operators',
      description: 'Account owners and users with operator permissions',
      type: 'System',
      source: 'System',
      tags: ['system', 'operators'],
      shared: true
    },
    {
      name: 'Wrong Number',
      description: 'Phone numbers marked as wrong/invalid',
      type: 'System',
      source: 'System',
      tags: ['system', 'wrong-number'],
      shared: true
    }
  ]

  try {
    // Get existing lists
    const { data: existingLists, error: fetchError } = await supabase
      .from('lists')
      .select('name')

    if (fetchError) {
      logger.error('❌ Error fetching existing lists:', fetchError)
      return
    }

    const existingNames = existingLists?.map(l => l.name.toLowerCase()) || []
    logger.debug(`📊 Found ${existingNames.length} existing lists\n`)

    let created = 0
    let skipped = 0

    for (const list of systemLists) {
      if (existingNames.includes(list.name.toLowerCase())) {
        logger.debug(`⏭️  Skipping "${list.name}" - already exists`)
        skipped++
      } else {
        logger.debug(`➕ Creating "${list.name}"...`)
        
        const { error } = await supabase
          .from('lists')
          .insert({
            ...list,
            contact_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          logger.error(`   ❌ Failed to create: ${error.message}`)
        } else {
          logger.debug(`   ✅ Created successfully`)
          created++
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    logger.debug('📊 SUMMARY:')
    console.log('='.repeat(60))
    logger.debug(`✅ Created ${created} new system lists`)
    logger.debug(`⏭️  Skipped ${skipped} existing lists`)
    logger.debug('\n✨ System lists setup completed!')

  } catch (error) {
    logger.error('❌ Unexpected error:', error)
  }
}

// Run the setup
createSystemLists()
