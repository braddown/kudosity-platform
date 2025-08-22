"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// ============================================================================
// Core Loading Spinner Component
// ============================================================================

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12"
}

/**
 * Core loading spinner using Lucide's Loader2 icon
 * Provides consistent animation and dark mode support
 */
export function LoadingSpinner({ 
  size = "md", 
  className 
}: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size],
        className
      )} 
    />
  )
}

// ============================================================================
// Loading Components for Different Use Cases
// ============================================================================

interface LoadingProps {
  message?: string
  className?: string
}

/**
 * Full page loading state - used for route transitions and initial page loads
 * Centers content in viewport with optional message
 */
export function LoadingPage({ 
  message = "Loading...",
  className 
}: LoadingProps) {
  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  )
}

/**
 * Section loading state - used for loading content within a page section
 * Takes up available space in container with min height
 */
export function LoadingSection({ 
  message,
  className 
}: LoadingProps) {
  return (
    <div className={cn(
      "flex min-h-[400px] items-center justify-center p-8",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Card loading state - used for loading content within cards
 * Smaller height than section loading
 */
export function LoadingCard({ 
  message,
  className 
}: LoadingProps) {
  return (
    <div className={cn(
      "flex min-h-[200px] items-center justify-center p-6",
      className
    )}>
      <div className="flex flex-col items-center space-y-3">
        <LoadingSpinner size="md" />
        {message && (
          <p className="text-xs text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Inline loading state - used within buttons or inline with text
 * Shows spinner with optional text side by side
 */
export function LoadingInline({ 
  message,
  className 
}: LoadingProps) {
  return (
    <span className={cn(
      "inline-flex items-center space-x-2",
      className
    )}>
      <LoadingSpinner size="sm" />
      {message && (
        <span className="text-sm text-muted-foreground">
          {message}
        </span>
      )}
    </span>
  )
}

/**
 * Button loading state - replaces button content while loading
 * Maintains button dimensions
 */
export function LoadingButton({ 
  message = "Loading...",
  className 
}: LoadingProps) {
  return (
    <span className={cn(
      "inline-flex items-center",
      className
    )}>
      <LoadingSpinner size="sm" className="mr-2" />
      <span>{message}</span>
    </span>
  )
}

/**
 * Table loading state - shows skeleton rows for table data
 * Used when loading tabular data
 */
interface LoadingTableProps extends LoadingProps {
  rows?: number
  columns?: number
}

export function LoadingTable({ 
  rows = 5,
  columns = 4,
  className 
}: LoadingTableProps) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Table header skeleton */}
      <div className="flex space-x-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted animate-pulse rounded"
            style={{ width: `${100 / columns}%` }}
          />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-muted animate-pulse rounded"
              style={{ 
                width: `${100 / columns}%`,
                opacity: 1 - (rowIndex * 0.1) // Gradual fade effect
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Overlay loading state - shows loading spinner over existing content
 * Used for form submissions or action confirmations
 */
export function LoadingOverlay({ 
  message,
  className 
}: LoadingProps) {
  return (
    <div className={cn(
      "absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-card p-6 shadow-lg">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Export all components
// ============================================================================

export default {
  Spinner: LoadingSpinner,
  Page: LoadingPage,
  Section: LoadingSection,
  Card: LoadingCard,
  Inline: LoadingInline,
  Button: LoadingButton,
  Table: LoadingTable,
  Overlay: LoadingOverlay,
}