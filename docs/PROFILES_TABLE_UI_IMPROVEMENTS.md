# Profiles Table UI Improvements

## Changes Made

### 1. Reorganized Actions Menu
Separated actions into two distinct categories for better UX:

#### Data Operations (Left Dropdown with Filters)
- Combined with the filter/segment/list dropdown
- **Data operations now appear at the TOP of the dropdown**
- Separated by a divider line from filters/lists/segments
- **Added search functionality for dropdowns with >10 items**
- Contains:
  - Filter Profiles - Opens inline filter builder
  - Export CSV - Exports current view or selection
  - Import CSV - Bulk import profiles

#### Bulk Actions (Right Dropdown)
- **Always visible but disabled when no profiles are selected**
- Shows count of selected items in button: "Actions (3)" when items are selected
- Shows just "Actions" when nothing is selected (greyed out)
- Contains actions that apply to selected profiles:
  - Tag - Add tags to selected profiles
  - Delete - Soft delete selected profiles
  - Add to List - Add selected profiles to a list
- Removed "Unsubscribe" as it's too complex for bulk operations (multiple channels)

### 2. DataTable Component Updates
- Added `bulkActions` prop separate from `actions`
- Bulk actions receive the selected rows as a parameter
- Actions now support icons for better visual hierarchy
- Filter dropdown now includes data operations at the bottom

### 3. Selection Handling
- Changed from index-based Set to actual Profile array
- `selectedProfiles` state properly tracks selected items
- Export uses selected profiles if any, otherwise exports all filtered profiles
- Bulk actions validate selection and show toast if no items selected

### 4. UI Improvements
- Clear separation between filtering/viewing operations and bulk actions
- Bulk actions button only visible when items are selected
- Shows selection count in the bulk actions button
- Icons added to all action items for better visual recognition
- Toast notifications for validation errors

## Status Clarification (for future implementation)

### Inactive Status
- Profile remains in all lists and segments
- All communication channels turned OFF
- Still counted in segment/list sizes
- Useful for temporary suppressions

### Deleted Status  
- Profile removed from all lists and segments
- All communication channels turned OFF
- Not counted in segment/list sizes
- Useful for permanent opt-outs

### Destroyed Status
- Complete removal from database (GDPR compliance)
- All related data permanently deleted
- Cannot be recovered

## Testing
1. Navigate to /profiles
2. The left dropdown should show filters/segments/lists with data operations at bottom
3. Select one or more profiles using checkboxes
4. The "Actions (n)" button should appear on the right
5. Click Actions to see bulk operations
6. Try each bulk action - should show toast if no selection
7. Export should work with or without selection
