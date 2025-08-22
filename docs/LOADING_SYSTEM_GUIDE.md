# Loading System Guide

## Overview

This document describes the unified loading system implemented across the Kudosity platform. All loading states use consistent components from `@/components/ui/loading` to ensure a uniform user experience.

## Core Components

### 1. LoadingSpinner
The base loading spinner component using Lucide's Loader2 icon.

```tsx
import { LoadingSpinner } from "@/components/ui/loading"

// Available sizes: "xs" | "sm" | "md" | "lg" | "xl"
<LoadingSpinner size="md" />
```

### 2. LoadingPage
Full-page loading state for route transitions and initial page loads.

```tsx
import { LoadingPage, LoadingMessages } from "@/components/ui/loading"

// In loading.tsx files
export default function Loading() {
  return <LoadingPage message={LoadingMessages.PROFILES} />
}
```

### 3. LoadingSection
Section-level loading for content within a page.

```tsx
import { LoadingSection } from "@/components/ui/loading"

// Within components
if (loading) {
  return <LoadingSection message="Loading data..." />
}
```

### 4. LoadingCard
Loading state for card components.

```tsx
import { LoadingCard } from "@/components/ui/loading"

// Inside card components
<Card>
  {loading ? <LoadingCard /> : <CardContent>...</CardContent>}
</Card>
```

### 5. LoadingInline
Inline loading for text or small components.

```tsx
import { LoadingInline } from "@/components/ui/loading"

// Inline with text
<p>Processing <LoadingInline /></p>
```

### 6. LoadingButton
Loading state for buttons during form submission.

```tsx
import { LoadingButton, LoadingMessages } from "@/components/ui/loading"

<Button disabled={loading}>
  {loading ? (
    <LoadingButton message={LoadingMessages.SAVE} />
  ) : (
    'Save Changes'
  )}
</Button>
```

### 7. LoadingTable
Skeleton loading for table data.

```tsx
import { LoadingTable } from "@/components/ui/loading"

// Table loading with custom rows/columns
<LoadingTable rows={10} columns={5} />
```

### 8. LoadingOverlay
Overlay loading for forms or modal actions.

```tsx
import { LoadingOverlay } from "@/components/ui/loading"

// Over existing content
<div className="relative">
  {loading && <LoadingOverlay message="Saving..." />}
  <form>...</form>
</div>
```

## Predefined Loading Messages

Use consistent messages from `LoadingMessages`:

```tsx
import { LoadingMessages } from "@/components/ui/loading"

// Authentication
LoadingMessages.LOGIN    // "Signing you in..."
LoadingMessages.LOGOUT   // "Signing you out..."
LoadingMessages.SIGNUP   // "Creating your account..."

// Data operations
LoadingMessages.FETCH    // "Loading data..."
LoadingMessages.SAVE     // "Saving changes..."
LoadingMessages.DELETE   // "Deleting..."
LoadingMessages.UPDATE   // "Updating..."

// Page loads
LoadingMessages.PROFILES // "Loading profiles..."
LoadingMessages.LISTS    // "Loading lists..."
LoadingMessages.CAMPAIGNS // "Loading campaigns..."
LoadingMessages.SETTINGS // "Loading settings..."
LoadingMessages.OVERVIEW // "Loading overview..."

// Table operations
LoadingMessages.TABLE_LOAD   // "Loading table data..."
LoadingMessages.TABLE_FILTER // "Applying filters..."
LoadingMessages.TABLE_SORT   // "Sorting data..."
```

## Implementation Guidelines

### 1. Route Loading (loading.tsx files)

All Next.js loading.tsx files should use `LoadingPage`:

```tsx
// app/[route]/loading.tsx
import { LoadingPage, LoadingMessages } from "@/components/ui/loading"

export default function Loading() {
  return <LoadingPage message={LoadingMessages.PROFILES} />
}
```

### 2. Component Loading States

```tsx
// Inside React components
import { LoadingSection } from "@/components/ui/loading"

function MyComponent() {
  const [loading, setLoading] = useState(true)
  
  if (loading) {
    return <LoadingSection message="Loading content..." />
  }
  
  return <div>Content</div>
}
```

### 3. Form Submissions

```tsx
import { LoadingButton, LoadingMessages } from "@/components/ui/loading"

function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoadingButton message={LoadingMessages.SAVE} />
        ) : (
          'Submit'
        )}
      </Button>
    </form>
  )
}
```

### 4. Data Tables

```tsx
import { LoadingTable } from "@/components/ui/loading"
import { DataTable } from "@/components/ui/data-table"

function MyTable() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  
  if (loading) {
    return <LoadingTable rows={10} columns={5} />
  }
  
  return <DataTable data={data} columns={columns} />
}
```

## Design Principles

1. **Consistency**: All loading states use the same spinner animation (Lucide Loader2)
2. **Dark Mode Support**: All components respect the theme using Tailwind's dark mode classes
3. **Performance**: Lightweight components with minimal DOM updates
4. **Accessibility**: Proper ARIA labels and semantic HTML
5. **Responsive**: Components adapt to different screen sizes

## Migration from Old Loading Components

### Old Components to Remove:
- `EnhancedLoading`
- `DefaultLoading`
- `LoadingProgress`
- Custom skeleton implementations
- Direct use of `Loader2` icon

### Migration Example:

```tsx
// Old
import EnhancedLoading from "@/components/EnhancedLoading"
<EnhancedLoading fullScreen message="Loading..." />

// New
import { LoadingPage } from "@/components/ui/loading"
<LoadingPage message="Loading..." />
```

```tsx
// Old
import { Loader2 } from "lucide-react"
<Loader2 className="animate-spin" />

// New
import { LoadingSpinner } from "@/components/ui/loading"
<LoadingSpinner size="md" />
```

## Best Practices

1. **Use appropriate loading component for context**:
   - Full page loads → `LoadingPage`
   - Section updates → `LoadingSection`
   - Button actions → `LoadingButton`
   - Table data → `LoadingTable`

2. **Provide meaningful messages**:
   - Use predefined messages from `LoadingMessages` when possible
   - Keep messages concise and action-oriented
   - Avoid generic "Loading..." when specific context is available

3. **Handle loading states properly**:
   - Show loading immediately on user action
   - Prevent multiple submissions with disabled states
   - Clear loading state on both success and error

4. **Consider loading duration**:
   - For quick operations (<300ms), consider skipping loading state
   - For longer operations, provide progress indicators if possible
   - Add timeout handling for operations that might hang

## Testing

When testing components with loading states:

```tsx
import { render, screen } from '@testing-library/react'
import { LoadingPage } from '@/components/ui/loading'

test('displays loading message', () => {
  render(<LoadingPage message="Test loading..." />)
  expect(screen.getByText('Test loading...')).toBeInTheDocument()
})
```

## Troubleshooting

### Loading state stuck
- Ensure loading state is cleared in both success and error handlers
- Check for unhandled promise rejections
- Verify cleanup in useEffect hooks

### Flashing loading states
- Consider adding a minimum display duration for very quick operations
- Use React Suspense boundaries for smoother transitions

### Performance issues
- Avoid rendering multiple loading spinners simultaneously
- Use React.memo for loading components if needed
- Consider lazy loading for heavy components

## Future Enhancements

Planned improvements to the loading system:
- Progress bars for long-running operations
- Skeleton screens that match actual content layout
- Loading state persistence across navigation
- Analytics integration for loading performance metrics
