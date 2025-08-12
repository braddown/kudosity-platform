# Complete Activity Logging Fix

## Problem
Activity history was not displaying in recipient profiles even though activities were being saved to the database. The issues were:
1. RLS policies were blocking the API from reading activities
2. Direct database queries were failing due to authentication context
3. Activities weren't properly associated with the logged-in user

## Root Causes
1. **RLS Blocking Reads**: The Row-Level Security policies on `profile_activity_log` table were preventing the authenticated Supabase client from reading activities
2. **Direct DB Queries**: Both reading and writing were using direct Supabase queries which respect RLS
3. **Missing User Context**: Activities weren't properly capturing the actual user who made changes

## Solution

### 1. Created Database Functions with SECURITY DEFINER
Created two PostgreSQL functions that bypass RLS while maintaining security:

#### `get_profile_activities(p_profile_id UUID)`
- Fetches activity logs for a profile
- Validates user has access through account membership
- Returns activities ordered by creation date
- Bypasses RLS using SECURITY DEFINER

#### `insert_profile_activity(...)`
- Inserts new activity logs
- Automatically captures account_id and performed_by (user)
- Validates user has permission to log activities
- Returns the created activity ID

### 2. Updated API Endpoints
Modified `/api/cdp-profiles/[id]/activity/route.ts`:
- GET: Now uses `get_profile_activities` RPC function
- POST: Now uses `insert_profile_activity` RPC function
- Both properly handle authentication and permissions

### 3. Updated Frontend Components
- `ProfileActivityTimeline`: Uses API endpoint instead of direct queries
- `useProfileForm`: Logs activities through API with proper user attribution
- Added refresh trigger to update timeline after saves

## Benefits
✅ **Working Activity Display**: Activities now show in the timeline
✅ **Proper User Attribution**: Shows actual user who made changes (not hardcoded)
✅ **Security Maintained**: Functions validate permissions before access
✅ **Performance**: SECURITY DEFINER functions bypass RLS overhead
✅ **Audit Trail**: Complete history of who changed what and when

## Database Schema
```sql
profile_activity_log
├── id (UUID)
├── profile_id (references cdp_profiles)
├── activity_type (property_updated, consent_given, etc.)
├── channel (email, sms, whatsapp, etc.)
├── channel_type (marketing, transactional)
├── description (human-readable description)
├── metadata (JSONB - additional context)
├── source (user's name)
├── account_id (references accounts)
├── performed_by (references auth.users)
└── created_at (timestamp)
```

## Testing
1. Edit any recipient profile
2. Make changes to fields or notification preferences
3. Save the profile
4. Activity History section should immediately show:
   - The change that was made
   - Who made it (your actual user name)
   - When it was made
   - Details of what changed (before/after values)

## Future Enhancements
- Add pagination for long activity histories
- Add filtering by activity type or date range
- Add export functionality for compliance reporting
- Add real-time updates via WebSockets
- Add activity aggregation for analytics
