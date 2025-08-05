import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  Profile, 
  UseProfilesOptions, 
  UseProfilesResult,
  ContactProcessingResult 
} from '@/lib/types/cdp-types'

/**
 * CDP Profiles Hook - Manages customer profiles with intelligent matching
 * 
 * This hook provides CRUD operations for the new CDP profiles system,
 * including profile creation, updates, merging, and intelligent search.
 */
export function useCDPProfiles(options: UseProfilesOptions = {}): UseProfilesResult {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  
  // Using imported supabase client
  
  const {
    filters = {},
    pagination = { page: 1, pageSize: 50 },
    sort = { field: 'created_at', direction: 'desc' }
  } = options

  // Calculate pagination
  const currentPage = pagination.page || 1
  const pageSize = pagination.pageSize || 50
  const offset = (currentPage - 1) * pageSize
  const totalPages = Math.ceil(totalCount / pageSize)

  // Fetch profiles with filters and pagination
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('cdp_profiles')
        .select('*', { count: 'exact' })
        .eq('merge_status', 'active') // Only show active profiles

      // Apply filters
      if (filters.lifecycle_stage) {
        query = query.eq('lifecycle_stage', filters.lifecycle_stage)
      }
      
      if (filters.source) {
        query = query.eq('source', filters.source)
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      
      if (filters.search) {
        // Search across multiple fields
        query = query.or(`
          first_name.ilike.%${filters.search}%,
          last_name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%,
          mobile.ilike.%${filters.search}%
        `)
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      setProfiles(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching CDP profiles:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles')
    } finally {
      setLoading(false)
    }
  }, [supabase, filters, pagination, sort, offset, pageSize])

  // Create new profile
  const createProfile = useCallback(async (profileData: Partial<Profile>): Promise<Profile> => {
    try {
      const { data, error: insertError } = await supabase
        .from('cdp_profiles')
        .insert([{
          mobile: profileData.mobile || '',
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          lifecycle_stage: profileData.lifecycle_stage || 'lead',
          source: profileData.source || 'manual_entry',
          custom_fields: profileData.custom_fields || {},
          notification_preferences: profileData.notification_preferences || {
            marketing_sms: true,
            marketing_email: true,
            transactional_sms: true,
            transactional_email: true,
            marketing_whatsapp: false,
            transactional_whatsapp: false,
            marketing_rcs: false,
            transactional_rcs: false
          },
          tags: profileData.tags || []
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh the list
      await fetchProfiles()
      
      return data
    } catch (err) {
      console.error('Error creating CDP profile:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to create profile')
    }
  }, [supabase, fetchProfiles])

  // Update existing profile
  const updateProfile = useCallback(async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    try {
      const { data, error: updateError } = await supabase
        .from('cdp_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      setProfiles(prev => prev.map(profile => 
        profile.id === id ? { ...profile, ...data } : profile
      ))
      
      return data
    } catch (err) {
      console.error('Error updating CDP profile:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }, [supabase])

  // Delete profile (soft delete by marking as archived)
  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('cdp_profiles')
        .update({ merge_status: 'archived' })
        .eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      setProfiles(prev => prev.filter(profile => profile.id !== id))
      setTotalCount(prev => prev - 1)
    } catch (err) {
      console.error('Error deleting CDP profile:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to delete profile')
    }
  }, [supabase])

  // Merge two profiles
  const mergeProfiles = useCallback(async (sourceId: string, targetId: string): Promise<void> => {
    try {
      const { data, error: mergeError } = await supabase.rpc('merge_cdp_profiles', {
        source_profile_id: sourceId,
        target_profile_id: targetId
      })

      if (mergeError) throw mergeError

      // Refresh the list to show updated state
      await fetchProfiles()
    } catch (err) {
      console.error('Error merging CDP profiles:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to merge profiles')
    }
  }, [supabase, fetchProfiles])

  // Find potential duplicate profiles
  const findPotentialDuplicates = useCallback(async (profileId: string) => {
    try {
      const profile = profiles.find(p => p.id === profileId)
      if (!profile) throw new Error('Profile not found')

      const { data, error } = await supabase.rpc('find_cdp_profile_matches', {
        input_mobile: profile.mobile,
        input_email: profile.email,
        input_first_name: profile.first_name,
        input_last_name: profile.last_name
      })

      if (error) throw error

      return data.filter((match: any) => match.profile_id !== profileId)
    } catch (err) {
      console.error('Error finding potential duplicates:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to find duplicates')
    }
  }, [supabase, profiles])

  // Process a contact into the CDP system
  const processContact = useCallback(async (contactData: {
    mobile: string
    email?: string
    first_name?: string
    last_name?: string
    source: string
    source_details?: Record<string, any>
    raw_data?: Record<string, any>
  }): Promise<ContactProcessingResult> => {
    try {
      // First, create the contact record
      const { data: contact, error: contactError } = await supabase
        .from('cdp_contacts')
        .insert([{
          mobile: contactData.mobile,
          email: contactData.email,
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          source: contactData.source,
          source_details: contactData.source_details || {},
          raw_data: contactData.raw_data || {}
        }])
        .select()
        .single()

      if (contactError) throw contactError

      // Process the contact through the CDP system
      const { data: result, error: processError } = await supabase.rpc('process_cdp_contact', {
        contact_uuid: contact.id
      })

      if (processError) throw processError

      // Refresh profiles if a new one was created
      if (result.action === 'new_profile_created' || result.action === 'auto_matched') {
        await fetchProfiles()
      }

      return result
    } catch (err) {
      console.error('Error processing contact:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to process contact')
    }
  }, [supabase, fetchProfiles])

  // Filter and search utilities
  const setFilters = useCallback((newFilters: UseProfilesOptions['filters']) => {
    // This would trigger a re-fetch with new filters
    // Implementation depends on how the parent component manages state
  }, [])

  const clearFilters = useCallback(() => {
    // Clear all filters and refresh
    setFilters({})
  }, [setFilters])

  const refetch = useCallback(async () => {
    await fetchProfiles()
  }, [fetchProfiles])

  // Load profiles on mount and when dependencies change
  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return {
    profiles,
    loading,
    error,
    totalCount,
    pagination: {
      page: currentPage,
      pageSize,
      totalPages
    },
    // CRUD operations
    createProfile,
    updateProfile,
    deleteProfile,
    mergeProfiles,
    // Filtering and search
    setFilters,
    clearFilters,
    refetch,
    // CDP-specific operations
    findPotentialDuplicates,
    processContact
  } as UseProfilesResult & {
    findPotentialDuplicates: (profileId: string) => Promise<any[]>
    processContact: (contactData: any) => Promise<ContactProcessingResult>
  }
}