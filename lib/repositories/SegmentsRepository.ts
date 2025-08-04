import { BaseRepository } from './BaseRepository'
import { RepositoryResponse, QueryOptions } from './types'
import { supabase } from '@/lib/supabase'

/**
 * Segment entity interface
 */
export interface Segment {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  creator_id: string | null;
  filter_criteria: any;
  estimated_size: number;
  last_refresh: string | null;
  auto_update: boolean;
  tags: string[];
  shared: boolean;
  type: string | null;
  tag: string | null;
}

/**
 * Repository for managing segment data operations.
 * Handles segments table and related audience segmentation functionality.
 */
export class SegmentsRepository extends BaseRepository<Segment> {
  private static instance: SegmentsRepository

  private constructor() {
    super({
      tableName: 'segments',
      primaryKey: 'id',
      enableLogging: process.env.NODE_ENV === 'development',
      enableCaching: false,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    })
  }

  public static getInstance(): SegmentsRepository {
    if (!SegmentsRepository.instance) {
      SegmentsRepository.instance = new SegmentsRepository()
    }
    return SegmentsRepository.instance
  }

  /**
   * Get segments by type
   */
  public async getSegmentsByType(
    type: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Segment[]>> {
    let query = supabase
      .from('segments')
      .select('*')
      .eq('type', type)

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

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment[]>>
  }

  /**
   * Get segments by creator
   */
  public async getSegmentsByCreator(
    creatorId: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Segment[]>> {
    let query = supabase
      .from('segments')
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

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment[]>>
  }

  /**
   * Search segments by name and description
   */
  public async searchSegments(
    searchTerm: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Segment[]>> {
    let query = supabase
      .from('segments')
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

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment[]>>
  }

  /**
   * Get shared segments
   */
  public async getSharedSegments(options?: QueryOptions): Promise<RepositoryResponse<Segment[]>> {
    let query = supabase
      .from('segments')
      .select('*')
      .eq('shared', true)

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

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment[]>>
  }

  /**
   * Get segments with auto-update enabled
   */
  public async getAutoUpdateSegments(options?: QueryOptions): Promise<RepositoryResponse<Segment[]>> {
    let query = supabase
      .from('segments')
      .select('*')
      .eq('auto_update', true)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('last_refresh', { ascending: true }) // Oldest refresh first for processing
    }

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment[]>>
  }

  /**
   * Update segment size estimate
   */
  public async updateEstimatedSize(
    segmentId: string,
    newSize: number
  ): Promise<RepositoryResponse<Segment>> {
    const query = supabase
      .from('segments')
      .update({ 
        estimated_size: newSize,
        last_refresh: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', segmentId)
      .select()
      .single()

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment>>
  }

  /**
   * Refresh segment data (recalculate size and update timestamp)
   */
  public async refreshSegment(segmentId: string): Promise<RepositoryResponse<Segment>> {
    // Get the segment to access its filter criteria
    const segmentResponse = await this.getById(segmentId)
    if (segmentResponse.error || !segmentResponse.data) {
      return { data: null, error: segmentResponse.error }
    }

    const segment = segmentResponse.data
    
    // Here you would implement the logic to calculate the segment size
    // based on filter_criteria. For now, we'll just update the refresh timestamp
    // In a real implementation, this would query the contacts table with the filters
    
    let estimatedSize = segment.estimated_size // Keep existing size for now
    
    // TODO: Implement actual segment size calculation based on filter_criteria
    // Example pseudo-code:
    // const contacts = await supabase
    //   .from('contacts')
    //   .select('id', { count: 'exact' })
    //   .match(segment.filter_criteria)
    // estimatedSize = contacts.count || 0

    const query = supabase
      .from('segments')
      .update({ 
        estimated_size: estimatedSize,
        last_refresh: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', segmentId)
      .select()
      .single()

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment>>
  }

  /**
   * Get segments by tags
   */
  public async getSegmentsByTags(
    tags: string[],
    options?: QueryOptions
  ): Promise<RepositoryResponse<Segment[]>> {
    let query = supabase
      .from('segments')
      .select('*')
      .contains('tags', tags)

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

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment[]>>
  }

  /**
   * Calculate actual segment size (execute the filter criteria)
   */
  public async calculateSegmentSize(segmentId: string): Promise<RepositoryResponse<number>> {
    const segmentResponse = await this.getById(segmentId)
    if (segmentResponse.error || !segmentResponse.data) {
      return { data: null, error: segmentResponse.error }
    }

    const segment = segmentResponse.data
    
    try {
      // This is a simplified example - in reality, you'd need to parse
      // the filter_criteria and build appropriate Supabase queries
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        // .match(segment.filter_criteria) // Would need proper filter parsing
      
      if (error) {
        console.error('Error calculating segment size:', error)
        return { data: null, error: { message: error.message, status: 500 } }
      }

      return { data: count || 0, error: null }
    } catch (error: any) {
      console.error('Error calculating segment size:', error)
      return { data: null, error: { message: error.message, status: 500 } }
    }
  }

  /**
   * Clone a segment with new name
   */
  public async cloneSegment(
    segmentId: string,
    newName: string,
    creatorId?: string
  ): Promise<RepositoryResponse<Segment>> {
    const originalSegment = await this.getById(segmentId)
    if (originalSegment.error || !originalSegment.data) {
      return { data: null, error: originalSegment.error }
    }

    const clonedSegmentData = {
      ...originalSegment.data,
      id: undefined, // Let database generate new ID
      name: newName,
      creator_id: creatorId || originalSegment.data.creator_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_refresh: null, // Reset refresh timestamp
      shared: false, // Cloned segments are private by default
    }

    const query = supabase
      .from('segments')
      .insert(clonedSegmentData)
      .select()
      .single()

    return this.executeQuery(query) as Promise<RepositoryResponse<Segment>>
  }
}

// Export singleton instance for easy access
export const segmentsRepository = SegmentsRepository.getInstance()