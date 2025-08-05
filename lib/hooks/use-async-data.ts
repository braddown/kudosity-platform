"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Standard error interface for async operations
 */
export interface AsyncError {
  message: string
  code?: string | number
  details?: any
}

/**
 * States for async data operations
 */
export type AsyncDataState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Configuration options for useAsyncData hook
 */
export interface UseAsyncDataOptions<T> {
  /** Initial data value */
  initialData?: T
  /** Auto-fetch on mount */
  immediate?: boolean
  /** Retry configuration */
  retry?: {
    attempts: number
    delay: number
    backoff?: 'linear' | 'exponential'
  }
  /** Cache configuration */
  cache?: {
    key: string
    ttl: number // Time to live in milliseconds
  }
  /** Transform function for response data */
  transform?: (data: any) => T
  /** Error transform function */
  transformError?: (error: any) => AsyncError
  /** Dependencies that trigger refetch */
  dependencies?: any[]
}

/**
 * Return type for useAsyncData hook
 */
export interface UseAsyncDataReturn<T> {
  /** Current data */
  data: T | null
  /** Loading state */
  loading: boolean
  /** Error state */
  error: AsyncError | null
  /** Current operation state */
  state: AsyncDataState
  /** Execute the async operation */
  execute: (...args: any[]) => Promise<T | null>
  /** Refetch with last used parameters */
  refetch: () => Promise<T | null>
  /** Reset to initial state */
  reset: () => void
  /** Retry last failed operation */
  retry: () => Promise<T | null>
  /** Check if currently loading */
  isLoading: boolean
  /** Check if has error */
  hasError: boolean
  /** Check if has data */
  hasData: boolean
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

/**
 * Get cached data if still valid
 */
const getCachedData = (key: string): any | null => {
  const cached = cache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

/**
 * Set data in cache
 */
const setCachedData = (key: string, data: any, ttl: number): void => {
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

/**
 * Default error transformer
 */
const defaultErrorTransform = (error: any): AsyncError => {
  if (error instanceof Error) {
    return { message: error.message }
  }
  
  if (typeof error === 'string') {
    return { message: error }
  }
  
  if (error?.message) {
    return { 
      message: error.message, 
      code: error.code || error.status,
      details: error 
    }
  }
  
  return { message: 'An unexpected error occurred', details: error }
}

/**
 * Custom hook for managing async data operations with standardized loading/error states
 * 
 * @param asyncFunction - The async function to execute
 * @param options - Configuration options
 * @returns Object with data, loading, error states and control functions
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute, refetch } = useAsyncData(
 *   async (id: string) => {
 *     const response = await fetch(`/api/users/${id}`)
 *     return response.json()
 *   },
 *   { immediate: false, retry: { attempts: 3, delay: 1000 } }
 * )
 * ```
 */
export function useAsyncData<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const {
    initialData = null,
    immediate = true,
    retry: retryConfig,
    cache: cacheConfig,
    transform,
    transformError = defaultErrorTransform,
    dependencies = []
  } = options

  // State
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AsyncError | null>(null)
  const [state, setState] = useState<AsyncDataState>('idle')
  
  // Refs to track current execution
  const lastArgsRef = useRef<any[]>([])
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  /**
   * Execute the async operation with error handling and retries
   */
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    // Check cache first
    if (cacheConfig) {
      const cachedData = getCachedData(cacheConfig.key)
      if (cachedData) {
        setData(transform ? transform(cachedData) : cachedData)
        setState('success')
        return cachedData
      }
    }

    lastArgsRef.current = args
    
    if (!mountedRef.current) return null

    setLoading(true)
    setState('loading')
    setError(null)

    try {
      const result = await asyncFunction(...args)
      
      if (!mountedRef.current) return null

      const transformedData = transform ? transform(result) : result
      setData(transformedData)
      setState('success')
      retryCountRef.current = 0

      // Cache the result
      if (cacheConfig) {
        setCachedData(cacheConfig.key, result, cacheConfig.ttl)
      }

      return transformedData
    } catch (err) {
      if (!mountedRef.current) return null

      const transformedError = transformError(err)
      setError(transformedError)
      setState('error')

      // Auto-retry logic
      if (retryConfig && retryCountRef.current < retryConfig.attempts) {
        const delay = retryConfig.backoff === 'exponential' 
          ? retryConfig.delay * Math.pow(2, retryCountRef.current)
          : retryConfig.delay

        retryCountRef.current++
        
        setTimeout(() => {
          if (mountedRef.current) {
            execute(...args)
          }
        }, delay)
      }

      return null
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [asyncFunction, transform, transformError, retryConfig, cacheConfig])

  /**
   * Refetch with last used parameters
   */
  const refetch = useCallback(() => {
    return execute(...lastArgsRef.current)
  }, [execute])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setData(initialData)
    setLoading(false)
    setError(null)
    setState('idle')
    retryCountRef.current = 0
    lastArgsRef.current = []
  }, [initialData])

  /**
   * Retry last failed operation
   */
  const retry = useCallback(() => {
    if (state === 'error') {
      retryCountRef.current = 0
      return refetch()
    }
    return Promise.resolve(data)
  }, [state, refetch, data])

  // Auto-execute on mount or dependency changes
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, ...dependencies])

  // Computed properties
  const isLoading = loading || state === 'loading'
  const hasError = error !== null || state === 'error'
  const hasData = data !== null

  return {
    data,
    loading,
    error,
    state,
    execute,
    refetch,
    reset,
    retry,
    isLoading,
    hasError,
    hasData
  }
}

/**
 * Specialized hook for API calls
 */
export function useApiData<T = any>(
  url: string | (() => string),
  options: UseAsyncDataOptions<T> & {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: any
    headers?: Record<string, string>
  } = {}
) {
  const { method = 'GET', body, headers, ...asyncOptions } = options

  const apiCall = useCallback(async () => {
    const apiUrl = typeof url === 'function' ? url() : url
    
    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }, [url, method, body, headers])

  return useAsyncData(apiCall, asyncOptions)
}

/**
 * Hook for managing mutations (POST, PUT, DELETE operations)
 */
export function useAsyncMutation<T = any, P = any>(
  mutationFunction: (params: P) => Promise<T>,
  options: Omit<UseAsyncDataOptions<T>, 'immediate'> = {}
): UseAsyncDataReturn<T> & {
  mutate: (params: P) => Promise<T | null>
} {
  const asyncData = useAsyncData(mutationFunction, { ...options, immediate: false })

  const mutate = useCallback((params: P) => {
    return asyncData.execute(params)
  }, [asyncData.execute])

  return {
    ...asyncData,
    mutate
  }
}