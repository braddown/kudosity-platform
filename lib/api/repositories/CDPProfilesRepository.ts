/**
 * CDP Profiles Repository
 * 
 * Repository for managing Profile entities in the Customer Data Platform.
 * Handles all database operations for master customer records.
 */

import { supabase } from '@/lib/supabase'
import type { 
  Profile, 
  CreateProfileRequest, 
  UpdateProfileRequest,
  ProfileSearchFilters,
  PaginatedResponse,
  ProfileMetrics
} from '@/lib/types'

export class CDPProfilesRepository {
  
  // =====================================================
  // PROFILE CRUD OPERATIONS
  // =====================================================
  
  /**
   * Create a new profile
   */
  async create(data: CreateProfileRequest): Promise<Profile> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        mobile: data.mobile,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        source: data.source,
        source_details: data.source_details || {},
        custom_fields: data.custom_fields || {},
        notification_preferences: {
          // Set defaults, then override with provided values
          marketing_sms: true,
          marketing_email: true,
          transactional_sms: true,
          transactional_email: true,
          marketing_whatsapp: false,
          transactional_whatsapp: false,
          marketing_rcs: false,
          transactional_rcs: false,
          ...data.notification_preferences
        },
        tags: data.tags || [],
        lifecycle_stage: data.lifecycle_stage || 'lead',
        consent_date: data.consent_date,
        consent_source: data.consent_source
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`)
    }

    return profile
  }

  /**
   * Get profile by ID
   */
  async getById(id: string): Promise<Profile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('merge_status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Profile not found
      }
      throw new Error(`Failed to get profile: ${error.message}`)
    }

    return profile
  }

  /**
   * Get profile by mobile number
   */
  async getByMobile(mobile: string): Promise<Profile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('mobile', mobile)
      .eq('merge_status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Profile not found
      }
      throw new Error(`Failed to get profile by mobile: ${error.message}`)
    }

    return profile
  }

  /**
   * Update profile
   */
  async update(id: string, data: UpdateProfileRequest): Promise<Profile> {
    const updateData: any = {}
    
    // Only include defined fields
    if (data.first_name !== undefined) updateData.first_name = data.first_name
    if (data.last_name !== undefined) updateData.last_name = data.last_name
    if (data.email !== undefined) updateData.email = data.email
    if (data.mobile !== undefined) updateData.mobile = data.mobile
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.address_line_1 !== undefined) updateData.address_line_1 = data.address_line_1
    if (data.address_line_2 !== undefined) updateData.address_line_2 = data.address_line_2
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.postal_code !== undefined) updateData.postal_code = data.postal_code
    if (data.country !== undefined) updateData.country = data.country
    if (data.lifecycle_stage !== undefined) updateData.lifecycle_stage = data.lifecycle_stage
    if (data.lead_score !== undefined) updateData.lead_score = data.lead_score
    if (data.lifetime_value !== undefined) updateData.lifetime_value = data.lifetime_value
    if (data.custom_fields !== undefined) updateData.custom_fields = data.custom_fields
    if (data.notification_preferences !== undefined) updateData.notification_preferences = data.notification_preferences
    if (data.tags !== undefined) updateData.tags = data.tags

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    return profile
  }

  /**
   * Delete (soft delete by marking as archived)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ merge_status: 'archived' })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`)
    }
  }

  // =====================================================
  // SEARCH & FILTERING
  // =====================================================

  /**
   * Search profiles with filters and pagination
   */
  async search(
    filters: ProfileSearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Profile>> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('merge_status', 'active')

    // Apply filters
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,mobile.ilike.%${filters.search}%`)
    }

    if (filters.lifecycle_stage?.length) {
      query = query.in('lifecycle_stage', filters.lifecycle_stage)
    }

    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.source?.length) {
      query = query.in('source', filters.source)
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }

    if (filters.last_activity_after) {
      query = query.gte('last_activity_at', filters.last_activity_after)
    }

    if (filters.last_activity_before) {
      query = query.lte('last_activity_at', filters.last_activity_before)
    }

    if (filters.lead_score_min !== undefined) {
      query = query.gte('lead_score', filters.lead_score_min)
    }

    if (filters.lead_score_max !== undefined) {
      query = query.lte('lead_score', filters.lead_score_max)
    }

    if (filters.has_email !== undefined) {
      if (filters.has_email) {
        query = query.not('email', 'is', null)
      } else {
        query = query.is('email', null)
      }
    }

    if (filters.has_mobile !== undefined) {
      if (filters.has_mobile) {
        query = query.not('mobile', 'is', null)
      } else {
        query = query.is('mobile', null)
      }
    }

    // Custom fields filtering
    if (filters.custom_fields) {
      for (const [key, value] of Object.entries(filters.custom_fields)) {
        query = query.contains('custom_fields', { [key]: value })
      }
    }

    // Pagination
    const offset = (page - 1) * pageSize
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data: profiles, error, count } = await query

    if (error) {
      throw new Error(`Failed to search profiles: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: profiles || [],
      total,
      page,
      page_size: pageSize,
      has_next: page < totalPages,
      has_previous: page > 1
    }
  }

  // =====================================================
  // PROFILE INTELLIGENCE & METRICS
  // =====================================================

  /**
   * Get profile metrics for dashboard
   */
  async getMetrics(): Promise<ProfileMetrics> {
    // Get basic counts
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: activeProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('merge_status', 'active')

    const { count: duplicateProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('merge_status', 'duplicate')

    // Get lifecycle stage distribution
    const { data: lifecycleData } = await supabase
      .from('profiles')
      .select('lifecycle_stage')
      .eq('merge_status', 'active')

    const profilesByLifecycle = lifecycleData?.reduce((acc, profile) => {
      acc[profile.lifecycle_stage] = (acc[profile.lifecycle_stage] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get average metrics
    const { data: metricsData } = await supabase
      .from('profiles')
      .select('lead_score, lifetime_value')
      .eq('merge_status', 'active')

    const averageLeadScore = metricsData?.length 
      ? Math.round(metricsData.reduce((sum, p) => sum + (p.lead_score || 0), 0) / metricsData.length)
      : 0

    const totalLifetimeValue = metricsData?.reduce((sum, p) => sum + (p.lifetime_value || 0), 0) || 0

    // Get recent creation counts
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { count: createdToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('merge_status', 'active')
      .gte('created_at', today.toISOString().split('T')[0])

    const { count: createdThisWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('merge_status', 'active')
      .gte('created_at', weekAgo.toISOString())

    const { count: createdThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('merge_status', 'active')
      .gte('created_at', monthAgo.toISOString())

    return {
      total_profiles: totalProfiles || 0,
      active_profiles: activeProfiles || 0,
      duplicate_profiles: duplicateProfiles || 0,
      profiles_by_lifecycle: profilesByLifecycle,
      average_lead_score: averageLeadScore,
      total_lifetime_value: totalLifetimeValue,
      profiles_created_today: createdToday || 0,
      profiles_created_this_week: createdThisWeek || 0,
      profiles_created_this_month: createdThisMonth || 0
    }
  }

  /**
   * Update data quality scores for all profiles
   */
  async updateDataQualityScores(): Promise<{ updated_count: number }> {
    const { data, error } = await supabase.rpc('update_all_profile_quality_scores')

    if (error) {
      throw new Error(`Failed to update quality scores: ${error.message}`)
    }

    return { updated_count: data || 0 }
  }

  // =====================================================
  // PROFILE MATCHING & MERGING
  // =====================================================

  /**
   * Find potential matches for profile data
   */
  async findMatches(
    mobile: string,
    email?: string,
    firstName?: string,
    lastName?: string
  ): Promise<Array<{ profile_id: string; match_score: number; match_reasons: string[] }>> {
    const { data, error } = await supabase.rpc('find_profile_matches', {
      input_mobile: mobile,
      input_email: email,
      input_first_name: firstName,
      input_last_name: lastName
    })

    if (error) {
      throw new Error(`Failed to find profile matches: ${error.message}`)
    }

    return data || []
  }

  /**
   * Merge two profiles
   */
  async mergeProfiles(
    sourceProfileId: string,
    targetProfileId: string,
    mergedByUserId?: string
  ): Promise<{ success: boolean; contacts_moved?: number; activities_moved?: number; error?: string }> {
    const { data, error } = await supabase.rpc('merge_profiles', {
      source_profile_id: sourceProfileId,
      target_profile_id: targetProfileId,
      merged_by_user_id: mergedByUserId
    })

    if (error) {
      throw new Error(`Failed to merge profiles: ${error.message}`)
    }

    return data
  }

  // =====================================================
  // TAGS & CUSTOM FIELDS
  // =====================================================

  /**
   * Add tags to a profile
   */
  async addTags(id: string, tags: string[]): Promise<Profile> {
    // Get current profile
    const profile = await this.getById(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Merge new tags with existing ones (remove duplicates)
    const updatedTags = Array.from(new Set([...profile.tags, ...tags]))

    return this.update(id, { tags: updatedTags })
  }

  /**
   * Remove tags from a profile
   */
  async removeTags(id: string, tags: string[]): Promise<Profile> {
    const profile = await this.getById(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const updatedTags = profile.tags.filter(tag => !tags.includes(tag))

    return this.update(id, { tags: updatedTags })
  }

  /**
   * Update custom field for a profile
   */
  async updateCustomField(id: string, fieldKey: string, value: any): Promise<Profile> {
    const profile = await this.getById(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const updatedCustomFields = {
      ...profile.custom_fields,
      [fieldKey]: value
    }

    return this.update(id, { custom_fields: updatedCustomFields })
  }

  /**
   * Remove custom field from a profile
   */
  async removeCustomField(id: string, fieldKey: string): Promise<Profile> {
    const profile = await this.getById(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const updatedCustomFields = { ...profile.custom_fields }
    delete updatedCustomFields[fieldKey]

    return this.update(id, { custom_fields: updatedCustomFields })
  }

  // =====================================================
  // NOTIFICATION PREFERENCES
  // =====================================================

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    id: string, 
    preferences: Partial<Profile['notification_preferences']>
  ): Promise<Profile> {
    const profile = await this.getById(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const updatedPreferences = {
      ...profile.notification_preferences,
      ...preferences
    }

    return this.update(id, { notification_preferences: updatedPreferences })
  }

  /**
   * Get profiles that have opted in to a specific channel
   */
  async getOptedInProfiles(
    channel: keyof Profile['notification_preferences'],
    filters?: ProfileSearchFilters,
    page: number = 1,
    pageSize: number = 100
  ): Promise<PaginatedResponse<Profile>> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('merge_status', 'active')
      .eq(`notification_preferences->${channel}`, true)

    // Apply additional filters if provided
    if (filters?.lifecycle_stage?.length) {
      query = query.in('lifecycle_stage', filters.lifecycle_stage)
    }

    if (filters?.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    // Pagination
    const offset = (page - 1) * pageSize
    query = query
      .order('last_activity_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data: profiles, error, count } = await query

    if (error) {
      throw new Error(`Failed to get opted-in profiles: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: profiles || [],
      total,
      page,
      page_size: pageSize,
      has_next: page < totalPages,
      has_previous: page > 1
    }
  }
}