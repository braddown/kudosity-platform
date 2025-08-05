"use client"

import React from 'react'
import { useAsyncData, useApiData, useAsyncMutation, type UseAsyncDataOptions, type UseAsyncDataReturn } from './use-async-data'
import { AsyncStateWrapper, type AsyncStateWrapperProps } from '@/components/ui/async-states'

/**
 * Configuration for async state rendering
 */
export interface UseAsyncStateOptions<T> extends UseAsyncDataOptions<T> {
  /** Custom loading message */
  loadingMessage?: string
  /** Custom empty state configuration */
  emptyState?: {
    title?: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  /** Function to determine if data is empty */
  isEmpty?: (data: T | null) => boolean
  /** Show error details in development */
  showErrorDetails?: boolean
}

/**
 * Return type that includes both data management and rendering capabilities
 */
export interface UseAsyncStateReturn<T> extends UseAsyncDataReturn<T> {
  /** Render function that handles all states automatically */
  render: (children: (data: T) => React.ReactNode) => React.ReactNode
  /** AsyncStateWrapper props for manual rendering */
  wrapperProps: Pick<AsyncStateWrapperProps, 'loading' | 'error' | 'data' | 'isEmpty' | 'onRetry' | 'onReset'>
}

/**
 * Enhanced useAsyncData that includes rendering capabilities
 * 
 * @example
 * ```typescript
 * const { data, loading, render } = useAsyncState(
 *   async () => fetch('/api/users').then(r => r.json()),
 *   { loadingMessage: 'Loading users...' }
 * )
 * 
 * return render((users) => (
 *   <UserList users={users} />
 * ))
 * ```
 */
export function useAsyncState<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncStateOptions<T> = {}
): UseAsyncStateReturn<T> {
  const {
    loadingMessage = "Loading...",
    emptyState,
    isEmpty: isEmptyFn,
    showErrorDetails = process.env.NODE_ENV === 'development',
    ...asyncOptions
  } = options

  const asyncData = useAsyncData(asyncFunction, asyncOptions)

  const defaultIsEmpty = React.useCallback((data: T | null): boolean => {
    if (data === null || data === undefined) return true
    if (Array.isArray(data)) return data.length === 0
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length === 0
    }
    return false
  }, [])

  const isEmpty = isEmptyFn ? isEmptyFn(asyncData.data) : defaultIsEmpty(asyncData.data)

  const render = React.useCallback((
    children: (data: T) => React.ReactNode
  ): React.ReactNode => {
    return (
      <AsyncStateWrapper
        loading={asyncData.loading}
        error={asyncData.error}
        data={asyncData.data}
        isEmpty={isEmpty}
        onRetry={asyncData.retry}
        onReset={asyncData.reset}
        loadingProps={{ message: loadingMessage }}
        errorProps={{ showDetails: showErrorDetails }}
        emptyProps={emptyState}
      >
        {asyncData.data && children(asyncData.data)}
      </AsyncStateWrapper>
    )
  }, [
    asyncData.loading,
    asyncData.error,
    asyncData.data,
    isEmpty,
    asyncData.retry,
    asyncData.reset,
    loadingMessage,
    showErrorDetails,
    emptyState
  ])

  const wrapperProps = React.useMemo(() => ({
    loading: asyncData.loading,
    error: asyncData.error,
    data: asyncData.data,
    isEmpty,
    onRetry: asyncData.retry,
    onReset: asyncData.reset
  }), [asyncData.loading, asyncData.error, asyncData.data, isEmpty, asyncData.retry, asyncData.reset])

  return {
    ...asyncData,
    render,
    wrapperProps
  }
}

/**
 * Specialized hook for API endpoints with rendering
 * 
 * @example
 * ```typescript
 * const { render } = useApiState('/api/campaigns/activity', {
 *   loadingMessage: 'Loading campaigns...',
 *   emptyState: {
 *     title: 'No campaigns found',
 *     description: 'Create your first campaign to get started.',
 *     action: {
 *       label: 'Create Campaign',
 *       onClick: () => router.push('/campaigns/create')
 *     }
 *   }
 * })
 * 
 * return render((campaigns) => (
 *   <CampaignTable campaigns={campaigns} />
 * ))
 * ```
 */
export function useApiState<T = any>(
  url: string | (() => string),
  options: UseAsyncStateOptions<T> & {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: any
    headers?: Record<string, string>
  } = {}
): UseAsyncStateReturn<T> {
  const { method, body, headers, ...stateOptions } = options

  const apiData = useApiData<T>(url, { method, body, headers, ...stateOptions })

  const defaultIsEmpty = React.useCallback((data: T | null): boolean => {
    if (data === null || data === undefined) return true
    if (Array.isArray(data)) return data.length === 0
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length === 0
    }
    return false
  }, [])

  const isEmpty = stateOptions.isEmpty ? stateOptions.isEmpty(apiData.data) : defaultIsEmpty(apiData.data)

  const render = React.useCallback((
    children: (data: T) => React.ReactNode
  ): React.ReactNode => {
    return (
      <AsyncStateWrapper
        loading={apiData.loading}
        error={apiData.error}
        data={apiData.data}
        isEmpty={isEmpty}
        onRetry={apiData.retry}
        onReset={apiData.reset}
        loadingProps={{ message: stateOptions.loadingMessage || "Loading..." }}
        errorProps={{ showDetails: stateOptions.showErrorDetails }}
        emptyProps={stateOptions.emptyState}
      >
        {apiData.data && children(apiData.data)}
      </AsyncStateWrapper>
    )
  }, [
    apiData.loading,
    apiData.error,
    apiData.data,
    isEmpty,
    apiData.retry,
    apiData.reset,
    stateOptions.loadingMessage,
    stateOptions.showErrorDetails,
    stateOptions.emptyState
  ])

  const wrapperProps = React.useMemo(() => ({
    loading: apiData.loading,
    error: apiData.error,
    data: apiData.data,
    isEmpty,
    onRetry: apiData.retry,
    onReset: apiData.reset
  }), [apiData.loading, apiData.error, apiData.data, isEmpty, apiData.retry, apiData.reset])

  return {
    ...apiData,
    render,
    wrapperProps
  }
}

/**
 * Hook for handling mutations with optimistic updates and consistent error handling
 * 
 * @example
 * ```typescript
 * const { mutate, loading, error } = useMutationState(
 *   async (userData) => {
 *     const response = await fetch('/api/users', {
 *       method: 'POST',
 *       body: JSON.stringify(userData)
 *     })
 *     return response.json()
 *   },
 *   {
 *     onSuccess: (data) => {
 *       toast({ title: 'User created successfully!' })
 *       router.push(`/users/${data.id}`)
 *     },
 *     onError: (error) => {
 *       toast({ title: 'Failed to create user', variant: 'destructive' })
 *     }
 *   }
 * )
 * ```
 */
export function useMutationState<T = any, P = any>(
  mutationFunction: (params: P) => Promise<T>,
  options: UseAsyncStateOptions<T> & {
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
    optimisticUpdate?: (params: P) => T
  } = {}
): UseAsyncStateReturn<T> & {
  mutate: (params: P) => Promise<T | null>
  mutateAsync: (params: P) => Promise<T>
} {
  const { onSuccess, onError, optimisticUpdate, ...stateOptions } = options

  const asyncMutation = useAsyncMutation(mutationFunction, stateOptions)

  const mutate = React.useCallback(async (params: P): Promise<T | null> => {
    try {
      const result = await asyncMutation.mutate(params)
      if (result && onSuccess) {
        onSuccess(result)
      }
      return result
    } catch (error) {
      if (onError) {
        onError(error)
      }
      throw error
    }
  }, [asyncMutation.mutate, onSuccess, onError])

  const mutateAsync = React.useCallback(async (params: P): Promise<T> => {
    const result = await mutate(params)
    if (result === null) {
      throw new Error('Mutation failed')
    }
    return result
  }, [mutate])

  const defaultIsEmpty = React.useCallback((data: T | null): boolean => {
    return data === null || data === undefined
  }, [])

  const isEmpty = stateOptions.isEmpty ? stateOptions.isEmpty(asyncMutation.data) : defaultIsEmpty(asyncMutation.data)

  const render = React.useCallback((
    children: (data: T) => React.ReactNode
  ): React.ReactNode => {
    return (
      <AsyncStateWrapper
        loading={asyncMutation.loading}
        error={asyncMutation.error}
        data={asyncMutation.data}
        isEmpty={isEmpty}
        onRetry={asyncMutation.retry}
        onReset={asyncMutation.reset}
        loadingProps={{ message: stateOptions.loadingMessage || "Processing..." }}
        errorProps={{ showDetails: stateOptions.showErrorDetails }}
        emptyProps={stateOptions.emptyState}
      >
        {asyncMutation.data && children(asyncMutation.data)}
      </AsyncStateWrapper>
    )
  }, [
    asyncMutation.loading,
    asyncMutation.error,
    asyncMutation.data,
    isEmpty,
    asyncMutation.retry,
    asyncMutation.reset,
    stateOptions.loadingMessage,
    stateOptions.showErrorDetails,
    stateOptions.emptyState
  ])

  const wrapperProps = React.useMemo(() => ({
    loading: asyncMutation.loading,
    error: asyncMutation.error,
    data: asyncMutation.data,
    isEmpty,
    onRetry: asyncMutation.retry,
    onReset: asyncMutation.reset
  }), [asyncMutation.loading, asyncMutation.error, asyncMutation.data, isEmpty, asyncMutation.retry, asyncMutation.reset])

  return {
    ...asyncMutation,
    mutate,
    mutateAsync,
    render,
    wrapperProps
  }
}