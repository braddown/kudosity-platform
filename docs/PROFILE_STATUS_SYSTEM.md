# Profile Status System

## Date: 2025-08-12

## Overview
Implemented a comprehensive profile status system that tracks profile states based on notification preferences and lifecycle management.

## Status Values

### 1. Active
- **Definition**: Profile has at least one communication channel active (marketing or transactional)
- **Visibility**: Displayed in all lists and segments
- **Data**: Full profile data retained
- **Channels Checked**: 
  - Marketing: email, sms, whatsapp, rcs
  - Transactional: email, sms, whatsapp, rcs

### 2. Archived  
- **Definition**: No communication channels are active but profile data is preserved
- **Visibility**: Still visible in lists and segments
- **Data**: Full profile data retained
- **Use Case**: Profiles that have opted out of all communications but may re-engage

### 3. Deleted
- **Definition**: Soft deleted profile, data preserved but hidden
- **Visibility**: NOT displayed in lists or segments
- **Data**: Full data retained, only ID and mobile number accessible
- **Restoration**: Can be restored to previous status

### 4. Destroyed
- **Definition**: Permanently deleted, minimal data retained for compliance
- **Visibility**: NOT displayed anywhere
- **Data**: Only ID and mobile number retained
- **Restoration**: Cannot be restored

## Profile Count Cards

The reporting cards at the top of the profiles page now show:

### All Profiles
- Total count of all profiles in the system (excluding destroyed)

### Active
- Count of profiles with any channel active (marketing or transactional)
- Excludes deleted and destroyed profiles

### Marketing
- Count of profiles with any marketing channel active
- Marketing channels: marketing_email, marketing_sms, marketing_whatsapp, marketing_rcs
- Excludes deleted and destroyed profiles

### Archived (formerly Suppressed)
- Count of profiles with no active channels
- Still visible in lists and segments
- Excludes deleted and destroyed profiles

### Unsubscribed
- Count of profiles with ALL marketing channels revoked/false
- May still have transactional channels active
- Excludes deleted and destroyed profiles

### Deleted
- Count of soft-deleted profiles
- Includes profiles with status 'deleted' or legacy 'Inactive'

## Implementation Details

### Database Changes
- Added `status` column to `cdp_profiles` table
- Values: 'active', 'archived', 'deleted', 'destroyed'
- Default: 'active'
- Index added for performance

### Count Calculation
Counts are now calculated dynamically based on:
1. Notification preferences (actual channel states)
2. Profile status field
3. Combination of both for accurate categorization

### Helper Functions
- `hasActiveChannel(profile)`: Checks if any channel is active
- `hasMarketingChannel(profile)`: Checks if any marketing channel is active
- `allMarketingRevoked(profile)`: Checks if all marketing channels are false

## Migration Notes

Existing profiles are migrated as follows:
- Profiles with any active channel → 'active'
- Profiles with is_deleted = true → 'deleted'
- All others → 'archived'

## Benefits

1. **Accurate Reporting**: Cards now show real-time accurate counts based on actual channel states
2. **Compliance**: Proper handling of deleted and destroyed profiles for GDPR/privacy
3. **Flexibility**: Profiles can transition between states based on user preferences
4. **Data Preservation**: Soft delete preserves data while respecting user wishes
5. **Performance**: Indexed status field for fast queries

## Testing

1. Toggle notification preferences and verify count updates
2. Delete a profile and verify it moves to deleted count
3. Archive a profile (turn off all channels) and verify archived count
4. Verify marketing count reflects only marketing channel states

