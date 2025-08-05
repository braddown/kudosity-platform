/**
 * Customer Data Platform (CDP) Profiles Hook
 * 
 * Custom hook for managing Profile entities in the CDP architecture.
 * Provides comprehensive CRUD operations, search, matching, and metrics.
 */

import { useState, useCallback, useMemo } from 'react'
import { useAsyncData } from './use-async-data'
import { CDPProfilesRepository } from '@/lib/api/repositories/CDPProfilesRepository'
import type { 
  Profile, 
  CreateProfileRequest, 
  UpdateProfileRequest,
  ProfileSearchFilters,
  PaginatedResponse,
  ProfileMetrics,
  NotificationPreferences
} from '@/lib/types'

// Initialize repository
const profilesRepo = new CDPProfilesRepository()

// Types for hook options and state
export interface UseCDPProfilesOptions {
  initialFilters?: ProfileSearchFilters
  pageSize?: number
  autoFetch?: boolean
  enableRealTimeUpdates?: boolean
}

export interface UseCDPProfilesResult {
  // Data state
  profiles: Profile[]
  profile: Profile | null
  isLoading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  
  // Search and filtering
  filters: ProfileSearchFilters
  searchQuery: string
  
  // Metrics
  metrics: ProfileMetrics | null
  metricsLoading: boolean
  
  // Actions
  searchProfiles: (filters?: ProfileSearchFilters, page?: number) => Promise<void>
  setSearchQuery: (query: string) => void
  applyFilters: (filters: ProfileSearchFilters) => void
  clearFilters: () => void
  goToPage: (page: number) => void
  refreshProfiles: () => Promise<void>
  
  // CRUD operations
  createProfile: (data: CreateProfileRequest) => Promise<Profile>
  getProfile: (id: string) => Promise<Profile | null>
  getProfileByMobile: (mobile: string) => Promise<Profile | null>
  updateProfile: (id: string, data: UpdateProfileRequest) => Promise<Profile>
  deleteProfile: (id: string) => Promise<void>
  
  // Profile intelligence
  findMatches: (mobile: string, email?: string, firstName?: string, lastName?: string) => Promise<Array<{profile_id: string; match_score: number; match_reasons: string[]}>>
  mergeProfiles: (sourceId: string, targetId: string, userId?: string) => Promise<{success: boolean; contacts_moved?: number; activities_moved?: number; error?: string}>
  
  // Tags and custom fields
  addTags: (id: string, tags: string[]) => Promise<Profile>
  removeTags: (id: string, tags: string[]) => Promise<Profile>
  updateCustomField: (id: string, fieldKey: string, value: any) => Promise<Profile>
  removeCustomField: (id: string, fieldKey: string) => Promise<Profile>
  
  // Notification preferences
  updateNotificationPreferences: (id: string, preferences: Partial<NotificationPreferences>) => Promise<Profile>
  getOptedInProfiles: (channel: keyof NotificationPreferences, filters?: ProfileSearchFilters) => Promise<PaginatedResponse<Profile>>
  
  // Metrics and analytics
  loadMetrics: () => Promise<void>
  updateDataQualityScores: () => Promise<{updated_count: number}>
}

/**
 * Main CDP Profiles Hook
 */
export function useCDPProfiles(options: UseCDPProfilesOptions = {}): UseCDPProfilesResult {
  const {
    initialFilters = {},
    pageSize = 20,
    autoFetch = true,
    enableRealTimeUpdates = false
  } = options

  // State management
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<ProfileSearchFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)

  // Async data hook for main profiles list
  const {
    data: profilesData,
    isLoading,
    error,
    execute: fetchProfiles,
    refresh: refreshProfiles
  } = useAsyncData<PaginatedResponse<Profile>>(
    async () => {
      const searchFilters = searchQuery ? { ...filters, search: searchQuery } : filters
      return profilesRepo.search(searchFilters, currentPage, pageSize)
    },
    { immediate: autoFetch }
  )

  // Update profiles state when data changes
  useMemo(() => {
    if (profilesData) {
      setProfiles(profilesData.data)
      setTotalPages(Math.ceil(profilesData.total / pageSize))
      setTotalCount(profilesData.total)
    }
  }, [profilesData, pageSize])

  // Computed pagination state
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // =====================================================
  // SEARCH & FILTERING ACTIONS
  // =====================================================

  const searchProfiles = useCallback(async (newFilters?: ProfileSearchFilters, page?: number) => {
    if (newFilters) {
      setFilters(newFilters)
    }
    if (page !== undefined) {
      setCurrentPage(page)
    }
    await fetchProfiles()
  }, [fetchProfiles])

  const applyFilters = useCallback((newFilters: ProfileSearchFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    fetchProfiles()
  }, [fetchProfiles])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
    fetchProfiles()
  }, [fetchProfiles])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
    fetchProfiles()
  }, [fetchProfiles])

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    // Auto-search after a brief delay (can be debounced)
    const timer = setTimeout(() => {
      fetchProfiles()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchProfiles])

  // =====================================================
  // CRUD OPERATIONS
  // =====================================================

  const createProfile = useCallback(async (data: CreateProfileRequest): Promise<Profile> => {
    try {
      const newProfile = await profilesRepo.create(data)
      // Refresh the list to include the new profile
      await refreshProfiles()
      return newProfile
    } catch (err) {
      throw new Error(`Failed to create profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [refreshProfiles])

  const getProfile = useCallback(async (id: string): Promise<Profile | null> => {
    try {
      const profileData = await profilesRepo.getById(id)
      setProfile(profileData)
      return profileData
    } catch (err) {
      throw new Error(`Failed to get profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const getProfileByMobile = useCallback(async (mobile: string): Promise<Profile | null> => {
    try {
      const profileData = await profilesRepo.getByMobile(mobile)
      setProfile(profileData)
      return profileData
    } catch (err) {
      throw new Error(`Failed to get profile by mobile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const updateProfile = useCallback(async (id: string, data: UpdateProfileRequest): Promise<Profile> => {
    try {
      const updatedProfile = await profilesRepo.update(id, data)
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p))
      if (profile?.id === id) {
        setProfile(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      throw new Error(`Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [profile])

  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    try {
      await profilesRepo.delete(id)
      
      // Remove from local state
      setProfiles(prev => prev.filter(p => p.id !== id))
      if (profile?.id === id) {
        setProfile(null)
      }
      
      // Refresh to get accurate counts
      await refreshProfiles()
    } catch (err) {
      throw new Error(`Failed to delete profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [profile, refreshProfiles])

  // =====================================================
  // PROFILE INTELLIGENCE
  // =====================================================

  const findMatches = useCallback(async (
    mobile: string,
    email?: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      return await profilesRepo.findMatches(mobile, email, firstName, lastName)
    } catch (err) {
      throw new Error(`Failed to find matches: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const mergeProfiles = useCallback(async (
    sourceId: string,
    targetId: string,
    userId?: string
  ) => {
    try {
      const result = await profilesRepo.mergeProfiles(sourceId, targetId, userId)
      
      if (result.success) {
        // Remove source profile from local state and refresh
        setProfiles(prev => prev.filter(p => p.id !== sourceId))
        await refreshProfiles()
      }
      
      return result
    } catch (err) {
      throw new Error(`Failed to merge profiles: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [refreshProfiles])

  // =====================================================
  // TAGS & CUSTOM FIELDS
  // =====================================================

  const addTags = useCallback(async (id: string, tags: string[]): Promise<Profile> => {
    try {
      const updatedProfile = await profilesRepo.addTags(id, tags)
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p))
      if (profile?.id === id) {
        setProfile(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      throw new Error(`Failed to add tags: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [profile])

  const removeTags = useCallback(async (id: string, tags: string[]): Promise<Profile> => {
    try {
      const updatedProfile = await profilesRepo.removeTags(id, tags)
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p))
      if (profile?.id === id) {
        setProfile(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      throw new Error(`Failed to remove tags: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [profile])

  const updateCustomField = useCallback(async (id: string, fieldKey: string, value: any): Promise<Profile> => {
    try {
      const updatedProfile = await profilesRepo.updateCustomField(id, fieldKey, value)
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p))
      if (profile?.id === id) {
        setProfile(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      throw new Error(`Failed to update custom field: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [profile])

  const removeCustomField = useCallback(async (id: string, fieldKey: string): Promise<Profile> => {
    try {
      const updatedProfile = await profilesRepo.removeCustomField(id, fieldKey)
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p))
      if (profile?.id === id) {
        setProfile(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      throw new Error(`Failed to remove custom field: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [profile])

  // =====================================================
  // NOTIFICATION PREFERENCES
  // =====================================================

  const updateNotificationPreferences = useCallback(async (
    id: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<Profile> => {
    try {
      const updatedProfile = await profilesRepo.updateNotificationPreferences(id, preferences)
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p))
      if (profile?.id === id) {
        setProfile(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      throw new Error(`Failed to update notification preferences: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [profile])

  const getOptedInProfiles = useCallback(async (
    channel: keyof NotificationPreferences,
    optFilters?: ProfileSearchFilters
  ): Promise<PaginatedResponse<Profile>> => {
    try {
      return await profilesRepo.getOptedInProfiles(channel, optFilters)
    } catch (err) {
      throw new Error(`Failed to get opted-in profiles: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // =====================================================
  // METRICS & ANALYTICS
  // =====================================================

  const loadMetrics = useCallback(async (): Promise<void> => {
    setMetricsLoading(true)
    try {
      const metricsData = await profilesRepo.getMetrics()
      setMetrics(metricsData)
    } catch (err) {
      console.error('Failed to load metrics:', err)
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  const updateDataQualityScores = useCallback(async () => {
    try {
      return await profilesRepo.updateDataQualityScores()
    } catch (err) {
      throw new Error(`Failed to update data quality scores: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================

  return {
    // Data state
    profiles,
    profile,
    isLoading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    
    // Search and filtering
    filters,
    searchQuery,
    
    // Metrics
    metrics,
    metricsLoading,
    
    // Actions
    searchProfiles,
    setSearchQuery: handleSetSearchQuery,
    applyFilters,
    clearFilters,
    goToPage,
    refreshProfiles,
    
    // CRUD operations
    createProfile,
    getProfile,
    getProfileByMobile,
    updateProfile,
    deleteProfile,
    
    // Profile intelligence
    findMatches,
    mergeProfiles,
    
    // Tags and custom fields
    addTags,
    removeTags,
    updateCustomField,
    removeCustomField,
    
    // Notification preferences
    updateNotificationPreferences,
    getOptedInProfiles,
    
    // Metrics and analytics
    loadMetrics,
    updateDataQualityScores
  }
}

/**
 * Hook for single profile management
 */
export function useCDPProfile(profileId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const profileData = await profilesRepo.getById(id)
      setProfile(profileData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    if (!profile) return null
    
    setIsLoading(true)
    setError(null)
    try {
      const updatedProfile = await profilesRepo.update(profile.id, data)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  // Auto-load profile if profileId is provided
  useMemo(() => {
    if (profileId) {
      loadProfile(profileId)
    }
  }, [profileId, loadProfile])

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    refreshProfile: () => profile ? loadProfile(profile.id) : Promise.resolve()
  }
}