-- Emergency fix: If the above doesn't work, this will recreate the column

-- Step 1: Add a new nullable email column
ALTER TABLE profiles ADD COLUMN email_new TEXT;

-- Step 2: Copy existing email data to the new column
UPDATE profiles SET email_new = email WHERE email IS NOT NULL;

-- Step 3: Drop the old email column (this will remove all constraints)
ALTER TABLE profiles DROP COLUMN email;

-- Step 4: Rename the new column to email
ALTER TABLE profiles RENAME COLUMN email_new TO email;

-- Step 5: Add an optional check constraint for email format
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_format 
CHECK (email IS NULL OR email = '' OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Verify the result
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email';
