# CDP Profiles Account Association Fix

## Issue
The `/profiles` page was showing 0 profiles even though the `cdp_profiles` table contained 2,633 records.

## Root Cause
The `cdp_profiles` table has Row Level Security (RLS) policies that restrict access based on the `account_id` column. The policies ensure users can only see profiles that belong to their account.

### RLS Policies on cdp_profiles:
1. **Read Policy**: Users can view profiles in their account
2. **Insert Policy**: Users with appropriate roles can insert profiles for their account
3. **Update Policy**: Users with appropriate roles can update profiles in their account
4. **Delete Policy**: Admins can delete profiles in their account

All policies check that:
```sql
EXISTS (
  SELECT 1 FROM account_members
  WHERE account_members.account_id = cdp_profiles.account_id
    AND account_members.user_id = auth.uid()
    AND account_members.status = 'active'
)
```

## Problem
All 2,633 CDP profiles had `NULL` values for `account_id`, meaning:
- No user could access them through the application
- The RLS policies blocked all queries
- The profiles page showed 0 results

## Solution
Applied migration to associate all existing profiles with the primary account:

```sql
UPDATE cdp_profiles 
SET account_id = 'bd84f8ed-f9e3-4457-a1a8-6c29fbf29e96'
WHERE account_id IS NULL 
  AND id != '00000000-0000-0000-0000-000000000000';
```

## Result
- All 2,633 profiles now have a valid `account_id`
- RLS policies now allow authorized users to view the profiles
- The `/profiles` page should display all profiles for users who are members of the account

## Future Considerations
When importing or creating new CDP profiles:
1. Always ensure the `account_id` is set
2. Use the current user's account context when creating profiles
3. Update import scripts to include account association
4. Consider adding a database trigger to automatically set account_id if not provided

## Verification
To verify the fix worked:
1. Navigate to `/profiles`
2. You should now see all 2,633 profiles listed
3. Filtering and search should work as expected
