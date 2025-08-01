-- Emergency fix: Recreate the email column as nullable
-- This will definitely work by completely recreating the column

BEGIN;

-- Step 1: Add a temporary nullable email column
ALTER TABLE profiles ADD COLUMN email_temp TEXT;

-- Step 2: Copy existing email data (if any exists and is not causing constraint issues)
UPDATE profiles SET email_temp = CASE 
    WHEN email IS NOT NULL AND email != '' THEN email 
    ELSE NULL 
END;

-- Step 3: Drop the problematic email column (removes all constraints)
ALTER TABLE profiles DROP COLUMN email CASCADE;

-- Step 4: Rename the temporary column to email
ALTER TABLE profiles RENAME COLUMN email_temp TO email;

-- Step 5: Add a basic email format check (optional, allows NULL)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_format_check 
CHECK (email IS NULL OR email = '' OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Verify the result
SELECT column_name, is_nullable, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'profiles' 
AND column_name = 'email';

COMMIT;
