# Location and Company Fields Update

## Overview
Added comprehensive location and company information fields to both Account settings and User Profile pages to support different geographical contexts for companies and individual users.

## Database Changes

### Accounts Table - New Fields
- `country` (VARCHAR 100) - Primary country where the company operates
- `timezone` (VARCHAR 100) - Default timezone for the account/company
- `company_address` (TEXT) - Full company address
- `company_number` (VARCHAR 100) - Business registration number (ABN/ACN/etc)

### User Profiles Table - New Fields  
- `mobile_number` (VARCHAR 50) - User's mobile phone number
- `country` (VARCHAR 100) - User's personal location
- `timezone` (VARCHAR 100) - User's personal timezone for messaging activities

## UI Updates

### Account Settings Page (`/settings/account`)

#### Three Card Layout:

1. **Account Information Card**
   - Account ID (read-only)
   - Created Date (read-only)
   - Account Name
   - Company Name
   - Billing Email
   - Support Email

2. **Company Details Card** (NEW)
   - Company Number (ABN/ACN/Registration)
   - Company Address (multi-line textarea)

3. **Location Settings Card** (NEW)
   - Country (dropdown)
   - Timezone (dropdown)
   - Note: These represent the primary company location

### User Profile Page (`/profile`)

#### Updated Cards:

1. **Profile Information Card**
   - Full Name
   - Email (read-only)
   - **Mobile Number** (NEW)

2. **Location Settings Card** (NEW)
   - Country (dropdown)
   - Timezone (dropdown)
   - Note: These can differ from company location for remote workers

3. **Account Memberships Card** (unchanged)

4. **Recent Activity Card** (unchanged)

## Features

### Dropdown Selections
- **Countries**: 40+ common countries with ISO codes
- **Timezones**: 24 major timezones with descriptive labels

### Data Separation
- **Account Location**: Primary business location and timezone
- **User Location**: Individual user's location for messaging activities
- Allows for distributed teams across different timezones

### Visual Enhancements
- Icons for each section (Building, Globe, Clock, Hash, Phone)
- Helpful descriptions and placeholder text
- Clear section grouping with cards

## Use Cases

1. **Multi-national Companies**
   - Company registered in one country
   - Users working from different countries

2. **Remote Teams**
   - Account has primary business timezone
   - Individual users have their local timezones

3. **Compliance & Registration**
   - Store business registration numbers
   - Maintain official company address

4. **Messaging Optimization**
   - Schedule messages based on user's timezone
   - Track activity in local time contexts

## Testing Checklist

- [ ] Navigate to `/settings/account`
- [ ] Add/edit company number and address
- [ ] Select country and timezone for account
- [ ] Save changes and verify persistence
- [ ] Navigate to `/profile`  
- [ ] Add/edit mobile number
- [ ] Select personal country and timezone
- [ ] Save changes and verify persistence
- [ ] Verify dropdowns work correctly
- [ ] Test with different user roles

## Future Enhancements

1. **Phone Number Formatting**
   - Auto-format based on selected country
   - International dialing code prefixes

2. **Address Validation**
   - Google Places API integration
   - Address auto-complete

3. **Timezone Detection**
   - Auto-detect timezone from browser
   - Suggest timezone based on country

4. **Multi-language Support**
   - Translate country names
   - Localized timezone descriptions
