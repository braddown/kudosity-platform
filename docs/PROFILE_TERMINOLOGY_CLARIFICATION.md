# Profile Terminology Clarification

## Overview
The application has two distinct types of profiles that serve different purposes. This document clarifies the terminology to avoid confusion.

## Profile Types

### 1. User Profile (`/profile`)
- **Purpose**: Personal information and settings for logged-in users
- **Data Source**: `user_profiles` table
- **Access**: Available from the top-right user dropdown menu
- **Label**: "User Profile"
- **Contains**:
  - User's personal information (first name, last name, email)
  - Contact details (mobile number)
  - Location settings (country, timezone)
  - Account memberships
  - Activity logs
  - Authentication details

### 2. Recipient Profiles (`/profiles`)
- **Purpose**: Customer/recipient data for marketing and messaging
- **Data Source**: `cdp_profiles` table (Customer Data Platform)
- **Access**: Main navigation under "Audience" section
- **Label**: "Recipient Profiles"
- **Contains**:
  - Customer contact information
  - Demographic data
  - Behavioral data
  - Custom fields
  - Engagement metrics
  - Marketing preferences
  - Segmentation data

## Key Differences

| Aspect | User Profile | Recipient Profiles |
|--------|--------------|-------------------|
| **Who** | Platform users (your team) | Your customers/recipients |
| **Purpose** | Account management | Customer relationship management |
| **Quantity** | One per user | Many (your entire customer base) |
| **Authentication** | Required (logged-in users) | Not required (data about customers) |
| **Permissions** | Self-editable | Managed by users with appropriate permissions |
| **Location** | `/profile` (dropdown menu) | `/profiles` (main navigation) |

## UI Labels Updated

### Navigation
- Top-right dropdown: "User Profile" (was "Profile")
- Main navigation: "Recipient Profiles" (was "Profiles")

### Page Titles
- `/profile`: "User Profile" page
- `/profiles`: "Recipient Profiles" page

## Database Structure

### User Profiles
```sql
user_profiles
├── id (UUID)
├── user_id (references auth.users)
├── first_name
├── last_name
├── mobile_number
├── country
├── timezone
└── [timestamps]
```

### Recipient Profiles (CDP)
```sql
cdp_profiles
├── id (UUID)
├── account_id (references accounts)
├── first_name
├── last_name
├── email
├── mobile
├── custom_fields (JSONB)
├── tags (array)
└── [many more customer-specific fields]
```

## Implementation Notes

1. **Clear Labeling**: All UI elements now clearly distinguish between "User Profile" and "Recipient Profiles"
2. **Separate APIs**: Each profile type has its own API endpoints and data access patterns
3. **No Confusion**: The terminology is now consistent throughout the application
4. **Future-Proof**: This separation allows for independent evolution of both systems
