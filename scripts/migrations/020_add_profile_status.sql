-- Add profile status column to cdp_profiles
-- Status values: 'active', 'archived', 'deleted', 'destroyed'

-- Add status column with default 'active'
ALTER TABLE cdp_profiles 
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active' 
CHECK (status IN ('active', 'archived', 'deleted', 'destroyed'));

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_cdp_profiles_status ON cdp_profiles(status);

-- Update existing profiles based on their current state
UPDATE cdp_profiles
SET status = CASE
    -- If any marketing or transactional channel is active, profile is active
    WHEN (notification_preferences->>'marketing_email' = 'true' 
          OR notification_preferences->>'marketing_sms' = 'true'
          OR notification_preferences->>'marketing_whatsapp' = 'true'
          OR notification_preferences->>'marketing_rcs' = 'true'
          OR notification_preferences->>'transactional_email' = 'true'
          OR notification_preferences->>'transactional_sms' = 'true'
          OR notification_preferences->>'transactional_whatsapp' = 'true'
          OR notification_preferences->>'transactional_rcs' = 'true') 
    THEN 'active'
    
    -- If is_deleted is true (from soft delete), status is deleted
    WHEN is_deleted = true THEN 'deleted'
    
    -- Otherwise archived (no active channels but not deleted)
    ELSE 'archived'
END
WHERE status IS NULL OR status = 'active';

-- Add comment explaining the status values
COMMENT ON COLUMN cdp_profiles.status IS 'Profile status: active (any channel active), archived (no channels active but visible), deleted (soft deleted, not visible), destroyed (permanently deleted, only ID and mobile retained)';

