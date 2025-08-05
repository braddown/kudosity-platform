#!/usr/bin/env tsx

/**
 * Legacy to CDP Migration Script
 * 
 * Migrates all existing profiles from the legacy `profiles` table
 * to the new CDP system (`cdp_profiles` and `cdp_contacts` tables).
 * 
 * This is a one-way migration that replaces the legacy system entirely.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface LegacyProfile {
  id: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  email?: string
  mobile?: string
  status: string
  country?: string
  state?: string
  location?: string
  source?: string
  tags?: string[]
  lifetime_value?: string | number
  custom_fields?: any
  notification_preferences?: any
  timezone?: string
  language_preferences?: string[]
  performance_metrics?: any
}

interface CDPProfile {
  id: string
  mobile: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  city?: string
  state?: string
  country?: string
  lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'churned' | 'blocked'
  lead_score: number
  lifetime_value: number
  data_quality_score: number
  custom_fields: any
  notification_preferences: any
  tags: string[]
  source: string
  source_details: any
  created_at: string
  updated_at: string
  last_activity_at: string
  consent_date?: string
  consent_source?: string
}

interface CDPContact {
  id: string
  profile_id: string
  source: string
  source_details: any
  mobile?: string
  email?: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  raw_data: any
  processing_status: 'matched'
  match_confidence: number
  match_method: string
  created_at: string
  processed_at: string
}

async function calculateDataQualityScore(profile: LegacyProfile): Promise<number> {
  let score = 0
  const maxScore = 10

  // Core fields (40% of score)
  if (profile.mobile) score += 2
  if (profile.email) score += 2
  
  // Name fields (20% of score)
  if (profile.first_name) score += 1
  if (profile.last_name) score += 1
  
  // Location fields (20% of score)
  if (profile.country) score += 1
  if (profile.state || profile.location) score += 1
  
  // Additional data (20% of score)
  if (profile.source) score += 1
  if (profile.custom_fields && Object.keys(profile.custom_fields).length > 0) score += 1

  return Math.round((score / maxScore) * 100) / 100
}

function mapLifecycleStage(status: string, lifetimeValue?: string | number): 'lead' | 'prospect' | 'customer' | 'churned' | 'blocked' {
  if (status === 'Inactive') return 'churned'
  
  const ltv = typeof lifetimeValue === 'string' ? parseFloat(lifetimeValue) : (lifetimeValue || 0)
  
  if (ltv > 0) return 'customer'
  if (ltv === 0 && status === 'Active') return 'prospect'
  
  return 'lead'
}

function extractCityFromLocation(location?: string): string | undefined {
  if (!location) return undefined
  
  // Handle formats like "City, State" or just "City"
  const parts = location.split(',')
  return parts[0]?.trim() || undefined
}

function mapLegacyToCDPProfile(legacy: LegacyProfile): CDPProfile {
  const dataQualityScore = calculateDataQualityScore(legacy)
  const lifecycleStage = mapLifecycleStage(legacy.status, legacy.lifetime_value)
  const lifetimeValue = typeof legacy.lifetime_value === 'string' 
    ? parseFloat(legacy.lifetime_value) || 0 
    : legacy.lifetime_value || 0

  return {
    id: legacy.id,
    mobile: legacy.mobile || 'unknown_' + legacy.id.slice(0, 8), // CDP requires mobile
    first_name: legacy.first_name,
    last_name: legacy.last_name,
    email: legacy.email,
    phone: legacy.mobile, // Duplicate for compatibility
    city: extractCityFromLocation(legacy.location),
    state: legacy.state,
    country: legacy.country || 'Unknown',
    lifecycle_stage: lifecycleStage,
    lead_score: legacy.performance_metrics?.lead_score || 0,
    lifetime_value: lifetimeValue,
    data_quality_score: dataQualityScore,
    custom_fields: legacy.custom_fields || {},
    notification_preferences: legacy.notification_preferences || {
      marketing_sms: true,
      marketing_email: true,
      transactional_sms: true,
      transactional_email: true,
      marketing_whatsapp: false,
      transactional_whatsapp: false,
      marketing_rcs: false,
      transactional_rcs: false
    },
    tags: legacy.tags || [],
    source: legacy.source || 'legacy_migration',
    source_details: {
      migrated_from: 'legacy_profiles',
      original_status: legacy.status,
      migration_date: new Date().toISOString(),
      performance_metrics: legacy.performance_metrics
    },
    created_at: legacy.created_at,
    updated_at: legacy.updated_at,
    last_activity_at: legacy.updated_at,
    consent_date: legacy.created_at, // Assume consent given at creation
    consent_source: 'legacy_system'
  }
}

function createContactFromProfile(profile: CDPProfile): CDPContact {
  return {
    id: crypto.randomUUID(),
    profile_id: profile.id,
    source: 'legacy_migration',
    source_details: {
      migrated_from: 'legacy_profiles',
      migration_date: new Date().toISOString()
    },
    mobile: profile.mobile.startsWith('unknown_') ? undefined : profile.mobile,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    company: profile.custom_fields?.company,
    job_title: profile.custom_fields?.job_title,
    raw_data: {
      legacy_profile: true,
      original_source: profile.source,
      custom_fields: profile.custom_fields
    },
    processing_status: 'matched',
    match_confidence: 1.0, // Perfect match since it's the source
    match_method: 'legacy_migration',
    created_at: profile.created_at,
    processed_at: new Date().toISOString()
  }
}

async function migrateLegacyProfiles() {
  console.log('🚀 Starting Legacy to CDP Migration...\n')

  try {
    // Step 1: Get all legacy profiles
    console.log('📊 Fetching legacy profiles...')
    const { data: legacyProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', '00000000-0000-0000-0000-000000000000') // Exclude metadata profile

    if (fetchError) {
      throw new Error(`Failed to fetch legacy profiles: ${fetchError.message}`)
    }

    if (!legacyProfiles || legacyProfiles.length === 0) {
      console.log('ℹ️  No legacy profiles found to migrate')
      return
    }

    console.log(`✅ Found ${legacyProfiles.length} legacy profiles to migrate\n`)

    // Step 2: Clear existing CDP data (clean slate)
    console.log('🧹 Clearing existing CDP data...')
    
    await supabase.from('cdp_profile_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('cdp_contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('cdp_contacts_archive').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('cdp_contact_review_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('cdp_profile_merge_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('cdp_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('✅ CDP tables cleared\n')

    // Step 3: Transform and insert CDP profiles
    console.log('🔄 Transforming and inserting CDP profiles...')
    
    const cdpProfiles: CDPProfile[] = []
    const cdpContacts: CDPContact[] = []

    for (const legacy of legacyProfiles) {
      try {
        const cdpProfile = mapLegacyToCDPProfile(legacy)
        const cdpContact = createContactFromProfile(cdpProfile)
        
        cdpProfiles.push(cdpProfile)
        cdpContacts.push(cdpContact)
      } catch (error) {
        console.warn(`⚠️  Failed to transform profile ${legacy.id}: ${error}`)
      }
    }

    // Insert CDP profiles in batches
    const batchSize = 100
    let insertedProfiles = 0
    
    for (let i = 0; i < cdpProfiles.length; i += batchSize) {
      const batch = cdpProfiles.slice(i, i + batchSize)
      
      const { error: profileError } = await supabase
        .from('cdp_profiles')
        .insert(batch)

      if (profileError) {
        console.error(`❌ Failed to insert profile batch: ${profileError.message}`)
        throw profileError
      }

      insertedProfiles += batch.length
      console.log(`📝 Inserted ${insertedProfiles}/${cdpProfiles.length} profiles`)
    }

    // Insert CDP contacts in batches
    let insertedContacts = 0
    
    for (let i = 0; i < cdpContacts.length; i += batchSize) {
      const batch = cdpContacts.slice(i, i + batchSize)
      
      const { error: contactError } = await supabase
        .from('cdp_contacts')
        .insert(batch)

      if (contactError) {
        console.error(`❌ Failed to insert contact batch: ${contactError.message}`)
        throw contactError
      }

      insertedContacts += batch.length
      console.log(`📞 Inserted ${insertedContacts}/${cdpContacts.length} contacts`)
    }

    console.log('\n✅ Migration completed successfully!')
    console.log(`📊 Migration Summary:`)
    console.log(`   • Legacy profiles: ${legacyProfiles.length}`)
    console.log(`   • CDP profiles created: ${insertedProfiles}`)
    console.log(`   • CDP contacts created: ${insertedContacts}`)
    
    // Step 4: Update data quality scores
    console.log('\n🔄 Updating data quality scores...')
    const { error: qualityError } = await supabase.rpc('update_all_profile_quality_scores')
    
    if (qualityError) {
      console.warn(`⚠️  Failed to update quality scores: ${qualityError.message}`)
    } else {
      console.log('✅ Data quality scores updated')
    }
    
    console.log('\n🎉 Legacy to CDP migration completed!')
    console.log('\nNext steps:')
    console.log('1. Test the new CDP system')
    console.log('2. Update components to use CDP APIs')
    console.log('3. Archive the legacy profiles table (optional)')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateLegacyProfiles()
}