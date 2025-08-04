/**
 * BaseRepository Class
 * 
 * Abstract base class providing common database operations using Supabase.
 * All repository classes extend this to ensure consistent data access patterns.
 */

import { supabase } from '@/lib/supabase'
import {
  IBaseRepository,
  RepositoryResponse,
  RepositoryError,
  QueryOptions,
  FilterOptions,
  RepositoryContext,
  RepositoryConfig,
  BulkOperationResult
} from './types'

export abstract class BaseRepository<T, TInsert = Partial<T>, TUpdate = Partial<T>> 
  implements IBaseRepository<T, TInsert, TUpdate> {
  
  protected readonly config: RepositoryConfig
  protected readonly context: RepositoryContext

  constructor(config: RepositoryConfig) {
    this.config = config
    this.context = {
      timestamp: new Date().toISOString(),
      operation: 'init'
    }
  }

  /**
   * Create a standardized repository response
   */
  protected createResponse<TData>(
    data: TData | null,
    error: RepositoryError | null = null
  ): RepositoryResponse<TData> {
    return {
      data,
      error,
      success: error === null
    }
  }

  /**
   * Create a standardized repository error
   */
  protected createError(
    message: string,
    code?: string,
    details?: any
  ): RepositoryError {
    return {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log repository operations (if enabled)
   */
  protected log(operation: string, details?: any): void {
    if (this.config.enableLogging) {
      console.log(`[${this.config.tableName}Repository] ${operation}:`, details)
    }
  }

  /**
   * Handle Supabase errors consistently
   */
  protected handleSupabaseError(error: any, operation: string): RepositoryError {
    this.log(`Error in ${operation}`, error)
    
    return this.createError(
      error.message || `Failed to ${operation}`,
      error.code,
      error
    )
  }

  /**
   * Build dynamic query with filters and options
   */
  protected buildQuery(
    baseQuery: any,
    filters?: FilterOptions,
    options?: QueryOptions
  ) {
    let query = baseQuery

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'string' && value.includes('*')) {
            // Simple wildcard search
            query = query.ilike(key, value.replace(/\\*/g, '%'))
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true })
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    // Apply select fields
    if (options?.select) {
      query = query.select(options.select)
    }

    return query
  }

  // IBaseRepository implementation

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<RepositoryResponse<T>> {
    try {
      this.log('findById', { id })

      const { data, error } = await supabase
        .from(this.config.tableName)
        .select('*')
        .eq(this.config.primaryKey, id)
        .single()

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'findById'))
      }

      return this.createResponse(data as T)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'findById'))
    }
  }

  /**
   * Find multiple records with optional filtering
   */
  async findMany(
    filters?: FilterOptions,
    options?: QueryOptions
  ): Promise<RepositoryResponse<T[]>> {
    try {
      this.log('findMany', { filters, options })

      const baseQuery = supabase
        .from(this.config.tableName)
        .select(options?.select || '*')

      const query = this.buildQuery(baseQuery, filters, options)
      const { data, error } = await query

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'findMany'))
      }

      return this.createResponse(data as T[] || [])
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'findMany'))
    }
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<RepositoryResponse<T>> {
    try {
      this.log('create', { data })

      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .insert(data as any)
        .select()
        .single()

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'create'))
      }

      return this.createResponse(result as T)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'create'))
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: TUpdate): Promise<RepositoryResponse<T>> {
    try {
      this.log('update', { id, data })

      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .update(data as any)
        .eq(this.config.primaryKey, id)
        .select()
        .single()

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'update'))
      }

      return this.createResponse(result as T)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'update'))
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<RepositoryResponse<boolean>> {
    try {
      this.log('delete', { id })

      const { error } = await supabase
        .from(this.config.tableName)
        .delete()
        .eq(this.config.primaryKey, id)

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'delete'))
      }

      return this.createResponse(true)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'delete'))
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(filters?: FilterOptions): Promise<RepositoryResponse<number>> {
    try {
      this.log('count', { filters })

      const baseQuery = supabase
        .from(this.config.tableName)
        .select('*', { count: 'exact', head: true })

      const query = this.buildQuery(baseQuery, filters)
      const { count, error } = await query

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'count'))
      }

      return this.createResponse(count || 0)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'count'))
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<RepositoryResponse<boolean>> {
    try {
      this.log('exists', { id })

      const { data, error } = await supabase
        .from(this.config.tableName)
        .select(this.config.primaryKey)
        .eq(this.config.primaryKey, id)
        .single()

      if (error && error.code !== 'PGRST116') {
        return this.createResponse(null, this.handleSupabaseError(error, 'exists'))
      }

      return this.createResponse(!!data)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'exists'))
    }
  }

  /**
   * Bulk create records
   */
  async createMany(records: TInsert[]): Promise<RepositoryResponse<BulkOperationResult<T>>> {
    try {
      this.log('createMany', { count: records.length })

      const { data, error } = await supabase
        .from(this.config.tableName)
        .insert(records as any[])
        .select()

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'createMany'))
      }

      const result: BulkOperationResult<T> = {
        successful: data as T[] || [],
        failed: [],
        totalProcessed: records.length,
        successCount: data?.length || 0,
        failureCount: 0
      }

      return this.createResponse(result)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'createMany'))
    }
  }

  /**
   * Soft delete (if the table has a status field)
   */
  async softDelete(id: string, statusField: string = 'status'): Promise<RepositoryResponse<T>> {
    return this.update(id, { [statusField]: 'deleted' } as any)
  }

  /**
   * Restore soft deleted record
   */
  async restore(id: string, statusField: string = 'status'): Promise<RepositoryResponse<T>> {
    return this.update(id, { [statusField]: 'active' } as any)
  }
}