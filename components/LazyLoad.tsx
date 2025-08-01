"use client"

import type React from "react"

import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from "react"
import { Loader2 } from "lucide-react"

interface LazyLoadProps {
  component: LazyExoticComponent<ComponentType<any>>
  fallback?: React.ReactNode
  props?: Record<string, any>
}

export default function LazyLoad({ component: Component, fallback, props = {} }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-48">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )
}

// Helper function to create lazy components
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(factory)
}
