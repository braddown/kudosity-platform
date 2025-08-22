# Select All Filtered Results Enhancement

## Issue
The "select all" checkbox in the table header was only selecting profiles on the current page, not all filtered results. This was confusing for users who expected it to select all matching profiles across all pages.

## Solution

### 1. DataTable Component Updates
- Added `allFilteredData` prop to pass all filtered results (not just current page)
- Added `onSelectAllFiltered` optional callback for custom handling
- Updated `handleSelectAll` to select all filtered data when available
- Enhanced checkbox logic to show proper checked/indeterminate states

### 2. Visual Feedback
- Added count indicator next to checkbox showing selection status
- Shows "All 150" when all filtered results are selected
- Shows "25 of 150" when partial selection
- Properly handles indeterminate state for partial selections

### 3. Profiles Page Integration
- Now passes `filteredProfiles` to DataTable as `allFilteredData`
- Enables selecting all filtered results regardless of pagination
- Maintains proper selection state across page navigation

## Behavior

### When Select All is Checked:
- If `allFilteredData` is provided: Selects ALL filtered results across all pages
- If not provided: Falls back to selecting only current page (backward compatible)
- Visual indicator shows total selection count

### When Individual Items are Selected:
- Checkbox shows indeterminate state when some but not all items are selected
- Count indicator updates to show "X of Y" format
- Works correctly with pagination

### Benefits:
- **Better UX**: Users can select all matching profiles at once
- **Clear Feedback**: Visual indicators show exactly what's selected
- **Backward Compatible**: Components without `allFilteredData` still work
- **Performance**: Only passes IDs, not full data when selecting large sets

## Testing
1. Navigate to /profiles
2. Apply a filter (e.g., "Active" profiles)
3. Check the select all checkbox
4. Verify all filtered profiles are selected (not just current page)
5. Navigate between pages - selection should persist
6. Check the count indicator shows correct numbers
7. Test partial selection to see indeterminate state



