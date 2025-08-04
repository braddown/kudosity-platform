/**
 * Repository Pattern Types & Interfaces
 * 
 * Centralized type definitions for the database access layer
 * using the Repository Pattern to standardize data operations.
 */

import { Database } from '@/types/supabase'

// Base database types from Supabase
export type Tables = Database['public']['Tables']
export type TableName = keyof Tables
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']

/**
 * Generic repository response wrapper
 */
export interface RepositoryResponse<T> {
  data: T | null
  error: RepositoryError | null
  success: boolean
}

/**
 * Repository error standardization
 */
export interface RepositoryError {
  message: string
  code?: string
  details?: any
  timestamp: string
}

/**
 * Common query options
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  ascending?: boolean
  select?: string
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number
  pageSize?: number
  cursor?: string
}

/**
 * Filter options for queries
 */
export interface FilterOptions {
  [key: string]: any
}

/**
 * Repository context for tracking operations
 */
export interface RepositoryContext {
  userId?: string
  requestId?: string
  timestamp: string
  operation: string
}

/**
 * Base repository interface that all repositories must implement
 */
export interface IBaseRepository<T, TInsert = Partial<T>, TUpdate = Partial<T>> {
  /**
   * Find a record by ID
   */
  findById(id: string): Promise<RepositoryResponse<T>>

  /**
   * Find multiple records with optional filtering
   */
  findMany(
    filters?: FilterOptions,
    options?: QueryOptions
  ): Promise<RepositoryResponse<T[]>>

  /**
   * Create a new record
   */
  create(data: TInsert): Promise<RepositoryResponse<T>>

  /**
   * Update an existing record
   */
  update(id: string, data: TUpdate): Promise<RepositoryResponse<T>>

  /**
   * Delete a record
   */
  delete(id: string): Promise<RepositoryResponse<boolean>>

  /**
   * Count records with optional filtering
   */
  count(filters?: FilterOptions): Promise<RepositoryResponse<number>>

  /**
   * Check if record exists
   */
  exists(id: string): Promise<RepositoryResponse<boolean>>
}

/**
 * Repository configuration
 */
export interface RepositoryConfig {
  tableName: string
  primaryKey: string
  enableLogging: boolean
  enableCaching: boolean
  cacheTimeout: number
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T> {
  successful: T[]
  failed: Array<{
    data: any
    error: RepositoryError
  }>
  totalProcessed: number
  successCount: number
  failureCount: number
}

/**
 * Transaction context for multi-table operations
 */
export interface TransactionContext {
  id: string
  timestamp: string
  operations: Array<{
    table: string
    operation: 'INSERT' | 'UPDATE' | 'DELETE'
    recordId?: string
  }>
}