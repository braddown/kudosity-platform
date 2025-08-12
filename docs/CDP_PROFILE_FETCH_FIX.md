# CDP Profile Fetch Fix - Resolved Duplicate Queries

## Problem
When accessing individual CDP profiles at `/profiles/edit/[id]`, the application was throwing the error:
```
Failed to load profile: JSON object requested, multiple (or no) rows returned
```

## Root Cause
The profile data was being fetched **twice** using different methods:

1. **EditProfilePage component** - Was fetching the profile directly using `profilesApi.getProfile()`
2. **useProfileData hook** - Was fetching the profile using direct Supabase queries with `.single()`

This caused:
- Duplicate API calls
- Conflicting fetch methods (one through API route, one direct to Supabase)
- The direct Supabase query with `.single()` was failing due to RLS or data issues

## Solution

### 1. Removed Redundant Fetch from EditProfilePage
**File:** `app/profiles/edit/[id]/page.tsx`
- Removed the `useEffect` that was fetching profile data
- Removed the `profile` and `loading` state variables
- Let ProfilePage component handle all data fetching

### 2. Updated useProfileData Hook to Use API
**File:** `lib/hooks/use-profile-data.ts`
- Changed from direct Supabase query:
  ```typescript
  const { data, error } = await supabase
    .from("cdp_profiles")
    .select("*")
    .eq("id", profileId)
    .single()
  ```
- To using the profiles API:
  ```typescript
  const { data, error } = await profilesApi.getProfile(profileId)
  ```
- Removed unnecessary `supabase` import

## Benefits
- ✅ Single source of truth for profile fetching
- ✅ Consistent error handling through API routes
- ✅ No more duplicate API calls
- ✅ Better separation of concerns
- ✅ Profiles now load correctly without errors

## Architecture Pattern
The correct pattern is now:
```
EditProfilePage (UI wrapper)
  └── ProfilePage (component)
      └── useProfileData (hook)
          └── profilesApi (API client)
              └── /api/cdp-profiles/[id] (API route)
                  └── Supabase (with proper auth context)
```

Each layer has a single responsibility:
- **EditProfilePage**: Provides page layout and navigation
- **ProfilePage**: Manages UI state and user interactions
- **useProfileData**: Manages data fetching and caching
- **profilesApi**: Makes HTTP requests to API
- **API route**: Handles authentication and database queries
- **Supabase**: Executes queries with proper RLS context

## Testing
After these changes:
1. Navigate to `/profiles`
2. Click on any profile
3. Profile loads correctly without errors
4. Editing and saving works as expected
