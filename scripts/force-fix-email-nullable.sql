-- Force fix the email column to be nullable
-- This is a more aggressive approach to remove the NOT NULL constraint

-- First, let's see what we're working with
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email';

-- Drop any existing check constraints on email
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'profiles'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%email%'
    LOOP
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- Now force the column to be nullable
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email';

-- Add a more permissive check constraint (optional)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_valid 
CHECK (email IS NULL OR email = '' OR length(email) > 0);
