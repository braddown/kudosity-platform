-- Check the current schema of the profiles table
-- This will help us understand what constraints exist

-- Check table structure and column details
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check all constraints on the profiles table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'profiles';

-- Check specifically for NOT NULL constraints on email
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'profiles' 
AND column_name = 'email';

-- Check if there are any triggers on the profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table = 'profiles';
