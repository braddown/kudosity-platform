-- Migration: Restructure Organizations to Accounts
-- Purpose: Rename organizations to accounts to align with proper multi-tenant architecture
-- where Organizations will eventually be labels for groups of accounts

BEGIN;

-- Step 1: Rename organizations table to accounts
ALTER TABLE organizations RENAME TO accounts;

-- Step 2: Rename organization_members to account_members
ALTER TABLE organization_members RENAME TO account_members;

-- Step 3: Update column names in account_members table
ALTER TABLE account_members 
  RENAME COLUMN organization_id TO account_id;

-- Step 4: Update foreign key constraints for account_members
ALTER TABLE account_members 
  DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
  
ALTER TABLE account_members 
  ADD CONSTRAINT account_members_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Step 5: Update other tables that reference organizations
-- Update user_sessions
ALTER TABLE user_sessions 
  RENAME COLUMN organization_id TO account_id;
  
ALTER TABLE user_sessions 
  DROP CONSTRAINT IF EXISTS user_sessions_organization_id_fkey;
  
ALTER TABLE user_sessions 
  ADD CONSTRAINT user_sessions_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Update invitations
ALTER TABLE invitations 
  RENAME COLUMN organization_id TO account_id;
  
ALTER TABLE invitations 
  DROP CONSTRAINT IF EXISTS invitations_organization_id_fkey;
  
ALTER TABLE invitations 
  ADD CONSTRAINT invitations_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Update audit_logs
ALTER TABLE audit_logs 
  RENAME COLUMN organization_id TO account_id;
  
ALTER TABLE audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_organization_id_fkey;
  
ALTER TABLE audit_logs 
  ADD CONSTRAINT audit_logs_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Update cdp_profiles
ALTER TABLE cdp_profiles 
  RENAME COLUMN organization_id TO account_id;
  
ALTER TABLE cdp_profiles 
  DROP CONSTRAINT IF EXISTS cdp_profiles_organization_id_fkey;
  
ALTER TABLE cdp_profiles 
  ADD CONSTRAINT cdp_profiles_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Update profile_activity_log
ALTER TABLE profile_activity_log 
  RENAME COLUMN organization_id TO account_id;
  
ALTER TABLE profile_activity_log 
  DROP CONSTRAINT IF EXISTS profile_activity_log_organization_id_fkey;
  
ALTER TABLE profile_activity_log 
  ADD CONSTRAINT profile_activity_log_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Update custom_field_definitions
ALTER TABLE custom_field_definitions 
  RENAME COLUMN organization_id TO account_id;
  
ALTER TABLE custom_field_definitions 
  DROP CONSTRAINT IF EXISTS custom_field_definitions_organization_id_fkey;
  
ALTER TABLE custom_field_definitions 
  ADD CONSTRAINT custom_field_definitions_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Step 6: Update RLS policies
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their organization" ON accounts;
DROP POLICY IF EXISTS "Users can update their organization" ON accounts;
DROP POLICY IF EXISTS "Users can view organization members" ON account_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON account_members;

-- Create new policies with correct naming
CREATE POLICY "Users can view their account" ON accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_members 
      WHERE account_members.account_id = accounts.id 
      AND account_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Account admins can update account" ON accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM account_members 
      WHERE account_members.account_id = accounts.id 
      AND account_members.user_id = auth.uid()
      AND account_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view account members" ON account_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_members am 
      WHERE am.account_id = account_members.account_id 
      AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "Account admins can manage members" ON account_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_members am 
      WHERE am.account_id = account_members.account_id 
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- Step 7: Update table comments
COMMENT ON TABLE accounts IS 'Multi-tenant accounts table (formerly organizations)';
COMMENT ON TABLE account_members IS 'User-account membership and roles';
COMMENT ON COLUMN accounts.name IS 'Account name';
COMMENT ON COLUMN account_members.account_id IS 'Reference to the account';

-- Step 8: Create future organizations table structure (for grouping accounts)
CREATE TABLE IF NOT EXISTS organization_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table to link accounts to organization groups
CREATE TABLE IF NOT EXISTS organization_group_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_group_id UUID NOT NULL REFERENCES organization_groups(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES user_profiles(id),
  UNIQUE(organization_group_id, account_id)
);

-- Add RLS for new tables
ALTER TABLE organization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_group_accounts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_members_account_id ON account_members(account_id);
CREATE INDEX IF NOT EXISTS idx_account_members_user_id ON account_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_group_accounts_org_id ON organization_group_accounts(organization_group_id);
CREATE INDEX IF NOT EXISTS idx_organization_group_accounts_account_id ON organization_group_accounts(account_id);

COMMIT;

-- Rollback script (save separately)
-- BEGIN;
-- ALTER TABLE accounts RENAME TO organizations;
-- ALTER TABLE account_members RENAME TO organization_members;
-- ALTER TABLE account_members RENAME COLUMN account_id TO organization_id;
-- -- Continue with reverse operations...
-- COMMIT;
