# Recipient Profile Save Fix

## Problem
When trying to save changes to a Recipient Profile (CDP profile), users were getting:
```
Error saving profile
Profile not found or no changes made
```

## Root Cause
The `useProfileForm` hook was making direct Supabase calls to update `cdp_profiles`:
```typescript
const { data, error } = await supabase
  .from("cdp_profiles")
  .update(cdpProfileUpdate)
  .eq("id", profile.id)
  .select()
```

This bypassed our authenticated API route which:
1. Handles proper authentication context
2. Validates the user has permission to edit profiles in their account
3. Ensures the profile belongs to the user's account

## Solution

### 1. Updated Profile Save to Use API
Changed from direct Supabase call to using the `profilesApi`:
```typescript
// Use the profiles API instead of direct Supabase call
const { data, error } = await profilesApi.updateProfile(profile.id, cdpProfileUpdate)
```

### 2. Temporarily Disabled Activity Logging
The activity logging was also using direct Supabase calls to `profile_activity_log` table. This has been temporarily disabled with console logging until we create proper API endpoints:
```typescript
// TODO: Replace with API call when activity logging API is created
// For now, we'll skip activity logging to avoid RLS issues
console.log('Activity logging temporarily disabled - would log:', {
  profile_id: profile.id,
  activity_type: activityType,
  // ... activity details
  source: 'Current User' // Will be dynamically set when API is ready
})
```

## Benefits
- ✅ Profile saves now go through authenticated API
- ✅ Proper account context is maintained
- ✅ User permissions are validated
- ✅ Consistent error handling
- ✅ Better security through API layer

## Future Work
Need to create API endpoints for activity logging:
- `POST /api/cdp-profiles/[id]/activity` - Log profile activity
- Include user context from authentication
- Validate user has permission to log activity for the profile
- Store the actual user who made the change (not hardcoded)

## Testing
1. Navigate to Recipient Profiles (`/profiles`)
2. Click on any profile to edit
3. Make changes to any field
4. Click "Save"
5. Should see success message and changes should persist
