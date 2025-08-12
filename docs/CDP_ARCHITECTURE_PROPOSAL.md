# CDP Architecture Proposal for Multi-Tenant Scalability

## Current Issue
The CDP profiles table is using RLS policies that require authentication context, but the API is using an unauthenticated Supabase client. Additionally, having all profiles in a single table with RLS filtering may not scale well.

## Architectural Concerns

### Current Approach Problems:
1. **Performance**: RLS policies run on every query, adding overhead
2. **Scalability**: Single table with millions of rows across all accounts
3. **Isolation**: Data from different accounts mixed in same table
4. **Complexity**: RLS policies become complex with different permission levels

## Proposed Solutions

### Option 1: Fix Current Architecture (Quick Fix)
Update the profiles API to use authenticated Supabase client:

```typescript
// lib/api/profiles-api.ts
import { createClient } from '@/lib/auth/client'

export const getProfiles = async (options?: {...}) => {
  const supabase = createClient() // Use authenticated client
  // ... rest of the code
}
```

**Pros:**
- Quick to implement
- Works with existing RLS policies
- No database changes needed

**Cons:**
- Still has scalability concerns
- RLS overhead on every query

### Option 2: Bypass RLS with Service Role (Better Performance)
Use service role key for CDP operations and handle authorization in application layer:

```typescript
// Create a service client for CDP operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// In API route, check authorization first
export async function GET(request: Request) {
  const user = await getCurrentUser()
  const account = await getUserAccount(user.id)
  
  // Now query with service role (bypasses RLS)
  const profiles = await supabaseService
    .from('cdp_profiles')
    .select('*')
    .eq('account_id', account.id)
}
```

**Pros:**
- Better performance (no RLS overhead)
- More flexible authorization logic
- Can implement caching

**Cons:**
- Need to be careful with security
- Service role key must be server-side only

### Option 3: Partitioned Tables (Best for Scale)
Create separate profile tables per account or use PostgreSQL table partitioning:

```sql
-- Create partitioned table
CREATE TABLE cdp_profiles_partitioned (
  LIKE cdp_profiles INCLUDING ALL
) PARTITION BY LIST (account_id);

-- Create partition for each account
CREATE TABLE cdp_profiles_account_abc123 
  PARTITION OF cdp_profiles_partitioned 
  FOR VALUES IN ('abc123-uuid');
```

**Pros:**
- Excellent performance at scale
- True data isolation
- Can backup/restore per account
- Easier compliance (GDPR)

**Cons:**
- More complex setup
- Need to manage partitions

### Option 4: Hybrid Approach (Recommended)
1. **Short term**: Fix the authenticated client issue
2. **Medium term**: Implement service role for CDP operations
3. **Long term**: Consider partitioning when reaching 100k+ profiles per account

## Recommended Implementation Plan

### Phase 1: Immediate Fix (Today)
1. Update profiles API to use authenticated client
2. Or create a server-side API route that uses service role

### Phase 2: Optimization (Next Sprint)
1. Implement caching layer (Redis/in-memory)
2. Add pagination and lazy loading
3. Create indexes on frequently queried columns

### Phase 3: Scale Planning (Future)
1. Monitor performance metrics
2. Implement partitioning at 100k+ profiles
3. Consider separate database per large account

## Security Considerations
- Never expose service role key to client
- Implement rate limiting
- Add audit logging for CDP operations
- Consider row-level encryption for sensitive data

## Performance Optimizations
1. **Indexes**: Add composite indexes for common queries
2. **Materialized Views**: For aggregations and reports
3. **Caching**: Redis for frequently accessed profiles
4. **CDN**: For profile images and static data
5. **Batch Operations**: For bulk imports/updates
