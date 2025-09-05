/**
 * useLogs Hook
 * 
 * Comprehensive hook for managing log operations with advanced features:
 * - Log fetching with pagination
 * - Advanced filtering with FilterGroups
 * - Search and event type filtering
 * - Saved filters management
 * - Connection status monitoring
 * - Client-side and server-side filtering
 * - Caching with TTL
 * 
 * Built on top of useAsyncData for consistent state management.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAsyncData } from './use-async-data'
import { supabase } from '@/lib/supabase'
import { logFiltersApi, type LogFilter } from '@/api/log-filters-api'
import { logger } from "@/lib/utils/logger"

// Types for logs management
export interface FilterCondition {
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'is_null' | 'is_not_null'
  value: string
}

export interface FilterGroup {
  id: string
  name: string
  conditions: FilterCondition[]
  operator: 'AND' | 'OR'
}

export interface LogEntry {
  id: string
  log_time: string
  event_type: string
  profile_id?: string
  campaign_id?: string
  location?: string
  device?: string
  os?: string
  details?: Record<string, any>
  [key: string]: any
}

export interface LogFilters {
  search?: string
  eventTypes?: string[]
  dateRange?: {
    start: string
    end: string
  }
  advancedFilters?: FilterGroup[]
}

export interface LogPagination {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

export interface UseLogsOptions {
  /** Auto-fetch logs on mount */
  immediate?: boolean
  /** Initial filters to apply */
  filters?: LogFilters
  /** Initial pagination settings */
  pagination?: Partial<LogPagination>
  /** Cache TTL in milliseconds */
  cacheTTL?: number
  /** User ID for saved filters */
  userId?: string
  /** Sort configuration */
  sortConfig?: {
    key: string
    direction: 'asc' | 'desc'
  }
}

export interface ConnectionStatus {
  status: 'unknown' | 'connected' | 'error'
  message: string
}

export interface UseLogsResult {
  // Data state
  logs: LogEntry[]
  allLogs: LogEntry[]
  loading: boolean
  error: string | null
  isEmpty: boolean
  
  // Pagination
  pagination: LogPagination
  startRecord: number
  endRecord: number
  
  // Connection status
  connectionStatus: ConnectionStatus
  
  // Available options
  eventTypes: string[]
  
  // Actions
  refetch: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  
  // Filtering
  setFilters: (filters: LogFilters) => void
  setSearch: (search: string) => void
  setEventTypes: (types: string[]) => void
  setAdvancedFilters: (filters: FilterGroup[]) => void
  clearAllFilters: () => void
  applyFilters: () => Promise<void>
  
  // Pagination
  goToPage: (page: number) => Promise<void>
  nextPage: () => Promise<void>
  previousPage: () => Promise<void>
  setPageSize: (size: number) => void
  
  // Sorting
  setSortConfig: (config: { key: string; direction: 'asc' | 'desc' }) => void
  
  // Saved filters
  savedFilters: LogFilter[]
  loadSavedFilters: () => Promise<void>
  saveFilter: (name: string, description?: string) => Promise<boolean>
  loadFilter: (filter: LogFilter) => void
  deleteFilter: (id: string) => Promise<boolean>
  
  // Row expansion
  expandedRows: Set<string>
  toggleRowExpansion: (id: string) => void
  expandAllRows: () => void
  collapseAllRows: () => void
  
  // Utility
  getTotalDatabaseRecords: () => Promise<number>
  exportLogs: (format: 'csv' | 'json') => Promise<void>
  
  // Filter status
  hasActiveFilters: boolean
}

/**
 * Hook for comprehensive log management
 */
export function useLogs(options: UseLogsOptions = {}): UseLogsResult {
  const {
    immediate = true,
    filters: initialFilters = {},
    pagination: initialPagination = { page: 1, pageSize: 10 },
    cacheTTL = 2 * 60 * 1000, // 2 minutes (logs change frequently)
    userId = 'default-user',
    sortConfig: initialSortConfig = { key: 'log_time', direction: 'desc' },
  } = options

  // State
  const [filters, setFiltersState] = useState<LogFilters>(initialFilters)
  const [pagination, setPagination] = useState<LogPagination>({
    page: initialPagination.page || 1,
    pageSize: initialPagination.pageSize || 10,
    totalRecords: 0,
    totalPages: 1,
  })
  const [sortConfig, setSortConfigState] = useState(initialSortConfig)
  const [allLogs, setAllLogs] = useState<LogEntry[]>([])
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'unknown',
    message: '',
  })
  const [savedFilters, setSavedFilters] = useState<LogFilter[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Generate cache key
  const cacheKey = useMemo(() => {
    return `logs-${JSON.stringify({ filters, pagination: { page: pagination.page, pageSize: pagination.pageSize }, sortConfig })}`
  }, [filters, pagination.page, pagination.pageSize, sortConfig])

  /**
   * Check connection status
   */
  const checkConnection = useCallback(async () => {
    try {
      if (!supabase) {
        setConnectionStatus({
          status: 'error',
          message: 'Supabase client is not initialized',
        })
        return false
      }

      const { data, error } = await supabase.from('logs').select('id').limit(1)

      if (error) {
        logger.error('Connection test failed:', error)
        setConnectionStatus({
          status: 'error',
          message: `Failed to connect: ${error.message}`,
        })
        return false
      }

      setConnectionStatus({
        status: 'connected',
        message: 'Connected to Supabase',
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setConnectionStatus({
        status: 'error',
        message: `Connection error: ${message}`,
      })
      return false
    }
  }, [])

  /**
   * Fetch available event types
   */
  const fetchEventTypes = useCallback(async () => {
    try {
      if (!supabase) return

      const { data, error } = await supabase
        .from('logs')
        .select('event_type')
        .not('event_type', 'is', null)

      if (error) {
        logger.error('Error fetching event types:', error)
        return
      }

      const uniqueTypes = Array.from(new Set(data?.map(item => item.event_type) || []))
      setAvailableEventTypes(uniqueTypes.filter(Boolean))
    } catch (error) {
      logger.error('Exception fetching event types:', error)
    }
  }, [])

  /**
   * Fetch all logs for client-side filtering
   */
  const fetchAllLogs = useCallback(async (): Promise<LogEntry[]> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }

      let query = supabase.from('logs').select('*')

      // Apply basic filters
      if (filters.search) {
        query = query.or(
          `event_type.ilike.%${filters.search}%,profile_id.ilike.%${filters.search}%,campaign_id.ilike.%${filters.search}%,location.ilike.%${filters.search}%,device.ilike.%${filters.search}%,os.ilike.%${filters.search}%`
        )
      }

      if (filters.eventTypes && filters.eventTypes.length > 0) {
        query = query.in('event_type', filters.eventTypes)
      }

      if (filters.dateRange) {
        query = query
          .gte('log_time', filters.dateRange.start)
          .lte('log_time', filters.dateRange.end)
      }

      // Apply sorting
      query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching all logs:', error)
      return []
    }
  }, [filters, sortConfig])

  /**
   * Apply advanced filters client-side
   */
  const applyAdvancedFilters = useCallback((logs: LogEntry[]): LogEntry[] => {
    if (!filters.advancedFilters || filters.advancedFilters.length === 0) {
      return logs
    }

    return logs.filter(log => {
      return filters.advancedFilters!.every(group => {
        if (group.conditions.length === 0) return true

        const results = group.conditions.map(condition => {
          const value = getLogValue(log, condition.field)
          const conditionValue = condition.value.toLowerCase()
          const logValue = String(value || '').toLowerCase()

          switch (condition.operator) {
            case 'equals':
              return logValue === conditionValue
            case 'contains':
              return logValue.includes(conditionValue)
            case 'starts_with':
              return logValue.startsWith(conditionValue)
            case 'ends_with':
              return logValue.endsWith(conditionValue)
            case 'greater_than':
              return parseFloat(logValue) > parseFloat(conditionValue)
            case 'less_than':
              return parseFloat(logValue) < parseFloat(conditionValue)
            case 'is_null':
              return value === null || value === undefined || value === ''
            case 'is_not_null':
              return value !== null && value !== undefined && value !== ''
            default:
              return false
          }
        })

        return group.operator === 'AND' 
          ? results.every(Boolean)
          : results.some(Boolean)
      })
    })
  }, [filters.advancedFilters])

  /**
   * Get log value by field path (supports nested fields)
   */
  const getLogValue = (log: LogEntry, field: string): any => {
    if (field.includes('.')) {
      const [mainField, detailField] = field.split('.')
      if (mainField === 'details' && log.details) {
        return log.details[detailField]
      }
    }
    return log[field]
  }

  // Main async data hook for fetching logs
  const {
    data: logs,
    loading,
    error,
    execute: fetchLogs,
    refetch,
    reset,
  } = useAsyncData<LogEntry[]>(
    async () => {
      // Check connection first
      const isConnected = await checkConnection()
      if (!isConnected) {
        throw new Error('Database connection failed')
      }

      // Fetch all logs for filtering
      const allLogsData = await fetchAllLogs()
      setAllLogs(allLogsData)

      // Apply advanced filters
      const filteredLogs = applyAdvancedFilters(allLogsData)

      // Update pagination info
      const totalRecords = filteredLogs.length
      const totalPages = Math.ceil(totalRecords / pagination.pageSize)
      
      setPagination(prev => ({
        ...prev,
        totalRecords,
        totalPages,
      }))

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.pageSize
      const paginatedLogs = filteredLogs.slice(offset, offset + pagination.pageSize)

      return paginatedLogs
    },
    {
      immediate,
      cache: { key: cacheKey, ttl: cacheTTL },
      transformError: (error) => ({
        message: error instanceof Error ? error.message : 'Failed to fetch logs',
        code: 'FETCH_ERROR',
      }),
    }
  )

  // Initialize connection and event types
  useEffect(() => {
    checkConnection().then(isConnected => {
      if (isConnected) {
        fetchEventTypes()
      }
    })
  }, [checkConnection, fetchEventTypes])

  // Computed values
  const isEmpty = !loading && (!logs || logs.length === 0)
  const startRecord = (pagination.page - 1) * pagination.pageSize + 1
  const endRecord = Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)
  const hasActiveFilters = !!(
    filters.search ||
    (filters.eventTypes && filters.eventTypes.length > 0) ||
    (filters.advancedFilters && filters.advancedFilters.length > 0) ||
    filters.dateRange
  )

  /**
   * Update filters and refetch
   */
  const setFilters = useCallback((newFilters: LogFilters) => {
    setFiltersState(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  /**
   * Quick search
   */
  const setSearch = useCallback((search: string) => {
    setFilters({ ...filters, search })
  }, [filters, setFilters])

  /**
   * Set event type filters
   */
  const setEventTypes = useCallback((types: string[]) => {
    setFilters({ ...filters, eventTypes: types })
  }, [filters, setFilters])

  /**
   * Set advanced filters
   */
  const setAdvancedFilters = useCallback((advancedFilters: FilterGroup[]) => {
    setFilters({ ...filters, advancedFilters })
  }, [filters, setFilters])

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFiltersState({})
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  /**
   * Apply filters (triggers refetch)
   */
  const applyFilters = useCallback(async () => {
    await refetch()
  }, [refetch])

  /**
   * Navigation functions
   */
  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }))
    }
  }, [pagination.totalPages])

  const nextPage = useCallback(async () => {
    if (pagination.page < pagination.totalPages) {
      await goToPage(pagination.page + 1)
    }
  }, [pagination.page, pagination.totalPages, goToPage])

  const previousPage = useCallback(async () => {
    if (pagination.page > 1) {
      await goToPage(pagination.page - 1)
    }
  }, [pagination.page, goToPage])

  const setPageSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, page: 1 }))
  }, [])

  /**
   * Sort configuration
   */
  const setSortConfig = useCallback((config: { key: string; direction: 'asc' | 'desc' }) => {
    setSortConfigState(config)
  }, [])

  /**
   * Load saved filters
   */
  const loadSavedFilters = useCallback(async () => {
    try {
      const result = await logFiltersApi.getLogFilters(userId)
      if (result.data) {
        setSavedFilters(result.data)
      }
    } catch (error) {
      logger.error('Error loading saved filters:', error)
    }
  }, [userId])

  /**
   * Save current filter
   */
  const saveFilter = useCallback(async (name: string, description?: string): Promise<boolean> => {
    try {
      const filterData = filters.advancedFilters || []
      
      const result = await logFiltersApi.saveLogFilter({
        name,
        description,
        user_id: userId,
        filter_data: filterData as any, // Cast to match the API type
        is_public: false,
        tags: [],
      })

      if (result.error) {
        throw new Error(result.error)
      }

      await loadSavedFilters()
      return true
    } catch (error) {
      logger.error('Error saving filter:', error)
      return false
    }
  }, [filters.advancedFilters, userId, loadSavedFilters])

  /**
   * Load a saved filter
   */
  const loadFilter = useCallback((filter: LogFilter) => {
    setAdvancedFilters(filter.filter_data as FilterGroup[])
  }, [setAdvancedFilters])

  /**
   * Delete a saved filter
   */
  const deleteFilter = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await logFiltersApi.deleteLogFilter(id)
      if (result.error) {
        throw new Error(result.error)
      }

      await loadSavedFilters()
      return true
    } catch (error) {
      logger.error('Error deleting filter:', error)
      return false
    }
  }, [loadSavedFilters])

  /**
   * Row expansion functions
   */
  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const expandAllRows = useCallback(() => {
    const allIds = new Set(logs?.map(log => log.id) || [])
    setExpandedRows(allIds)
  }, [logs])

  const collapseAllRows = useCallback(() => {
    setExpandedRows(new Set())
  }, [])

  /**
   * Get total database records
   */
  const getTotalDatabaseRecords = useCallback(async (): Promise<number> => {
    try {
      if (!supabase) return 0

      const { count, error } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })

      if (error) {
        throw new Error(error.message)
      }

      return count || 0
    } catch (error) {
      logger.error('Error getting total database records:', error)
      return 0
    }
  }, [])

  /**
   * Export logs
   */
  const exportLogs = useCallback(async (format: 'csv' | 'json'): Promise<void> => {
    try {
      const logsToExport = allLogs.length > 0 ? allLogs : logs || []
      
      if (format === 'json') {
        const dataStr = JSON.stringify(logsToExport, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `logs-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        // Simple CSV export
        if (logsToExport.length === 0) return
        
        const headers = Object.keys(logsToExport[0])
        const csvContent = [
          headers.join(','),
          ...logsToExport.map(log => 
            headers.map(header => {
              const value = log[header]
              return typeof value === 'object' ? JSON.stringify(value) : String(value || '')
            }).join(',')
          )
        ].join('\n')
        
        const dataBlob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      logger.error('Error exporting logs:', error)
    }
  }, [allLogs, logs])

  /**
   * Refresh function (clears cache and refetches)
   */
  const refresh = useCallback(async () => {
    reset()
    await fetchLogs()
  }, [reset, fetchLogs])

  /**
   * Refetch function (void return type)
   */
  const refetchData = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    // Data state
    logs: logs || [],
    allLogs,
    loading,
    error: error?.message || null,
    isEmpty,
    
    // Pagination
    pagination,
    startRecord,
    endRecord,
    
    // Connection status
    connectionStatus,
    
    // Available options
    eventTypes: availableEventTypes,
    
    // Actions
    refetch: refetchData,
    refresh,
    reset,
    
    // Filtering
    setFilters,
    setSearch,
    setEventTypes,
    setAdvancedFilters,
    clearAllFilters,
    applyFilters,
    
    // Pagination
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    
    // Sorting
    setSortConfig,
    
    // Saved filters
    savedFilters,
    loadSavedFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    
    // Row expansion
    expandedRows,
    toggleRowExpansion,
    expandAllRows,
    collapseAllRows,
    
    // Utility
    getTotalDatabaseRecords,
    exportLogs,
    
    // Filter status
    hasActiveFilters,
  }
}