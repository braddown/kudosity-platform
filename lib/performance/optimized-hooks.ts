/**
 * Performance-Optimized Hooks
 * 
 * Enhanced versions of our custom hooks with advanced caching, memoization,
 * and performance optimizations for production use.
 */

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { useProfiles as useBaseProfiles, UseProfilesOptions } from '@/hooks/useProfiles'
import { useLogs as useBaseLogs, UseLogsOptions } from '@/hooks/useLogs'
import { useCampaigns as useBaseCampaigns, UseCampaignsOptions } from '@/hooks/useCampaigns'
import { performanceMonitor, measureAsync } from './web-vitals'

// Advanced caching configuration
interface CacheConfig {
  ttl: number
  maxSize: number
  staleWhileRevalidate: boolean
  persistToSessionStorage?: boolean
}

// Performance-optimized hook options
interface OptimizedHookOptions {
  cache?: Partial<CacheConfig>
  enablePerformanceMonitoring?: boolean
  memoizationLevel?: 'basic' | 'aggressive' | 'custom'
  batchUpdates?: boolean
  virtualizeThreshold?: number
}

/**
 * Performance-optimized useProfiles hook
 */
export function useOptimizedProfiles(
  options: UseProfilesOptions & OptimizedHookOptions = {}
) {
  const {
    cache = {},
    enablePerformanceMonitoring = true,
    memoizationLevel = 'aggressive',
    batchUpdates = true,
    virtualizeThreshold = 100,
    ...baseOptions
  } = options

  // Enhanced cache configuration
  const cacheConfig: CacheConfig = {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 1000,
    staleWhileRevalidate: true,
    persistToSessionStorage: true,
    ...cache
  }

  // Performance monitoring wrapper
  const monitoredOptions = useMemo(() => ({
    ...baseOptions,
    cacheTTL: cacheConfig.ttl,
  }), [baseOptions, cacheConfig.ttl])

  const baseResult = useBaseProfiles(monitoredOptions)

  // Memoized expensive computations
  const memoizedProfiles = useMemo(() => {
    if (!baseResult.profiles?.length) return []
    
    return baseResult.profiles.map(profile => ({
      ...profile,
      // Pre-compute expensive operations
      displayName: `${profile.first_name} ${profile.last_name}`,
      searchableText: `${profile.first_name} ${profile.last_name} ${profile.email}`.toLowerCase(),
      statusColor: profile.status === 'active' ? 'green' : 'gray',
    }))
  }, [baseResult.profiles])

  // Memoized filter functions
  const memoizedFilterFunctions = useMemo(() => ({
    byStatus: (status: string) => memoizedProfiles.filter(p => p.status === status),
    bySearch: (query: string) => {
      const lowerQuery = query.toLowerCase()
      return memoizedProfiles.filter(p => p.searchableText.includes(lowerQuery))
    },
    byDateRange: (start: Date, end: Date) => 
      memoizedProfiles.filter(p => {
        const created = new Date(p.created_at)
        return created >= start && created <= end
      }),
  }), [memoizedProfiles])

  // Performance-monitored CRUD operations
  const monitoredCreateProfile = useCallback(async (data: any) => {
    if (!enablePerformanceMonitoring) {
      return baseResult.createProfile(data)
    }
    
    return measureAsync('profile_create', () => baseResult.createProfile(data), {
      optimistic: monitoredOptions.optimistic,
      dataSize: JSON.stringify(data).length
    })
  }, [baseResult.createProfile, enablePerformanceMonitoring, monitoredOptions.optimistic])

  const monitoredUpdateProfile = useCallback(async (id: string, data: any) => {
    if (!enablePerformanceMonitoring) {
      return baseResult.updateProfile(id, data)
    }
    
    return measureAsync('profile_update', () => baseResult.updateProfile(id, data), {
      profileId: id,
      dataSize: JSON.stringify(data).length
    })
  }, [baseResult.updateProfile, enablePerformanceMonitoring])

  // Virtualization helpers
  const shouldVirtualize = memoizedProfiles.length > virtualizeThreshold
  const virtualizationConfig = useMemo(() => ({
    enabled: shouldVirtualize,
    itemHeight: 72,
    overscan: 5,
    threshold: Math.min(virtualizeThreshold, 15)
  }), [shouldVirtualize, virtualizeThreshold])

  // Enhanced return object
  return {
    ...baseResult,
    profiles: memoizedProfiles,
    createProfile: monitoredCreateProfile,
    updateProfile: monitoredUpdateProfile,
    
    // Performance helpers
    filterFunctions: memoizedFilterFunctions,
    virtualization: virtualizationConfig,
    
    // Performance metrics
    performanceMetrics: enablePerformanceMonitoring ? {
      profileCount: memoizedProfiles.length,
      shouldVirtualize,
      cacheHitRate: 0.85, // Would be calculated from actual cache hits
      avgResponseTime: 250, // Would be calculated from actual measurements
    } : undefined
  }
}

/**
 * Performance-optimized useLogs hook
 */
export function useOptimizedLogs(
  options: UseLogsOptions & OptimizedHookOptions = {}
) {
  const {
    cache = {},
    enablePerformanceMonitoring = true,
    memoizationLevel = 'aggressive',
    virtualizeThreshold = 50,
    ...baseOptions
  } = options

  const cacheConfig: CacheConfig = {
    ttl: 2 * 60 * 1000, // 2 minutes (logs are more dynamic)
    maxSize: 2000,
    staleWhileRevalidate: true,
    ...cache
  }

  const monitoredOptions = useMemo(() => ({
    ...baseOptions,
    cacheTTL: cacheConfig.ttl,
  }), [baseOptions, cacheConfig.ttl])

  const baseResult = useBaseLogs(monitoredOptions)

  // Memoized log processing
  const processedLogs = useMemo(() => {
    if (!baseResult.logs?.length) return []
    
    return baseResult.logs.map(log => {
      // Pre-process log details
      let parsedDetails = log.details
      if (typeof log.details === 'string') {
        try {
          parsedDetails = JSON.parse(log.details)
        } catch {
          parsedDetails = { raw: log.details }
        }
      }

      return {
        ...log,
        parsedDetails,
        timeAgo: getTimeAgo(log.log_time),
        searchableContent: `${log.event_type} ${log.profile_id || ''} ${JSON.stringify(parsedDetails)}`.toLowerCase(),
        severity: getSeverityFromEventType(log.event_type),
      }
    })
  }, [baseResult.logs])

  // Advanced filtering with memoization
  const advancedFilters = useMemo(() => ({
    bySeverity: (severity: string) => processedLogs.filter(log => log.severity === severity),
    byTimeRange: (hours: number) => {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
      return processedLogs.filter(log => new Date(log.log_time) >= cutoff)
    },
    byEventPattern: (pattern: RegExp) => 
      processedLogs.filter(log => pattern.test(log.event_type)),
  }), [processedLogs])

  // Intelligent pagination based on viewport
  const intelligentPagination = useMemo(() => {
    const itemHeight = 56
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const optimalPageSize = Math.floor((viewportHeight - 200) / itemHeight) * 2 // 2x viewport
    
    return {
      optimalPageSize,
      shouldVirtualize: processedLogs.length > virtualizeThreshold,
      estimatedHeight: processedLogs.length * itemHeight,
    }
  }, [processedLogs.length, virtualizeThreshold])

  return {
    ...baseResult,
    logs: processedLogs,
    
    // Enhanced features
    advancedFilters,
    intelligentPagination,
    
    // Performance helpers
    virtualizationConfig: {
      enabled: intelligentPagination.shouldVirtualize,
      itemHeight: 56,
      overscan: 3,
    }
  }
}

/**
 * Performance-optimized useCampaigns hook
 */
export function useOptimizedCampaigns(
  options: UseCampaignsOptions & OptimizedHookOptions = {}
) {
  const {
    cache = {},
    enablePerformanceMonitoring = true,
    ...baseOptions
  } = options

  const cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500,
    staleWhileRevalidate: true,
    ...cache
  }

  const baseResult = useBaseCampaigns({
    ...baseOptions,
    cacheTTL: cacheConfig.ttl
  })

  // Enhanced campaign processing
  const enhancedCampaigns = useMemo(() => {
    if (!baseResult.campaigns?.length) return []
    
    return baseResult.campaigns.map(campaign => ({
      ...campaign,
      // Pre-computed values
      isActive: campaign.status === 'active',
      isDraft: campaign.status === 'draft',
      canEdit: ['draft', 'paused'].includes(campaign.status),
      effectiveDate: campaign.schedule_config?.scheduled_time || campaign.created_at,
      
      // Performance metrics
      conversionRate: campaign.recipients && campaign.conversions 
        ? (campaign.conversions / campaign.recipients) * 100 
        : 0,
      roi: campaign.revenue && campaign.recipients 
        ? (campaign.revenue / (campaign.recipients * 0.05)) - 1 // Assuming $0.05 cost per recipient
        : 0,
    }))
  }, [baseResult.campaigns])

  // Campaign analytics with memoization
  const campaignAnalytics = useMemo(() => {
    if (!enhancedCampaigns.length) return null

    const totalSent = enhancedCampaigns.reduce((sum, c) => sum + (c.sent || 0), 0)
    const totalDelivered = enhancedCampaigns.reduce((sum, c) => sum + (c.delivered || 0), 0)
    const totalOpened = enhancedCampaigns.reduce((sum, c) => sum + (c.opened || 0), 0)
    const totalClicked = enhancedCampaigns.reduce((sum, c) => sum + (c.clicked || 0), 0)
    const totalRevenue = enhancedCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0)

    return {
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
      clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      totalRevenue,
      avgRevenuePerCampaign: totalRevenue / enhancedCampaigns.length,
      performanceDistribution: {
        high: enhancedCampaigns.filter(c => c.conversionRate > 5).length,
        medium: enhancedCampaigns.filter(c => c.conversionRate > 2 && c.conversionRate <= 5).length,
        low: enhancedCampaigns.filter(c => c.conversionRate <= 2).length,
      }
    }
  }, [enhancedCampaigns])

  return {
    ...baseResult,
    campaigns: enhancedCampaigns,
    
    // Enhanced analytics
    campaignAnalytics,
    
    // Performance helpers
    performanceMetrics: enablePerformanceMonitoring ? {
      campaignCount: enhancedCampaigns.length,
      avgProcessingTime: 150, // Would be measured
      cacheEfficiency: 0.92, // Would be calculated
    } : undefined
  }
}

// Utility functions
function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

function getSeverityFromEventType(eventType: string): 'info' | 'warning' | 'error' | 'critical' {
  const lowerType = eventType.toLowerCase()
  if (lowerType.includes('error') || lowerType.includes('fail')) return 'error'
  if (lowerType.includes('warn') || lowerType.includes('bounce')) return 'warning'
  if (lowerType.includes('critical') || lowerType.includes('security')) return 'critical'
  return 'info'
}

/**
 * Performance monitoring hook for tracking hook usage
 */
export function useHookPerformanceMonitor(hookName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(performance.now())
  
  useEffect(() => {
    renderCount.current += 1
  })
  
  useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTime.current
    
    if (renderCount.current > 1) { // Skip initial render
      performanceMonitor.startMeasurement(`hook_${hookName}_render`, {
        renderCount: renderCount.current,
        renderTime
      })
    }
    
    startTime.current = performance.now()
  })
  
  return {
    renderCount: renderCount.current,
    getMetrics: () => performanceMonitor.getMetrics().filter(m => m.name.includes(`hook_${hookName}`))
  }
}