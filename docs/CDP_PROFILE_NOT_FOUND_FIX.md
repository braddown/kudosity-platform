# CDP Profile Not Found Error Fix

## Issue
The application was showing "JSON object requested, multiple (or no) rows returned" error when trying to access a profile with ID `3d9e431b-bc3b-4a5b-9b8e-76aed9b3f93a`.

## Root Cause
The profile ID `3d9e431b-bc3b-4a5b-9b8e-76aed9b3f93a` doesn't exist in the database. The Supabase `.single()` method throws an error when no rows are found, causing the confusing error message.

## Solution
Updated the API routes to use `.maybeSingle()` instead of `.single()`:
- `.single()` - Throws error if no rows or multiple rows found
- `.maybeSingle()` - Returns null if no rows found, only throws on multiple rows

### Changes Made
1. **GET /api/cdp-profiles/[id]**
   - Changed to use `.maybeSingle()`
   - Added explicit null check
   - Returns clear 404 error with message

2. **PUT /api/cdp-profiles/[id]**
   - Changed to use `.maybeSingle()`
   - Returns 404 if profile doesn't exist

## How to Use Profiles Correctly

### Valid Profile IDs (Examples)
Based on the database, these are valid profile IDs:
- `f65e63e2-b6ca-4eb7-aef3-d9a821f11a29` (Chopper Erso)
- `270798c1-6845-4df2-887c-a892dfad7560` (Unknown User)
- `9b35c6af-5b81-4561-8a56-6da0049ac9b0` (Olivia Birrell)

### Accessing Profiles
1. **List View**: Navigate to `/profiles` to see all profiles
2. **Click to Edit**: Click on any profile in the list to edit
3. **Direct URL**: Use `/profiles/edit/[valid-id]` with a valid profile ID

### Error Handling
If you navigate to a non-existent profile:
- API returns 404 with message "No profile exists with ID [id]"
- UI shows "Profile not found" error
- User is redirected back to profiles list

## Testing
1. Navigate to `/profiles`
2. Click on any profile in the list - should open correctly
3. Try invalid URL `/profiles/edit/invalid-id` - should show error and redirect

## Future Improvements
- Add profile search functionality
- Implement profile ID validation on client side
- Add "Create New Profile" button when profile not found
- Consider using slugs or email for more user-friendly URLs
