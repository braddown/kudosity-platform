-- Make email field nullable in profiles table
-- This allows profiles to be created without email addresses

-- First, update any existing NULL emails to empty string (if any exist)
UPDATE profiles 
SET email = '' 
WHERE email IS NULL;

-- Now alter the table to remove the NOT NULL constraint
ALTER TABLE profiles 
ALTER COLUMN email DROP NOT NULL;

-- Add a check constraint to ensure email is either NULL or a valid format
-- (This is optional but helps maintain data quality)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_format_check 
CHECK (email IS NULL OR email = '' OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Update any existing profiles that have empty string emails to NULL for consistency
UPDATE profiles 
SET email = NULL 
WHERE email = '';
