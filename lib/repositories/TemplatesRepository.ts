import { BaseRepository } from './BaseRepository'
import { RepositoryResponse, QueryOptions } from './types'
import { supabase } from '@/lib/supabase'

/**
 * Template entity interface
 */
export interface Template {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  creator_id: string | null;
  content: string;
  variables: string[];
  channel: string | null;
  category: string | null;
  tags: string[];
  version: string | null;
  status: string | null;
  performance_metrics: any;
}

/**
 * Repository for managing template data operations.
 * Handles templates table and related template functionality.
 */
export class TemplatesRepository extends BaseRepository<Template> {
  private static instance: TemplatesRepository

  private constructor() {
    super({
      tableName: 'templates',
      primaryKey: 'id',
      enableLogging: process.env.NODE_ENV === 'development',
      enableCaching: false,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    })
  }

  public static getInstance(): TemplatesRepository {
    if (!TemplatesRepository.instance) {
      TemplatesRepository.instance = new TemplatesRepository()
    }
    return TemplatesRepository.instance
  }

  /**
   * Get templates by channel (SMS, Email, etc.)
   */
  public async getTemplatesByChannel(
    channel: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Template[]>> {
    let query = supabase
      .from('templates')
      .select('*')
      .eq('channel', channel)

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

    return this.executeQuery(query) as Promise<RepositoryResponse<Template[]>>
  }

  /**
   * Get templates by status
   */
  public async getTemplatesByStatus(
    status: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Template[]>> {
    let query = supabase
      .from('templates')
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

    return this.executeQuery(query) as Promise<RepositoryResponse<Template[]>>
  }

  /**
   * Get templates by category
   */
  public async getTemplatesByCategory(
    category: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Template[]>> {
    let query = supabase
      .from('templates')
      .select('*')
      .eq('category', category)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    return this.executeQuery(query) as Promise<RepositoryResponse<Template[]>>
  }

  /**
   * Search templates by name and content
   */
  public async searchTemplates(
    searchTerm: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Template[]>> {
    let query = supabase
      .from('templates')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

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

    return this.executeQuery(query) as Promise<RepositoryResponse<Template[]>>
  }

  /**
   * Get templates by creator
   */
  public async getTemplatesByCreator(
    creatorId: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Template[]>> {
    let query = supabase
      .from('templates')
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

    return this.executeQuery(query) as Promise<RepositoryResponse<Template[]>>
  }

  /**
   * Get templates by tags
   */
  public async getTemplatesByTags(
    tags: string[],
    options?: QueryOptions
  ): Promise<RepositoryResponse<Template[]>> {
    let query = supabase
      .from('templates')
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

    return this.executeQuery(query) as Promise<RepositoryResponse<Template[]>>
  }

  /**
   * Create a new template version
   */
  public async createVersion(
    templateId: string,
    versionData: Partial<Template>
  ): Promise<RepositoryResponse<Template>> {
    // Get the current template to increment version
    const currentTemplate = await this.getById(templateId)
    if (currentTemplate.error || !currentTemplate.data) {
      return { data: null, error: currentTemplate.error }
    }

    const currentVersion = currentTemplate.data.version || '1.0'
    const versionParts = currentVersion.split('.')
    const newMinorVersion = parseInt(versionParts[1] || '0') + 1
    const newVersion = `${versionParts[0]}.${newMinorVersion}`

    // Create new template with incremented version
    const newTemplateData = {
      ...currentTemplate.data,
      ...versionData,
      id: undefined, // Let database generate new ID
      version: newVersion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const query = supabase
      .from('templates')
      .insert(newTemplateData)
      .select()
      .single()

    return this.executeQuery(query) as Promise<RepositoryResponse<Template>>
  }

  /**
   * Update template performance metrics
   */
  public async updatePerformanceMetrics(
    templateId: string,
    metrics: any
  ): Promise<RepositoryResponse<Template>> {
    const query = supabase
      .from('templates')
      .update({ 
        performance_metrics: metrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single()

    return this.executeQuery(query) as Promise<RepositoryResponse<Template>>
  }

  /**
   * Get active templates (status = 'Active')
   */
  public async getActiveTemplates(options?: QueryOptions): Promise<RepositoryResponse<Template[]>> {
    return this.getTemplatesByStatus('Active', options)
  }

  /**
   * Archive a template (set status to 'Archived')
   */
  public async archiveTemplate(templateId: string): Promise<RepositoryResponse<Template>> {
    const query = supabase
      .from('templates')
      .update({ 
        status: 'Archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single()

    return this.executeQuery(query) as Promise<RepositoryResponse<Template>>
  }

  /**
   * Get template usage statistics
   */
  public async getTemplateUsageStats(templateId: string): Promise<RepositoryResponse<any>> {
    const query = supabase
      .from('messages_sent')
      .select('id, status, created_at')
      .eq('template_id', templateId)

    const response = await this.executeQuery(query) as RepositoryResponse<any[]>
    
    if (response.error || !response.data) {
      return { data: null, error: response.error }
    }

    // Calculate usage statistics
    const stats = {
      totalUses: response.data.length,
      successfulSends: response.data.filter((msg: any) => msg.status === 'Sent' || msg.status === 'Delivered').length,
      failedSends: response.data.filter((msg: any) => msg.status === 'Failed').length,
      lastUsed: response.data.length > 0 ? response.data[0].created_at : null,
    }

    return { data: stats, error: null }
  }
}

// Export singleton instance for easy access
export const templatesRepository = TemplatesRepository.getInstance()