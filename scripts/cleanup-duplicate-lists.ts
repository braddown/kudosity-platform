#!/usr/bin/env tsx
/**
 * Script to clean up duplicate and unwanted lists from the database
 * Run with: npx tsx scripts/cleanup-duplicate-lists.ts
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

async function cleanupDuplicateLists() {
  logger.debug('🧹 Starting cleanup of duplicate and unwanted lists...\n')

  try {
    // First, get all lists
    const { data: allLists, error: fetchError } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      logger.error('❌ Error fetching lists:', fetchError)
      return
    }

    logger.debug(`📊 Found ${allLists?.length || 0} total lists\n`)

    // Lists to remove entirely (test lists and truly unwanted ones)
    const listsToRemoveEntirely = ['test lists', 'test list']
    
    // System lists we want to keep only ONE of each
    const systemListsToKeepOne = [
      'active',
      'inactive', 
      'deleted',
      'marketing enabled',
      'unsubscribed',
      'suppressed',
      'operators',
      'wrong number'
    ]

    const deletedIds: string[] = []
    const keptLists: any[] = []

    // Remove test lists entirely
    for (const list of allLists || []) {
      if (listsToRemoveEntirely.includes(list.name.toLowerCase())) {
        logger.debug(`🗑️  Removing test list: "${list.name}" (ID: ${list.id})`)
        const { error } = await supabase
          .from('lists')
          .delete()
          .eq('id', list.id)
        
        if (error) {
          logger.error(`   ❌ Failed to delete: ${error.message}`)
        } else {
          deletedIds.push(list.id)
          logger.debug(`   ✅ Deleted successfully`)
        }
      }
    }

    // Handle system lists - keep only the first one of each type
    for (const systemListName of systemListsToKeepOne) {
      const duplicates = allLists?.filter(
        list => list.name.toLowerCase() === systemListName.toLowerCase()
      ) || []

      if (duplicates.length > 1) {
        logger.debug(`\n🔍 Found ${duplicates.length} instances of "${systemListName}"`)
        
        // Keep the first one (oldest)
        const [keep, ...remove] = duplicates
        logger.debug(`   ✅ Keeping: "${keep.name}" (ID: ${keep.id}, created: ${keep.created_at})`)
        keptLists.push(keep)
        
        // Remove the rest
        for (const duplicate of remove) {
          logger.debug(`   🗑️  Removing duplicate: "${duplicate.name}" (ID: ${duplicate.id}, created: ${duplicate.created_at})`)
          
          // First remove any list memberships
          const { error: membershipError } = await supabase
            .from('list_memberships')
            .delete()
            .eq('list_id', duplicate.id)
          
          if (membershipError) {
            logger.error(`      ❌ Failed to delete memberships: ${membershipError.message}`)
          }
          
          // Then remove the list itself
          const { error } = await supabase
            .from('lists')
            .delete()
            .eq('id', duplicate.id)
          
          if (error) {
            logger.error(`      ❌ Failed to delete list: ${error.message}`)
          } else {
            deletedIds.push(duplicate.id)
            logger.debug(`      ✅ Deleted successfully`)
          }
        }
      } else if (duplicates.length === 1) {
        logger.debug(`✅ Single instance of "${systemListName}" found - no cleanup needed`)
        keptLists.push(duplicates[0])
      } else {
        logger.debug(`ℹ️  No instances of "${systemListName}" found`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    logger.debug('📊 CLEANUP SUMMARY:')
    console.log('='.repeat(60))
    logger.debug(`✅ Kept ${keptLists.length} system lists`)
    logger.debug(`🗑️  Deleted ${deletedIds.length} duplicate/test lists`)
    
    if (keptLists.length > 0) {
      logger.debug('\n📋 Remaining system lists:')
      keptLists.forEach(list => {
        logger.debug(`   - ${list.name} (ID: ${list.id})`)
      })
    }

    logger.debug('\n✨ Cleanup completed successfully!')

  } catch (error) {
    logger.error('❌ Unexpected error during cleanup:', error)
  }
}

// Run the cleanup
cleanupDuplicateLists()
