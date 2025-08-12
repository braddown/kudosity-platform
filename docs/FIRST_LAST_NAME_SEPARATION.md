# First and Last Name Separation

## Overview
Separated the full name field into first name and last name fields for better personalization capabilities in messaging and user management.

## Database Changes

### User Profiles Table - New Fields
- `first_name` (VARCHAR 100) - User's first name for personalization
- `last_name` (VARCHAR 100) - User's last name
- `full_name` (VARCHAR 255) - Kept for backward compatibility, auto-generated from first + last

### Data Migration
The migration automatically splits existing `full_name` data:
- First word → `first_name`
- Remaining words → `last_name`
- Preserves original `full_name` field

## UI Updates

### Profile Page (`/profile`)
**Before:**
- Single "Full Name" field

**After:**
- Two side-by-side fields:
  - First Name (left)
  - Last Name (right)
- Email field moved to second row
- Mobile number on second row

### Registration Page (`/auth/signup`)
**Before:**
- Single "Full Name" field with user icon

**After:**
- Two side-by-side fields in grid layout:
  - First Name (with user icon)
  - Last Name (no icon for cleaner look)

### Account Setup Page
- No changes needed (uses account name, not user name)

## Code Changes

### Authentication Client (`lib/auth/client.ts`)
Updated `signUp` function to accept:
```typescript
{
  email: string
  password: string
  fullName?: string  // For backward compatibility
  firstName?: string // New field
  lastName?: string  // New field
}
```

### Data Handling
- `full_name` is auto-generated: `${firstName} ${lastName}`.trim()`
- `display_name` uses `firstName` as primary source
- Avatar initials use first letter of each name

## Benefits

1. **Better Personalization**
   - Can use first name alone in greetings: "Hi John!"
   - More natural messaging: "John, your order is ready"
   - Professional communications with full name when needed

2. **Improved Data Quality**
   - Structured data instead of free-form text
   - Consistent formatting across the platform
   - Easier sorting and searching

3. **International Support**
   - Better handling of name formats
   - Can adapt UI for cultures with different name orders
   - Clearer data structure for integrations

## User Experience

### Registration Flow
1. User enters first and last name separately
2. Clear labeling reduces confusion
3. Side-by-side layout saves vertical space
4. Maintains professional appearance

### Profile Management
1. Users can update names independently
2. Clear which field is which
3. Initials automatically update for avatars
4. Full name still displayed where appropriate

## Testing Checklist

- [ ] Register new user with first and last name
- [ ] Verify names save correctly to database
- [ ] Check profile page displays both fields
- [ ] Update names and verify changes persist
- [ ] Verify initials in avatar update correctly
- [ ] Check full name displays in user dropdown
- [ ] Test with single-word names
- [ ] Test with multi-word last names

## Future Enhancements

1. **Name Formatting**
   - Title/prefix support (Mr., Dr., etc.)
   - Middle name field
   - Suffix support (Jr., III, etc.)

2. **Internationalization**
   - Support for name order preferences
   - Unicode name validation
   - Cultural name format templates

3. **Smart Features**
   - Auto-capitalization
   - Name validation/suggestions
   - Duplicate detection

## Migration Notes

For existing users:
- Names are automatically split on first space
- Users can update their names in profile
- Full name field maintained for compatibility
- No action required from users
