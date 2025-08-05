# Custom Hooks & Reusable Components Guide

This guide provides comprehensive documentation for the custom hooks and reusable components implemented in Task 7. These tools are designed to reduce code duplication, provide consistent state management, and improve the overall developer experience.

## Overview

The custom hooks and components follow a consistent pattern:
- **Built on `useAsyncData`** for standardized loading/error states
- **Comprehensive CRUD operations** with optimistic updates
- **Advanced filtering and pagination** capabilities
- **Caching with TTL** for performance optimization
- **TypeScript-first** with full type safety

## Table of Contents

1. [Data Management Hooks](#data-management-hooks)
   - [useProfiles](#useprofiles)
   - [useLogs](#uselogs)
   - [useCampaigns](#usecampaigns)
2. [Navigation Hooks](#navigation-hooks)
   - [useEnhancedNavigation](#useenhancednavigation)
3. [Layout Components](#layout-components)
   - [EnhancedPageLayout](#enhancedpagelayout)
4. [Best Practices](#best-practices)
5. [Migration Guide](#migration-guide)

---

## Data Management Hooks

### useProfiles

Comprehensive hook for managing profile operations with advanced features like CRUD operations, filtering, pagination, and bulk operations.

#### Import

```typescript
import { useProfiles } from '@/hooks/useProfiles'
```

#### Basic Usage

```typescript
function ProfilesPage() {
  const {
    profiles,
    loading,
    error,
    totalCount,
    currentPage,
    hasNextPage,
    createProfile,
    updateProfile,
    deleteProfile,
    nextPage,
    search,
  } = useProfiles({
    immediate: true,
    pagination: { page: 1, limit: 25 },
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  })

  if (loading) return <div>Loading profiles...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <input 
        placeholder="Search profiles..." 
        onChange={(e) => search(e.target.value)}
      />
      
      {profiles.map(profile => (
        <div key={profile.id}>
          <h3>{profile.first_name} {profile.last_name}</h3>
          <p>{profile.email}</p>
          <button onClick={() => deleteProfile(profile.id)}>
            Delete
          </button>
        </div>
      ))}
      
      {hasNextPage && (
        <button onClick={nextPage}>Load More</button>
      )}
    </div>
  )
}
```

#### Advanced Usage with Filtering

```typescript
function AdvancedProfilesPage() {
  const {
    profiles,
    loading,
    setFilters,
    clearFilters,
    bulkUpdate,
    bulkDelete,
    getMostVisitedRoutes,
  } = useProfiles({
    filters: {
      status: 'active',
      tags: ['premium'],
      createdAfter: '2024-01-01',
    },
    optimistic: true,
  })

  const handleBulkAction = async (action: string, profileIds: string[]) => {
    if (action === 'delete') {
      await bulkDelete(profileIds)
    } else if (action === 'activate') {
      await bulkUpdate(profileIds, { status: 'active' })
    }
  }

  return (
    <div>
      <div className="filters">
        <button onClick={() => setFilters({ status: 'active' })}>
          Active Only
        </button>
        <button onClick={() => setFilters({ tags: ['premium'] })}>
          Premium Users
        </button>
        <button onClick={clearFilters}>
          Clear Filters
        </button>
      </div>
      
      {/* Profile list with bulk actions */}
      <ProfileList 
        profiles={profiles}
        onBulkAction={handleBulkAction}
      />
    </div>
  )
}
```

#### Key Features

- **CRUD Operations**: Create, read, update, delete profiles
- **Advanced Filtering**: Search, status filters, date ranges, tags
- **Pagination**: Full pagination with navigation controls
- **Bulk Operations**: Bulk update/delete multiple profiles
- **Optimistic Updates**: Immediate UI updates for better UX
- **Caching**: Intelligent caching with configurable TTL

---

### useLogs

Comprehensive hook for managing log data with advanced filtering, saved filters, and real-time capabilities.

#### Import

```typescript
import { useLogs } from '@/hooks/useLogs'
```

#### Basic Usage

```typescript
function LogsPage() {
  const {
    logs,
    loading,
    error,
    pagination,
    eventTypes,
    connectionStatus,
    setSearch,
    setEventTypes,
    goToPage,
    expandedRows,
    toggleRowExpansion,
  } = useLogs({
    immediate: true,
    pagination: { page: 1, pageSize: 25 },
    enableRealTimeUpdates: true,
  })

  return (
    <div>
      <div className="connection-status">
        Status: {connectionStatus.status} - {connectionStatus.message}
      </div>
      
      <div className="filters">
        <input 
          placeholder="Search logs..." 
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <select onChange={(e) => setEventTypes([e.target.value])}>
          <option value="">All Event Types</option>
          {eventTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="logs">
        {logs.map(log => (
          <div key={log.id} className="log-entry">
            <div onClick={() => toggleRowExpansion(log.id)}>
              <span>{log.event_type}</span>
              <span>{log.log_time}</span>
            </div>
            
            {expandedRows.has(log.id) && (
              <div className="log-details">
                <pre>{JSON.stringify(log.details, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pagination">
        <button 
          disabled={pagination.page === 1}
          onClick={() => goToPage(pagination.page - 1)}
        >
          Previous
        </button>
        
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        
        <button 
          disabled={pagination.page === pagination.totalPages}
          onClick={() => goToPage(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

#### Advanced Usage with Saved Filters

```typescript
function AdvancedLogsPage() {
  const {
    logs,
    savedFilters,
    loadSavedFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    setAdvancedFilters,
    exportLogs,
    hasActiveFilters,
    clearAllFilters,
  } = useLogs({
    userId: 'current-user-id',
    cacheTTL: 2 * 60 * 1000, // 2 minutes for fresh log data
  })

  const handleSaveCurrentFilter = async () => {
    const name = prompt('Filter name:')
    if (name) {
      await saveFilter(name, 'Custom filter for debugging')
    }
  }

  return (
    <div>
      <div className="saved-filters">
        <h3>Saved Filters</h3>
        {savedFilters.map(filter => (
          <div key={filter.id} className="filter-item">
            <button onClick={() => loadFilter(filter)}>
              {filter.name}
            </button>
            <button onClick={() => deleteFilter(filter.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="filter-actions">
        {hasActiveFilters && (
          <>
            <button onClick={handleSaveCurrentFilter}>
              Save Current Filter
            </button>
            <button onClick={clearAllFilters}>
              Clear All Filters
            </button>
          </>
        )}
      </div>

      <div className="export-actions">
        <button onClick={() => exportLogs('json')}>
          Export as JSON
        </button>
        <button onClick={() => exportLogs('csv')}>
          Export as CSV
        </button>
      </div>

      {/* Log display */}
      <LogTable logs={logs} />
    </div>
  )
}
```

#### Key Features

- **Advanced Filtering**: Search, event types, date ranges, custom filters
- **Saved Filters**: Save, load, and manage filter configurations
- **Real-time Updates**: Optional real-time log updates
- **Connection Monitoring**: Database connection status tracking
- **Export Functionality**: Export logs as JSON or CSV
- **Row Expansion**: Expandable log details

---

### useCampaigns

Comprehensive hook for managing campaign operations including CRUD, status management, templates, and analytics.

#### Import

```typescript
import { useCampaigns } from '@/hooks/useCampaigns'
```

#### Basic Usage

```typescript
function CampaignsPage() {
  const {
    campaigns,
    loading,
    error,
    overallMetrics,
    createCampaign,
    updateCampaign,
    startCampaign,
    pauseCampaign,
    getActiveCampaigns,
    templates,
    loadTemplates,
  } = useCampaigns({
    immediate: true,
    includeArchived: false,
  })

  const handleCreateCampaign = async () => {
    const newCampaign = await createCampaign({
      name: 'New Campaign',
      type: 'broadcast',
      channel: 'sms',
      status: 'draft',
    })
    
    if (newCampaign) {
      console.log('Campaign created:', newCampaign)
    }
  }

  return (
    <div>
      <div className="metrics">
        <h3>Overall Metrics</h3>
        <div>Delivery Rate: {overallMetrics.deliveryRate.toFixed(1)}%</div>
        <div>Open Rate: {overallMetrics.openRate.toFixed(1)}%</div>
        <div>Click Rate: {overallMetrics.clickRate.toFixed(1)}%</div>
      </div>

      <button onClick={handleCreateCampaign}>
        Create Campaign
      </button>

      <div className="campaigns">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="campaign-card">
            <h4>{campaign.name}</h4>
            <p>Status: {campaign.status}</p>
            <p>Type: {campaign.type} | Channel: {campaign.channel}</p>
            
            <div className="campaign-actions">
              {campaign.status === 'draft' && (
                <button onClick={() => startCampaign(campaign.id)}>
                  Start
                </button>
              )}
              {campaign.status === 'active' && (
                <button onClick={() => pauseCampaign(campaign.id)}>
                  Pause
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Advanced Usage with Templates and Scheduling

```typescript
function AdvancedCampaignsPage() {
  const {
    campaigns,
    templates,
    createTemplate,
    scheduleCampaign,
    duplicateCampaign,
    calculateSMSCount,
    estimateCosts,
    validateMessage,
    getEstimatedReach,
  } = useCampaigns()

  const handleScheduleCampaign = async (campaignId: string) => {
    const schedule = {
      type: 'scheduled' as const,
      scheduled_time: '2024-12-25T09:00:00Z',
      timezone: 'America/New_York',
    }
    
    await scheduleCampaign(campaignId, schedule)
  }

  const handleMessageValidation = (content: string, channel: string) => {
    const validation = validateMessage(content, channel)
    const smsCount = calculateSMSCount(content)
    const estimatedCost = estimateCosts(1000, content.length, channel)
    
    return {
      ...validation,
      smsCount,
      estimatedCost,
    }
  }

  return (
    <div>
      <div className="templates">
        <h3>Campaign Templates</h3>
        {templates.map(template => (
          <div key={template.id} className="template-item">
            <h4>{template.name}</h4>
            <p>{template.type} - {template.category}</p>
            <small>Used {template.usage_count} times</small>
          </div>
        ))}
      </div>

      <div className="campaign-tools">
        <MessageComposer onValidate={handleMessageValidation} />
        <AudienceSelector onEstimate={getEstimatedReach} />
        <SchedulePicker onSchedule={handleScheduleCampaign} />
      </div>
    </div>
  )
}
```

#### Key Features

- **Campaign Management**: Full CRUD operations with status control
- **Template System**: Create, manage, and reuse campaign templates
- **Analytics**: Campaign metrics and performance tracking
- **Scheduling**: Advanced scheduling with recurring patterns
- **Message Utilities**: SMS count, cost estimation, validation
- **Audience Tools**: Reach estimation and validation

---

## Navigation Hooks

### useEnhancedNavigation

Enhanced navigation hook that extends the base navigation with history tracking, dynamic breadcrumbs, and analytics.

#### Import

```typescript
import { useEnhancedNavigation } from '@/hooks/useEnhancedNavigation'
```

#### Basic Usage

```typescript
function NavigationComponent() {
  const {
    // Base navigation features
    navigation,
    activeItem,
    breadcrumbs,
    
    // Enhanced features
    history,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    dynamicBreadcrumbs,
    recentRoutes,
    analytics,
  } = useEnhancedNavigation({
    maxHistorySize: 50,
    enableAnalytics: true,
    enablePersistence: true,
  })

  return (
    <div>
      <div className="navigation-history">
        <button disabled={!canGoBack} onClick={goBack}>
          ← Back
        </button>
        <button disabled={!canGoForward} onClick={goForward}>
          Forward →
        </button>
      </div>

      <div className="breadcrumbs">
        {dynamicBreadcrumbs.map((crumb, index) => (
          <span key={index}>
            {index > 0 && ' > '}
            {crumb.isParam ? (
              <span className="param-crumb">
                {crumb.label}
              </span>
            ) : (
              <a href={crumb.path}>{crumb.label}</a>
            )}
          </span>
        ))}
      </div>

      <div className="recent-routes">
        <h4>Recent Pages</h4>
        {recentRoutes.slice(0, 5).map(route => (
          <div key={route.path}>
            <a href={route.path}>{route.title}</a>
            <small>{route.timestamp.toLocaleString()}</small>
          </div>
        ))}
      </div>

      <div className="analytics">
        <p>Total Visits: {analytics.totalVisits}</p>
        <p>Unique Routes: {analytics.uniqueRoutes.size}</p>
        <p>Session Duration: {
          Math.round((Date.now() - analytics.sessionStartTime.getTime()) / 1000 / 60)
        } minutes</p>
      </div>
    </div>
  )
}
```

#### Advanced Usage with Custom Resolvers

```typescript
function AdvancedNavigationPage() {
  const {
    generateBreadcrumbs,
    getRouteTitle,
    analytics,
    saveSession,
    loadSession,
  } = useEnhancedNavigation({
    routeTitleResolver: (path, params) => {
      // Custom title generation
      if (path.includes('/profiles/') && params?.id) {
        return `Profile: ${params.id}`
      }
      if (path.includes('/campaigns/') && params?.campaignId) {
        return `Campaign: ${params.campaignId}`
      }
      return path.split('/').pop()?.replace(/-/g, ' ') || 'Page'
    },
    breadcrumbResolver: (path, params) => {
      // Custom breadcrumb generation
      const crumbs = [{ label: 'Home', path: '/' }]
      
      if (path.startsWith('/admin/')) {
        crumbs.push({ label: 'Admin', path: '/admin' })
      }
      
      // Add more custom logic
      return crumbs
    },
  })

  return (
    <div>
      <div className="most-visited">
        <h4>Most Visited Routes</h4>
        {analytics.mostVisitedRoutes.slice(0, 5).map(route => (
          <div key={route.path}>
            <a href={route.path}>{route.title}</a>
            <span>({route.count} visits)</span>
          </div>
        ))}
      </div>

      <div className="session-controls">
        <button onClick={saveSession}>Save Session</button>
        <button onClick={loadSession}>Load Session</button>
      </div>
    </div>
  )
}
```

#### Key Features

- **History Tracking**: Full navigation history with back/forward
- **Dynamic Breadcrumbs**: Intelligent breadcrumb generation
- **Route Analytics**: Visit tracking and session analytics
- **Session Persistence**: Save/restore navigation state
- **Custom Resolvers**: Customize title and breadcrumb generation

---

## Layout Components

### EnhancedPageLayout

Comprehensive page layout component with loading, error, and empty states, plus breadcrumb integration.

#### Import

```typescript
import { EnhancedPageLayout } from '@/components/layouts/EnhancedPageLayout'
```

#### Basic Usage

```typescript
function ProfilesPage() {
  const { profiles, loading, error, isEmpty, refresh } = useProfiles()

  return (
    <EnhancedPageLayout
      title="Profiles"
      description="Manage your customer profiles"
      loading={{ loading }}
      error={{ error, onRetry: refresh }}
      empty={{ 
        isEmpty, 
        emptyTitle: "No profiles found",
        emptyDescription: "Start by creating your first profile",
        emptyActions: [
          { label: "Create Profile", onClick: () => {} }
        ]
      }}
      breadcrumbs={{ showBreadcrumbs: true }}
      actions={[
        { label: "Import", variant: "outline" },
        { label: "Create Profile", variant: "default" }
      ]}
    >
      <ProfileList profiles={profiles} />
    </EnhancedPageLayout>
  )
}
```

#### Advanced Usage with Skeleton Loading

```typescript
function CampaignsPage() {
  const { campaigns, loading, error } = useCampaigns()

  return (
    <EnhancedPageLayout
      title="Campaigns"
      subtitle="Manage your marketing campaigns"
      badge={{ text: "Active", variant: "default" }}
      
      loading={{
        loading,
        showSkeleton: true,
        skeletonCount: 5,
        message: "Loading campaigns..."
      }}
      
      error={{
        error,
        recoverable: true,
        onRetry: () => window.location.reload(),
        errorTitle: "Failed to load campaigns",
        errorDetails: "Please check your connection and try again"
      }}
      
      breadcrumbs={{
        showBreadcrumbs: true,
        maxBreadcrumbs: 4,
        customBreadcrumbs: [
          { label: "Home", path: "/" },
          { label: "Marketing", path: "/marketing" },
          { label: "Campaigns" }
        ]
      }}
      
      actions={[
        { 
          label: "Analytics", 
          icon: <BarChart3 className="h-4 w-4" />,
          variant: "outline" 
        },
        { 
          label: "New Campaign", 
          icon: <Plus className="h-4 w-4" />,
          variant: "default"
        }
      ]}
      
      withSidebar
      sidebar={<CampaignFilters />}
    >
      <CampaignGrid campaigns={campaigns} />
    </EnhancedPageLayout>
  )
}
```

#### Key Features

- **Loading States**: Spinner and skeleton UI options
- **Error Handling**: Comprehensive error display with retry
- **Empty States**: Customizable empty state with actions
- **Breadcrumb Integration**: Dynamic breadcrumb generation
- **Action Buttons**: Header actions with loading states
- **Responsive Sidebar**: Optional sidebar support

---

## Best Practices

### 1. Hook Composition

Combine hooks for complex functionality:

```typescript
function useProfileManagement() {
  const profiles = useProfiles()
  const navigation = useEnhancedNavigation()
  
  const navigateToProfile = (profileId: string) => {
    navigation.navigateToPath(`/profiles/${profileId}`)
  }
  
  return {
    ...profiles,
    navigateToProfile,
  }
}
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
function ProfilesPage() {
  const { profiles, error, createProfile } = useProfiles()
  
  const handleCreate = async (data: any) => {
    try {
      const profile = await createProfile(data)
      if (!profile) {
        throw new Error('Failed to create profile')
      }
      // Success handling
    } catch (err) {
      // Error handling
      console.error('Create profile error:', err)
    }
  }
}
```

### 3. Performance Optimization

Use caching and pagination:

```typescript
const { profiles } = useProfiles({
  cacheTTL: 10 * 60 * 1000, // 10 minutes
  pagination: { page: 1, limit: 25 },
  immediate: false, // Don't auto-fetch
})
```

### 4. Type Safety

Always use TypeScript interfaces:

```typescript
interface CustomProfileData {
  first_name: string
  last_name: string
  email: string
  custom_fields?: Record<string, any>
}

const { createProfile } = useProfiles()
const newProfile = await createProfile(data as CustomProfileData)
```

---

## Migration Guide

### From Manual State Management

**Before:**
```typescript
function OldProfilesPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(setProfiles)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
  
  // More manual state management...
}
```

**After:**
```typescript
function NewProfilesPage() {
  const { profiles, loading, error } = useProfiles()
  
  // That's it! All the complex state management is handled
}
```

### From Custom Layout Components

**Before:**
```typescript
function OldPage() {
  const [loading, setLoading] = useState(true)
  
  if (loading) return <LoadingSpinner />
  
  return (
    <div>
      <header>
        <h1>My Page</h1>
        <button>Action</button>
      </header>
      <main>{/* content */}</main>
    </div>
  )
}
```

**After:**
```typescript
function NewPage() {
  const [loading, setLoading] = useState(true)
  
  return (
    <EnhancedPageLayout
      title="My Page"
      loading={{ loading }}
      actions={[{ label: "Action" }]}
    >
      {/* content */}
    </EnhancedPageLayout>
  )
}
```

---

## Conclusion

These custom hooks and components provide a solid foundation for building consistent, maintainable, and performant React applications. They eliminate code duplication, provide standardized patterns, and offer comprehensive functionality out of the box.

For questions or contributions, please refer to the project documentation or create an issue in the repository.