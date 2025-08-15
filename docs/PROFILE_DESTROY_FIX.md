# Profile Destroy Function Fix

## Issue
The destroy function for permanently deleting profiles was not working. It should completely remove the profile and all associated data from the database.

## Solution

### 1. Enhanced DELETE API Endpoint
Updated the DELETE endpoint in `app/api/cdp-profiles/[id]/route.ts` to:
- Delete all related data before deleting the profile
- Handle foreign key constraints properly
- Clean up data in the following order:
  1. `cdp_contacts` - Contact information
  2. `cdp_profile_activities` - Profile activities
  3. `cdp_profile_merge_log` - Merge logs
  4. `profile_activity_log` - Activity logs
  5. `list_memberships` - List memberships
  6. `cdp_profiles` - The profile itself (last)

### 2. Account ID Handling
- Modified to handle profiles that might not have `account_id` set
- Checks if profile exists before attempting deletion
- Only enforces account_id match if it's set on the profile

### 3. Enhanced Confirmation Dialog
Updated the destroy confirmation dialog to be more explicit:
- Shows warning emoji ⚠️
- Lists what will be deleted:
  - Profile completely from database
  - All associated activity logs
  - Removal from all lists and segments
  - All related metadata
- Emphasizes this action CANNOT be undone

## Technical Details

### Foreign Key Constraints
The cdp_profiles table has foreign key relationships with:
- `cdp_contacts` (NO ACTION on delete)
- `cdp_profile_activities` (NO ACTION on delete)
- `cdp_profile_merge_log` (NO ACTION on delete)
- `profile_activity_log` (CASCADE on delete)
- `list_memberships` (via contact_id)

The NO ACTION constraints prevent deletion if related records exist, so we must delete them first.

## Testing
1. Navigate to /profiles
2. Find a profile with status "deleted"
3. Click the 3-dot menu → Destroy
4. Confirm the detailed warning dialog
5. Profile should be permanently removed from the database
6. Verify all related data is also removed

## Security
- Only users with 'owner' or 'admin' role can destroy profiles
- Requires active account membership
- Logs all deletion steps for audit trail
