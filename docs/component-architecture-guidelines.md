# Component Architecture Guidelines

## Overview

These guidelines establish standards for component design, structure, and organization in the Kudosity Platform to ensure maintainability, performance, and developer experience.

## Component Size Guidelines

### Size Limits
- **Maximum Recommended**: 300 lines per component
- **Warning Threshold**: 200 lines (consider refactoring)  
- **Critical Threshold**: 500+ lines (immediate refactoring required)

### Rationale
- Easier to understand and maintain
- Better testability and debugging
- Improved code reusability
- Enhanced performance through better code splitting

### Measuring Component Size
```bash
# Check component sizes across the project
find components -name "*.tsx" -exec wc -l {} + | sort -nr | head -20
```

## Single Responsibility Principle

### Each Component Should Have One Clear Purpose

**✅ Good Examples:**
```tsx
// UserAvatar.tsx - Single purpose: display user avatar
export function UserAvatar({ user, size = 'md' }) {
  return (
    <img 
      src={user.avatar} 
      alt={user.name}
      className={cn('rounded-full', sizeClasses[size])}
    />
  )
}

// ContactForm.tsx - Single purpose: contact form management  
export function ContactForm({ contact, onSave }) {
  // Form logic only
}
```

**❌ Bad Examples:**
```tsx
// ProfilePage.tsx - Multiple purposes: forms, events, stats, navigation
export function ProfilePage() {
  // 900+ lines handling multiple responsibilities
  // Should be split into ProfileHeader, ContactForm, EventsTimeline, etc.
}
```

### Refactoring Large Components

When a component exceeds size limits, split by responsibility:

1. **Extract Sub-components**: Move distinct UI sections to separate components
2. **Extract Custom Hooks**: Move state logic and business logic to hooks  
3. **Extract Utility Functions**: Move pure functions to utility modules
4. **Create Container Components**: Separate data fetching from presentation

## Client vs Server Component Guidelines

### When to Use Server Components (Default)

Server components are the default in Next.js 13+ App Router. Use them for:

- **Static content display**
- **Layout components** (Header, Footer, Sidebar)
- **Data fetching wrappers**
- **Pure presentational components**
- **SEO-important content**

```tsx
// Server Component (no "use client" needed)
export default function UserProfile({ userId }: { userId: string }) {
  // This can be a server component - it just displays data
  return (
    <div className="profile">
      <UserDetails userId={userId} />
      <UserStats userId={userId} />
    </div>
  )
}
```

### When to Use Client Components ("use client")

Only use `"use client"` when you need:

- **Browser-specific APIs** (localStorage, window, document)
- **Event handlers** (onClick, onChange, onSubmit)
- **React state** (useState, useReducer)
- **Effect hooks** (useEffect, useLayoutEffect)
- **Context that uses state** (React.createContext with state)
- **Real-time features** (WebSocket connections)

```tsx
"use client"

// Client Component - needs interactivity and state
export function ContactForm({ contact, onSave }) {
  const [formData, setFormData] = useState(contact)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault() // Browser event
    setIsSubmitting(true) // State update
    await onSave(formData)
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Interactive form elements */}
    </form>
  )
}
```

### Client/Server Boundary Patterns

#### Pattern 1: Wrapper Components
When you need to add interactivity to server components:

```tsx
// ServerButton.tsx - Server component
export function ServerButton({ children, ...props }) {
  return (
    <button {...props} className="btn">
      {children}
    </button>
  )
}

// ClientButtonWrapper.tsx - Client wrapper
"use client"
export function ClientButtonWrapper({ onClick, children, ...props }) {
  return (
    <ServerButton onClick={onClick} {...props}>
      {children}
    </ServerButton>
  )
}
```

#### Pattern 2: Data Fetching Separation
```tsx
// Server Component - fetches data
export default async function ProfilePage({ userId }) {
  const profile = await fetchProfile(userId)
  
  return (
    <div>
      <ProfileDisplay profile={profile} />
      <ProfileEditForm profile={profile} /> {/* Client component */}
    </div>
  )
}

// Client Component - handles form interactions
"use client"
export function ProfileEditForm({ profile }) {
  const [editedProfile, setEditedProfile] = useState(profile)
  // Form logic here
}
```

## Naming Conventions

### Component Names
- **PascalCase** for component names: `UserProfile`, `ContactForm`
- **Descriptive and specific**: `ContactEditForm` not `Form`
- **Action-based for interactive components**: `CreateContactButton`, `SaveProfileForm`

### File Names
- **PascalCase** for component files: `UserProfile.tsx`
- **Match component name**: `ContactForm.tsx` exports `ContactForm`
- **Descriptive prefixes**: `ContactEditForm.tsx`, `ContactCreateForm.tsx`

### Folder Structure
```
components/
├── ui/                      # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── forms/                   # Form-specific components
│   ├── ContactForm.tsx
│   ├── ProfileForm.tsx
│   └── index.ts
├── layouts/                 # Layout components
│   ├── AppLayout.tsx
│   ├── PageLayout.tsx
│   └── index.ts
└── features/               # Feature-specific components
    ├── contacts/
    │   ├── ContactsList.tsx
    │   ├── ContactDetails.tsx
    │   └── index.ts
    └── profiles/
        ├── ProfileHeader.tsx
        ├── ProfileStats.tsx
        └── index.ts
```

## Component Composition Patterns

### Container/Presentational Pattern
Separate data fetching from presentation:

```tsx
// Container Component (handles data)
export default function ContactsContainer() {
  const { data: contacts, loading, error } = useContacts()
  
  if (loading) return <ContactsLoading />
  if (error) return <ContactsError error={error} />
  
  return <ContactsList contacts={contacts} />
}

// Presentational Component (handles display)
export function ContactsList({ contacts }) {
  return (
    <div className="contacts-list">
      {contacts.map(contact => (
        <ContactItem key={contact.id} contact={contact} />
      ))}
    </div>
  )
}
```

### Compound Components Pattern
For complex components with multiple related parts:

```tsx
// ProfileCard.tsx
export function ProfileCard({ children }) {
  return <div className="profile-card">{children}</div>
}

ProfileCard.Header = function ProfileCardHeader({ children }) {
  return <div className="profile-card-header">{children}</div>
}

ProfileCard.Body = function ProfileCardBody({ children }) {
  return <div className="profile-card-body">{children}</div>
}

ProfileCard.Footer = function ProfileCardFooter({ children }) {
  return <div className="profile-card-footer">{children}</div>
}

// Usage
<ProfileCard>
  <ProfileCard.Header>
    <h2>John Doe</h2>
  </ProfileCard.Header>
  <ProfileCard.Body>
    <ContactDetails contact={contact} />
  </ProfileCard.Body>
  <ProfileCard.Footer>
    <EditButton />
  </ProfileCard.Footer>
</ProfileCard>
```

## Custom Hooks Guidelines

### When to Extract Logic to Hooks
- **State management logic** that can be reused
- **Data fetching patterns** that are repeated
- **Complex business logic** that clutters components
- **Browser API interactions** (localStorage, geolocation, etc.)

### Hook Naming
- Always start with `use`: `useContacts`, `useProfile`
- Be specific about purpose: `useContactForm` not `useForm`
- Include entity name: `useProfileData`, `useContactActions`

### Example Hook Pattern
```tsx
// hooks/useContactForm.ts
export function useContactForm(initialContact?: Contact) {
  const [contact, setContact] = useState(initialContact || {})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: keyof Contact, value: any) => {
    setContact(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!contact.email) newErrors.email = 'Email is required'
    if (!contact.name) newErrors.name = 'Name is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (onSave: (contact: Contact) => Promise<void>) => {
    if (!validate()) return false
    
    setIsSubmitting(true)
    try {
      await onSave(contact)
      return true
    } catch (error) {
      setErrors({ general: 'Failed to save contact' })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    contact,
    errors,
    isSubmitting,
    updateField,
    submit,
    reset: () => setContact(initialContact || {})
  }
}
```

## Error Boundaries and Error Handling

### Component-Level Error Boundaries
Wrap large feature areas with error boundaries:

```tsx
// components/ErrorBoundary.tsx
"use client"

export class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Feature error:', error, errorInfo)
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback />
    }

    return this.props.children
  }
}

// Usage
<FeatureErrorBoundary fallback={<ContactsErrorFallback />}>
  <ContactsContainer />
</FeatureErrorBoundary>
```

## Testing Guidelines

### Component Testing Structure
```tsx
// __tests__/ContactForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContactForm } from '../ContactForm'

describe('ContactForm', () => {
  const mockContact = { id: '1', name: 'John', email: 'john@test.com' }
  const mockOnSave = jest.fn()

  beforeEach(() => {
    mockOnSave.mockClear()
  })

  it('renders form fields with initial values', () => {
    render(<ContactForm contact={mockContact} onSave={mockOnSave} />)
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument()
  })

  it('calls onSave with updated data when form is submitted', async () => {
    render(<ContactForm contact={mockContact} onSave={mockOnSave} />)
    
    const nameInput = screen.getByLabelText(/name/i)
    fireEvent.change(nameInput, { target: { value: 'Jane' } })
    
    const submitButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockContact,
        name: 'Jane'
      })
    })
  })

  it('displays error message when save fails', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'))
    
    render(<ContactForm contact={mockContact} onSave={mockOnSave} />)
    
    const submitButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument()
    })
  })
})
```

### Testing Custom Hooks
```tsx
// __tests__/useContactForm.test.ts
import { renderHook, act } from '@testing-library/react'
import { useContactForm } from '../hooks/useContactForm'

describe('useContactForm', () => {
  it('initializes with provided contact', () => {
    const initialContact = { name: 'John', email: 'john@test.com' }
    const { result } = renderHook(() => useContactForm(initialContact))
    
    expect(result.current.contact).toEqual(initialContact)
  })

  it('updates field when updateField is called', () => {
    const { result } = renderHook(() => useContactForm())
    
    act(() => {
      result.current.updateField('name', 'Jane')
    })
    
    expect(result.current.contact.name).toBe('Jane')
  })
})
```

## Performance Guidelines

### Code Splitting
Split large feature areas using dynamic imports:

```tsx
// Lazy load heavy components
const ContactsTable = lazy(() => import('./ContactsTable'))
const ProfileEditor = lazy(() => import('./ProfileEditor'))

export function ContactsPage() {
  return (
    <Suspense fallback={<ContactsTableSkeleton />}>
      <ContactsTable />
    </Suspense>
  )
}
```

### Memoization
Use React.memo for expensive pure components:

```tsx
// Only re-render when props change
export const ContactCard = React.memo(function ContactCard({ contact }) {
  return (
    <div className="contact-card">
      <h3>{contact.name}</h3>
      <p>{contact.email}</p>
    </div>
  )
})

// Use useMemo for expensive calculations
export function ContactStats({ contacts }) {
  const stats = useMemo(() => {
    return calculateContactStatistics(contacts)
  }, [contacts])

  return <div>{/* Display stats */}</div>
}
```

## Migration Strategy

### Step-by-Step Refactoring Process

1. **Identify Target Component**
   - Components >300 lines
   - Components with multiple responsibilities
   - Components with client/server boundary issues

2. **Analyze Responsibilities**
   - List all distinct purposes the component serves
   - Identify shared state and logic
   - Map dependencies between different sections

3. **Plan the Split**
   - Create new component names following naming conventions
   - Decide which components need "use client"
   - Plan the data flow between new components

4. **Extract Components**
   - Start with the most independent sections
   - Extract custom hooks for shared logic
   - Create proper TypeScript interfaces

5. **Update Parent Component**
   - Replace sections with new components
   - Simplify props and state management
   - Ensure proper client/server boundaries

6. **Test and Validate**
   - Run existing tests
   - Add tests for new components
   - Manually test all functionality

### Example Migration

**Before (ProfilePage.tsx - 927 lines):**
```tsx
export default function ProfilePage({ profileId }) {
  // 50+ lines of state and effects
  // 200+ lines of form rendering
  // 300+ lines of custom fields
  // 250+ lines of events timeline
  // 100+ lines of statistics
}
```

**After (5 focused components):**
```tsx
// ProfilePage.tsx - 50 lines (container)
export default function ProfilePage({ profileId }) {
  return (
    <div className="profile-page">
      <ProfileHeader profileId={profileId} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ContactPropertiesForm profileId={profileId} />
        <ProfileStats profileId={profileId} />
      </div>
      <CustomFieldsSection profileId={profileId} />
      <ProfileEventsTimeline profileId={profileId} />
    </div>
  )
}

// ProfileHeader.tsx - 75 lines
// ContactPropertiesForm.tsx - 200 lines  
// CustomFieldsSection.tsx - 300 lines
// ProfileEventsTimeline.tsx - 250 lines
// ProfileStats.tsx - 50 lines
```

## Conclusion

Following these guidelines will result in:

- **Maintainable code** that's easy to understand and modify
- **Better performance** through proper code splitting and server/client separation
- **Improved developer experience** with clear patterns and conventions
- **Higher code quality** through better testing and error handling
- **Scalable architecture** that grows with the application

Remember: These are guidelines, not rigid rules. Use judgment and context when applying them, but document any deviations and their rationale.

---

*Guidelines Version: 1.0*  
*Last Updated: 2025-01-20*  
*Status: Active*