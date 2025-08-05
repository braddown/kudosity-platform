/**
 * useProfiles Hook
 * 
 * Comprehensive hook for managing profile operations with advanced features:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Filtering and search capabilities
 * - Pagination support
 * - Optimistic updates
 * - Caching with TTL
 * - Error handling and retry logic
 * 
 * Built on top of useAsyncData for consistent state management.
 */

import { useState, useCallback, useMemo } from 'react'
import { useAsyncData } from './use-async-data'
import { supabase } from '@/lib/supabase'

// Types
export interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  mobile?: string
  phone?: string
  country?: string
  state?: string
  city?: string
  status: 'active' | 'inactive' | 'deleted'
  lifecycle_stage?: string
  lead_score?: number
  lifetime_value?: number
  data_quality_score?: number
  source?: string
  created_at: string
  updated_at: string
  last_activity_at?: string
  custom_fields?: Record<string, any>
  notification_preferences?: Record<string, any>
  tags?: string[]
}

export interface ProfileFilters {
  search?: string
  status?: string
  tags?: string[]
  createdAfter?: string
  createdBefore?: string
}

export interface ProfilePagination {
  page: number
  limit: number
  offset?: number
}

export interface UseProfilesOptions {
  /** Auto-fetch profiles on mount */
  immediate?: boolean
  /** Initial filters to apply */
  filters?: ProfileFilters
  /** Pagination settings */
  pagination?: ProfilePagination
  /** Cache TTL in milliseconds */
  cacheTTL?: number
  /** Enable optimistic updates */
  optimistic?: boolean
}

export interface UseProfilesResult {
  // Data state
  profiles: Profile[]
  loading: boolean
  error: string | null
  isEmpty: boolean
  totalCount: number
  
  // Pagination
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  
  // Actions
  refetch: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  
  // CRUD operations
  createProfile: (data: Partial<Profile>) => Promise<Profile | null>
  updateProfile: (id: string, data: Partial<Profile>) => Promise<Profile | null>
  deleteProfile: (id: string) => Promise<boolean>
  restoreProfile: (id: string) => Promise<Profile | null>
  
  // Single profile operations
  getProfile: (id: string) => Promise<Profile | null>
  
  // Filtering and search
  setFilters: (filters: ProfileFilters) => void
  clearFilters: () => void
  search: (query: string) => void
  
  // Pagination
  goToPage: (page: number) => Promise<void>
  nextPage: () => Promise<void>
  previousPage: () => Promise<void>
  setPageSize: (size: number) => void
  
  // Bulk operations
  bulkDelete: (ids: string[]) => Promise<boolean>
  bulkUpdate: (ids: string[], data: Partial<Profile>) => Promise<boolean>
  
  // Utility
  findProfile: (predicate: (profile: Profile) => boolean) => Profile | undefined
  filterProfiles: (predicate: (profile: Profile) => boolean) => Profile[]
}

// Helper function to map CDP lifecycle stage to profile status
const mapLifecycleStageToStatus = (lifecycleStage: string): 'active' | 'inactive' | 'deleted' => {
  if (lifecycleStage === 'churned') return 'inactive'
  return 'active' // default for lead, prospect, customer
}

/**
 * Hook for comprehensive profile management
 */
export function useProfiles(options: UseProfilesOptions = {}): UseProfilesResult {
  const {
    immediate = true,
    filters: initialFilters = {},
    pagination: initialPagination = { page: 1, limit: 25 },
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    optimistic = true,
  } = options

  // Local state for filters and pagination
  const [filters, setFiltersState] = useState<ProfileFilters>(initialFilters)
  const [pagination, setPagination] = useState<ProfilePagination>(initialPagination)
  const [totalCount, setTotalCount] = useState(0)

  // Generate cache key based on filters and pagination
  const cacheKey = useMemo(() => {
    return `profiles-${JSON.stringify({ filters, pagination })}`
  }, [filters, pagination])

  // Main async data hook for fetching profiles
  const {
    data: profiles,
    loading,
    error,
    execute: fetchProfiles,
    refetch,
    reset,
  } = useAsyncData<Profile[]>(
    async () => {
      const options = {
        ...filters,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      }

      // Fetch profiles from CDP system
      let query = supabase
        .from("cdp_profiles")
        .select("*", { count: 'exact' })
        .eq("merge_status", "active")
        .order("created_at", { ascending: false })

      // Apply search filter
      if (options.search) {
        query = query.or(
          `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%,mobile.ilike.%${options.search}%`
        )
      }

      // Apply status filter (map to lifecycle_stage)
      if (options.status) {
        if (options.status === 'active') {
          query = query.in('lifecycle_stage', ['lead', 'prospect', 'customer'])
        } else if (options.status === 'inactive') {
          query = query.eq('lifecycle_stage', 'churned')
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Update total count for pagination
      if (count !== null) {
        setTotalCount(count)
      }

      // Map CDP profiles to expected format for compatibility
      const mappedProfiles = (data || []).map(cdpProfile => ({
        id: cdpProfile.id,
        first_name: cdpProfile.first_name,
        last_name: cdpProfile.last_name,
        email: cdpProfile.email,
        mobile: cdpProfile.mobile?.startsWith('unknown_') ? '' : cdpProfile.mobile,
        phone: cdpProfile.phone,
        country: cdpProfile.country,
        state: cdpProfile.state,
        city: cdpProfile.city,
        status: mapLifecycleStageToStatus(cdpProfile.lifecycle_stage),
        lifecycle_stage: cdpProfile.lifecycle_stage,
        lead_score: cdpProfile.lead_score,
        lifetime_value: cdpProfile.lifetime_value,
        data_quality_score: cdpProfile.data_quality_score,
        custom_fields: cdpProfile.custom_fields || {},
        notification_preferences: cdpProfile.notification_preferences || {},
        tags: cdpProfile.tags || [],
        source: cdpProfile.source,
        created_at: cdpProfile.created_at,
        updated_at: cdpProfile.updated_at,
        last_activity_at: cdpProfile.last_activity_at
      }))

      return mappedProfiles
    },
    {
      immediate,
      cache: { key: cacheKey, ttl: cacheTTL },
      transformError: (error) => ({
        message: error instanceof Error ? error.message : 'Failed to fetch profiles',
        code: 'FETCH_ERROR',
      }),
    }
  )

  // Computed values
  const isEmpty = !loading && (!profiles || profiles.length === 0)
  const totalPages = Math.ceil(totalCount / pagination.limit)
  const hasNextPage = pagination.page < totalPages
  const hasPreviousPage = pagination.page > 1

  /**
   * Create a new profile
   */
  const createProfile = useCallback(async (data: Partial<Profile>): Promise<Profile | null> => {
    try {
      // Map data to CDP format
      const cdpProfileData = {
        mobile: data.mobile || `unknown_${Date.now()}`,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.mobile,
        country: data.country || 'Unknown',
        state: data.state,
        city: data.city,
        lifecycle_stage: 'lead' as const,
        lead_score: 0,
        lifetime_value: 0,
        custom_fields: data.custom_fields || {},
        notification_preferences: data.notification_preferences || {
          marketing_sms: true,
          marketing_email: true,
          transactional_sms: true,
          transactional_email: true,
          marketing_whatsapp: false,
          transactional_whatsapp: false,
          marketing_rcs: false,
          transactional_rcs: false
        },
        tags: data.tags || [],
        source: 'manual_entry',
        source_details: {
          created_by: 'system',
          creation_date: new Date().toISOString()
        }
      }

      const { data: result, error } = await supabase
        .from("cdp_profiles")
        .insert([cdpProfileData])
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }

      // Map result back to expected format
      const mappedProfile: Profile = {
        id: result.id,
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        mobile: result.mobile?.startsWith('unknown_') ? '' : result.mobile,
        phone: result.phone,
        country: result.country,
        state: result.state,
        city: result.city,
        status: 'active',
        lifecycle_stage: result.lifecycle_stage,
        lead_score: result.lead_score,
        lifetime_value: result.lifetime_value,
        data_quality_score: result.data_quality_score,
        custom_fields: result.custom_fields || {},
        notification_preferences: result.notification_preferences || {},
        tags: result.tags || [],
        source: result.source,
        created_at: result.created_at,
        updated_at: result.updated_at,
        last_activity_at: result.last_activity_at
      }

      // Optimistic update
      if (optimistic) {
        refetch()
      }

      return mappedProfile
    } catch (error) {
      console.error('Failed to create profile:', error)
      return null
    }
  }, [optimistic, refetch])

  /**
   * Update an existing profile
   */
  const updateProfile = useCallback(async (id: string, data: Partial<Profile>): Promise<Profile | null> => {
    try {
      // Map data to CDP format
      const cdpProfileUpdate = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        mobile: data.mobile,
        phone: data.mobile,
        country: data.country,
        state: data.state,
        city: data.city,
        custom_fields: data.custom_fields,
        notification_preferences: data.notification_preferences,
        tags: data.tags,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }

      const { data: result, error } = await supabase
        .from("cdp_profiles")
        .update(cdpProfileUpdate)
        .eq("id", id)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }

      // Map result back to expected format
      const mappedProfile: Profile = {
        id: result.id,
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        mobile: result.mobile?.startsWith('unknown_') ? '' : result.mobile,
        phone: result.phone,
        country: result.country,
        state: result.state,
        city: result.city,
        status: mapLifecycleStageToStatus(result.lifecycle_stage),
        lifecycle_stage: result.lifecycle_stage,
        lead_score: result.lead_score,
        lifetime_value: result.lifetime_value,
        data_quality_score: result.data_quality_score,
        custom_fields: result.custom_fields || {},
        notification_preferences: result.notification_preferences || {},
        tags: result.tags || [],
        source: result.source,
        created_at: result.created_at,
        updated_at: result.updated_at,
        last_activity_at: result.last_activity_at
      }

      // Optimistic update or refetch
      refetch()

      return mappedProfile
    } catch (error) {
      console.error('Failed to update profile:', error)
      return null
    }
  }, [refetch])

  /**
   * Delete a profile (soft delete)
   */
  const deleteProfile = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("cdp_profiles")
        .update({ 
          merge_status: "archived", 
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq("id", id)
      
      if (error) {
        throw new Error(error.message)
      }

      refetch()
      return true
    } catch (error) {
      console.error('Failed to delete profile:', error)
      return false
    }
  }, [refetch])

  /**
   * Restore a soft-deleted profile
   */
  const restoreProfile = useCallback(async (id: string): Promise<Profile | null> => {
    try {
      const { data: result, error } = await supabase
        .from("cdp_profiles")
        .update({ 
          merge_status: "active", 
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }

      // Map result back to expected format
      const mappedProfile: Profile = {
        id: result.id,
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        mobile: result.mobile?.startsWith('unknown_') ? '' : result.mobile,
        phone: result.phone,
        country: result.country,
        state: result.state,
        city: result.city,
        status: 'active',
        lifecycle_stage: result.lifecycle_stage,
        lead_score: result.lead_score,
        lifetime_value: result.lifetime_value,
        data_quality_score: result.data_quality_score,
        custom_fields: result.custom_fields || {},
        notification_preferences: result.notification_preferences || {},
        tags: result.tags || [],
        source: result.source,
        created_at: result.created_at,
        updated_at: result.updated_at,
        last_activity_at: result.last_activity_at
      }

      refetch()
      return mappedProfile
    } catch (error) {
      console.error('Failed to restore profile:', error)
      return null
    }
  }, [refetch])

  /**
   * Get a single profile
   */
  const getProfile = useCallback(async (id: string): Promise<Profile | null> => {
    try {
      const { data: result, error } = await supabase
        .from("cdp_profiles")
        .select("*")
        .eq("id", id)
        .single()
      
      if (error) {
        throw new Error(error.message)
      }

      if (!result) {
        return null
      }

      // Map CDP profile to expected format
      const mappedProfile: Profile = {
        id: result.id,
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        mobile: result.mobile?.startsWith('unknown_') ? '' : result.mobile,
        phone: result.phone,
        country: result.country,
        state: result.state,
        city: result.city,
        status: mapLifecycleStageToStatus(result.lifecycle_stage),
        lifecycle_stage: result.lifecycle_stage,
        lead_score: result.lead_score,
        lifetime_value: result.lifetime_value,
        data_quality_score: result.data_quality_score,
        custom_fields: result.custom_fields || {},
        notification_preferences: result.notification_preferences || {},
        tags: result.tags || [],
        source: result.source,
        created_at: result.created_at,
        updated_at: result.updated_at,
        last_activity_at: result.last_activity_at
      }

      return mappedProfile
    } catch (error) {
      console.error('Failed to get profile:', error)
      return null
    }
  }, [])

  /**
   * Update filters and refetch
   */
  const setFilters = useCallback((newFilters: ProfileFilters) => {
    setFiltersState(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    // Refetch will be triggered by useEffect dependency on filters
  }, [])

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [setFilters])

  /**
   * Quick search function
   */
  const search = useCallback((query: string) => {
    setFilters({ ...filters, search: query })
  }, [filters, setFilters])

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(prev => ({ ...prev, page }))
    }
  }, [totalPages])

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(async () => {
    if (hasNextPage) {
      await goToPage(pagination.page + 1)
    }
  }, [hasNextPage, pagination.page, goToPage])

  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(async () => {
    if (hasPreviousPage) {
      await goToPage(pagination.page - 1)
    }
  }, [hasPreviousPage, pagination.page, goToPage])

  /**
   * Update page size
   */
  const setPageSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, limit: size, page: 1 }))
  }, [])

  /**
   * Bulk delete profiles
   */
  const bulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("cdp_profiles")
        .update({ 
          merge_status: "archived", 
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .in("id", ids)
      
      if (error) {
        console.error('Failed to bulk delete profiles:', error.message)
        return false
      }

      refetch()
      return true
    } catch (error) {
      console.error('Failed to bulk delete profiles:', error)
      return false
    }
  }, [refetch])

  /**
   * Bulk update profiles
   */
  const bulkUpdate = useCallback(async (ids: string[], data: Partial<Profile>): Promise<boolean> => {
    try {
      // Map data to CDP format
      const cdpProfileUpdate = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        mobile: data.mobile,
        phone: data.mobile,
        country: data.country,
        state: data.state,
        city: data.city,
        custom_fields: data.custom_fields,
        notification_preferences: data.notification_preferences,
        tags: data.tags,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from("cdp_profiles")
        .update(cdpProfileUpdate)
        .in("id", ids)
      
      if (error) {
        console.error('Failed to bulk update profiles:', error.message)
        return false
      }

      refetch()
      return true
    } catch (error) {
      console.error('Failed to bulk update profiles:', error)
      return false
    }
  }, [refetch])

  /**
   * Find a profile by predicate
   */
  const findProfile = useCallback((predicate: (profile: Profile) => boolean): Profile | undefined => {
    return profiles?.find(predicate)
  }, [profiles])

  /**
   * Filter profiles by predicate
   */
  const filterProfiles = useCallback((predicate: (profile: Profile) => boolean): Profile[] => {
    return profiles?.filter(predicate) || []
  }, [profiles])

  /**
   * Refresh function (clears cache and refetches)
   */
  const refresh = useCallback(async () => {
    reset()
    await fetchProfiles()
  }, [reset, fetchProfiles])

  /**
   * Refetch function (void return type)
   */
  const refetchData = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    // Data state
    profiles: profiles || [],
    loading,
    error: error?.message || null,
    isEmpty,
    totalCount,
    
    // Pagination
    currentPage: pagination.page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    
    // Actions
    refetch: refetchData,
    refresh,
    reset,
    
    // CRUD operations
    createProfile,
    updateProfile,
    deleteProfile,
    restoreProfile,
    getProfile,
    
    // Filtering and search
    setFilters,
    clearFilters,
    search,
    
    // Pagination
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    
    // Bulk operations
    bulkDelete,
    bulkUpdate,
    
    // Utility
    findProfile,
    filterProfiles,
  }
}