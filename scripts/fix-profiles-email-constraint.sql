-- Remove NOT NULL constraint from email field in profiles table
-- This allows profiles to exist without email addresses

-- First, let's check the current constraint
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email', 'mobile');

-- Remove NOT NULL constraint from email field
ALTER TABLE profiles 
ALTER COLUMN email DROP NOT NULL;

-- Ensure mobile can also be nullable (in case it isn't already)
ALTER TABLE profiles 
ALTER COLUMN mobile DROP NOT NULL;

-- Update any existing records that might have issues
UPDATE profiles 
SET email = NULL 
WHERE email = '' OR email = 'null';

UPDATE profiles 
SET mobile = NULL 
WHERE mobile = '' OR mobile = 'null';

-- Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('id', 'email', 'mobile')
ORDER BY column_name;
