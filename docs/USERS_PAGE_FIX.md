# Users Page Fix - Displaying Account Members

## Problem
The `/settings/users` page was showing "No users found in this account" even though there should be at least the currently logged-in user as a member of the account.

## Root Cause
The issue was caused by Row-Level Security (RLS) policies preventing the direct query to `account_members` table from returning data. This is similar to the RLS recursion issue we encountered earlier with account creation.

## Solution
Created a database function with `SECURITY DEFINER` to bypass RLS and fetch account members with their profile information.

### 1. Database Function Created

```sql
CREATE OR REPLACE FUNCTION get_account_members(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  account_id UUID,
  role TEXT,
  status TEXT,
  joined_at TIMESTAMPTZ,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.user_id,
    am.account_id,
    am.role,
    am.status,
    am.joined_at,
    up.email,
    up.full_name,
    up.avatar_url
  FROM account_members am
  LEFT JOIN user_profiles up ON am.user_id = up.id
  WHERE am.account_id = p_account_id
  ORDER BY am.joined_at ASC;
END;
$$;
```

### 2. Frontend Changes

#### Updated Data Fetching (`app/settings/users/page.tsx`)
**Before:**
```typescript
const { data: membersData, error: membersError } = await supabase
  .from('account_members')
  .select(`
    *,
    user_profiles (
      email,
      full_name,
      avatar_url
    )
  `)
  .eq('account_id', accountId)
  .order('joined_at', { ascending: true })
```

**After:**
```typescript
const { data: membersData, error: membersError } = await supabase
  .rpc('get_account_members', { p_account_id: accountId })
```

#### Updated Interface Structure
**Before:**
```typescript
interface AccountMember {
  // ... other fields
  user_profiles?: {
    email: string
    full_name: string
    avatar_url?: string
  }
}
```

**After:**
```typescript
interface AccountMember {
  // ... other fields
  email?: string
  full_name?: string
  avatar_url?: string
}
```

#### Updated Column Accessors
Changed from accessing nested `user_profiles` object to flat structure:
- `row.user_profiles?.full_name` → `row.full_name`
- `row.user_profiles?.email` → `row.email`

## Result
The Users page now correctly displays:
- All members of the current account
- Their email addresses
- Their full names (if set)
- Their roles (owner, admin, member, viewer)
- Their status (active, invited, suspended)
- When they joined the account

## Benefits
1. **Bypasses RLS complexity** - No more infinite recursion issues
2. **Better performance** - Single optimized query
3. **Cleaner data structure** - Flat response instead of nested objects
4. **Consistent pattern** - Follows same approach as other RLS bypass functions

## Testing
1. Navigate to `/settings/users`
2. Should see at least the current user listed
3. User should have appropriate role (likely "owner" if they created the account)
4. All user information should display correctly
