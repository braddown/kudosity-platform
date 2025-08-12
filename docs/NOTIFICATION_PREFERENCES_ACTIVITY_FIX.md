# Notification Preferences Activity Logging Fix

## Date: 2025-08-12

## Issue
When updating notification preferences on recipient profiles, the user activity log was showing "No specific changes" instead of detailing what preferences were changed.

## Root Cause
The activity logging was comparing the wrong objects:
- Was comparing: `profile[field]` vs `cdpProfileUpdate[field]`
- Should compare: `profile[field]` vs `finalProfileToSave[field]`

The `cdpProfileUpdate` object only contains fields that were explicitly set for the update, while `finalProfileToSave` contains the complete new state including notification preferences.

## Solution

### 1. Fixed Comparison Logic
Changed the user activity logging to compare against `finalProfileToSave` instead of `cdpProfileUpdate`:
```typescript
// Before
const oldValue = profile[field]
const newValue = cdpProfileUpdate[field]

// After  
const oldValue = profile[field]
const newValue = finalProfileToSave[field]
```

### 2. Enhanced Notification Preference Detection
- Properly handles undefined/null values as "Off"
- Excludes metadata fields (consent_date, activation_date)
- Shows clear "Marketing email: Off → On" format

### 3. Added Audience Icon for Profile Activities
- Profile-related activities now show the Users icon (purple)
- Other activities continue to show the Activity icon (orange)
- Helps visually distinguish between different types of activities

## Files Modified
- `lib/hooks/use-profile-form.ts` - Fixed comparison logic for user activity logging
- `app/settings/users/page.tsx` - Added audience icon for profile activities
- `app/profile/page.tsx` - Added audience icon for profile activities

## Expected Behavior

### Before
```
Updated recipient profile: Brad Down - Changed: No specific changes
```

### After
```
Updated recipient profile: Brad Down - Changed: Notification Preferences: Marketing email: Off → On, Transactional sms: On → Off
```

## Visual Changes
- Recipient profile activities now show with purple Users icon
- Other activities show with orange Activity icon
- Helps administrators quickly identify profile-related changes

## Testing
1. Update notification preferences on a recipient profile
2. Check User Activity Log in Settings > Users
3. Should see detailed changes like "Marketing email: Off → On"
4. Icon should be purple Users icon for profile activities
