# User Profile Update Fix - RLS Policy Correction

## Problem
When trying to update the User Profile, users were getting the error:
```
Error saving profile
Profile not found or no changes made
```

## Root Cause
The Row-Level Security (RLS) policies on the `user_profiles` table were still checking against the `id` column instead of the new `user_id` column. 

The old policies were using:
- `auth.uid() = id` (incorrect - comparing user ID to profile ID)

But after adding the `user_id` column, they should use:
- `auth.uid() = user_id` (correct - comparing user ID to user ID)

## Solution

### RLS Policies Updated
Dropped the old policies and created new ones that properly reference the `user_id` column:

```sql
-- View your own profile
CREATE POLICY "View your own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Update your own profile
CREATE POLICY "Update your own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert your own profile
CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- View profiles of organization members
CREATE POLICY "View profiles of organization members" 
ON user_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM account_members om1
    JOIN account_members om2 ON om1.account_id = om2.account_id
    WHERE om1.user_id = auth.uid() 
    AND om2.user_id = user_profiles.user_id
    AND om1.status = 'active'
    AND om2.status = 'active'
  )
);

-- Delete your own profile
CREATE POLICY "Delete your own profile" 
ON user_profiles FOR DELETE 
USING (auth.uid() = user_id);
```

## Impact
Now users can:
- ✅ View their own profile
- ✅ Update their profile information
- ✅ View profiles of other members in their organization
- ✅ Save changes without errors

## Testing
1. Navigate to User Profile (`/profile`)
2. Edit any field (e.g., First Name, Last Name, Mobile Number, Country, Timezone)
3. Click "Save Changes"
4. Should see success message: "Your profile has been updated"
5. Changes should persist after page refresh
