#!/usr/bin/env tsx

/**
 * CDP Migration Script
 * 
 * This script migrates existing profile and contact data to the new CDP architecture.
 * It handles the migration safely by:
 * 1. Reading existing data from legacy tables
 * 2. Creating corresponding CDP records
 * 3. Mapping relationships and maintaining data integrity
 * 4. Providing rollback capabilities
 * 
 * Usage:
 * npm run migrate-cdp -- --dry-run  # Preview what will be migrated
 * npm run migrate-cdp               # Actually perform the migration
 * npm run migrate-cdp -- --rollback # Rollback the migration
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface LegacyProfile {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  mobile?: string
  custom_fields?: Record<string, any>
  notification_preferences?: Record<string, any>
  created_at: string
  updated_at: string
  status?: string
  tags?: string[]
  country?: string
  state?: string
  location?: string
  lifetime_value?: number
}

interface LegacyContact {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  source?: string
  created_at: string
  updated_at: string
  status?: string
  custom_fields?: Record<string, any>
  tags?: string[]
}

async function getMigrationStats() {
  console.log('📊 Gathering migration statistics...\n')

  // Count existing records
  const [
    { count: legacyProfiles },
    { count: legacyContacts },
    { count: cdpProfiles },
    { count: cdpContacts }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('cdp_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('cdp_contacts').select('*', { count: 'exact', head: true })
  ])

  console.log('📈 Current State:')
  console.log(`   Legacy Profiles: ${legacyProfiles || 0}`)
  console.log(`   Legacy Contacts: ${legacyContacts || 0}`)
  console.log(`   CDP Profiles: ${cdpProfiles || 0}`)
  console.log(`   CDP Contacts: ${cdpContacts || 0}`)
  console.log()

  return {
    legacyProfiles: legacyProfiles || 0,
    legacyContacts: legacyContacts || 0,
    cdpProfiles: cdpProfiles || 0,
    cdpContacts: cdpContacts || 0
  }
}

async function migrateProfiles(dryRun: boolean = false): Promise<number> {
  console.log('👤 Migrating Profiles...')

  // Fetch all legacy profiles
  const { data: legacyProfiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching legacy profiles:', error)
    return 0
  }

  if (!legacyProfiles || legacyProfiles.length === 0) {
    console.log('   No legacy profiles to migrate.')
    return 0
  }

  console.log(`   Found ${legacyProfiles.length} profiles to migrate`)

  if (dryRun) {
    console.log('   [DRY RUN] Would migrate:')
    legacyProfiles.slice(0, 5).forEach((profile: LegacyProfile) => {
      console.log(`     - ${profile.first_name} ${profile.last_name} (${profile.email || profile.mobile || 'No contact'})`)
    })
    if (legacyProfiles.length > 5) {
      console.log(`     ... and ${legacyProfiles.length - 5} more`)
    }
    return legacyProfiles.length
  }

  let migratedCount = 0
  const batchSize = 50

  for (let i = 0; i < legacyProfiles.length; i += batchSize) {
    const batch = legacyProfiles.slice(i, i + batchSize)
    
    const cdpProfiles = batch.map((profile: LegacyProfile) => ({
      id: profile.id, // Keep the same ID for easier relationship mapping
      mobile: profile.mobile || `unknown_${profile.id}`, // Mobile is required in CDP
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      
      // Map legacy fields to CDP structure
      lifecycle_stage: profile.status === 'Active' ? 'customer' : 'lead',
      lifetime_value: profile.lifetime_value || 0,
      data_quality_score: calculateDataQuality(profile),
      country: profile.country || 'Australia',
      state: profile.state,
      city: parseLocation(profile.location)?.city,
      
      // Preserve custom data
      custom_fields: profile.custom_fields || {},
      notification_preferences: mapNotificationPreferences(profile.notification_preferences),
      tags: profile.tags || [],
      
      // Source information
      source: 'legacy_migration',
      source_details: {
        migrated_from: 'profiles_table',
        migration_date: new Date().toISOString(),
        original_status: profile.status
      },
      
      // Timestamps
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_activity_at: profile.updated_at
    }))

    const { error: insertError } = await supabase
      .from('cdp_profiles')
      .upsert(cdpProfiles, { onConflict: 'id' })

    if (insertError) {
      console.error(`Error migrating batch ${i + 1}-${i + batch.length}:`, insertError)
      continue
    }

    migratedCount += batch.length
    console.log(`   Migrated ${migratedCount}/${legacyProfiles.length} profiles`)
  }

  console.log(`   ✅ Successfully migrated ${migratedCount} profiles\n`)
  return migratedCount
}

async function migrateContacts(dryRun: boolean = false): Promise<number> {
  console.log('📞 Migrating Contacts...')

  // Fetch all legacy contacts
  const { data: legacyContacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching legacy contacts:', error)
    return 0
  }

  if (!legacyContacts || legacyContacts.length === 0) {
    console.log('   No legacy contacts to migrate.')
    return 0
  }

  console.log(`   Found ${legacyContacts.length} contacts to migrate`)

  if (dryRun) {
    console.log('   [DRY RUN] Would migrate:')
    legacyContacts.slice(0, 5).forEach((contact: LegacyContact) => {
      console.log(`     - ${contact.first_name} ${contact.last_name} (${contact.email || contact.phone || 'No contact'})`)
    })
    if (legacyContacts.length > 5) {
      console.log(`     ... and ${legacyContacts.length - 5} more`)
    }
    return legacyContacts.length
  }

  let migratedCount = 0
  const batchSize = 50

  for (let i = 0; i < legacyContacts.length; i += batchSize) {
    const batch = legacyContacts.slice(i, i + batchSize)
    
    const cdpContacts = batch.map((contact: LegacyContact) => ({
      // Don't keep the same ID - let CDP generate new ones
      mobile: contact.phone,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      
      // CDP-specific fields
      source: 'legacy_migration',
      source_details: {
        migrated_from: 'contacts_table',
        migration_date: new Date().toISOString(),
        original_id: contact.id,
        original_source: contact.source
      },
      raw_data: {
        ...contact.custom_fields,
        original_status: contact.status,
        original_tags: contact.tags
      },
      
      // Processing status - set to pending so they get processed through CDP
      processing_status: 'pending',
      
      // Timestamps
      created_at: contact.created_at
    }))

    const { error: insertError } = await supabase
      .from('cdp_contacts')
      .insert(cdpContacts)

    if (insertError) {
      console.error(`Error migrating batch ${i + 1}-${i + batch.length}:`, insertError)
      continue
    }

    migratedCount += batch.length
    console.log(`   Migrated ${migratedCount}/${legacyContacts.length} contacts`)
  }

  console.log(`   ✅ Successfully migrated ${migratedCount} contacts\n`)
  return migratedCount
}

async function processContacts() {
  console.log('⚡ Processing migrated contacts through CDP system...')

  // Process pending contacts in batches
  const { data: result, error } = await supabase.rpc('process_pending_cdp_contacts', {
    batch_size: 100
  })

  if (error) {
    console.error('Error processing contacts:', error)
    return
  }

  console.log(`   ✅ Processed ${result.processed_count} contacts`)
  console.log(`   📊 Success: ${result.success_count}, Errors: ${result.error_count}`)
  console.log()
}

async function rollbackMigration(): Promise<void> {
  console.log('🔄 Rolling back CDP migration...')

  const confirm = process.argv.includes('--force-rollback')
  if (!confirm) {
    console.log('⚠️  This will delete all CDP data!')
    console.log('    To confirm, run with --force-rollback flag')
    return
  }

  // Delete CDP data (in reverse order of dependencies)
  await supabase.from('cdp_profile_activities').delete().neq('id', '')
  await supabase.from('cdp_contact_review_queue').delete().neq('id', '')
  await supabase.from('cdp_contacts_archive').delete().neq('id', '')
  await supabase.from('cdp_contacts').delete().neq('id', '')
  await supabase.from('cdp_profiles').delete().neq('id', '')

  console.log('✅ Rollback completed')
}

// Utility functions
function calculateDataQuality(profile: LegacyProfile): number {
  let score = 0
  const fields = ['first_name', 'last_name', 'email', 'mobile']
  
  fields.forEach(field => {
    if (profile[field as keyof LegacyProfile]) score += 0.25
  })
  
  return Math.min(1, score)
}

function mapNotificationPreferences(legacy?: Record<string, any>) {
  return {
    marketing_sms: legacy?.marketing_sms ?? true,
    marketing_email: legacy?.marketing_email ?? true,
    transactional_sms: legacy?.transactional_sms ?? true,
    transactional_email: legacy?.transactional_email ?? true,
    marketing_whatsapp: legacy?.marketing_whatsapp ?? false,
    transactional_whatsapp: legacy?.transactional_whatsapp ?? false,
    marketing_rcs: legacy?.marketing_rcs ?? false,
    transactional_rcs: legacy?.transactional_rcs ?? false
  }
}

function parseLocation(location?: string) {
  if (!location) return null
  
  // Simple parsing - this can be enhanced
  const parts = location.split(',').map(s => s.trim())
  return {
    city: parts[0] || null,
    state: parts[1] || null
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const rollback = args.includes('--rollback')

  console.log('🚀 CDP Migration Tool\n')

  if (rollback) {
    await rollbackMigration()
    return
  }

  // Show current state
  const stats = await getMigrationStats()

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  // Perform migrations
  const profilesMigrated = await migrateProfiles(dryRun)
  const contactsMigrated = await migrateContacts(dryRun)

  if (!dryRun && contactsMigrated > 0) {
    // Process the migrated contacts through CDP
    await processContacts()
  }

  // Final statistics
  const finalStats = await getMigrationStats()
  
  console.log('📊 Migration Summary:')
  console.log(`   Profiles migrated: ${profilesMigrated}`)
  console.log(`   Contacts migrated: ${contactsMigrated}`)
  console.log(`   CDP Profiles total: ${finalStats.cdpProfiles}`)
  console.log(`   CDP Contacts total: ${finalStats.cdpContacts}`)
  
  if (dryRun) {
    console.log('\n💡 To perform the actual migration, run without --dry-run')
  } else {
    console.log('\n✅ Migration completed successfully!')
    console.log('\n🔗 Next steps:')
    console.log('   1. Update your application to use CDP components')
    console.log('   2. Test the new CDP functionality')
    console.log('   3. Monitor the review queue for any manual interventions needed')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { main as migrateToCDP }