import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact, ContactReviewQueue, BatchProcessingResult } from '@/lib/types/cdp-types'

export interface UseCDPContactsOptions {
  filters?: {
    processing_status?: string
    source?: string
    batch_id?: string
    date_range?: {
      from: string
      to: string
    }
  }
  pagination?: {
    page?: number
    pageSize?: number
  }
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export interface UseCDPContactsResult {
  contacts: Contact[]
  loading: boolean
  error: string | null
  totalCount: number
  pagination: {
    page: number
    pageSize: number
    totalPages: number
  }
  // Contact operations
  getContact: (id: string) => Promise<Contact | null>
  createContact: (contactData: Partial<Contact>) => Promise<Contact>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  // Processing operations
  processContact: (id: string) => Promise<any>
  processBatch: (batchSize?: number) => Promise<BatchProcessingResult>
  retryFailedContact: (id: string) => Promise<any>
  // Review queue operations
  getReviewQueue: () => Promise<ContactReviewQueue[]>
  resolveReview: (reviewId: string, resolution: any) => Promise<void>
  // Utilities
  setFilters: (filters: UseCDPContactsOptions['filters']) => void
  refetch: () => Promise<void>
}

/**
 * CDP Contacts Hook - Manages contact processing and review queue
 * 
 * This hook handles individual contact touchpoints, their processing status,
 * and the manual review queue for complex cases.
 */
export function useCDPContacts(options: UseCDPContactsOptions = {}): UseCDPContactsResult {
  const [contacts, setContacts] = useState<Contact[]>([])
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

  // Fetch contacts with filters
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('cdp_contacts')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.processing_status) {
        query = query.eq('processing_status', filters.processing_status)
      }
      
      if (filters.source) {
        query = query.eq('source', filters.source)
      }
      
      if (filters.batch_id) {
        query = query.eq('batch_id', filters.batch_id)
      }
      
      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.from)
          .lte('created_at', filters.date_range.to)
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      setContacts(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching CDP contacts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }, [supabase, filters, pagination, sort, offset, pageSize])

  // Get single contact
  const getContact = useCallback(async (id: string): Promise<Contact | null> => {
    try {
      const { data, error } = await supabase
        .from('cdp_contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      return data
    } catch (err) {
      console.error('Error fetching contact:', err)
      return null
    }
  }, [supabase])

  // Create new contact
  const createContact = useCallback(async (contactData: Partial<Contact>): Promise<Contact> => {
    try {
      const { data, error: insertError } = await supabase
        .from('cdp_contacts')
        .insert([{
          mobile: contactData.mobile,
          email: contactData.email,
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          company: contactData.company,
          job_title: contactData.job_title,
          source: contactData.source || 'manual_entry',
          source_details: contactData.source_details || {},
          raw_data: contactData.raw_data || {},
          batch_id: contactData.batch_id,
          external_id: contactData.external_id
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh the list
      await fetchContacts()
      
      return data
    } catch (err) {
      console.error('Error creating CDP contact:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to create contact')
    }
  }, [supabase, fetchContacts])

  // Update contact
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>): Promise<Contact> => {
    try {
      const { data, error: updateError } = await supabase
        .from('cdp_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, ...data } : contact
      ))
      
      return data
    } catch (err) {
      console.error('Error updating CDP contact:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to update contact')
    }
  }, [supabase])

  // Delete contact
  const deleteContact = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('cdp_contacts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      setContacts(prev => prev.filter(contact => contact.id !== id))
      setTotalCount(prev => prev - 1)
    } catch (err) {
      console.error('Error deleting CDP contact:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to delete contact')
    }
  }, [supabase])

  // Process single contact
  const processContact = useCallback(async (id: string) => {
    try {
      const { data, error: processError } = await supabase.rpc('process_cdp_contact', {
        contact_uuid: id
      })

      if (processError) throw processError

      // Refresh contacts to show updated status
      await fetchContacts()
      
      return data
    } catch (err) {
      console.error('Error processing contact:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to process contact')
    }
  }, [supabase, fetchContacts])

  // Process batch of pending contacts
  const processBatch = useCallback(async (batchSize: number = 100): Promise<BatchProcessingResult> => {
    try {
      const { data, error: batchError } = await supabase.rpc('process_pending_cdp_contacts', {
        batch_size: batchSize
      })

      if (batchError) throw batchError

      // Refresh contacts to show updated statuses
      await fetchContacts()
      
      return data
    } catch (err) {
      console.error('Error processing batch:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to process batch')
    }
  }, [supabase, fetchContacts])

  // Retry failed contact
  const retryFailedContact = useCallback(async (id: string) => {
    try {
      // Reset contact status to pending
      await updateContact(id, {
        processing_status: 'pending',
        processing_notes: undefined,
        retry_count: 0
      })

      // Process the contact
      return await processContact(id)
    } catch (err) {
      console.error('Error retrying contact:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to retry contact')
    }
  }, [updateContact, processContact])

  // Get review queue
  const getReviewQueue = useCallback(async (): Promise<ContactReviewQueue[]> => {
    try {
      const { data, error } = await supabase
        .from('cdp_contact_review_queue')
        .select(`
          *,
          cdp_contacts (
            id,
            mobile,
            email,
            first_name,
            last_name,
            source,
            created_at
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      return data || []
    } catch (err) {
      console.error('Error fetching review queue:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch review queue')
    }
  }, [supabase])

  // Resolve review queue item
  const resolveReview = useCallback(async (reviewId: string, resolution: any): Promise<void> => {
    try {
      const { error: resolveError } = await supabase
        .from('cdp_contact_review_queue')
        .update({
          status: 'resolved',
          resolution: resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (resolveError) throw resolveError

      // If resolution includes profile assignment, update the contact
      if (resolution.action === 'assign_profile' && resolution.profile_id && resolution.contact_id) {
        await updateContact(resolution.contact_id, {
          profile_id: resolution.profile_id,
          processing_status: 'matched',
          match_method: 'manual_assignment',
          processed_at: new Date().toISOString()
        })
      }
    } catch (err) {
      console.error('Error resolving review:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to resolve review')
    }
  }, [supabase, updateContact])

  // Statistics and metrics
  const getProcessingStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cdp_contacts')
        .select('processing_status')

      if (error) throw error

      const stats = data.reduce((acc, contact) => {
        acc[contact.processing_status] = (acc[contact.processing_status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        total: data.length,
        pending: stats.pending || 0,
        processing: stats.processing || 0,
        matched: stats.matched || 0,
        needs_review: stats.needs_review || 0,
        failed: stats.failed || 0,
        archived: stats.archived || 0
      }
    } catch (err) {
      console.error('Error fetching processing stats:', err)
      return null
    }
  }, [supabase])

  // Filter utilities
  const setFilters = useCallback((newFilters: UseCDPContactsOptions['filters']) => {
    // This would trigger a re-fetch with new filters
    // Implementation depends on how the parent component manages state
  }, [])

  const refetch = useCallback(async () => {
    await fetchContacts()
  }, [fetchContacts])

  // Load contacts on mount and when dependencies change
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  return {
    contacts,
    loading,
    error,
    totalCount,
    pagination: {
      page: currentPage,
      pageSize,
      totalPages
    },
    // Contact operations
    getContact,
    createContact,
    updateContact,
    deleteContact,
    // Processing operations
    processContact,
    processBatch,
    retryFailedContact,
    // Review queue operations
    getReviewQueue,
    resolveReview,
    // Utilities
    setFilters,
    refetch,
    // Additional utilities
    getProcessingStats
  } as UseCDPContactsResult & {
    getProcessingStats: () => Promise<any>
  }
}