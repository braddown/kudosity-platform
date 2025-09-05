import { BaseRepository } from './BaseRepository'
import { RepositoryResponse, QueryOptions } from './types'
import { supabase } from '@/lib/supabase'
import { logger } from "@/lib/utils/logger"

/**
 * Contact entity interface
 */
export interface Contact {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  source: string | null;
  tags: string[];
  lifetime_value: number;
  last_activity_date: string | null;
  first_contact_date: string | null;
  device: string | null;
  os: string | null;
  location: string | null;
  timezone: string | null;
  opt_in_date: string | null;
  opt_out_date: string | null;
  custom_fields: any;
}

/**
 * Repository for managing contact data operations.
 * Handles contacts table and related contact management functionality.
 */
export class ContactsRepository extends BaseRepository<Contact> {
  private static instance: ContactsRepository

  private constructor() {
    super({
      tableName: 'contacts',
      primaryKey: 'id',
      enableLogging: process.env.NODE_ENV === 'development',
      enableCaching: false,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    })
  }

  public static getInstance(): ContactsRepository {
    if (!ContactsRepository.instance) {
      ContactsRepository.instance = new ContactsRepository()
    }
    return ContactsRepository.instance
  }

  /**
   * Search contacts by name, email, or phone
   */
  public async searchContacts(
    searchTerm: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Contact[]>> {
    let query = supabase
      .from('contacts')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)

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

    return this.executeQuery(query) as Promise<RepositoryResponse<Contact[]>>
  }

  /**
   * Get contacts by status
   */
  public async getContactsByStatus(
    status: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Contact[]>> {
    let query = supabase
      .from('contacts')
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

    return this.executeQuery(query) as Promise<RepositoryResponse<Contact[]>>
  }

  /**
   * Get contacts by tags
   */
  public async getContactsByTags(
    tags: string[],
    options?: QueryOptions
  ): Promise<RepositoryResponse<Contact[]>> {
    let query = supabase
      .from('contacts')
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

    return this.executeQuery(query) as Promise<RepositoryResponse<Contact[]>>
  }

  /**
   * Get contacts by device type
   */
  public async getContactsByDevice(
    device: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Contact[]>> {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('device', device)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    return this.executeQuery(query) as Promise<RepositoryResponse<Contact[]>>
  }

  /**
   * Get contacts by location
   */
  public async getContactsByLocation(
    location: string,
    options?: QueryOptions
  ): Promise<RepositoryResponse<Contact[]>> {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('location', location)

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    return this.executeQuery(query) as Promise<RepositoryResponse<Contact[]>>
  }

  /**
   * Add tags to multiple contacts
   */
  public async addTagsToContacts(
    contactIds: string[],
    tagsToAdd: string[]
  ): Promise<RepositoryResponse<null>> {
    const { data, error } = await supabase.rpc('add_tags_to_contacts', {
      p_contact_ids: contactIds,
      p_tags_to_add: tagsToAdd,
    })

    if (error) {
      logger.error('Error adding tags to contacts:', error)
      return this.createResponse(null, this.handleSupabaseError(error, 'addTagsToContacts'))
    }
    return this.createResponse(null)
  }

  /**
   * Remove tags from multiple contacts
   */
  public async removeTagsFromContacts(
    contactIds: string[],
    tagsToRemove: string[]
  ): Promise<RepositoryResponse<null>> {
    const { data, error } = await supabase.rpc('remove_tags_from_contacts', {
      p_contact_ids: contactIds,
      p_tags_to_remove: tagsToRemove,
    })

    if (error) {
      logger.error('Error removing tags from contacts:', error)
      return this.createResponse(null, this.handleSupabaseError(error, 'removeTagsFromContacts'))
    }
    return this.createResponse(null)
  }

  /**
   * Update contact activity timestamp
   */
  public async updateLastActivity(contactId: string): Promise<RepositoryResponse<Contact>> {
    const query = supabase
      .from('contacts')
      .update({ 
        last_activity_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .select()
      .single()

    return this.executeQuery(query) as Promise<RepositoryResponse<Contact>>
  }

  /**
   * Get contact statistics by status
   */
  public async getContactStats(): Promise<RepositoryResponse<any>> {
    const query = supabase
      .from('contacts')
      .select('status')

    const response = await this.executeQuery(query) as RepositoryResponse<any[]>
    
    if (response.error || !response.data) {
      return this.createResponse(null, response.error)
    }

    // Group by status and count
    const stats = response.data.reduce((acc: any, contact: any) => {
      const status = contact.status || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return this.createResponse(stats)
  }

  /**
   * Bulk import contacts
   */
  public async bulkImport(
    contacts: Partial<Contact>[],
    source: string = 'Import'
  ): Promise<RepositoryResponse<Contact[]>> {
    const contactsWithDefaults = contacts.map(contact => ({
      ...contact,
      source,
      first_contact_date: contact.first_contact_date || new Date().toISOString(),
      status: contact.status || 'Active',
      lifetime_value: contact.lifetime_value || 0,
      tags: contact.tags || [],
      custom_fields: contact.custom_fields || {},
    }))

    const query = supabase
      .from('contacts')
      .insert(contactsWithDefaults)
      .select()

    return this.executeQuery(query) as Promise<RepositoryResponse<Contact[]>>
  }
}

// Export singleton instance for easy access
export const contactsRepository = ContactsRepository.getInstance()