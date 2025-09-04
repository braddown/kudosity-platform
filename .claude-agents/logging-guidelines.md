# Logging System Guidelines - Kudosity

## Overview
Part of **CC002: Clean Up Console Statements** task. This document outlines how to use the centralized logging system instead of console.log statements.

## Quick Start

### Import and Setup
```typescript
import { createLogger } from '@/lib/utils/logger'

// Create a scoped logger for your component/module
const logger = createLogger('ComponentName')
```

### Basic Usage
```typescript
// Debug information (development only)
logger.debug('User clicked button', { buttonId: 'submit', userId: 123 })

// General information (not in production)  
logger.info('Profile loaded successfully', { profileId: userId, loadTime: '150ms' })

// Warnings (always logged)
logger.warn('API rate limit approaching', { currentRequests: 95, limit: 100 })

// Errors (always logged)  
logger.error('Failed to save profile', error, { profileId: userId, attempts: 3 })
```

## Log Levels

| Level | When to Use | Environment | Example |
|-------|-------------|-------------|---------|
| `debug` | Development debugging, detailed flow tracing | Development only | Button clicks, state changes, API calls |
| `info` | General application flow, successful operations | Development & Staging | Data loaded, operations completed |
| `warn` | Potential issues, deprecated usage, approaching limits | Always | Rate limits, fallback usage, validation warnings |
| `error` | Actual errors, exceptions, failed operations | Always | API failures, validation errors, exceptions |

## Migration from console.log

### ❌ Old Way
```typescript
console.log("Fetching profiles with options:", options)
console.log(`Loaded ${data.length} profiles`)
console.error("Error fetching profiles:", error)
```

### ✅ New Way
```typescript
logger.debug('Fetching profiles', { options })
logger.info('Profiles loaded successfully', { count: data.length })
logger.error('Error fetching profiles', error, { options })
```

## Best Practices

### 1. Use Structured Logging
```typescript
// ❌ Don't: String concatenation
logger.info(`User ${userId} performed ${action}`)

// ✅ Do: Structured context
logger.info('User action performed', { userId, action })
```

### 2. Meaningful Messages  
```typescript
// ❌ Don't: Generic messages
logger.debug('Processing data')

// ✅ Do: Specific, actionable messages
logger.debug('Processing profile validation', { profileId, validationRules })
```

### 3. Include Relevant Context
```typescript
// ❌ Don't: Missing context
logger.error('Save failed', error)

// ✅ Do: Rich context for debugging
logger.error('Profile save failed', error, { 
  profileId, 
  operation: 'update',
  attempts: retryCount,
  validationErrors 
})
```

### 4. Performance Considerations
```typescript
// Use timing for performance-critical operations
logger.time('profile-validation')
await validateProfile(profileData)  
logger.timeEnd('profile-validation')
```

## Environment Behavior

### Development
- All log levels displayed with colors
- Console output optimized for debugging
- Performance timing enabled

### Production  
- Only `warn` and `error` levels logged
- Structured JSON output for external services
- Performance timing disabled

## Component Examples

### API Route
```typescript
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('ProfilesAPI')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const options = Object.fromEntries(searchParams)
  
  logger.debug('API request received', { endpoint: '/api/profiles', options })
  
  try {
    const profiles = await getProfiles(options)
    logger.info('API request successful', { count: profiles.length, endpoint: '/api/profiles' })
    return Response.json(profiles)
  } catch (error) {
    logger.error('API request failed', error, { endpoint: '/api/profiles', options })
    return Response.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}
```

### React Component
```typescript
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('ProfileForm')

export function ProfileForm({ profileId }: { profileId: string }) {
  const handleSubmit = async (data: FormData) => {
    logger.debug('Form submission started', { profileId, fields: Object.keys(data) })
    
    try {
      await updateProfile(profileId, data)
      logger.info('Profile updated successfully', { profileId })
    } catch (error) {
      logger.error('Profile update failed', error, { profileId, data })
    }
  }
  
  // Component JSX...
}
```

## Integration with Error Boundaries

```typescript
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('ErrorBoundary')

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React error boundary triggered', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    })
  }
}
```

## Future Enhancements

1. **External Service Integration**: Connect to LogDNA, Sentry, or DataDog
2. **User Context**: Automatically include user ID and session info
3. **Performance Metrics**: Built-in performance monitoring
4. **Log Aggregation**: Centralized logging dashboard

## Migration Status

- ✅ `lib/utils/logger.ts` - Logging system implemented
- ✅ `components/Contacts.tsx` - 23 console statements replaced
- ✅ `lib/api/profiles-api.ts` - 10 console statements replaced  
- 🔄 **906 remaining console statements** across 133 files

## Quick Migration Commands

Search for remaining console statements:
```bash
# Find all console statements
grep -r "console\." --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# Count remaining statements
grep -r "console\." --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | wc -l
```

## Questions?

Consult the **Code Quality Guardian** specialist agent for additional guidance on logging best practices and code quality standards.