"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  FileX, 
  Search,
  Database,
  Wifi,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AsyncError } from '@/hooks/use-async-data'

// =============================================================================
// LOADING STATES
// =============================================================================

export interface LoadingStateProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'skeleton' | 'dots' | 'progress'
  fullScreen?: boolean
  showIcon?: boolean
}

/**
 * Standardized loading component with multiple variants
 */
export function LoadingState({
  message = "Loading...",
  className,
  size = 'md',
  variant = 'spinner',
  fullScreen = false,
  showIcon = true,
}: LoadingStateProps) {
  const containerClass = cn(
    "flex flex-col items-center justify-center space-y-4",
    fullScreen ? "min-h-screen" : "min-h-[200px] p-6",
    className
  )

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'

  const renderIcon = () => {
    if (!showIcon) return null

    switch (variant) {
      case 'spinner':
        return <Loader2 className={cn(iconSize, "animate-spin text-primary")} />
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-pulse",
                  size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
                )}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )
      default:
        return <Loader2 className={cn(iconSize, "animate-spin text-primary")} />
    }
  }

  if (variant === 'skeleton') {
    return (
      <div className={containerClass}>
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        {message && (
          <p className={cn("text-muted-foreground text-center", textSize)}>
            {message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={containerClass}>
      {renderIcon()}
      {message && (
        <p className={cn("text-muted-foreground text-center", textSize)}>
          {message}
        </p>
      )}
    </div>
  )
}

/**
 * Loading skeleton for table-like layouts
 */
export function TableLoadingSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4",
                colIndex === 0 ? "w-24" : "flex-1"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Loading skeleton for card layouts
 */
export function CardLoadingSkeleton({ 
  count = 3,
  className 
}: { 
  count?: number
  className?: string 
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =============================================================================
// ERROR STATES
// =============================================================================

export interface ErrorStateProps {
  error: AsyncError | Error | string
  onRetry?: () => void
  onReset?: () => void
  className?: string
  variant?: 'default' | 'card' | 'inline' | 'minimal'
  showDetails?: boolean
  retryText?: string
  resetText?: string
}

/**
 * Standardized error display component
 */
export function ErrorState({
  error,
  onRetry,
  onReset,
  className,
  variant = 'default',
  showDetails = false,
  retryText = "Try Again",
  resetText = "Reset"
}: ErrorStateProps) {
  // Normalize error to AsyncError format
  const normalizedError: AsyncError = React.useMemo(() => {
    if (typeof error === 'string') {
      return { message: error }
    }
    if (error instanceof Error) {
      return { message: error.message }
    }
    return error as AsyncError
  }, [error])

  const getErrorIcon = () => {
    const code = normalizedError.code
    if (typeof code === 'number') {
      if (code >= 500) return <Database className="h-6 w-6 text-destructive" />
      if (code === 404) return <FileX className="h-6 w-6 text-destructive" />
      if (code >= 400) return <XCircle className="h-6 w-6 text-destructive" />
    }
    if (normalizedError.message.toLowerCase().includes('network')) {
      return <Wifi className="h-6 w-6 text-destructive" />
    }
    return <AlertCircle className="h-6 w-6 text-destructive" />
  }

  const getErrorTitle = () => {
    const code = normalizedError.code
    if (typeof code === 'number') {
      if (code >= 500) return "Server Error"
      if (code === 404) return "Not Found"
      if (code >= 400) return "Request Error"
    }
    if (normalizedError.message.toLowerCase().includes('network')) {
      return "Connection Error"
    }
    return "Something went wrong"
  }

  if (variant === 'inline') {
    return (
      <Alert className={cn("border-destructive/50", className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{normalizedError.message}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              {retryText}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center space-x-2 text-destructive", className)}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{normalizedError.message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  const content = (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        {getErrorIcon()}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{getErrorTitle()}</h3>
        <p className="text-muted-foreground">{normalizedError.message}</p>
        {showDetails && normalizedError.details && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Technical Details
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(normalizedError.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
      {(onRetry || onReset) && (
        <div className="flex justify-center space-x-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryText}
            </Button>
          )}
          {onReset && (
            <Button onClick={onReset} variant="outline">
              {resetText}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className={cn("max-w-md mx-auto", className)}>
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[200px] p-6", className)}>
      <div className="max-w-md">
        {content}
      </div>
    </div>
  )
}

// =============================================================================
// EMPTY STATES
// =============================================================================

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline'
  }
  className?: string
  variant?: 'default' | 'card' | 'minimal'
}

/**
 * Standardized empty state component
 */
export function EmptyState({
  title = "No data found",
  description = "There's nothing to show here yet.",
  icon,
  action,
  className,
  variant = 'default'
}: EmptyStateProps) {
  const defaultIcon = <FileX className="h-12 w-12 text-muted-foreground/50" />

  const content = (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        {icon || defaultIcon}
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          {description}
        </p>
      </div>
      {action && (
        <Button 
          onClick={action.onClick} 
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  )

  if (variant === 'minimal') {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 space-y-2", className)}>
        <div className="text-muted-foreground/50">
          {icon || <FileX className="h-8 w-8" />}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        {action && (
          <Button size="sm" onClick={action.onClick} variant={action.variant || 'outline'}>
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn("max-w-md mx-auto", className)}>
        <CardContent className="p-8">
          {content}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[300px] p-6", className)}>
      <div className="max-w-md">
        {content}
      </div>
    </div>
  )
}

/**
 * Empty state specifically for search results
 */
export function SearchEmptyState({
  searchTerm,
  onClear,
  className
}: {
  searchTerm: string
  onClear?: () => void
  className?: string
}) {
  return (
    <EmptyState
      title="No search results"
      description={`No results found for "${searchTerm}". Try adjusting your search terms.`}
      icon={<Search className="h-12 w-12 text-muted-foreground/50" />}
      action={onClear ? {
        label: "Clear search",
        onClick: onClear,
        variant: 'outline'
      } : undefined}
      className={className}
    />
  )
}

// =============================================================================
// COMBINED ASYNC STATE WRAPPER
// =============================================================================

export interface AsyncStateWrapperProps {
  loading: boolean
  error: AsyncError | Error | string | null
  data: any
  isEmpty?: boolean
  onRetry?: () => void
  onReset?: () => void
  loadingProps?: Partial<LoadingStateProps>
  errorProps?: Partial<ErrorStateProps>
  emptyProps?: Partial<EmptyStateProps>
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper component that handles loading, error, and empty states automatically
 */
export function AsyncStateWrapper({
  loading,
  error,
  data,
  isEmpty = false,
  onRetry,
  onReset,
  loadingProps,
  errorProps,
  emptyProps,
  children,
  className
}: AsyncStateWrapperProps) {
  if (loading) {
    return (
      <LoadingState 
        message="Loading..."
        {...loadingProps}
        className={cn(className, loadingProps?.className)}
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        onReset={onReset}
        {...errorProps}
        className={cn(className, errorProps?.className)}
      />
    )
  }

  if (isEmpty || (Array.isArray(data) && data.length === 0) || !data) {
    return (
      <EmptyState
        {...emptyProps}
        className={cn(className, emptyProps?.className)}
      />
    )
  }

  return <>{children}</>
}