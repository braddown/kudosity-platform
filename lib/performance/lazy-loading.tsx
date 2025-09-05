/**
 * Lazy Loading and Code Splitting Utilities
 * 
 * This module provides utilities for implementing lazy loading and code splitting
 * throughout the application to improve initial load performance.
 */

import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { performanceMonitor } from './web-vitals'
import { logger } from "@/lib/utils/logger"

// Loading component variants
interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'card' | 'page' | 'table'
  count?: number
  className?: string
  message?: string
}

/**
 * Flexible loading component for different contexts
 */
export const LoadingState: React.FC<LoadingProps> = ({ 
  variant = 'spinner', 
  count = 3, 
  className = '',
  message = 'Loading...'
}) => {
  switch (variant) {
    case 'skeleton':
      return (
        <div className={`space-y-4 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )
    
    case 'card':
      return (
        <div className={`space-y-4 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    
    case 'table':
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="border rounded-md">
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    
    case 'page':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    
    case 'spinner':
    default:
      return (
        <div className={`flex flex-col items-center justify-center py-12 space-y-4 ${className}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )
  }
}

/**
 * Enhanced lazy loading wrapper with performance monitoring
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ComponentType
    name?: string
    preload?: boolean
    errorBoundary?: boolean
  } = {}
): LazyExoticComponent<T> {
  const { fallback: Fallback = () => <LoadingState variant="spinner" />, name = 'LazyComponent', preload = false } = options

  // Create the lazy component
  const LazyComponent = lazy(async () => {
    const measurementId = performanceMonitor.startMeasurement(`lazy_load_${name}`, {
      component: name,
      preloaded: preload
    })

    try {
      const module = await importFn()
      performanceMonitor.endMeasurement(measurementId)
      return module
    } catch (error) {
      performanceMonitor.endMeasurement(measurementId)
      logger.error(`Failed to load lazy component: ${name}`, error)
      throw error
    }
  })

  // Add preload capability
  if (preload && typeof window !== 'undefined') {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFn().catch(error => {
        logger.error(`Failed to preload component: ${name}`, error)
      })
    }, 100)
  }

  return LazyComponent
}

/**
 * Enhanced Next.js dynamic import wrapper with performance monitoring
 */
export function createDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: () => React.ReactElement
    ssr?: boolean
    name?: string
    preload?: boolean
  } = {}
) {
  const { 
    loading: Loading = () => <LoadingState variant="spinner" />, 
    ssr = true, 
    name = 'DynamicComponent',
    preload = false 
  } = options

  return dynamic(
    async () => {
      const measurementId = performanceMonitor.startMeasurement(`dynamic_load_${name}`, {
        component: name,
        ssr,
        preloaded: preload
      })

      try {
        const module = await importFn()
        performanceMonitor.endMeasurement(measurementId)
        return module
      } catch (error) {
        performanceMonitor.endMeasurement(measurementId)
        logger.error(`Failed to load dynamic component: ${name}`, error)
        throw error
      }
    },
    {
      loading: Loading,
      ssr,
    }
  )
}

/**
 * Lazy wrapper component with Suspense boundary
 */
interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ComponentType<LoadingProps>
  fallbackProps?: LoadingProps
  errorBoundary?: boolean
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback: Fallback = LoadingState,
  fallbackProps = { variant: 'spinner' },
  errorBoundary = true
}) => {
  const content = (
    <Suspense fallback={<Fallback {...fallbackProps} />}>
      {children}
    </Suspense>
  )

  if (errorBoundary) {
    return (
      <ErrorBoundary>
        {content}
      </ErrorBoundary>
    )
  }

  return content
}

/**
 * Simple error boundary for lazy-loaded components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Lazy component error:', error, errorInfo)
    
    // Record error metric
    performanceMonitor.startMeasurement('component_error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-red-500">⚠️</div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Failed to load component. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Pre-configured lazy components for common use cases

// Large table components
export const LazyTableComponents = {
  ProfilesTable: createDynamicComponent(
    () => import('@/components/ProfilesTable').then(mod => ({ default: mod.ProfilesTable })),
    { name: 'ProfilesTable', loading: () => <LoadingState variant="table" count={5} /> }
  ),
  LogsTable: createDynamicComponent(
    () => import('@/components/Logs').then(mod => ({ default: mod.default })),
    { name: 'LogsTable', loading: () => <LoadingState variant="table" count={10} /> }
  )
}

// Large form components
export const LazyFormComponents = {
  ProfileForm: createDynamicComponent(
    () => import('@/components/features/profiles/ContactPropertiesForm').then(mod => ({ default: mod.ContactPropertiesForm })),
    { name: 'ProfileForm', loading: () => <LoadingState variant="skeleton" count={5} /> }
  ),
  CustomFieldsForm: createDynamicComponent(
    () => import('@/components/features/profiles/CustomFieldsSection').then(mod => ({ default: mod.CustomFieldsSection })),
    { name: 'CustomFieldsForm', loading: () => <LoadingState variant="skeleton" count={3} /> }
  )
}

// Page-level components
export const LazyPageComponents = {
  ProfilePage: createDynamicComponent(
    () => import('@/components/features/profiles/ProfilePage'),
    { name: 'ProfilePage', loading: () => <LoadingState variant="page" count={3} /> }
  )
}

// Utility functions for preloading
export const preloadComponent = (componentImport: () => Promise<any>, name?: string) => {
  if (typeof window !== 'undefined') {
    const measurementId = performanceMonitor.startMeasurement(`preload_${name || 'component'}`)
    
    componentImport()
      .then(() => {
        performanceMonitor.endMeasurement(measurementId)
        logger.debug(`✅ Preloaded component: ${name || 'component'}`)
      })
      .catch(error => {
        performanceMonitor.endMeasurement(measurementId)
        logger.error(`❌ Failed to preload component: ${name || 'component'}`, error)
      })
  }
}

// Route-based preloading
export const preloadRouteComponents = (routes: string[]) => {
  if (typeof window !== 'undefined') {
    routes.forEach(route => {
      switch (route) {
        case '/profiles':
          preloadComponent(() => import('@/components/features/profiles/ProfilePage'), 'ProfilesPage')
          break
        case '/logs':
          preloadComponent(() => import('@/components/Logs'), 'LogsPage')
          break
        case '/campaigns':
          preloadComponent(() => import('@/components/features/campaigns'), 'CampaignsPage')
          break
        default:
          logger.debug(`No preload configured for route: ${route}`)
      }
    })
  }
}