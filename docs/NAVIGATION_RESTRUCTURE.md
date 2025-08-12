# Navigation and Settings Restructure

## Overview
Restructured the navigation and settings to properly align with the Account-based multi-tenant architecture, removing "Organization" terminology and implementing proper user profile management.

## Key Changes

### 1. Terminology Updates
- **Removed**: All references to "Organization"
- **Replaced with**: "Account" for tenant boundaries
- **Added**: "Company" as an optional field within an account

### 2. Navigation Structure Changes

#### Settings Menu (Sidebar)
**Before:**
- Personal
- Organization  
- Users
- Senders
- Domains

**After:**
- Account (account information and settings)
- Users (user management and permissions)
- Senders
- Domains

#### User Dropdown (Top Right)
**Added:**
- Profile link (first item after user info)
- Links to new `/profile` page for personal information

### 3. New Pages Created

#### Profile Page (`/app/profile/page.tsx`)
**Purpose**: Personal user information and activity
**Features:**
- User profile information (name, email, avatar)
- Account memberships display
- Personal activity log
- Editable user details
- Shows all accounts user belongs to with roles

#### Account Settings (`/app/settings/account/page.tsx`)
**Purpose**: Account-level settings
**Features:**
- Account ID (read-only)
- Account Name (editable)
- Company Name (editable, optional)
- Billing Email
- Support Email
- Creation date
**Removed:**
- Slug field (not needed)
- Subscription plan section (moved elsewhere)

#### User Management (`/app/settings/users/page.tsx`)
**Purpose**: Manage all users in the account
**Features:**
- List of all account users
- Role badges (Owner, Admin, Member, Viewer)
- Status indicators
- Join dates
- Activity log tab showing user actions
- Permission-based action menu
- Role-based access control

### 4. Database Changes

#### Added Fields
- `company_name` column added to `accounts` table
- Migration: `add_company_name_to_accounts`

### 5. Access Control Implementation

#### User Roles & Permissions
- **Owner**: Can manage all users except other owners
- **Admin**: Can manage members and viewers
- **Member**: No user management permissions
- **Viewer**: Read-only access

#### Features by Role
- Invite users (Owner/Admin)
- Edit user roles (Owner/Admin)
- Remove users (Owner/Admin)
- View activity logs (All roles)

### 6. User Experience Improvements

#### Profile Access
- Quick access from user dropdown
- Shows personal information
- Displays all account memberships
- Activity tracking

#### Account Context
- Clear separation between personal (Profile) and account (Settings) data
- Account-specific settings under `/settings`
- Personal information under `/profile`

### 7. Activity Logging
- User activity tracking in account settings
- Personal activity in profile
- Audit trail for user management actions

## Migration Path

### For Existing Users
1. All "Organization" references updated to "Account"
2. Company name is now optional field within account
3. Personal settings moved to Profile (accessible from dropdown)
4. Account settings remain under Settings menu

### For New Users
1. Create account during onboarding
2. Optional company name field
3. Clear separation of personal vs account data

## Benefits

1. **Clearer Structure**: Personal vs Account data properly separated
2. **Better UX**: Profile easily accessible from dropdown
3. **Scalability**: Ready for future multi-account per user scenarios
4. **Consistency**: "Account" terminology throughout the system
5. **Flexibility**: Company name as optional field, not structural element

## Testing Checklist

- [ ] Navigate to `/profile` from user dropdown
- [ ] Edit profile information and save
- [ ] View account memberships in profile
- [ ] Navigate to `/settings/account`
- [ ] Edit account information including company name
- [ ] Navigate to `/settings/users`
- [ ] View user list with proper roles
- [ ] Check activity log tab
- [ ] Verify role-based action visibility

## Future Enhancements

1. **Profile Features**
   - Avatar upload
   - Password change
   - Two-factor authentication
   - Email preferences

2. **User Management**
   - Actual user invitation system
   - Granular permission management
   - Bulk user operations
   - User suspension/reactivation

3. **Activity Logging**
   - Real-time activity tracking
   - Detailed audit logs
   - Export activity reports
   - Activity filtering and search

4. **Account Features**
   - Logo upload for accounts
   - Multiple billing contacts
   - Account-level preferences
   - API configuration per account
