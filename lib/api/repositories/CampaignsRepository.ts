import { BaseRepository } from './BaseRepository'
import { RepositoryResponse, QueryOptions } from './types'
import { supabase } from '@/lib/supabase'

/**
 * Campaign entity interface
 */
export interface Campaign {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  status: string | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  creator_id: string | null;
  template_id: string | null;
  segment_id: string | null;
  list_id: string | null;
  channel: string | null;
  budget: number;
  performance_metrics: any;
  a_b_test: boolean;
  a_b_test_variables: any;
  tags: string[];
}

/**
 * Repository for managing campaign data operations.
 * Handles campaigns table and related campaign analytics.
 */
export class CampaignsRepository extends BaseRepository<Campaign> {
  private static instance: CampaignsRepository

  private constructor() {
    super({
      tableName: 'campaigns',
      primaryKey: 'id',
      enableLogging: process.env.NODE_ENV === 'development',
      enableCaching: false,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    })
  }

  public static getInstance(): CampaignsRepository {
    if (!CampaignsRepository.instance) {
      CampaignsRepository.instance = new CampaignsRepository()
    }
    return CampaignsRepository.instance
  }

  /**
   * Get campaign with performance metrics
   */
  public async getCampaignWithMetrics(campaignId: string): Promise<RepositoryResponse<Campaign & { metrics?: any }>> {
    const query = supabase
      .from('campaigns')
      .select(`
        *,
        campaign_sends (
          id,
          status,
          cost,
          total_recipients,
          date_sent
        )
      `)
      .eq('id', campaignId)
      .single()

    return this.executeQuery(query, 'getCampaignWithMetrics') as Promise<RepositoryResponse<Campaign & { metrics?: any }>>
  }

  /**
   * Get campaigns by status with optional filtering
   */
  public async getCampaignsByStatus(
    status: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Campaign[]>> {
    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('status', status)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      const from = (options.page && options.page > 0 ? options.page - 1 : 0) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    }

    const { data, error } = await query
    
    if (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'getCampaignsByStatus'))
    }
    
    return this.createResponse(data)
  }

  /**
   * Get campaigns by creator
   */
  public async getCampaignsByCreator(
    creatorId: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Campaign[]>> {
    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('creator_id', creatorId)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      const from = (options.page && options.page > 0 ? options.page - 1 : 0) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    }

    const { data, error } = await query
    
    if (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'getCampaignsByCreator'))
    }
    
    return this.createResponse(data)
  }

  /**
   * Search campaigns by name and description
   */
  public async searchCampaigns(
    searchTerm: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Campaign[]>> {
    let query = supabase
      .from('campaigns')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      const from = (options.page && options.page > 0 ? options.page - 1 : 0) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    }

    const { data, error } = await query
    
    if (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'searchCampaigns'))
    }
    
    return this.createResponse(data)
  }

  /**
   * Get campaigns by channel (SMS, Email, etc.)
   */
  public async getCampaignsByChannel(
    channel: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Campaign[]>> {
    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('channel', channel)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query
    
    if (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'getCampaignsByChannel'))
    }
    
    return this.createResponse(data)
  }

  /**
   * Update campaign performance metrics
   */
  public async updatePerformanceMetrics(
    campaignId: string,
    metrics: any
  ): Promise<RepositoryResponse<Campaign>> {
    const query = supabase
      .from('campaigns')
      .update({ 
        performance_metrics: metrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single()

    const { data, error } = await query
    
    if (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'updatePerformanceMetrics'))
    }
    
    return this.createResponse(data)
  }

  /**
   * Get campaigns with activity data for dashboard
   */
  public async getCampaignsForActivity(
    options?: QueryOptions
  ): Promise<RepositoryResponse<Campaign[]>> {
    // Use the base repository's findMany method with custom select
    const selectFields = 'id,name,type,status,channel,created_at,performance_metrics,budget'
    
    return this.findMany({}, {
      ...options,
      select: selectFields,
      orderBy: options?.orderBy || 'created_at',
      ascending: options?.ascending ?? false
    })
  }
}

// Export singleton instance for easy access
export const campaignsRepository = CampaignsRepository.getInstance()