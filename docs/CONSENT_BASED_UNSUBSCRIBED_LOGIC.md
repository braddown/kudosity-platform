# Consent-Based Unsubscribed Logic

## Business Requirements
Marketing channels should follow a consent model with three states:
1. **No consent given** - Channel value is `null` or profile has no preferences
2. **Consented** - Channel value is `true` (with optional consent metadata)
3. **Revoked/No Consent** - Channel value is `false`

## Implementation

### Unsubscribed Definition
A profile is considered "Unsubscribed" when:
1. They have notification preferences defined
2. ALL marketing channels are either `false` or `null` (no channels are `true`)
3. At least ONE channel is explicitly set to `false` (showing active choice)

This ensures we only count profiles that have:
- Made an explicit choice to not receive marketing
- Not just profiles with missing/undefined preferences

### Marketing Enabled Definition
A profile is considered "Marketing Enabled" when:
1. At least ONE marketing channel is set to `true`
2. Checks both singular and plural field names (e.g., `marketing_email` and `marketing_emails`)

### Key Points
- **No preferences = Not unsubscribed** - These profiles haven't made any consent choices
- **All channels null = Not unsubscribed** - No explicit consent decision made
- **At least one false + no true = Unsubscribed** - Active choice to opt out
- **Any channel true = Not unsubscribed** - Has active marketing consent

## Database Field Names
The system handles both naming conventions:
- `marketing_emails` (plural) - newer format
- `marketing_email` (singular) - legacy format
- Both are checked for proper counting

## Channels Checked
- marketing_emails / marketing_email
- marketing_sms
- marketing_whatsapp
- marketing_rcs
- marketing_push (if implemented)
- marketing_in_app (if implemented)







