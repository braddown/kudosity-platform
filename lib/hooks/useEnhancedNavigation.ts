/**
 * useEnhancedNavigation Hook
 * 
 * Enhanced navigation hook that extends the existing useNavigation with:
 * - Route history tracking with back/forward navigation
 * - Dynamic breadcrumb generation for parameterized routes
 * - Frequently visited routes tracking
 * - Enhanced navigation analytics
 * - Route metadata management
 * - Session-based navigation state persistence
 * 
 * Built on top of the existing useNavigation hook.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useNavigation } from '@/lib/navigation/useNavigation'
import { logger } from "@/lib/utils/logger"

// Local interface definition since it's not exported from useNavigation
interface BaseNavigationOptions {
  permissions?: string[]
  autoExpand?: boolean
  multiExpand?: boolean
  initialExpanded?: string[]
}

// Types for enhanced navigation
export interface RouteHistoryEntry {
  path: string
  title: string
  timestamp: Date
  params?: Record<string, string>
  searchParams?: Record<string, string>
  metadata?: Record<string, any>
}

export interface DynamicBreadcrumb {
  label: string
  path: string
  isParam?: boolean
  paramName?: string
  paramValue?: string
  icon?: string
}

export interface NavigationAnalytics {
  totalVisits: number
  uniqueRoutes: Set<string>
  sessionStartTime: Date
  mostVisitedRoutes: Array<{ path: string; count: number; title: string }>
  averageTimePerRoute: number
  routeTransitions: Array<{ from: string; to: string; count: number }>
}

export interface UseEnhancedNavigationOptions extends BaseNavigationOptions {
  /** Maximum number of history entries to keep */
  maxHistorySize?: number
  /** Enable route analytics tracking */
  enableAnalytics?: boolean
  /** Enable session persistence */
  enablePersistence?: boolean
  /** Custom route title resolver */
  routeTitleResolver?: (path: string, params?: Record<string, string>) => string
  /** Custom breadcrumb resolver for dynamic routes */
  breadcrumbResolver?: (path: string, params?: Record<string, string>) => DynamicBreadcrumb[]
}

export interface UseEnhancedNavigationReturn {
  // Original navigation hook properties
  navigation: any[]
  allNavigation: any[]
  flatNavigation: any[]
  expandedItems: string[]
  selectedItem: string | null
  activeItem: any
  activeParent: any
  breadcrumbs: any[]
  
  // Original navigation actions
  toggleExpanded: (itemId: string) => void
  setExpanded: (itemIds: string[]) => void
  selectItem: (itemId: string, parentId?: string) => void
  navigateToItem: (itemId: string, parentId?: string) => void
  navigateToPath: (path: string) => void
  isExpanded: (itemId: string) => boolean
  isSelected: (itemId: string) => boolean
  isActive: (path: string) => boolean
  
  // Enhanced navigation features
  // History management
  history: RouteHistoryEntry[]
  currentHistoryIndex: number
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
  clearHistory: () => void
  
  // Dynamic breadcrumbs
  dynamicBreadcrumbs: DynamicBreadcrumb[]
  generateBreadcrumbs: (path: string, params?: Record<string, string>) => DynamicBreadcrumb[]
  
  // Analytics
  analytics: NavigationAnalytics
  getMostVisitedRoutes: (limit?: number) => Array<{ path: string; count: number; title: string }>
  getRouteVisitCount: (path: string) => number
  
  // Recent navigation
  recentRoutes: RouteHistoryEntry[]
  frequentRoutes: Array<{ path: string; count: number; title: string; lastVisited: Date }>
  
  // Utility functions
  addToHistory: (path: string, title?: string, metadata?: Record<string, any>) => void
  getRouteTitle: (path: string, params?: Record<string, string>) => string
  isCurrentRoute: (path: string) => boolean
  
  // Session management
  saveSession: () => void
  loadSession: () => void
  clearSession: () => void
}

// Default route title resolver
const defaultRouteTitleResolver = (path: string, params?: Record<string, string>): string => {
  // Extract route segments
  const segments = path.split('/').filter(Boolean)
  
  // Handle common patterns
  if (segments.length === 0) return 'Home'
  
  // Check for ID patterns
  const lastSegment = segments[segments.length - 1]
  if (params && Object.values(params).includes(lastSegment)) {
    // This is likely a dynamic route
    const paramName = Object.keys(params).find(key => params[key] === lastSegment)
    if (paramName === 'id') {
      return `${capitalize(segments[segments.length - 2] || 'Item')} Details`
    }
    return `${capitalize(paramName || 'Item')}: ${lastSegment}`
  }
  
  // Convert path to title
  return segments
    .map(segment => capitalize(segment.replace(/-/g, ' ')))
    .join(' > ')
}

// Default breadcrumb resolver
const defaultBreadcrumbResolver = (path: string, params?: Record<string, string>): DynamicBreadcrumb[] => {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs: DynamicBreadcrumb[] = []
  
  // Add home
  breadcrumbs.push({
    label: 'Home',
    path: '/',
  })
  
  // Build breadcrumbs for each segment
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Check if this segment is a parameter
    const isParam = params && Object.values(params).includes(segment)
    const paramName = isParam ? Object.keys(params!).find(key => params![key] === segment) : undefined
    
    breadcrumbs.push({
      label: isParam ? `${capitalize(paramName || 'Item')}: ${segment}` : capitalize(segment.replace(/-/g, ' ')),
      path: currentPath,
      isParam,
      paramName,
      paramValue: isParam ? segment : undefined,
    })
  })
  
  return breadcrumbs
}

// Utility function
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Session storage keys
const STORAGE_KEYS = {
  HISTORY: 'enhanced-nav-history',
  ANALYTICS: 'enhanced-nav-analytics',
  FREQUENT_ROUTES: 'enhanced-nav-frequent',
} as const

/**
 * Enhanced navigation hook with history tracking and analytics
 */
export function useEnhancedNavigation(options: UseEnhancedNavigationOptions = {}): UseEnhancedNavigationReturn {
  const {
    maxHistorySize = 50,
    enableAnalytics = true,
    enablePersistence = true,
    routeTitleResolver = defaultRouteTitleResolver,
    breadcrumbResolver = defaultBreadcrumbResolver,
    ...navigationOptions
  } = options

  // Use the base navigation hook
  const baseNavigation = useNavigation(navigationOptions)
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Enhanced state
  const [history, setHistory] = useState<RouteHistoryEntry[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [routeVisitCounts, setRouteVisitCounts] = useState<Map<string, number>>(new Map())
  const [routeTransitions, setRouteTransitions] = useState<Map<string, number>>(new Map())
  const [sessionStartTime] = useState(new Date())
  const [routeTimestamps, setRouteTimestamps] = useState<Map<string, Date>>(new Map())

  /**
   * Extract route parameters from pathname
   */
  const extractRouteParams = useCallback((path: string): Record<string, string> => {
    const params: Record<string, string> = {}
    
    // Simple parameter extraction for common patterns
    // This could be enhanced with more sophisticated routing logic
    const segments = path.split('/').filter(Boolean)
    
    segments.forEach((segment, index) => {
      // Common ID patterns
      if (/^[0-9a-fA-F-]{8,}$/.test(segment) || /^\d+$/.test(segment)) {
        // Looks like an ID
        const prevSegment = segments[index - 1]
        if (prevSegment) {
          params[`${prevSegment}Id`] = segment
        } else {
          params['id'] = segment
        }
      }
    })
    
    return params
  }, [])

  /**
   * Get route title
   */
  const getRouteTitle = useCallback((path: string, params?: Record<string, string>): string => {
    return routeTitleResolver(path, params || extractRouteParams(path))
  }, [routeTitleResolver, extractRouteParams])

  /**
   * Generate dynamic breadcrumbs
   */
  const generateBreadcrumbs = useCallback((path: string, params?: Record<string, string>): DynamicBreadcrumb[] => {
    return breadcrumbResolver(path, params || extractRouteParams(path))
  }, [breadcrumbResolver, extractRouteParams])

  /**
   * Add entry to history
   */
  const addToHistory = useCallback((path: string, title?: string, metadata?: Record<string, any>) => {
    const params = extractRouteParams(path)
    const searchParamsObj = Object.fromEntries(searchParams.entries())
    
    const entry: RouteHistoryEntry = {
      path,
      title: title || getRouteTitle(path, params),
      timestamp: new Date(),
      params,
      searchParams: searchParamsObj,
      metadata,
    }

    setHistory(prevHistory => {
      // Remove any entries after current index (for forward navigation)
      const newHistory = prevHistory.slice(0, currentHistoryIndex + 1)
      
      // Add new entry
      newHistory.push(entry)
      
      // Keep within size limit
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        setCurrentHistoryIndex(prev => Math.max(0, prev - 1))
      }
      
      return newHistory
    })

    setCurrentHistoryIndex(prevIndex => 
      Math.min(prevIndex + 1, maxHistorySize - 1)
    )

    // Update analytics
    if (enableAnalytics) {
      setRouteVisitCounts(prev => new Map(prev).set(path, (prev.get(path) || 0) + 1))
      setRouteTimestamps(prev => new Map(prev).set(path, new Date()))
    }
  }, [currentHistoryIndex, maxHistorySize, enableAnalytics, extractRouteParams, getRouteTitle, searchParams])

  /**
   * Navigation history functions
   */
  const canGoBack = currentHistoryIndex > 0
  const canGoForward = currentHistoryIndex < history.length - 1

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = currentHistoryIndex - 1
      const entry = history[newIndex]
      setCurrentHistoryIndex(newIndex)
      router.push(entry.path)
    }
  }, [canGoBack, currentHistoryIndex, history, router])

  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = currentHistoryIndex + 1
      const entry = history[newIndex]
      setCurrentHistoryIndex(newIndex)
      router.push(entry.path)
    }
  }, [canGoForward, currentHistoryIndex, history, router])

  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentHistoryIndex(-1)
  }, [])

  /**
   * Dynamic breadcrumbs for current route
   */
  const dynamicBreadcrumbs = useMemo(() => {
    return generateBreadcrumbs(pathname)
  }, [pathname, generateBreadcrumbs])

  /**
   * Analytics computations
   */
  const analytics = useMemo((): NavigationAnalytics => {
    const mostVisitedRoutes = Array.from(routeVisitCounts.entries())
      .map(([path, count]) => ({
        path,
        count,
        title: getRouteTitle(path),
      }))
      .sort((a, b) => b.count - a.count)

    const totalVisits = Array.from(routeVisitCounts.values()).reduce((sum, count) => sum + count, 0)
    const uniqueRoutes = new Set(routeVisitCounts.keys())
    
    // Calculate average time per route (simplified)
    const now = new Date()
    const sessionDuration = now.getTime() - sessionStartTime.getTime()
    const averageTimePerRoute = totalVisits > 0 ? sessionDuration / totalVisits : 0

    return {
      totalVisits,
      uniqueRoutes,
      sessionStartTime,
      mostVisitedRoutes,
      averageTimePerRoute,
      routeTransitions: [], // Could be enhanced with transition tracking
    }
  }, [routeVisitCounts, sessionStartTime, getRouteTitle])

  /**
   * Recent and frequent routes
   */
  const recentRoutes = useMemo(() => {
    return history.slice(-10).reverse()
  }, [history])

  const frequentRoutes = useMemo(() => {
    return Array.from(routeVisitCounts.entries())
      .map(([path, count]) => ({
        path,
        count,
        title: getRouteTitle(path),
        lastVisited: routeTimestamps.get(path) || new Date(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [routeVisitCounts, routeTimestamps, getRouteTitle])

  /**
   * Utility functions
   */
  const getMostVisitedRoutes = useCallback((limit = 10) => {
    return analytics.mostVisitedRoutes.slice(0, limit)
  }, [analytics.mostVisitedRoutes])

  const getRouteVisitCount = useCallback((path: string) => {
    return routeVisitCounts.get(path) || 0
  }, [routeVisitCounts])

  const isCurrentRoute = useCallback((path: string) => {
    return pathname === path
  }, [pathname])

  /**
   * Session persistence
   */
  const saveSession = useCallback(() => {
    if (!enablePersistence || typeof window === 'undefined') return

    try {
      sessionStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history))
      sessionStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify({
        visitCounts: Array.from(routeVisitCounts.entries()),
        timestamps: Array.from(routeTimestamps.entries()),
      }))
      sessionStorage.setItem(STORAGE_KEYS.FREQUENT_ROUTES, JSON.stringify(frequentRoutes))
    } catch (error) {
      logger.warn('Failed to save navigation session:', error)
    }
  }, [enablePersistence, history, routeVisitCounts, routeTimestamps, frequentRoutes])

  const loadSession = useCallback(() => {
    if (!enablePersistence || typeof window === 'undefined') return

    try {
      const savedHistory = sessionStorage.getItem(STORAGE_KEYS.HISTORY)
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }))
        setHistory(parsedHistory)
        setCurrentHistoryIndex(parsedHistory.length - 1)
      }

      const savedAnalytics = sessionStorage.getItem(STORAGE_KEYS.ANALYTICS)
      if (savedAnalytics) {
        const { visitCounts, timestamps } = JSON.parse(savedAnalytics)
        setRouteVisitCounts(new Map(visitCounts))
        setRouteTimestamps(new Map(timestamps.map(([path, timestamp]: [string, string]) => [path, new Date(timestamp)])))
      }
    } catch (error) {
      logger.warn('Failed to load navigation session:', error)
    }
  }, [enablePersistence])

  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        sessionStorage.removeItem(key)
      })
    } catch (error) {
      logger.warn('Failed to clear navigation session:', error)
    }
    
    clearHistory()
    setRouteVisitCounts(new Map())
    setRouteTimestamps(new Map())
  }, [clearHistory])

  // Track route changes
  useEffect(() => {
    const currentTitle = getRouteTitle(pathname)
    addToHistory(pathname, currentTitle)
  }, [pathname, addToHistory, getRouteTitle])

  // Auto-save session periodically
  useEffect(() => {
    if (!enablePersistence) return

    const interval = setInterval(saveSession, 30000) // Save every 30 seconds
    return () => clearInterval(interval)
  }, [enablePersistence, saveSession])

  // Load session on mount
  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Save session on unmount
  useEffect(() => {
    return () => {
      saveSession()
    }
  }, [saveSession])

  return {
    // Original navigation properties
    ...baseNavigation,
    
    // Enhanced navigation features
    history,
    currentHistoryIndex,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    clearHistory,
    
    // Dynamic breadcrumbs
    dynamicBreadcrumbs,
    generateBreadcrumbs,
    
    // Analytics
    analytics,
    getMostVisitedRoutes,
    getRouteVisitCount,
    
    // Recent navigation
    recentRoutes,
    frequentRoutes,
    
    // Utility functions
    addToHistory,
    getRouteTitle,
    isCurrentRoute,
    
    // Session management
    saveSession,
    loadSession,
    clearSession,
  }
}