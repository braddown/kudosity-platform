# Accounts & Multi-Tenancy Architecture

## Overview

The Kudosity Platform uses a multi-tenant architecture where each **Account** represents an isolated workspace with its own users, data, and settings. Users can be members of multiple accounts with different roles.

## Key Concepts

### Accounts (formerly Organizations)
- Primary tenant boundary in the system
- Each account has its own isolated data
- Users access accounts they are members of
- Billing and subscription management at account level

### Account Members
- Links users to accounts with specific roles
- Roles: owner, admin, member, viewer
- Status: active, invited, suspended

### Future: Organizations
- Will be implemented as labels/groupings for multiple accounts
- Allows enterprise customers to manage multiple accounts under one organization
- Not yet implemented in current architecture

## Database Schema

### 1. `accounts` Table
```sql
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  billing_email TEXT,
  support_email TEXT,
  plan TEXT DEFAULT 'free',
  plan_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `account_members` Table
```sql
CREATE TABLE account_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(account_id, user_id)
);
```

### 3. `user_profiles` Table
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Authentication Flow

### Sign Up Flow
1. User signs up via Supabase Auth
2. User profile is created automatically (trigger)
3. User is redirected to `/auth/setup-account`
4. User creates their first account
5. User becomes owner of the new account
6. User is redirected to main application

### Sign In Flow
1. User signs in via Supabase Auth
2. System checks for existing account memberships
3. If no accounts: redirect to `/auth/setup-account`
4. If one account: auto-select and continue
5. If multiple accounts: show account selector

### Account Context
- Current account stored in cookie: `current_account`
- Account context available in all API routes
- Middleware validates account access on protected routes

## API Structure

### Client-side Authentication (`/lib/auth/client.ts`)
```typescript
// Get current user with account memberships
export async function getCurrentUser()

// Create a new account
export async function createAccount(name: string)

// Switch to a different account
export async function switchAccount(accountId: string)

// Sign out and clear account context
export async function signOut()
```

### Server-side Authentication (`/lib/auth/server.ts`)
```typescript
// Get authenticated user with account context
export async function getUser()

// Get current account from cookies
export async function getCurrentAccount()

// Validate user has access to account
export async function validateAccountAccess(accountId: string)
```

## Middleware Protection

The middleware (`/middleware.ts`) handles:
- Authentication verification
- Account membership validation
- Redirect to setup for new users
- Account context management

## Row Level Security (RLS)

All tables use RLS policies to ensure data isolation:

```sql
-- Example: Profiles can only be accessed by account members
CREATE POLICY "Account members can view profiles"
ON profiles FOR SELECT
USING (
  account_id IN (
    SELECT account_id FROM account_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);
```

## Multi-Account Support

### Account Switching
- Users can belong to multiple accounts
- UI provides account switcher in navigation
- Account context persists across sessions

### Data Isolation
- All queries filtered by current account
- No cross-account data access
- Account ID included in all relevant tables

## Future Enhancements

### Organizations (Phase 2)
When organizations are implemented:
- Organizations will group multiple accounts
- Centralized billing at organization level
- Cross-account reporting for organization owners
- SSO configuration at organization level

### Migration Path
The current structure supports future organization implementation:
1. Add `organizations` table
2. Add `organization_id` to `accounts` table
3. Create `organization_accounts` junction table
4. No breaking changes to existing account structure

## Best Practices

1. **Always validate account context** in API routes
2. **Include account_id** in all tenant-specific tables
3. **Use RLS policies** for data isolation
4. **Test multi-account scenarios** thoroughly
5. **Log account switches** for audit trail

## Common Patterns

### Getting Current Account in API Route
```typescript
import { getUser, getCurrentAccount } from '@/lib/auth/server'

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const account = await getCurrentAccount()
  if (!account) {
    return NextResponse.json({ error: 'No account selected' }, { status: 400 })
  }

  // Use account.id for queries
}
```

### Creating Account-Scoped Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert({
    account_id: account.id,  // Always include account_id
    // ... other fields
  })
```

### Querying Account-Specific Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('account_id', account.id)  // Always filter by account
```
