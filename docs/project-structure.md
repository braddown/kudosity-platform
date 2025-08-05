# Project Structure Guide

This document outlines the reorganized project structure for improved modularity, maintainability, and developer experience.

## Overview

The project has been restructured to follow feature-based organization with clear separation of concerns. Components are organized by domain rather than function, and all imports use TypeScript path mapping for cleaner, more maintainable code.

## Directory Structure

```
├── lib/                           # Core business logic and utilities
│   ├── api/                       # API layer - all external data access
│   │   ├── chat-api.ts           # Chat functionality API
│   │   ├── profiles-api.ts       # Profile management API
│   │   ├── properties-api.ts     # Properties/fields API
│   │   ├── segments-api.ts       # Segments and lists API
│   │   ├── log-filters-api.ts    # Logging and filters API
│   │   ├── repositories/         # Repository pattern implementations
│   │   │   ├── BaseRepository.ts
│   │   │   ├── CampaignsRepository.ts
│   │   │   ├── ContactsRepository.ts
│   │   │   ├── ListsRepository.ts
│   │   │   ├── ProfilesRepository.ts
│   │   │   ├── SegmentsRepository.ts
│   │   │   ├── TemplatesRepository.ts
│   │   │   └── types.ts
│   │   └── index.ts              # Unified API exports
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-async-data.ts     # Generic async data fetching
│   │   ├── use-async-state.tsx   # Async state management
│   │   ├── use-profile-data.ts   # Profile-specific data hooks
│   │   ├── use-profile-form.ts   # Profile form management
│   │   ├── use-lists.ts          # Lists functionality
│   │   ├── use-media-query.ts    # Responsive utilities
│   │   ├── use-mobile.tsx        # Mobile detection
│   │   └── index.ts              # Unified hooks exports
│   ├── types/                     # TypeScript type definitions
│   │   ├── supabase.ts           # Supabase-generated types
│   │   ├── database-types.ts     # Database schema types
│   │   └── index.ts              # Unified type exports
│   ├── navigation/               # Navigation utilities
│   ├── supabase.ts              # Supabase client configuration
│   ├── config.ts                # App configuration
│   └── utils.ts                 # General utilities
├── components/                   # React components
│   ├── features/                # Feature-based component organization
│   │   ├── campaigns/           # Campaign-related components
│   │   │   ├── CampaignActivityTable.tsx
│   │   │   ├── BroadcastMessage.tsx
│   │   │   ├── BroadcastClientWrapper.tsx
│   │   │   └── index.ts
│   │   ├── chat/                # Chat functionality
│   │   │   ├── ChatApp.tsx
│   │   │   ├── ChatClientWrapper.tsx
│   │   │   └── index.ts
│   │   ├── lists/               # Contact lists management
│   │   │   ├── ListsComponent.tsx
│   │   │   ├── ListsClientWrapper.tsx
│   │   │   └── index.ts
│   │   ├── segments/            # Audience segmentation
│   │   │   ├── SegmentList.tsx
│   │   │   ├── SegmentsClientWrapper.tsx
│   │   │   └── index.ts
│   │   ├── properties/          # Contact properties/fields
│   │   │   ├── PropertiesComponent.tsx
│   │   │   ├── PropertiesClientWrapper.tsx
│   │   │   ├── CreatePropertyButton.tsx
│   │   │   ├── CreatePropertyForm.tsx
│   │   │   ├── NewPropertyButton.tsx
│   │   │   ├── CustomFieldsManager.tsx
│   │   │   └── index.ts
│   │   ├── journeys/            # Customer journey workflows
│   │   │   ├── Journeys.tsx
│   │   │   ├── JourneyEditor.tsx
│   │   │   ├── journey-canvas.tsx
│   │   │   └── index.ts
│   │   ├── touchpoints/         # Message touchpoints
│   │   │   ├── TouchpointMessage.tsx
│   │   │   ├── TouchpointsList.tsx
│   │   │   └── index.ts
│   │   ├── settings/            # Application settings
│   │   │   ├── AccountSettings.tsx
│   │   │   ├── ApiKeys.tsx
│   │   │   ├── Webhooks.tsx
│   │   │   ├── DataSources.tsx
│   │   │   └── index.ts
│   │   ├── profiles/            # User profiles (from previous refactoring)
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ContactPropertiesForm.tsx
│   │   │   ├── ProfileActivityTimeline.tsx
│   │   │   ├── NotificationPreferences.tsx
│   │   │   ├── CustomFieldsSection.tsx
│   │   │   └── index.ts
│   │   └── index.ts             # Unified feature exports
│   ├── ui/                      # shadcn/ui design system components
│   ├── layouts/                 # Layout components
│   ├── navigation/              # Navigation components
│   └── [shared components]      # Shared utility components
└── app/                         # Next.js App Router pages
```

## TypeScript Path Mapping

The project uses TypeScript path aliases for cleaner imports:

```typescript
// tsconfig.json paths configuration
{
  "paths": {
    "@/*": ["./*"],                    // Root access
    "@/lib/*": ["lib/*"],              // Core utilities
    "@/api/*": ["lib/api/*"],          // API layer
    "@/hooks/*": ["lib/hooks/*"],      // Custom hooks
    "@/types/*": ["lib/types/*"],      # Type definitions
    "@/components/*": ["components/*"], // Components
    "@/features/*": ["components/features/*"], // Feature components
    "@/providers/*": ["providers/*"],   # Context providers
    "@/ui/*": ["components/ui/*"]       # Design system
  }
}
```

## Import Conventions

### ✅ **Preferred Import Patterns**

```typescript
// Feature components - use specific imports
import { CampaignActivityTable } from '@/features/campaigns'
import { ChatApp } from '@/features/chat'
import { SegmentList } from '@/features/segments'

// API layer - use from centralized API
import { profilesApi } from '@/api/profiles-api'
import { campaignsRepository } from '@/api/repositories'

// Hooks - use from hooks directory
import { useProfileData } from '@/hooks/use-profile-data'
import { useAsyncState } from '@/hooks/use-async-state'

// Types - use from types directory
import type { Profile, Campaign } from '@/types'

// UI components - use from ui directory
import { Button } from '@/ui/button'
import { Card } from '@/ui/card'
```

### ❌ **Avoid These Patterns**

```typescript
// Don't use relative imports for distant files
import { profilesApi } from '../../../lib/api/profiles-api'

// Don't bypass the path mapping
import { Button } from '../../components/ui/button'

// Don't import from implementation details
import { BaseRepository } from '@/api/repositories/BaseRepository'
```

## Feature Organization Principles

### 1. **Domain-Driven Structure**
Components are grouped by business domain (campaigns, chat, segments) rather than technical function (forms, tables, buttons).

### 2. **Clear Boundaries**
Each feature directory is self-contained with its own `index.ts` for clean exports.

### 3. **Shared Components**
Common UI elements remain in the root `components/` directory and are imported via `@/components/*`.

### 4. **Single Responsibility**
Each directory has a focused purpose and clear ownership.

## API Layer Architecture

### Repository Pattern
- **BaseRepository**: Common functionality for all repositories
- **Specific Repositories**: Domain-specific data access (CampaignsRepository, ProfilesRepository, etc.)
- **API Files**: Higher-level API functions that may use multiple repositories

### Benefits
- Consistent error handling
- Standardized response format
- Easy testing and mocking
- Clear separation between data access and business logic

## Migration Benefits

### 1. **Improved Developer Experience**
- Shorter, cleaner import statements
- Easier to locate related functionality
- Better IDE support for auto-imports

### 2. **Better Maintainability**
- Clear ownership of components
- Reduced coupling between features
- Easier refactoring and testing

### 3. **Scalability**
- New features can be added without affecting existing code
- Clear patterns for organizing new functionality
- Easier onboarding for new developers

### 4. **Build Performance**
- Better tree-shaking due to clear dependency boundaries
- Reduced circular dependencies
- Optimized import resolution

## Development Guidelines

### Adding New Features
1. Create a new directory under `components/features/`
2. Add an `index.ts` file for clean exports
3. Update the main features `index.ts` to include the new feature
4. Use appropriate path aliases for imports

### Adding New API Endpoints
1. Add to existing API files in `lib/api/` or create new ones
2. Update `lib/api/index.ts` to export new functionality
3. Follow the repository pattern for database operations

### Adding New Types
1. Add to `lib/types/` directory
2. Update `lib/types/index.ts` to export new types
3. Use domain-specific naming (e.g., `campaign.types.ts`)

## File Naming Conventions

- **Components**: PascalCase (e.g., `CampaignActivityTable.tsx`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-profile-data.ts`)
- **API files**: kebab-case with `-api` suffix (e.g., `profiles-api.ts`)
- **Types**: kebab-case with `.types` suffix (e.g., `campaign.types.ts`)
- **Index files**: Always `index.ts` for clean exports

This structure provides a solid foundation for continued development while maintaining clarity, performance, and developer experience.