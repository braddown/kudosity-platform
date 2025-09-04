# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Performance Analysis
- `npm run analyze` - Enable bundle analyzer
- `npm run perf:build` - Build with analysis
- `npm run perf:test` - Full performance test with Lighthouse
- `npm run bundle:analyze` - Analyze webpack bundles

### Database Migration Scripts
- `npm run migrate-cdp` - Run CDP migration
- `npm run migrate-cdp:dry` - Dry run CDP migration
- `npm run migrate-cdp:rollback` - Rollback CDP migration

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **UI**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Server Components + hooks
- **Authentication**: Supabase Auth with middleware

### Core Directory Structure

```
app/                    # Next.js 14 App Router pages
├── api/               # API routes (24 endpoints)
├── auth/              # Authentication pages
├── campaigns/         # Campaign management
├── messaging/         # Message/SMS functionality  
├── profiles/          # Customer profile management
├── segments/          # Customer segmentation
└── overview/          # Dashboard/analytics

components/            # React components (62 components)
├── features/          # Feature-specific components
├── layouts/           # Layout components
├── ui/               # shadcn/ui primitives (57 components)
└── [major components] # Dashboard, Contacts, ProfilesTable, etc.

lib/                   # Core utilities and configurations
├── api/              # API utilities and clients
├── auth/             # Authentication utilities
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Shared utilities
├── supabase.ts       # Supabase client configuration
└── supabase-server.ts # Server-side Supabase client
```

### Key Architecture Patterns

**Authentication Flow**: 
- Middleware (`middleware.ts`) handles auth on every request
- Redirects unauthenticated users to `/auth/login`
- Account membership system with `current_account` cookie
- Multi-tenant structure via account membership

**Database Layer**:
- Uses Supabase client with server-side rendering support
- CDP (Customer Data Platform) integration with migration scripts
- Core tables: profiles, campaigns, logs, segments, account_members
- Custom fields stored as JSONB in profiles table

**Component Architecture**:
- Server Components for data fetching
- Client Components for interactivity (marked with 'use client')
- Feature-based organization in components/features/
- shadcn/ui for consistent design system

**API Design**:
- RESTful endpoints in app/api/
- Webhook support for external integrations (Kudosity SMS)
- Database operations via Supabase client
- Authentication handled by middleware

### Path Aliases (tsconfig.json)
- `@/*` - Root directory
- `@/components/*` - components/
- `@/lib/*` - lib/
- `@/api/*` - lib/api/
- `@/hooks/*` - lib/hooks/
- `@/types/*` - lib/types/
- `@/ui/*` - components/ui/

## Important Configuration

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema (Core Tables)
- `profiles` - Customer data with custom JSONB fields
- `campaigns` - Campaign management 
- `logs` - Activity and event tracking
- `segments` - Customer segmentation rules
- `account_members` - Multi-tenant user accounts

### Performance Optimizations
- Bundle splitting configured for vendors, Radix UI, Supabase
- Image optimization with WebP/AVIF formats
- Production console.log removal (except errors)
- Webpack tree shaking enabled
- Standalone output for Docker deployment

## Specialist Agent System

The project includes a specialized agent system located in `.claude-agents/` that provides domain-specific guidance for maintaining consistency and quality:

- **Database Specialist**: Supabase schema management, migrations, performance optimization
- **SMS & Communication Specialist**: Kudosity API integration, campaign management, delivery optimization
- **Component Architecture Specialist**: React/Next.js components, shadcn/ui design system consistency
- **Infrastructure Specialist**: Vercel deployment, security compliance, production readiness
- **Code Quality Guardian**: TypeScript compliance, architectural patterns, security best practices
- **UX Design Specialist**: Design consistency, typography hierarchy, color schemes, glass morphism effects

Always consult the relevant specialist agent documentation when working in their domain areas.

## Version Control Rules

**CRITICAL**: Never commit or push code without explicit user instruction. Always wait for user testing and approval before any git operations.

## Database Usage

Always use the Supabase MCP server when dealing with database operations. The Supabase project ID is `hgfsmeudhvsvwmzxexmv`.