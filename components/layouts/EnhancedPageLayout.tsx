"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo } from "react"
import { ArrowLeft, RefreshCw, AlertCircle, Loader2, ChevronRight, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePageHeader } from "../PageHeaderContext"
import { useEnhancedNavigation } from "@/hooks/useEnhancedNavigation"

// Types
export interface ActionButton {
  label?: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  disabled?: boolean
  loading?: boolean
}

export interface LoadingState {
  /** Whether the page is in a loading state */
  loading?: boolean
  /** Custom loading message */
  message?: string
  /** Whether to show skeleton loaders instead of spinner */
  showSkeleton?: boolean
  /** Number of skeleton items for lists */
  skeletonCount?: number
}

export interface ErrorState {
  /** Error message to display */
  error?: string | Error | null
  /** Whether the error is recoverable */
  recoverable?: boolean
  /** Custom retry function */
  onRetry?: () => void
  /** Custom error title */
  errorTitle?: string
  /** Additional error details */
  errorDetails?: string
}

export interface EmptyState {
  /** Whether to show empty state */
  isEmpty?: boolean
  /** Empty state title */
  emptyTitle?: string
  /** Empty state description */
  emptyDescription?: string
  /** Empty state icon */
  emptyIcon?: ReactNode
  /** Empty state actions */
  emptyActions?: ActionButton[]
}

export interface BreadcrumbConfig {
  /** Whether to show breadcrumbs */
  showBreadcrumbs?: boolean
  /** Custom breadcrumb items (overrides auto-generated) */
  customBreadcrumbs?: Array<{ label: string; path?: string }>
  /** Maximum breadcrumb items to show */
  maxBreadcrumbs?: number
}

export interface EnhancedPageLayoutProps {
  // Basic layout props
  title: string
  description?: string
  children: ReactNode
  actions?: ActionButton[]
  
  // Navigation props
  showBackButton?: boolean
  backHref?: string
  onBack?: () => void
  
  // Layout configuration
  contentClassName?: string
  fullWidth?: boolean
  withSidebar?: boolean
  sidebar?: ReactNode
  
  // Enhanced features
  loading?: LoadingState
  error?: ErrorState
  empty?: EmptyState
  breadcrumbs?: BreadcrumbConfig
  
  // Page metadata
  subtitle?: string
  badge?: { text: string; variant?: "default" | "secondary" | "destructive" | "outline" }
  
  // Analytics
  pageId?: string
  trackPageView?: boolean
}

/**
 * Enhanced PageLayout component with comprehensive loading, error, and empty states
 * 
 * Features:
 * - Intelligent loading states with skeleton UI
 * - Comprehensive error handling with retry functionality
 * - Empty state management
 * - Dynamic breadcrumb generation
 * - Page analytics and navigation tracking
 * - Responsive design with sidebar support
 * - Accessibility features built-in
 */
export default function EnhancedPageLayout({
  // Basic props
  title,
  description,
  children,
  actions = [],
  
  // Navigation
  showBackButton = false,
  backHref,
  onBack,
  
  // Layout
  contentClassName = "",
  fullWidth = false,
  withSidebar = false,
  sidebar,
  
  // Enhanced features
  loading = {},
  error = {},
  empty = {},
  breadcrumbs = {},
  
  // Metadata
  subtitle,
  badge,
  
  // Analytics
  pageId,
  trackPageView = true,
}: EnhancedPageLayoutProps) {
  const router = useRouter()
  const { setPageHeader } = usePageHeader()
  const { dynamicBreadcrumbs, goBack, canGoBack } = useEnhancedNavigation()

  // Parse states
  const isLoading = loading.loading || false
  const hasError = !!(error.error)
  const isRetryable = error.recoverable !== false && !!error.onRetry
  const showEmpty = empty.isEmpty && !isLoading && !hasError
  
  // Generate breadcrumbs
  const breadcrumbItems = useMemo(() => {
    if (!breadcrumbs.showBreadcrumbs) return []
    
    if (breadcrumbs.customBreadcrumbs) {
      return breadcrumbs.customBreadcrumbs
    }
    
    // Use dynamic breadcrumbs from navigation hook
    const maxItems = breadcrumbs.maxBreadcrumbs || 5
    return dynamicBreadcrumbs.slice(-maxItems).map(crumb => ({
      label: crumb.label,
      path: crumb.path,
    }))
  }, [breadcrumbs, dynamicBreadcrumbs])

  // Set page header
  useEffect(() => {
    setPageHeader({
      title,
      description,
      actions: actions.filter(action => !action.loading && !action.disabled),
      showBackButton,
      backHref,
    })

    return () => {
      setPageHeader(null)
    }
  }, [title, description, actions, showBackButton, backHref, setPageHeader])

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else if (canGoBack) {
      goBack()
    } else {
      router.back()
    }
  }

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    if (!breadcrumbs.showBreadcrumbs || breadcrumbItems.length === 0) {
      return null
    }

    return (
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
              {item.path && index < breadcrumbItems.length - 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => router.push(item.path!)}
                >
                  {index === 0 ? <Home className="h-4 w-4" /> : item.label}
                </Button>
              ) : (
                <span className={index === breadcrumbItems.length - 1 ? "text-foreground font-medium" : ""}>
                  {index === 0 && !item.path ? <Home className="h-4 w-4" /> : item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )
  }

  // Render page header
  const renderPageHeader = () => (
    <div className="mb-6">
      {renderBreadcrumbs()}
      
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">{title}</h1>
              {badge && (
                <Badge variant={badge.variant || "secondary"}>
                  {badge.text}
                </Badge>
              )}
            </div>
            
            {subtitle && (
              <p className="text-lg text-muted-foreground mt-1">{subtitle}</p>
            )}
            
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        </div>
        
        {actions.length > 0 && (
          <div className="flex items-center space-x-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={action.className}
              >
                {action.loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  action.icon
                )}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      <Separator className="mt-6" />
    </div>
  )

  // Render loading state
  const renderLoadingState = () => {
    if (loading.showSkeleton) {
      const count = loading.skeletonCount || 3
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, index) => (
            <Card key={index}>
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
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">
          {loading.message || "Loading..."}
        </p>
      </div>
    )
  }

  // Render error state
  const renderErrorState = () => {
    const errorMessage = error.error instanceof Error ? error.error.message : (error.error || "An error occurred")
    
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">
              {error.errorTitle || "Something went wrong"}
            </h3>
            <p className="text-muted-foreground mt-2">
              {errorMessage}
            </p>
            {error.errorDetails && (
              <p className="text-sm text-muted-foreground mt-1">
                {error.errorDetails}
              </p>
            )}
          </div>
        </div>
        
        {isRetryable && (
          <Button onClick={error.onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            If this problem persists, please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="text-center space-y-4">
        {empty.emptyIcon || <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
          <div className="h-6 w-6 bg-muted-foreground/20 rounded" />
        </div>}
        
        <div>
          <h3 className="text-lg font-semibold">
            {empty.emptyTitle || "No data available"}
          </h3>
          <p className="text-muted-foreground mt-2">
            {empty.emptyDescription || "There's nothing to show here yet."}
          </p>
        </div>
      </div>
      
      {empty.emptyActions && empty.emptyActions.length > 0 && (
        <div className="flex items-center space-x-2">
          {empty.emptyActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )

  // Render main content
  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState()
    }
    
    if (hasError) {
      return renderErrorState()
    }
    
    if (showEmpty) {
      return renderEmptyState()
    }
    
    return children
  }

  // Main render
  return (
    <div className="w-full bg-background min-h-screen">
      <div className={fullWidth ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        {renderPageHeader()}
        
        {withSidebar ? (
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="w-full xl:w-2/3">
              <div className={contentClassName}>
                {renderContent()}
              </div>
            </div>
            <div className="hidden xl:block xl:w-1/3">
              <div className="sticky top-6">
                {sidebar}
              </div>
            </div>
          </div>
        ) : (
          <div className={contentClassName}>
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  )
}