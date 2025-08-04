/**
 * ProfilesRepository
 * 
 * Repository for managing profile data operations.
 * Replaces direct Supabase calls and lib/profiles-api.ts abstractions.
 */

import { BaseRepository } from './BaseRepository'
import { RepositoryResponse, FilterOptions, QueryOptions } from './types'
import { supabase } from '@/lib/supabase'

/**
 * Profile entity type
 */
export interface Profile {
  id: string
  created_at?: string
  updated_at?: string
  first_name: string
  last_name: string
  email?: string
  status?: 'Active' | 'Inactive'
  last_login?: string
  performance_metrics?: any
  avatar_url?: string
  timezone?: string
  language_preferences?: string[]
  notification_preferences?: any
  state?: string
  country: string
  mobile?: string
  device?: string
  os?: string
  location?: string
  source?: string
  tags?: string[]
  lifetime_value?: number
  custom_fields?: any
}

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>

/**
 * Profiles repository class
 */
export class ProfilesRepository extends BaseRepository<Profile, ProfileInsert, ProfileUpdate> {
  private static instance: ProfilesRepository

  private constructor() {
    super({
      tableName: 'profiles',
      primaryKey: 'id',
      enableLogging: process.env.NODE_ENV === 'development',
      enableCaching: false,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    })
  }

  /**
   * Singleton pattern for repository access
   */
  public static getInstance(): ProfilesRepository {
    if (!ProfilesRepository.instance) {
      ProfilesRepository.instance = new ProfilesRepository()
    }
    return ProfilesRepository.instance
  }

  // Business logic methods specific to profiles

  /**
   * Find profile by email
   */
  async findByEmail(email: string): Promise<RepositoryResponse<Profile>> {
    try {
      const { data, error } = await this.findMany({ email }, { limit: 1 })
      
      if (error) {
        return this.createResponse(null, error)
      }

      return this.createResponse(data?.[0] || null)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'findByEmail'))
    }
  }

  /**
   * Find profiles by status
   */
  async findByStatus(status: 'Active' | 'Inactive'): Promise<RepositoryResponse<Profile[]>> {
    return this.findMany({ status })
  }

  /**
   * Search profiles by name or email
   */
  async search(query: string, options?: QueryOptions): Promise<RepositoryResponse<Profile[]>> {
    try {
      this.log('search', { query, options })

      // Use raw Supabase query for complex search operations
      const { data, error } = await supabase
        .from(this.config.tableName)
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(options?.limit || 50)
        .order(options?.orderBy || 'created_at', { ascending: options?.ascending ?? false })

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'search'))
      }

      return this.createResponse(data as Profile[] || [])
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'search'))
    }
  }

  /**
   * Update profile performance metrics
   */
  async updatePerformanceMetrics(
    id: string, 
    metrics: any
  ): Promise<RepositoryResponse<Profile>> {
    return this.update(id, { 
      performance_metrics: metrics,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Add tags to profile
   */
  async addTags(id: string, newTags: string[]): Promise<RepositoryResponse<Profile>> {
    try {
      const profileResponse = await this.findById(id)
      if (!profileResponse.success || !profileResponse.data) {
        return profileResponse
      }

      const currentTags = profileResponse.data.tags || []
      const uniqueTags = [...new Set([...currentTags, ...newTags])]

      return this.update(id, { tags: uniqueTags })
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'addTags'))
    }
  }

  /**
   * Remove tags from profile
   */
  async removeTags(id: string, tagsToRemove: string[]): Promise<RepositoryResponse<Profile>> {
    try {
      const profileResponse = await this.findById(id)
      if (!profileResponse.success || !profileResponse.data) {
        return profileResponse
      }

      const currentTags = profileResponse.data.tags || []
      const filteredTags = currentTags.filter(tag => !tagsToRemove.includes(tag))

      return this.update(id, { tags: filteredTags })
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'removeTags'))
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<RepositoryResponse<Profile>> {
    return this.update(id, { 
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Get profiles with pagination
   */
  async findPaginated(
    page: number = 1,
    pageSize: number = 50,
    filters?: FilterOptions
  ): Promise<RepositoryResponse<{
    data: Profile[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }>> {
    try {
      // Get total count
      const countResponse = await this.count(filters)
      if (!countResponse.success) {
        return this.createResponse(null, countResponse.error)
      }

      const total = countResponse.data || 0
      const totalPages = Math.ceil(total / pageSize)
      const offset = (page - 1) * pageSize

      // Get paginated data
      const dataResponse = await this.findMany(filters, {
        limit: pageSize,
        offset,
        orderBy: 'created_at',
        ascending: false
      })

      if (!dataResponse.success) {
        return this.createResponse(null, dataResponse.error)
      }

      const result = {
        data: dataResponse.data || [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }

      return this.createResponse(result)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'findPaginated'))
    }
  }

  /**
   * Bulk update profiles
   */
  async bulkUpdateStatus(
    profileIds: string[], 
    status: 'Active' | 'Inactive'
  ): Promise<RepositoryResponse<Profile[]>> {
    try {
      this.log('bulkUpdateStatus', { profileIds, status })

      const { data, error } = await supabase
        .from(this.config.tableName)
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .in('id', profileIds)
        .select()

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'bulkUpdateStatus'))
      }

      return this.createResponse(data as Profile[] || [])
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'bulkUpdateStatus'))
    }
  }
}

// Export singleton instance for easy access
export const profilesRepository = ProfilesRepository.getInstance()