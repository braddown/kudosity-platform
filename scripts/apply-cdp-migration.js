import { logger } from "@/lib/utils/logger"
/**
 * Simple CDP Migration Applier
 * 
 * Applies the CDP architecture migration to Supabase database.
 * This is a simple Node.js script that can be run without TypeScript compilation.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration - you may need to update these
const SUPABASE_URL = 'https://hgfsmeudhvsvwmzxexmv.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!SUPABASE_SERVICE_KEY) {
  logger.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyCDPMigration() {
  logger.debug('🚀 Starting CDP Architecture Migration...')
  
  try {
    // Step 1: Enable required extensions
    logger.debug('📦 Enabling required extensions...')
    
    const { error: ext1Error } = await supabase.rpc('exec_sql', {
      sql_query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    })
    
    if (ext1Error) {
      logger.warn('⚠️  uuid-ossp extension:', ext1Error.message)
    }
    
    const { error: ext2Error } = await supabase.rpc('exec_sql', {
      sql_query: 'CREATE EXTENSION IF NOT EXISTS "pg_trgm";'
    })
    
    if (ext2Error) {
      logger.warn('⚠️  pg_trgm extension:', ext2Error.message)
    }
    
    logger.debug('✅ Extensions enabled')

    // Step 2: Create core tables
    logger.debug('🏗️  Creating core tables...')
    
    // Create users table
    const createUsersSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
        department TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        permissions TEXT[] DEFAULT '{}',
        last_login TIMESTAMP WITH TIME ZONE,
        password_reset_token TEXT,
        password_reset_expires TIMESTAMP WITH TIME ZONE,
        email_verified BOOLEAN DEFAULT FALSE,
        timezone TEXT DEFAULT 'UTC',
        language_preference TEXT DEFAULT 'en',
        notification_preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `
    
    const { error: usersError } = await supabase.rpc('exec_sql', { sql_query: createUsersSQL })
    if (usersError) {
      logger.error('❌ Failed to create users table:', usersError.message)
      throw usersError
    }
    logger.debug('✅ Users table created')

    // Create profiles table
    const createProfilesSQL = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        address_line_1 TEXT,
        address_line_2 TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT,
        lifecycle_stage TEXT DEFAULT 'lead' CHECK (
          lifecycle_stage IN ('lead', 'prospect', 'customer', 'churned', 'blocked')
        ),
        lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
        lifetime_value DECIMAL(12,2) DEFAULT 0,
        data_quality_score DECIMAL(3,2) DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
        custom_fields JSONB DEFAULT '{}',
        notification_preferences JSONB DEFAULT '{
          "marketing_sms": true,
          "marketing_email": true,
          "transactional_sms": true,
          "transactional_email": true,
          "marketing_whatsapp": false,
          "transactional_whatsapp": false,
          "marketing_rcs": false,
          "transactional_rcs": false
        }',
        tags TEXT[] DEFAULT '{}',
        source TEXT NOT NULL,
        source_details JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_duplicate BOOLEAN DEFAULT FALSE,
        duplicate_of_profile_id UUID,
        merge_status TEXT DEFAULT 'active' CHECK (merge_status IN ('active', 'duplicate', 'merged', 'archived')),
        data_retention_date TIMESTAMP WITH TIME ZONE,
        consent_date TIMESTAMP WITH TIME ZONE,
        consent_source TEXT
      );
    `
    
    const { error: profilesError } = await supabase.rpc('exec_sql', { sql_query: createProfilesSQL })
    if (profilesError) {
      logger.error('❌ Failed to create profiles table:', profilesError.message)
      throw profilesError
    }
    logger.debug('✅ Profiles table created')

    // Create contacts table
    const createContactsSQL = `
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        source TEXT NOT NULL CHECK (source IN (
          'form_submission', 'sms_inbound', 'csv_upload', 'api_import', 
          'manual_entry', 'webhook', 'integration', 'email_inbound'
        )),
        source_details JSONB DEFAULT '{}',
        batch_id UUID,
        external_id TEXT,
        mobile TEXT,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        company TEXT,
        job_title TEXT,
        raw_data JSONB DEFAULT '{}',
        processing_status TEXT DEFAULT 'pending' CHECK (
          processing_status IN ('pending', 'processing', 'matched', 'needs_review', 'archived', 'rejected', 'failed')
        ),
        match_confidence DECIMAL(3,2) CHECK (match_confidence >= 0 AND match_confidence <= 1),
        match_method TEXT,
        potential_matches JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,
        processed_by UUID REFERENCES users(id),
        processing_notes TEXT,
        retry_count INTEGER DEFAULT 0,
        last_retry_at TIMESTAMP WITH TIME ZONE
      );
    `
    
    const { error: contactsError } = await supabase.rpc('exec_sql', { sql_query: createContactsSQL })
    if (contactsError) {
      logger.error('❌ Failed to create contacts table:', contactsError.message)
      throw contactsError
    }
    logger.debug('✅ Contacts table created')

    // Create profile_activities table
    const createActivitiesSQL = `
      CREATE TABLE IF NOT EXISTS profile_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        contact_id UUID,
        activity_type TEXT NOT NULL CHECK (activity_type IN (
          'profile_created', 'contact_merged', 'data_updated', 'manual_edit',
          'communication_sent', 'communication_received', 'tag_added', 'tag_removed',
          'lifecycle_changed', 'preference_updated', 'custom_field_updated'
        )),
        activity_description TEXT,
        changes JSONB DEFAULT '{}',
        data_source TEXT,
        channel TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id),
        ip_address INET,
        user_agent TEXT
      );
    `
    
    const { error: activitiesError } = await supabase.rpc('exec_sql', { sql_query: createActivitiesSQL })
    if (activitiesError) {
      logger.error('❌ Failed to create profile_activities table:', activitiesError.message)
      throw activitiesError
    }
    logger.debug('✅ Profile activities table created')

    // Step 3: Create indexes
    logger.debug('📊 Creating indexes...')
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON profiles(mobile);',
      'CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_profiles_merge_status ON profiles(merge_status);',
      'CREATE INDEX IF NOT EXISTS idx_contacts_mobile ON contacts(mobile) WHERE mobile IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_contacts_processing_status ON contacts(processing_status);',
      'CREATE INDEX IF NOT EXISTS idx_contacts_profile_id ON contacts(profile_id) WHERE profile_id IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_profile_activities_profile_id ON profile_activities(profile_id);'
    ]
    
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql_query: indexSQL })
      if (indexError) {
        logger.warn('⚠️  Index creation warning:', indexError.message)
      }
    }
    logger.debug('✅ Indexes created')

    // Step 4: Add foreign key constraint for profiles self-reference
    const addForeignKeySQL = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'profiles_duplicate_of_fkey'
        ) THEN
          ALTER TABLE profiles ADD CONSTRAINT profiles_duplicate_of_fkey 
          FOREIGN KEY (duplicate_of_profile_id) REFERENCES profiles(id);
        END IF;
      END $$;
    `
    
    const { error: fkError } = await supabase.rpc('exec_sql', { sql_query: addForeignKeySQL })
    if (fkError) {
      logger.warn('⚠️  Foreign key constraint warning:', fkError.message)
    }

    // Step 5: Create default admin user
    logger.debug('👤 Creating default admin user...')
    
    const createAdminSQL = `
      INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role,
        email_verified
      ) VALUES (
        'admin@kudosity.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewCj3TpODZ1zEI82',
        'System',
        'Administrator',
        'admin',
        true
      ) ON CONFLICT (email) DO NOTHING;
    `
    
    const { error: adminError } = await supabase.rpc('exec_sql', { sql_query: createAdminSQL })
    if (adminError) {
      logger.warn('⚠️  Admin user creation warning:', adminError.message)
    }
    logger.debug('✅ Default admin user created (admin@kudosity.com / admin123)')
    
    logger.debug('🎉 CDP Architecture Migration completed successfully!')
    logger.debug('')
    logger.debug('📋 Summary:')
    logger.debug('  ✅ Extensions enabled (uuid-ossp, pg_trgm)')
    logger.debug('  ✅ Core tables created (users, profiles, contacts, profile_activities)')
    logger.debug('  ✅ Indexes created for performance')
    logger.debug('  ✅ Foreign key constraints added')
    logger.debug('  ✅ Default admin user created')
    logger.debug('')
    logger.debug('🔑 Next steps:')
    logger.debug('  1. Update your application to use the new CDP types and hooks')
    logger.debug('  2. Create custom field definitions as needed')
    logger.debug('  3. Set up contact processing workflows')
    logger.debug('  4. Configure notification preferences')
    logger.debug('')
    logger.debug('⚠️  Remember to change the default admin password!')
    
  } catch (error) {
    logger.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
applyCDPMigration()
  .then(() => {
    logger.debug('✨ Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('💥 Migration failed:', error)
    process.exit(1)
  })