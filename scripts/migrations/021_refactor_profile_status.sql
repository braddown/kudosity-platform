-- Refactor profile status to be a pure lifecycle state
-- Not derived from notification preferences

-- First, update existing status values to proper lifecycle states
UPDATE cdp_profiles
SET status = CASE
    -- If profile was marked as deleted/inactive, keep as deleted
    WHEN status = 'deleted' OR status = 'destroyed' THEN status
    
    -- If all channels are disabled, mark as inactive
    WHEN (
        (notification_preferences->>'marketing_email' != 'true' OR notification_preferences->>'marketing_email' IS NULL)
        AND (notification_preferences->>'marketing_sms' != 'true' OR notification_preferences->>'marketing_sms' IS NULL)
        AND (notification_preferences->>'marketing_whatsapp' != 'true' OR notification_preferences->>'marketing_whatsapp' IS NULL)
        AND (notification_preferences->>'marketing_rcs' != 'true' OR notification_preferences->>'marketing_rcs' IS NULL)
        AND (notification_preferences->>'transactional_email' != 'true' OR notification_preferences->>'transactional_email' IS NULL)
        AND (notification_preferences->>'transactional_sms' != 'true' OR notification_preferences->>'transactional_sms' IS NULL)
        AND (notification_preferences->>'transactional_whatsapp' != 'true' OR notification_preferences->>'transactional_whatsapp' IS NULL)
        AND (notification_preferences->>'transactional_rcs' != 'true' OR notification_preferences->>'transactional_rcs' IS NULL)
    ) THEN 'inactive'
    
    -- Otherwise, profile is active
    ELSE 'active'
END
WHERE status IS NOT NULL;

-- Rename 'archived' to 'inactive' if any exist
UPDATE cdp_profiles 
SET status = 'inactive' 
WHERE status = 'archived';

-- Update the check constraint to use new values
ALTER TABLE cdp_profiles 
DROP CONSTRAINT IF EXISTS cdp_profiles_status_check;

ALTER TABLE cdp_profiles 
ADD CONSTRAINT cdp_profiles_status_check 
CHECK (status IN ('active', 'inactive', 'deleted', 'destroyed'));

-- Update the column comment to reflect new semantics
COMMENT ON COLUMN cdp_profiles.status IS 'Profile lifecycle status: active (normal state), inactive (exists but dormant), deleted (soft deleted, hidden), destroyed (hard deleted, minimal data retained)';

-- Create a function to check if profile has any active channel
-- This will be used for derived states
CREATE OR REPLACE FUNCTION has_active_channel(prefs jsonb)
RETURNS boolean AS $$
BEGIN
    RETURN (
        prefs->>'marketing_email' = 'true' OR
        prefs->>'marketing_sms' = 'true' OR
        prefs->>'marketing_whatsapp' = 'true' OR
        prefs->>'marketing_rcs' = 'true' OR
        prefs->>'transactional_email' = 'true' OR
        prefs->>'transactional_sms' = 'true' OR
        prefs->>'transactional_whatsapp' = 'true' OR
        prefs->>'transactional_rcs' = 'true'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to check if profile has any marketing channel
CREATE OR REPLACE FUNCTION has_marketing_channel(prefs jsonb)
RETURNS boolean AS $$
BEGIN
    RETURN (
        prefs->>'marketing_email' = 'true' OR
        prefs->>'marketing_sms' = 'true' OR
        prefs->>'marketing_whatsapp' = 'true' OR
        prefs->>'marketing_rcs' = 'true'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

