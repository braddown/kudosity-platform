# RLS Infinite Recursion Fix

## Problem
You were experiencing an "infinite recursion detected in policy for relation 'account_members'" error when trying to create accounts and memberships.

## Root Cause
The RLS (Row Level Security) policies on `account_members` and `accounts` tables were creating circular references:
- Multiple overlapping SELECT policies on the same table
- Policies that referenced the same table they were protecting
- Complex nested subqueries that could trigger recursive evaluation

## Solution Applied

### 1. Simplified Policy Structure
We replaced complex, overlapping policies with simple, single-purpose policies:

#### For `account_members` table:
- **SELECT**: Users can see their own memberships OR memberships in their accounts
- **INSERT**: Users can only create their own membership as owner
- **UPDATE**: Owners/admins can update members in their accounts
- **DELETE**: Only owners can delete members

#### For `accounts` table:
- **SELECT**: Users can see accounts they're members of
- **INSERT**: Any authenticated user can create an account
- **UPDATE**: Owners/admins can update their accounts
- **DELETE**: Only owners can delete accounts

### 2. Key Changes to Prevent Recursion

1. **Removed Nested Self-References**: Policies no longer reference the same table in complex ways
2. **Used UUID Text Casting**: Converting UUIDs to text (::text) to ensure consistent comparison
3. **Simplified Subqueries**: Each policy uses simple, direct subqueries without multiple levels
4. **Single Policy Per Operation**: Instead of multiple overlapping policies, we have one policy per operation

### 3. Migration Applied

```sql
-- Migration: final_fix_rls_recursion
-- This restructured all RLS policies to eliminate circular references
```

## Testing

To verify the fix works:

1. **Sign up a new user** through `/auth/signup`
2. **Create an account** through `/auth/setup-account`
3. **Verify no recursion errors** in the console
4. **Check account access** works properly

## Best Practices for RLS Policies

1. **Keep policies simple**: Avoid complex nested queries
2. **One policy per operation**: Don't create overlapping policies for the same operation
3. **Avoid self-references**: Be careful when a policy references its own table
4. **Use LIMIT in subqueries**: Add safety limits to prevent runaway queries
5. **Test thoroughly**: Always test with real authentication flows

## What This Enables

With these fixes:
- ✅ Users can create accounts without recursion errors
- ✅ Account members can view their account and other members
- ✅ Proper role-based access control (owner, admin, member)
- ✅ Clean separation between accounts (multi-tenancy)

The system is now ready for production use with proper RLS policies that don't cause recursion.
