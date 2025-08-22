# Profile Cards and Filtering Fix

## Issues Fixed

1. **Card Order**: Reordered cards to be more logical
2. **Marketing Enabled Logic**: Changed to show profiles with ANY marketing channel enabled
3. **Unsubscribed Logic**: Changed to show profiles with ALL marketing channels disabled

## Changes Made

### 1. Card Order (ProfileCounts.tsx)
**Before**: All Profiles, Active, Marketing Enabled, Inactive, Unsubscribed, Deleted
**After**: All Profiles, Active, Inactive, Deleted, Marketing Enabled, Unsubscribed

This follows a more logical progression:
- Lifecycle statuses first (Active → Inactive → Deleted)
- Marketing statuses last (Marketing Enabled → Unsubscribed)

### 2. Marketing Enabled Logic
**Before**: Only counted active profiles with marketing channels
**After**: Counts ANY profile (except destroyed) with ANY marketing channel enabled

- Shows profiles regardless of lifecycle status (active, inactive, deleted)
- A profile is "Marketing Enabled" if ANY of these are true:
  - marketing_email
  - marketing_sms
  - marketing_push
  - marketing_in_app

### 3. Unsubscribed Logic
**Before**: Only counted active/inactive profiles with all marketing disabled
**After**: Counts ANY profile (except destroyed) with ALL marketing channels disabled

- Shows profiles regardless of lifecycle status (active, inactive, deleted)
- A profile is "Unsubscribed" if ALL marketing channels are false or not set
- This is the opposite of "Marketing Enabled"

### 4. Updated Descriptions
- Marketing Enabled: "Any marketing channel enabled"
- Unsubscribed: "All marketing channels disabled"

## Behavior

### Marketing Enabled Card
- Shows count of profiles with at least one marketing channel enabled
- Clicking filters to show these profiles regardless of their lifecycle status
- Useful for seeing who can receive marketing messages

### Unsubscribed Card
- Shows count of profiles with all marketing channels disabled
- Clicking filters to show these profiles regardless of their lifecycle status
- Useful for seeing who has opted out of all marketing

### Lifecycle Status Cards (Active, Inactive, Deleted)
- These are purely based on the profile's `status` field
- Independent of marketing preferences
- Represent the profile's lifecycle state in the system

## Testing
1. Navigate to /profiles
2. Verify card order: All → Active → Inactive → Deleted → Marketing Enabled → Unsubscribed
3. Click "Marketing Enabled" - should show profiles with ANY marketing channel on
4. Click "Unsubscribed" - should show profiles with ALL marketing channels off
5. Verify counts match the filtered results
6. Test that Marketing/Unsubscribed cards include profiles from all lifecycle statuses




