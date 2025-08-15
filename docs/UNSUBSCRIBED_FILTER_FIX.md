# Unsubscribed Filter Fix

## Issue
The "Unsubscribed" filter was incorrectly showing profiles with marketing channels enabled. It was treating undefined/missing/null channels as "disabled" when they should require explicit false values.

## Solution

### Updated Logic for "Unsubscribed" Status
A profile is considered "Unsubscribed" when:
1. ALL four main marketing channels (email, sms, whatsapp, rcs) are explicitly set to false
2. Optional channels (push, in_app) are either false or not defined
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
- Returned true if channels were not equal to true (including undefined/null)
- Treated missing preferences as unsubscribed

**After**:
- Returns false if no preferences exist
- Requires ALL main channels (email, sms, whatsapp, rcs) to be explicitly false
- Optional channels (push, in_app) can be false or undefined
- Only returns true when all channels are properly disabled

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
