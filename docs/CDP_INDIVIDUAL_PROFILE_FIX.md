# CDP Individual Profile Access Fix

## Issue
After fixing the profile list display, individual profiles couldn't be loaded when clicking on them.

## Root Cause
The `getProfile` function in `lib/api/profiles-api.ts` was still using the unauthenticated Supabase client directly, which couldn't access profiles due to RLS policies.

## Solution Implemented

### 1. Created Dynamic Route API
Created `/api/cdp-profiles/[id]/route.ts` to handle individual profile operations:
- **GET**: Fetch a single profile by ID
- **PUT**: Update a profile
- **DELETE**: Delete a profile

### 2. Authentication & Authorization
Each endpoint:
- Authenticates the user
- Verifies account membership
- Ensures the profile belongs to the user's account
- Checks appropriate permissions (e.g., admin-only for delete)

### 3. Updated Profile API Functions
Modified `lib/api/profiles-api.ts` to use the new authenticated endpoints:
- `getProfile()` - Uses GET `/api/cdp-profiles/[id]`
- `updateProfile()` - Uses PUT `/api/cdp-profiles/[id]`
- `deleteProfile()` - Uses DELETE `/api/cdp-profiles/[id]`

## Benefits
1. **Consistent Authentication**: All profile operations now use the same authentication flow
2. **Security**: Server-side validation of account access
3. **Performance**: No RLS overhead on individual queries
4. **Flexibility**: Easy to add business logic or caching

## Architecture Pattern
```
Client (React) 
  ↓
Profile API (lib/api/profiles-api.ts)
  ↓
Authenticated API Routes (/api/cdp-profiles/*)
  ↓
Supabase with Account Context
  ↓
Database with RLS
```

## Testing
1. Navigate to `/profiles`
2. Click on any profile to view details
3. Edit profile information
4. Save changes
5. All operations should work with proper authentication

## Future Improvements
- Add response caching for frequently accessed profiles
- Implement batch operations for bulk updates
- Add audit logging for profile changes
- Consider using service role for better performance at scale
