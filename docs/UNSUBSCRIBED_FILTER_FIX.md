# Unsubscribed Filter Fix

## Issue
The "Unsubscribed" filter was incorrectly showing profiles with marketing channels enabled. It was treating undefined/missing/null channels as "disabled" when they should require explicit false values.

## Solution

### Updated Logic for "Unsubscribed" Status
A profile is considered "Unsubscribed" when:
1. NO marketing channels are set to true
2. All channels are either false, undefined, or null
3. This includes profiles with no notification preferences at all

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
- Too strict - required all channels to be explicitly false
- Returned 0 count because most profiles have undefined/null values

**After**:
- Returns true if NO channels are set to true
- Accepts false, undefined, or null as "off"
- Returns true for profiles with no preferences at all
- Only returns false if ANY channel is explicitly true

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
