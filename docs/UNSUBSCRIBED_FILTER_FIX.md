# Unsubscribed Filter Fix

## Issue
The "Unsubscribed" filter was incorrectly showing profiles with marketing channels enabled. It was treating undefined/missing channels as "disabled" when they should be ignored.

## Solution

### Updated Logic for "Unsubscribed" Status
A profile is considered "Unsubscribed" when:
1. It has at least one marketing channel defined in notification_preferences
2. ALL defined marketing channels are set to false (or undefined)
3. NO marketing channels are set to true

### Updated Logic for "Marketing Enabled" Status
A profile is considered "Marketing Enabled" when:
1. It has at least one marketing channel set to true
2. Checks all 6 possible marketing channels:
   - marketing_email
   - marketing_sms
   - marketing_whatsapp
   - marketing_rcs
   - marketing_push
   - marketing_in_app

## Key Changes

### 1. allMarketingRevoked Function
**Before**: 
- Returned true if channels were undefined or not equal to true
- Treated missing preferences as unsubscribed

**After**:
- Returns false if no preferences exist
- Returns false if no marketing channels are defined
- Only returns true if at least one channel is defined AND none are true
- Handles all 6 marketing channel types

### 2. hasMarketingChannel Function
**Before**:
- Only checked 4 channels (email, sms, whatsapp, rcs)

**After**:
- Checks all 6 channels including push and in-app

## Behavior

### Unsubscribed Filter Shows:
- Profiles where ALL defined marketing channels are false
- Does NOT show profiles with any channel set to true
- Does NOT show profiles with no marketing preferences defined

### Marketing Enabled Filter Shows:
- Profiles where ANY marketing channel is true
- Checks all 6 possible marketing channels

## Testing
1. Navigate to /profiles
2. Click "Unsubscribed" card
3. Verify NO profiles shown have any marketing channel set to true
4. Click "Marketing Enabled" card  
5. Verify ALL profiles shown have at least one marketing channel set to true
6. Verify counts match the filtered results
