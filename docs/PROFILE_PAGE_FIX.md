# Profile Page Query Fix

## Issue
The profile page was not displaying account memberships and profile updates were failing.

## Root Cause
The `user_profiles` table uses `user_id` as the foreign key to `auth.users`, not `id` as the primary key. The queries were incorrectly using `id` instead of `user_id`.

## Fixes Applied

### 1. Profile Fetch Query
**Before:**
```typescript
.from('user_profiles')
.select('*')
.eq('id', user.id)  // WRONG - id is the primary key, not the user reference
.single()
```

**After:**
```typescript
.from('user_profiles')
.select('*')
.eq('user_id', user.id)  // CORRECT - user_id is the foreign key
.single()
```

### 2. Profile Update Query
**Before:**
```typescript
.from('user_profiles')
.update({ ... })
.eq('id', profile.id)  // WRONG - trying to use primary key
```

**After:**
```typescript
const { data: { user } } = await supabase.auth.getUser()

.from('user_profiles')
.update({ ... })
.eq('user_id', user.id)  // CORRECT - using user_id foreign key
```

### 3. Added Debug Logging
Added console logging to help debug membership fetching:
```typescript
console.log('Fetching memberships for user:', user.id)
// ... query ...
if (membershipError) {
  console.error('Error fetching memberships:', membershipError)
} else if (membershipData) {
  console.log('Memberships found:', membershipData)
} else {
  console.log('No memberships found')
}
```

## Database Schema Reference
```sql
-- user_profiles table structure
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Primary key
  user_id UUID REFERENCES auth.users(id),         -- Foreign key to auth.users
  email VARCHAR(255),
  full_name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  -- ... other fields
);
```

## Testing
1. Navigate to `/profile`
2. Verify profile data loads correctly
3. Update profile fields and save
4. Check that account memberships are displayed
5. Verify changes persist after page refresh

## Key Takeaway
Always use the correct column for queries:
- `user_id` when querying by authenticated user
- `id` only when you have the actual profile record ID
