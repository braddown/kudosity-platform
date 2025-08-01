-- Create an index on email for performance (excluding NULL values)
-- This should be run separately after the main constraint changes
CREATE INDEX IF NOT EXISTS idx_profiles_email_non_null 
ON profiles (email) 
WHERE email IS NOT NULL AND email != '';
