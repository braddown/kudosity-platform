/**
 * Performance Utilities Export Barrel
 * 
 * Central export point for all performance optimization utilities,
 * monitoring tools, and optimization hooks.
 */

// Core performance monitoring
export {
  performanceMonitor,
  startMeasurement,
  endMeasurement,
  measureAsync,
  usePerformanceMetrics,
  PERFORMANCE_THRESHOLDS,
  type PerformanceMetric,
  type MetricName,
  type MetricValue,
  type MetricRating,
  type CustomMetric
} from './web-vitals'

// Lazy loading and code splitting
export {
  LoadingState,
  createLazyComponent,
  createDynamicComponent,
  LazyWrapper,
  LazyFormComponents,
  LazyTableComponents,
  LazyPageComponents,
  preloadComponent,
  preloadRouteComponents
} from './lazy-loading'

// Virtualization for large lists
export {
  VirtualizedList,
  VirtualizedTable,
  VirtualizedProfilesTable,
  VirtualizedLogsTable,
  useVirtualizationSettings,
  createMemoizedRenderer,
  type VirtualizedListProps,
  type VirtualizedItemProps,
  type VirtualizedTableProps,
  type VirtualizedColumn
} from './virtualization'

// Performance-optimized hooks
export {
  useOptimizedProfiles,
  useOptimizedLogs,
  useOptimizedCampaigns,
  useHookPerformanceMonitor
} from './optimized-hooks'

// Performance utilities and helpers
export const PerformanceUtils = {
  /**
   * Debounce function calls for performance
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T => {
    let timeout: NodeJS.Timeout | null = null
    
    return ((...args: Parameters<T>) => {
      const later = () => {
        timeout = null
        if (!immediate) func(...args)
      }
      
      const callNow = immediate && !timeout
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func(...args)
    }) as T
  },

  /**
   * Throttle function calls for performance
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  },

  /**
   * Batch DOM updates for better performance
   */
  batchDOMUpdates: (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback)
    } else {
      setTimeout(callback, 0)
    }
  },

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  /**
   * Get memory usage information
   */
  getMemoryUsage: () => {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return null
    }
    
    const memory = (performance as any).memory
    if (!memory) return null
    
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    }
  },

  /**
   * Get network connection information
   */
  getConnectionInfo: () => {
    if (typeof window === 'undefined') return null
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (!connection) return null
    
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  },

  /**
   * Calculate Cumulative Layout Shift score
   */
  calculateCLS: (entries: PerformanceEntry[]) => {
    let clsValue = 0
    let sessionValue = 0
    let sessionEntries: PerformanceEntry[] = []
    
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0]
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1]
        
        if (sessionValue && entry.startTime - lastSessionEntry.startTime < 1000 && entry.startTime - firstSessionEntry.startTime < 5000) {
          sessionValue += entry.value
          sessionEntries.push(entry)
        } else {
          clsValue = Math.max(clsValue, sessionValue)
          sessionValue = entry.value
          sessionEntries = [entry]
        }
      }
    })
    
    return Math.max(clsValue, sessionValue)
  }
}

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  // Thresholds for recommendations
  VIRTUALIZATION_THRESHOLD: 100,
  LAZY_LOADING_THRESHOLD: 10,
  MEMORY_WARNING_THRESHOLD: 50, // MB
  
  // Bundle size recommendations
  CHUNK_SIZE_WARNING: 250 * 1024, // 250KB
  INITIAL_BUNDLE_SIZE_WARNING: 1 * 1024 * 1024, // 1MB
  
  // Network thresholds
  SLOW_CONNECTION_THRESHOLD: 1.5, // Mbps
  HIGH_RTT_THRESHOLD: 300, // ms
  
  // Animation performance
  TARGET_FPS: 60,
  FRAME_BUDGET: 16.67, // ms (1000/60)
} as const

// Export types for better TypeScript support
export type PerformanceConfig = {
  enableMonitoring: boolean
  enableVirtualization: boolean
  enableLazyLoading: boolean
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal'
  reportingEndpoint?: string
  sampleRate?: number
}

// Default performance configuration
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableMonitoring: process.env.NODE_ENV === 'production',
  enableVirtualization: true,
  enableLazyLoading: true,
  cacheStrategy: 'moderate',
  sampleRate: 0.1 // 10% sampling rate
}