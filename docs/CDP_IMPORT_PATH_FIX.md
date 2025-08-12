# CDP Import Path Fix

## Issue
After implementing the authenticated API routes for CDP profiles, the application was still experiencing errors because multiple pages were importing from the wrong path `@/api/profiles-api` instead of `@/lib/api/profiles-api`.

## Files Fixed
The following files had incorrect import paths:
1. `app/profiles/edit/[id]/page.tsx`
2. `app/profiles/page.tsx`
3. `app/properties/edit/[id]/page.tsx`
4. `app/properties/edit-custom-field/[key]/page.tsx`
5. `app/properties/new/page.tsx`

Also fixed:
- `app/profiles/page.tsx` - segments-api import path

## Changes Made
Changed all imports from:
```typescript
import { profilesApi } from "@/api/profiles-api"
import { segmentsApi } from "@/api/segments-api"
```

To:
```typescript
import { profilesApi } from "@/lib/api/profiles-api"
import { segmentsApi } from "@/lib/api/segments-api"
```

## Impact
This fix ensures that:
1. All pages use the correct API client with authenticated endpoints
2. Profile operations (view, edit, delete) work correctly
3. Properties management pages can access profile data
4. No more "module not found" errors

## Testing
After these fixes:
1. Navigate to `/profiles` - list should load
2. Click on any profile - details should display
3. Edit a profile - should save successfully
4. Properties pages should work correctly
