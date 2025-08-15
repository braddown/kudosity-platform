# Profile Deletion Fix

## Issue
- Duplicate confirmation dialogs when deleting profiles from the table
- Page resets to page 1 after deletion, losing user's current position

## Solution

### 1. Removed Duplicate Confirmation Dialog
- The DataTable component already shows a confirmation dialog (components/ui/data-table.tsx)
- Removed the duplicate confirmation from the profiles page (app/profiles/page.tsx)
- Enhanced the DataTable confirmation to show profile names when available

### 2. Maintained Page State After Deletion
- Added a `isDeletionRef` ref to track when profile updates are due to deletion/restore operations
- Modified the useEffect that filters profiles to only reset page when filters change, not when profiles are updated due to deletion
- When deleting a profile, the page now stays on the current page
- If the last item on a page is deleted, it automatically adjusts to the last valid page
- Different behavior based on filter:
  - For filtered views (e.g., "active", "marketing"): Removes the deleted profile from view
  - For "all" or "deleted" views: Updates the status but keeps the profile visible

### 3. Status Value Consistency
- Updated status values to use lowercase ("deleted", "active") for consistency
- Fixed DataTable to check for "deleted" status instead of "Inactive"

## Changes Made

1. **app/profiles/page.tsx**
   - Added `useRef` import and `isDeletionRef` to track deletion operations
   - Added `useToast` import and hook for toast notifications
   - Modified useEffect to check `isDeletionRef` before resetting page
   - Set `isDeletionRef.current = true` before updating profiles in delete/restore/destroy handlers
   - Removed duplicate confirmation dialog in onRowDelete
   - Added logic to maintain current page after deletion
   - Updated status values to lowercase
   - Added similar logic for restore and destroy operations
   - Replaced all `alert()` calls with `toast()` notifications

2. **components/ui/data-table.tsx**
   - Enhanced confirmation message to show profile names when available
   - Updated status check to use "deleted" instead of "Inactive"

### 4. Replaced Alert Dialogs with Toast Notifications
- Replaced all `alert()` calls with toast notifications for better UX
- Success operations show as normal toasts
- Error operations show as destructive (red) toasts
- No more secondary dialog boxes after operations

## Testing
1. Navigate to /profiles
2. Go to any page other than page 1 (e.g., page 3)
3. Delete a profile - should see only one confirmation dialog
4. After confirming, a toast notification appears instead of an alert
5. After deletion, should remain on the same page (page 3)
6. If deleting the last item on a page, should go to the previous page
7. Test with different filters (all, active, deleted) to ensure proper behavior
8. Test restore and destroy operations to ensure they also:
   - Show toast notifications instead of alerts
   - Maintain page position
