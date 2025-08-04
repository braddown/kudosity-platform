# Naming Conventions and Patterns

## Overview

This document establishes consistent naming conventions across the Kudosity Platform codebase to improve readability, maintainability, and developer experience.

## General Principles

1. **Consistency**: Follow the same pattern within each category
2. **Clarity**: Names should be descriptive and unambiguous
3. **Context**: Include enough context to understand purpose
4. **Convention**: Follow established community standards when applicable

## Component Naming

### File Names
**Standard: PascalCase for all component files**

```
✅ Good Examples:
- ContactForm.tsx
- ProfileHeader.tsx
- UserAvatar.tsx
- CampaignActivityTable.tsx
- CustomFieldsManager.tsx

❌ Bad Examples:
- contactForm.tsx
- profile-header.tsx
- user_avatar.tsx
- campaign-activity-table.tsx
```

### Component Export Names
**Standard: Match file name exactly**

```tsx
// ContactForm.tsx
export default function ContactForm() { /* ... */ }
// or
export function ContactForm() { /* ... */ }

// UserAvatar.tsx
export default function UserAvatar() { /* ... */ }
```

### Component Composition Naming
**Standard: Use dot notation for related components**

```tsx
// ProfileCard.tsx
export function ProfileCard() { /* ... */ }
ProfileCard.Header = function ProfileCardHeader() { /* ... */ }
ProfileCard.Body = function ProfileCardBody() { /* ... */ }
ProfileCard.Footer = function ProfileCardFooter() { /* ... */ }

// Usage:
<ProfileCard>
  <ProfileCard.Header>Title</ProfileCard.Header>
  <ProfileCard.Body>Content</ProfileCard.Body>
</ProfileCard>
```

### Wrapper Component Naming
**Standard: Add descriptive suffix**

```
✅ Good Examples:
- ContactFormWrapper.tsx
- ProfilePageClientWrapper.tsx
- DataTableContainer.tsx
- ErrorBoundaryWrapper.tsx

❌ Bad Examples:
- ContactFormComp.tsx
- ProfilePageThing.tsx
- DataTableStuff.tsx
```

## File and Folder Structure

### Folder Names
**Standard: kebab-case for all folders**

```
✅ Good Examples:
components/
├── ui/
├── forms/
├── layouts/
├── navigation/
├── data-tables/
├── error-boundaries/
└── feature-modules/
    ├── contact-management/
    ├── profile-editing/
    └── campaign-analytics/

❌ Bad Examples:
components/
├── UI/
├── Forms/
├── dataTable/
├── ErrorBoundaries/
└── featureModules/
```

### Component Organization by Feature

```
components/
├── ui/                     # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── index.ts
├── forms/                  # Form-specific components
│   ├── ContactForm.tsx
│   ├── ProfileForm.tsx
│   ├── CampaignForm.tsx
│   └── index.ts
├── layouts/                # Layout components
│   ├── AppLayout.tsx
│   ├── PageLayout.tsx
│   ├── DashboardLayout.tsx
│   └── index.ts
├── tables/                 # Data table components
│   ├── ContactsTable.tsx
│   ├── CampaignsTable.tsx
│   ├── DataTableBase.tsx
│   └── index.ts
└── features/              # Feature-specific components
    ├── contacts/
    │   ├── ContactsList.tsx
    │   ├── ContactDetails.tsx
    │   ├── ContactFilters.tsx
    │   └── index.ts
    ├── profiles/
    │   ├── ProfileHeader.tsx
    │   ├── ProfileStats.tsx
    │   ├── ProfileEvents.tsx
    │   └── index.ts
    └── campaigns/
        ├── CampaignList.tsx
        ├── CampaignMetrics.tsx
        └── index.ts
```

## Hook Naming

### File Names
**Standard: kebab-case with `use-` prefix**

```
✅ Good Examples:
- use-contacts.ts
- use-profile-form.ts
- use-async-data.ts
- use-campaign-metrics.ts
- use-local-storage.ts

❌ Bad Examples:
- useContacts.ts
- profileFormHook.ts
- contacts-hook.ts
- ContactsHook.ts
```

### Hook Function Names
**Standard: camelCase with `use` prefix**

```tsx
// use-contacts.ts
export function useContacts() { /* ... */ }
export function useContactForm() { /* ... */ }
export function useContactFilters() { /* ... */ }

// use-profile-form.ts
export function useProfileForm() { /* ... */ }
export function useProfileValidation() { /* ... */ }
```

### Custom Hook Parameters and Returns
**Standard: Descriptive object patterns**

```tsx
// Good: Clear parameter object
export function useContactForm({
  initialContact,
  onSave,
  onError,
  validationRules
}: UseContactFormOptions) {
  return {
    contact,
    errors,
    isSubmitting,
    isDirty,
    updateField,
    submit,
    reset,
    validate
  }
}

// Good: Consistent return pattern
export function useContacts(options: UseContactsOptions) {
  return {
    data: contacts,
    loading,
    error,
    refetch,
    createContact,
    updateContact,
    deleteContact
  }
}
```

## Library and Utility Naming

### File Names
**Standard: kebab-case for utilities, PascalCase for classes**

```
✅ Good Examples:
lib/
├── utils.ts
├── constants.ts
├── api-client.ts
├── date-helpers.ts
├── validation-rules.ts
├── repositories/
│   ├── BaseRepository.ts
│   ├── ContactsRepository.ts
│   └── CampaignsRepository.ts
└── services/
    ├── AuthService.ts
    ├── NotificationService.ts
    └── AnalyticsService.ts

❌ Bad Examples:
lib/
├── Utils.ts
├── dateHelpers.ts
├── validationRules.ts
├── repositories/
│   ├── baseRepository.ts
│   └── contacts-repository.ts
```

### Class Names
**Standard: PascalCase with descriptive suffixes**

```tsx
// Good: Clear class naming
export class ContactsRepository extends BaseRepository { /* ... */ }
export class AuthenticationService { /* ... */ }
export class ValidationError extends Error { /* ... */ }
export class ApiClient { /* ... */ }

// Bad: Unclear or inconsistent naming
export class contactsRepo { /* ... */ }
export class Auth { /* ... */ }
export class validateError { /* ... */ }
```

### Function Names
**Standard: camelCase with verb-noun pattern**

```tsx
// Good: Clear action-oriented naming
export function validateEmail(email: string): boolean { /* ... */ }
export function formatPhoneNumber(phone: string): string { /* ... */ }
export function calculateCampaignMetrics(data: CampaignData): Metrics { /* ... */ }
export function transformContactData(raw: RawContact): Contact { /* ... */ }

// Bad: Unclear or non-standard naming
export function email_validate(email: string): boolean { /* ... */ }
export function phoneFormat(phone: string): string { /* ... */ }
export function CampaignMetrics(data: CampaignData): Metrics { /* ... */ }
```

## Type and Interface Naming

### Interfaces
**Standard: PascalCase with descriptive names**

```tsx
// Good: Clear interface naming
export interface Contact {
  id: string
  name: string
  email: string
}

export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export interface UseContactsOptions {
  initialFilters?: ContactFilters
  autoRefresh?: boolean
  onError?: (error: Error) => void
}

export interface ContactsApiResponse {
  contacts: Contact[]
  totalCount: number
  hasNextPage: boolean
}
```

### Type Aliases
**Standard: PascalCase with descriptive suffixes**

```tsx
// Good: Clear type naming
export type ContactStatus = 'active' | 'inactive' | 'pending'
export type CampaignType = 'email' | 'sms' | 'push' | 'in-app'
export type ValidationRule<T> = (value: T) => string | null

export type ContactFormErrors = Record<keyof ContactFormData, string>
export type ApiError = {
  message: string
  code: string
  details?: Record<string, any>
}
```

### Generic Type Parameters
**Standard: Single uppercase letters with descriptive meaning**

```tsx
// Good: Meaningful generic parameters
export interface Repository<TEntity, TCreateData = Partial<TEntity>, TUpdateData = Partial<TEntity>> {
  create(data: TCreateData): Promise<TEntity>
  update(id: string, data: TUpdateData): Promise<TEntity>
  findById(id: string): Promise<TEntity | null>
}

export interface ApiResponse<TData> {
  data: TData
  status: number
  message?: string
}

// Common patterns:
// T = Generic type
// TData = Data type
// TEntity = Entity type
// TResponse = Response type
// TOptions = Options type
```

## Variable and Constant Naming

### Variables
**Standard: camelCase with descriptive names**

```tsx
// Good: Clear variable naming
const contactList = await fetchContacts()
const isSubmitting = false
const validationErrors: Record<string, string> = {}
const campaignMetrics = calculateMetrics(data)

// Bad: Unclear or abbreviated naming
const cList = await fetchContacts()
const sub = false
const errs = {}
const metrics = calculateMetrics(data)
```

### Constants
**Standard: SCREAMING_SNAKE_CASE for module constants, camelCase for local constants**

```tsx
// Good: Module-level constants
export const API_BASE_URL = 'https://api.kudosity.com'
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address'
} as const

// Good: Local constants within functions
function processContacts() {
  const batchSize = 100
  const maxRetries = 3
  const defaultFilters = { status: 'active' }
  // ...
}
```

### Event Handler Naming
**Standard: `handle` prefix with descriptive action**

```tsx
// Good: Clear event handler naming
function ContactForm() {
  const handleSubmit = (e: FormEvent) => { /* ... */ }
  const handleInputChange = (field: string, value: string) => { /* ... */ }
  const handleCancel = () => { /* ... */ }
  const handleContactSelect = (contactId: string) => { /* ... */ }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={(e) => handleInputChange('name', e.target.value)} />
      <button type="button" onClick={handleCancel}>Cancel</button>
    </form>
  )
}

// Bad: Unclear or inconsistent naming
function ContactForm() {
  const submit = (e: FormEvent) => { /* ... */ }
  const onChange = (field: string, value: string) => { /* ... */ }
  const clickCancel = () => { /* ... */ }
}
```

## API and Route Naming

### API Route Files
**Standard: kebab-case following Next.js conventions**

```
app/api/
├── contacts/
│   ├── route.ts              # GET/POST /api/contacts
│   └── [id]/
│       ├── route.ts          # GET/PUT/DELETE /api/contacts/[id]
│       └── activities/
│           └── route.ts      # GET /api/contacts/[id]/activities
├── campaigns/
│   ├── route.ts
│   ├── [id]/
│   │   └── route.ts
│   └── activity/
│       └── route.ts
└── dashboard-metrics/
    └── route.ts
```

### API Endpoint Functions
**Standard: HTTP method as function name**

```tsx
// app/api/contacts/route.ts
export async function GET() { /* ... */ }
export async function POST() { /* ... */ }

// app/api/contacts/[id]/route.ts
export async function GET({ params }: { params: { id: string } }) { /* ... */ }
export async function PUT({ params }: { params: { id: string } }) { /* ... */ }
export async function DELETE({ params }: { params: { id: string } }) { /* ... */ }
```

### API Client Function Naming
**Standard: HTTP method + resource pattern**

```tsx
// lib/api-client.ts
export const contactsApi = {
  getContacts: (filters?: ContactFilters) => Promise<Contact[]>,
  getContact: (id: string) => Promise<Contact>,
  createContact: (data: CreateContactData) => Promise<Contact>,
  updateContact: (id: string, data: UpdateContactData) => Promise<Contact>,
  deleteContact: (id: string) => Promise<void>,
  
  // Nested resource actions
  getContactActivities: (contactId: string) => Promise<Activity[]>,
  addContactToList: (contactId: string, listId: string) => Promise<void>
}

export const campaignsApi = {
  getCampaigns: () => Promise<Campaign[]>,
  getCampaign: (id: string) => Promise<Campaign>,
  createCampaign: (data: CreateCampaignData) => Promise<Campaign>,
  updateCampaign: (id: string, data: UpdateCampaignData) => Promise<Campaign>,
  deleteCampaign: (id: string) => Promise<void>
}
```

## Database and Model Naming

### Database Table Names
**Standard: snake_case (following PostgreSQL conventions)**

```sql
-- Good: Clear table naming
contacts
contact_activities
campaign_metrics
list_memberships
custom_field_definitions
message_templates

-- Bad: Inconsistent naming
Contacts
contactActivities
CampaignMetrics
list-memberships
```

### Database Column Names
**Standard: snake_case**

```sql
-- Good: Consistent column naming
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email_address VARCHAR(255),
  phone_number VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Bad: Mixed naming styles
CREATE TABLE contacts (
  ID UUID PRIMARY KEY,
  firstName VARCHAR(255),
  LastName VARCHAR(255),
  email-address VARCHAR(255),
  createdAt TIMESTAMP
);
```

### TypeScript Database Types
**Standard: PascalCase interfaces, camelCase properties**

```tsx
// types/database.ts
export interface Contact {
  id: string
  firstName: string
  lastName: string
  emailAddress: string
  phoneNumber?: string
  createdAt: Date
  updatedAt: Date
}

export interface ContactActivity {
  id: string
  contactId: string
  activityType: 'email_sent' | 'link_clicked' | 'form_submitted'
  activityData: Record<string, any>
  occurredAt: Date
}
```

## Test File Naming

### Test Files
**Standard: Same name as source file with `.test.` or `.spec.` suffix**

```
✅ Good Examples:
ContactForm.test.tsx
use-contacts.test.ts
ContactsRepository.spec.ts
utils.test.ts

❌ Bad Examples:
ContactFormTest.tsx
contacts-hook-tests.ts
test-contacts-repository.ts
```

### Test Description Naming
**Standard: Descriptive, behavior-focused names**

```tsx
// Good: Clear, behavior-focused test names
describe('ContactForm', () => {
  it('renders form fields with initial contact data', () => { /* ... */ })
  it('calls onSave with updated data when form is submitted', () => { /* ... */ })
  it('displays validation errors when required fields are empty', () => { /* ... */ })
  it('disables submit button when form is being submitted', () => { /* ... */ })
})

describe('useContacts', () => {
  it('returns loading state initially', () => { /* ... */ })
  it('returns contacts data after successful fetch', () => { /* ... */ })
  it('returns error state when fetch fails', () => { /* ... */ })
})

// Bad: Unclear or technical test names
describe('ContactForm', () => {
  it('test 1', () => { /* ... */ })
  it('should work', () => { /* ... */ })
  it('renders correctly', () => { /* ... */ })
})
```

## Migration Strategy

### Current State Analysis

**Existing Patterns Found:**
- Components: Mixed PascalCase and kebab-case
- Hooks: Mostly kebab-case with `use-` prefix
- Utilities: Mixed kebab-case and camelCase
- Some inconsistencies in component wrapper naming

### Migration Approach

1. **Phase 1: New Components**
   - All new components follow the established conventions
   - Document exceptions and rationale

2. **Phase 2: Refactoring Existing Components**
   - Rename during planned refactoring (e.g., breaking down large components)
   - Update imports and references
   - Update tests

3. **Phase 3: Systematic Cleanup**
   - Batch rename remaining non-conforming files
   - Use IDE refactoring tools for safe renaming
   - Update documentation

### Automated Tools

```bash
# Find components that don't follow naming conventions
find components -name "*.tsx" | grep -v "^[A-Z]"

# Find hooks that don't follow naming conventions  
find hooks -name "*.ts" -o -name "*.tsx" | grep -v "^use-"

# Rename files (example)
git mv components/theme-provider.tsx components/ThemeProvider.tsx
```

## Enforcement

### Linting Rules
Add ESLint rules to enforce naming conventions:

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"]
      },
      {
        "selector": "typeAlias",
        "format": ["PascalCase"]
      },
      {
        "selector": "function",
        "format": ["camelCase", "PascalCase"]
      },
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      }
    ]
  }
}
```

### Code Review Checklist

- [ ] Component files use PascalCase
- [ ] Hook files use kebab-case with `use-` prefix
- [ ] Function names use camelCase with descriptive verbs
- [ ] Constants use appropriate case (SCREAMING_SNAKE_CASE for module constants)
- [ ] Types and interfaces use PascalCase
- [ ] Test files follow `.test.` or `.spec.` suffix pattern
- [ ] Folder names use kebab-case

## Documentation

### Component Documentation
```tsx
/**
 * ContactForm - Form component for creating and editing contacts
 * 
 * @param contact - Initial contact data to populate the form
 * @param onSave - Callback function called when form is successfully submitted
 * @param onCancel - Optional callback function called when form is cancelled
 * @param validationRules - Optional custom validation rules to apply
 * 
 * @example
 * ```tsx
 * <ContactForm
 *   contact={existingContact}
 *   onSave={handleContactSave}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function ContactForm({
  contact,
  onSave,
  onCancel,
  validationRules
}: ContactFormProps) {
  // Implementation
}
```

---

*Naming Conventions Version: 1.0*  
*Last Updated: 2025-01-20*  
*Status: Active*