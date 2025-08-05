-- =====================================================
-- Customer Data Platform (CDP) Architecture Migration
-- =====================================================
-- This migration creates the full CDP structure with:
-- 1. Users (platform operators)
-- 2. Profiles (master customer records)  
-- 3. Contacts (individual touchpoints)
-- 4. Activity logging and conflict resolution
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. USERS TABLE (Platform Operators)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
  department TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  permissions TEXT[] DEFAULT '{}',
  
  -- Authentication & session
  last_login TIMESTAMP WITH TIME ZONE,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Platform preferences
  timezone TEXT DEFAULT 'UTC',
  language_preference TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- =====================================================
-- 2. PROFILES TABLE (Master Customer Records)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Primary matching field (allows duplicates when needed)
  mobile TEXT NOT NULL,
  
  -- Consolidated customer data (best known information)
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  
  -- Additional contact info
  phone TEXT,  -- Alternative/landline number
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Customer intelligence
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (
    lifecycle_stage IN ('lead', 'prospect', 'customer', 'churned', 'blocked')
  ),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  data_quality_score DECIMAL(3,2) DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  
  -- Custom data and preferences
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
  
  -- Profile metadata
  source TEXT NOT NULL,  -- How they first entered the system
  source_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Deduplication and merge management
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of_profile_id UUID,
  merge_status TEXT DEFAULT 'active' CHECK (merge_status IN ('active', 'duplicate', 'merged', 'archived')),
  
  -- Data management
  data_retention_date TIMESTAMP WITH TIME ZONE,  -- GDPR compliance
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_source TEXT,
  
  -- Add self-referential foreign key constraint after table creation
  CONSTRAINT profiles_duplicate_of_fkey FOREIGN KEY (duplicate_of_profile_id) REFERENCES profiles(id)
);

-- =====================================================
-- 3. CONTACTS TABLE (Individual Touchpoints - Processing Queue)
-- =====================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL until matched/processed
  
  -- Source information
  source TEXT NOT NULL CHECK (source IN (
    'form_submission', 'sms_inbound', 'csv_upload', 'api_import', 
    'manual_entry', 'webhook', 'integration', 'email_inbound'
  )),
  source_details JSONB DEFAULT '{}',  -- Form ID, campaign ID, etc.
  batch_id UUID,  -- For grouping bulk uploads
  external_id TEXT,  -- Reference to external system
  
  -- Raw contact data (as received)
  mobile TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  raw_data JSONB DEFAULT '{}',  -- All original fields preserved
  
  -- Processing and matching status
  processing_status TEXT DEFAULT 'pending' CHECK (
    processing_status IN ('pending', 'processing', 'matched', 'needs_review', 'archived', 'rejected', 'failed')
  ),
  match_confidence DECIMAL(3,2) CHECK (match_confidence >= 0 AND match_confidence <= 1),
  match_method TEXT,  -- 'exact_mobile', 'fuzzy_name_email', 'manual', etc.
  potential_matches JSONB DEFAULT '[]',  -- Array of possible profile matches with scores
  
  -- Processing metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id),
  processing_notes TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 4. PROFILE ACTIVITIES TABLE (Activity Log & Audit Trail)
-- =====================================================
CREATE TABLE profile_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID,  -- Reference to original contact (may be archived)
  
  -- Activity classification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'profile_created', 'contact_merged', 'data_updated', 'manual_edit',
    'communication_sent', 'communication_received', 'tag_added', 'tag_removed',
    'lifecycle_changed', 'preference_updated', 'custom_field_updated'
  )),
  activity_description TEXT,
  
  -- Change tracking
  changes JSONB DEFAULT '{}',  -- Before/after data for changes
  data_source TEXT,  -- Where this activity originated
  channel TEXT,  -- SMS, Email, WhatsApp, etc.
  
  -- Activity metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),  -- User who initiated (if manual)
  ip_address INET,
  user_agent TEXT
);

-- =====================================================
-- 5. CONTACTS ARCHIVE TABLE (Processed Contacts Audit Trail)
-- =====================================================
CREATE TABLE contacts_archive (
  id UUID PRIMARY KEY,  -- Same ID as original contact
  profile_id UUID,  -- Profile it was matched to
  
  -- Original contact data
  source TEXT,
  source_details JSONB,
  raw_data JSONB,
  
  -- Processing results
  processing_result JSONB DEFAULT '{}',  -- How it was processed
  match_confidence DECIMAL(3,2),
  match_method TEXT,
  
  -- Archive metadata
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_by UUID REFERENCES users(id),
  archive_reason TEXT DEFAULT 'processed'
);

-- =====================================================
-- 6. CONTACT REVIEW QUEUE (Manual Review System)
-- =====================================================
CREATE TABLE contact_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Review classification
  review_type TEXT NOT NULL CHECK (review_type IN (
    'duplicate_check', 'data_conflict', 'low_confidence_match', 
    'manual_verification', 'compliance_review'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Review data
  potential_matches JSONB DEFAULT '[]',  -- Possible profiles with conflict details
  conflict_details JSONB DEFAULT '{}',  -- What conflicts were detected
  review_notes TEXT,
  
  -- Assignment and status
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'escalated')),
  resolution JSONB DEFAULT '{}',  -- How it was resolved
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id)
);

-- =====================================================
-- 7. PROFILE MERGE LOG (Track Profile Merges)
-- =====================================================
CREATE TABLE profile_merge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_profile_id UUID NOT NULL,  -- Profile that was merged (now duplicate)
  target_profile_id UUID REFERENCES profiles(id),  -- Profile it was merged into
  
  -- Merge details
  merge_reason TEXT,
  data_conflicts JSONB DEFAULT '{}',  -- What conflicts existed
  resolution_strategy JSONB DEFAULT '{}',  -- How conflicts were resolved
  
  -- Metadata
  merged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  merged_by UUID REFERENCES users(id),
  can_be_undone BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Profiles indexes
CREATE INDEX idx_profiles_mobile ON profiles(mobile);
CREATE INDEX idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX idx_profiles_merge_status ON profiles(merge_status);
CREATE INDEX idx_profiles_lifecycle_stage ON profiles(lifecycle_stage);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_last_activity_at ON profiles(last_activity_at);
CREATE INDEX idx_profiles_duplicate_of ON profiles(duplicate_of_profile_id) WHERE duplicate_of_profile_id IS NOT NULL;

-- Text search indexes for profiles
CREATE INDEX idx_profiles_name_search ON profiles USING gin(
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
);

-- Similarity search indexes (fuzzy matching)
CREATE INDEX idx_profiles_mobile_trgm ON profiles USING gin(mobile gin_trgm_ops);
CREATE INDEX idx_profiles_email_trgm ON profiles USING gin(email gin_trgm_ops) WHERE email IS NOT NULL;
CREATE INDEX idx_profiles_name_trgm ON profiles USING gin(
  (coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops
);

-- Contacts indexes
CREATE INDEX idx_contacts_mobile ON contacts(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_processing_status ON contacts(processing_status);
CREATE INDEX idx_contacts_profile_id ON contacts(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_batch_id ON contacts(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

-- Profile activities indexes
CREATE INDEX idx_profile_activities_profile_id ON profile_activities(profile_id);
CREATE INDEX idx_profile_activities_created_at ON profile_activities(created_at);
CREATE INDEX idx_profile_activities_activity_type ON profile_activities(activity_type);
CREATE INDEX idx_profile_activities_contact_id ON profile_activities(contact_id) WHERE contact_id IS NOT NULL;

-- Review queue indexes
CREATE INDEX idx_contact_review_queue_status ON contact_review_queue(status);
CREATE INDEX idx_contact_review_queue_assigned_to ON contact_review_queue(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_contact_review_queue_priority ON contact_review_queue(priority);
CREATE INDEX idx_contact_review_queue_created_at ON contact_review_queue(created_at);

-- Archive indexes
CREATE INDEX idx_contacts_archive_profile_id ON contacts_archive(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_contacts_archive_archived_at ON contacts_archive(archived_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- =====================================================

-- Update profiles.updated_at on any change
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Update users.updated_at on any change
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Log profile changes to activities
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if there are actual changes to customer-facing data
  IF (OLD.first_name IS DISTINCT FROM NEW.first_name OR
      OLD.last_name IS DISTINCT FROM NEW.last_name OR
      OLD.email IS DISTINCT FROM NEW.email OR
      OLD.mobile IS DISTINCT FROM NEW.mobile OR
      OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage OR
      OLD.notification_preferences IS DISTINCT FROM NEW.notification_preferences OR
      OLD.custom_fields IS DISTINCT FROM NEW.custom_fields OR
      OLD.tags IS DISTINCT FROM NEW.tags) THEN
    
    INSERT INTO profile_activities (
      profile_id,
      activity_type,
      activity_description,
      changes,
      data_source
    ) VALUES (
      NEW.id,
      'data_updated',
      'Profile data updated',
      jsonb_build_object(
        'before', row_to_json(OLD),
        'after', row_to_json(NEW)
      ),
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_profile_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create default admin user (password should be changed immediately)
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role,
  email_verified
) VALUES (
  'admin@kudosity.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewCj3TpODZ1zEI82', -- 'admin123' - CHANGE THIS!
  'System',
  'Administrator',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'profiles', 'contacts', 'profile_activities', 'contacts_archive', 'contact_review_queue', 'profile_merge_log')
ORDER BY tablename;

-- Show table sizes
SELECT 
  'Migration completed successfully. Tables created:' as status,
  COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'profiles', 'contacts', 'profile_activities', 'contacts_archive', 'contact_review_queue', 'profile_merge_log');