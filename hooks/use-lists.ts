/**
 * useListsRepository Hook
 * 
 * Demonstrates how to use the Repository Pattern in React components.
 * This hook provides a clean interface for list operations with consistent
 * error handling, loading states, and data management.
 */

import { useState, useEffect, useCallback } from 'react'
import { List } from '@/lib/repositories'

interface UseListsOptions {
  autoFetch?: boolean
  filters?: {
    type?: string
    creator_id?: string
    search?: string
  }
}

interface UseListsResult {
  lists: List[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createList: (data: {
    name: string
    description?: string
    type?: string
    tags?: string[]
  }) => Promise<List | null>
  updateList: (id: string, data: Partial<List>) => Promise<List | null>
  deleteList: (id: string) => Promise<boolean>
  searchLists: (query: string) => Promise<void>
}

/**
 * Hook for managing lists with repository pattern benefits:
 * - Consistent error handling
 * - Loading state management
 * - Optimistic updates
 * - Automatic refetching
 */
export function useListsRepository(options: UseListsOptions = {}): UseListsResult {
  const { autoFetch = true, filters } = options
  
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch lists from API (which uses repository pattern)
   */
  const fetchLists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.creator_id) params.append('creator_id', filters.creator_id)
      if (filters?.search) params.append('search', filters.search)

      const response = await fetch(`/api/lists?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch lists')
      }

      const data = await response.json()
      setLists(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching lists:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  /**
   * Create a new list with optimistic updates
   */
  const createList = useCallback(async (data: {
    name: string
    description?: string
    type?: string
    tags?: string[]
  }): Promise<List | null> => {
    try {
      setError(null)

      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create list')
      }

      const newList = await response.json()
      
      // Optimistic update
      setLists(prev => [newList, ...prev])
      
      return newList
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create list'
      setError(errorMessage)
      console.error('Error creating list:', err)
      return null
    }
  }, [])

  /**
   * Update an existing list with optimistic updates
   */
  const updateList = useCallback(async (id: string, data: Partial<List>): Promise<List | null> => {
    try {
      setError(null)

      // Optimistic update
      setLists(prev => prev.map(list => 
        list.id === id ? { ...list, ...data } : list
      ))

      const response = await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        // Revert optimistic update on error
        await fetchLists()
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update list')
      }

      const updatedList = await response.json()
      
      // Update with actual server response
      setLists(prev => prev.map(list => 
        list.id === id ? updatedList : list
      ))

      return updatedList
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update list'
      setError(errorMessage)
      console.error('Error updating list:', err)
      return null
    }
  }, [fetchLists])

  /**
   * Delete a list with optimistic updates
   */
  const deleteList = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)

      // Store original list for potential revert
      const originalList = lists.find(list => list.id === id)
      
      // Optimistic update
      setLists(prev => prev.filter(list => list.id !== id))

      const response = await fetch(`/api/lists/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Revert optimistic update on error
        if (originalList) {
          setLists(prev => [...prev, originalList].sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          ))
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete list')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list'
      setError(errorMessage)
      console.error('Error deleting list:', err)
      return false
    }
  }, [lists])

  /**
   * Search lists with debouncing
   */
  const searchLists = useCallback(async (query: string) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (query.trim()) {
        params.append('search', query.trim())
      }
      
      // Add existing filters
      if (filters?.type) params.append('type', filters.type)
      if (filters?.creator_id) params.append('creator_id', filters.creator_id)

      const response = await fetch(`/api/lists?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search lists')
      }

      const data = await response.json()
      setLists(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      console.error('Error searching lists:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchLists()
    }
  }, [autoFetch, fetchLists])

  return {
    lists,
    loading,
    error,
    refetch: fetchLists,
    createList,
    updateList,
    deleteList,
    searchLists
  }
}

/**
 * Hook for managing a single list
 */
export function useListRepository(listId: string | null) {
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    if (!listId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/lists/${listId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch list')
      }

      const data = await response.json()
      setList(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch list'
      setError(errorMessage)
      console.error('Error fetching list:', err)
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return {
    list,
    loading,
    error,
    refetch: fetchList
  }
}