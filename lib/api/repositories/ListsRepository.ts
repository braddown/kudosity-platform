/**
 * ListsRepository
 * 
 * Repository for managing list data operations.
 * Handles static contact lists and list membership management.
 */

import { BaseRepository } from './BaseRepository'
import { RepositoryResponse, FilterOptions, QueryOptions } from './types'
import { supabase } from '@/lib/supabase'

/**
 * List entity type
 */
export interface List {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  description?: string
  creator_id?: string
  type?: 'Manual' | 'System' | 'Upload' | 'Segment' | 'Dynamic' | 'Static'
  source?: 'Manual' | 'System' | 'CSV Upload' | 'API' | 'Import' | 'Segment'
  contact_count?: number
  tags?: string[]
  shared?: boolean
}

export type ListInsert = Omit<List, 'id' | 'created_at' | 'updated_at' | 'contact_count'>
export type ListUpdate = Partial<Omit<List, 'id' | 'created_at'>>

/**
 * List membership entity type
 */
export interface ListMembership {
  id: string
  list_id?: string
  contact_id?: string
  date_added?: string
  added_by?: string
  status?: 'Active' | 'Removed'
  date_removed?: string
}

export type ListMembershipInsert = Omit<ListMembership, 'id' | 'date_added'>
export type ListMembershipUpdate = Partial<Omit<ListMembership, 'id'>>

/**
 * Lists repository class
 */
export class ListsRepository extends BaseRepository<List, ListInsert, ListUpdate> {
  private static instance: ListsRepository

  private constructor() {
    super({
      tableName: 'lists',
      primaryKey: 'id',
      enableLogging: process.env.NODE_ENV === 'development',
      enableCaching: false,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    })
  }

  /**
   * Singleton pattern for repository access
   */
  public static getInstance(): ListsRepository {
    if (!ListsRepository.instance) {
      ListsRepository.instance = new ListsRepository()
    }
    return ListsRepository.instance
  }

  // Business logic methods specific to lists

  /**
   * Find lists by type
   */
  async findByType(type: List['type']): Promise<RepositoryResponse<List[]>> {
    return this.findMany({ type })
  }

  /**
   * Find lists by creator
   */
  async findByCreator(creatorId: string): Promise<RepositoryResponse<List[]>> {
    return this.findMany({ creator_id: creatorId })
  }

  /**
   * Search lists by name or description
   */
  async search(query: string, options?: QueryOptions): Promise<RepositoryResponse<List[]>> {
    try {
      this.log('search', { query, options })

      const { data, error } = await supabase
        .from(this.config.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(options?.limit || 50)
        .order(options?.orderBy || 'created_at', { ascending: options?.ascending ?? false })

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'search'))
      }

      return this.createResponse(data as List[] || [])
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'search'))
    }
  }

  /**
   * Get list with membership details
   */
  async getWithMemberships(
    listId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<RepositoryResponse<{
    list: List
    members: Array<{
      id: string
      contact_id: string
      date_added: string
      status: string
      contact: {
        id: string
        first_name?: string
        last_name?: string
        email?: string
        phone?: string
        status?: string
      }
    }>
    pagination: {
      page: number
      pageSize: number
      total: number
      hasNext: boolean
      hasPrev: boolean
    }
  }>> {
    try {
      // Get list details
      const listResponse = await this.findById(listId)
      if (!listResponse.success || !listResponse.data) {
        return this.createResponse(null, listResponse.error)
      }

      const offset = (page - 1) * pageSize

      // Get memberships with contact details
      const { data: memberships, error: membershipsError } = await supabase
        .from('list_memberships')
        .select(`
          id,
          contact_id,
          date_added,
          status,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone,
            status
          )
        `)
        .eq('list_id', listId)
        .eq('status', 'Active')
        .range(offset, offset + pageSize - 1)
        .order('date_added', { ascending: false })

      if (membershipsError) {
        return this.createResponse(null, this.handleSupabaseError(membershipsError, 'getWithMemberships'))
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('list_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId)
        .eq('status', 'Active')

      if (countError) {
        return this.createResponse(null, this.handleSupabaseError(countError, 'getWithMemberships'))
      }

      const total = count || 0
      const result = {
        list: listResponse.data,
        members: memberships?.map((m: any) => ({
          id: m.id,
          contact_id: m.contact_id,
          date_added: m.date_added,
          status: m.status,
          contact: m.contacts
        })) || [],
        pagination: {
          page,
          pageSize,
          total,
          hasNext: offset + pageSize < total,
          hasPrev: page > 1
        }
      }

      return this.createResponse(result)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'getWithMemberships'))
    }
  }

  /**
   * Add contacts to a list
   */
  async addContacts(
    listId: string,
    contactIds: string[],
    addedBy?: string
  ): Promise<RepositoryResponse<ListMembership[]>> {
    try {
      this.log('addContacts', { listId, contactIds, addedBy })

      // Check if list exists
      const listExists = await this.exists(listId)
      if (!listExists.success || !listExists.data) {
        return this.createResponse(null, this.createError('List not found'))
      }

      // Prepare membership records
      const memberships = contactIds.map(contactId => ({
        list_id: listId,
        contact_id: contactId,
        added_by: addedBy,
        status: 'Active' as const
      }))

      // Insert memberships (using upsert to handle existing memberships)
      const { data, error } = await supabase
        .from('list_memberships')
        .upsert(memberships, { 
          onConflict: 'list_id,contact_id',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'addContacts'))
      }

      // Update contact count
      await this.updateContactCount(listId)

      return this.createResponse(data as ListMembership[] || [])
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'addContacts'))
    }
  }

  /**
   * Remove contacts from a list
   */
  async removeContacts(
    listId: string,
    contactIds: string[]
  ): Promise<RepositoryResponse<boolean>> {
    try {
      this.log('removeContacts', { listId, contactIds })

      const { error } = await supabase
        .from('list_memberships')
        .update({ 
          status: 'Removed',
          date_removed: new Date().toISOString()
        })
        .eq('list_id', listId)
        .in('contact_id', contactIds)

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'removeContacts'))
      }

      // Update contact count
      await this.updateContactCount(listId)

      return this.createResponse(true)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'removeContacts'))
    }
  }

  /**
   * Update contact count for a list
   */
  private async updateContactCount(listId: string): Promise<void> {
    try {
      const { count, error } = await supabase
        .from('list_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId)
        .eq('status', 'Active')

      if (!error) {
        await supabase
          .from('lists')
          .update({ contact_count: count })
          .eq('id', listId)
      }
    } catch (error) {
      this.log('updateContactCount error', error)
    }
  }

  /**
   * Get list membership for a specific contact
   */
  async getContactMembership(
    listId: string,
    contactId: string
  ): Promise<RepositoryResponse<ListMembership>> {
    try {
      const { data, error } = await supabase
        .from('list_memberships')
        .select('*')
        .eq('list_id', listId)
        .eq('contact_id', contactId)
        .single()

      if (error && error.code !== 'PGRST116') {
        return this.createResponse(null, this.handleSupabaseError(error, 'getContactMembership'))
      }

      return this.createResponse(data as ListMembership || null)
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'getContactMembership'))
    }
  }

  /**
   * Get all lists for a contact
   */
  async getContactLists(contactId: string): Promise<RepositoryResponse<List[]>> {
    try {
      const { data, error } = await supabase
        .from('list_memberships')
        .select(`
          lists (
            id,
            name,
            description,
            type,
            source,
            contact_count,
            tags,
            shared,
            created_at,
            updated_at
          )
        `)
        .eq('contact_id', contactId)
        .eq('status', 'Active')

      if (error) {
        return this.createResponse(null, this.handleSupabaseError(error, 'getContactLists'))
      }

      const lists = data?.map((membership: any) => membership.lists).filter(Boolean) || []
      return this.createResponse(lists as List[])
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'getContactLists'))
    }
  }

  /**
   * Delete list and all memberships
   */
  async deleteWithMemberships(listId: string): Promise<RepositoryResponse<boolean>> {
    try {
      this.log('deleteWithMemberships', { listId })

      // First check if it's a system list (protected)
      const listResponse = await this.findById(listId)
      if (listResponse.success && listResponse.data?.type === 'System') {
        return this.createResponse(null, this.createError('Cannot delete system lists'))
      }

      // Delete memberships first
      const { error: membershipError } = await supabase
        .from('list_memberships')
        .delete()
        .eq('list_id', listId)

      if (membershipError) {
        return this.createResponse(null, this.handleSupabaseError(membershipError, 'deleteWithMemberships'))
      }

      // Delete the list
      const deleteResponse = await this.delete(listId)
      return deleteResponse
    } catch (error) {
      return this.createResponse(null, this.handleSupabaseError(error, 'deleteWithMemberships'))
    }
  }
}

// Export singleton instance for easy access
export const listsRepository = ListsRepository.getInstance()