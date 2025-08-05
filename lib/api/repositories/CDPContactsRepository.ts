/**
 * CDP Contacts Repository
 * 
 * Repository for managing Contact entities in the Customer Data Platform.
 * Handles contact processing, matching, and workflow management.
 */

import { supabase } from '@/lib/supabase'
import type { 
  Contact, 
  CreateContactRequest,
  ContactSearchFilters,
  PaginatedResponse,
  ProcessingResult,
  BatchProcessingResult,
  ContactMetrics,
  ProfileMatch
} from '@/lib/types'

export class CDPContactsRepository {
  
  // =====================================================
  // CONTACT CRUD OPERATIONS
  // =====================================================
  
  /**
   * Create a new contact
   */
  async create(data: CreateContactRequest): Promise<Contact> {
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        source: data.source,
        source_details: data.source_details || {},
        batch_id: data.batch_id,
        external_id: data.external_id,
        mobile: data.mobile,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        company: data.company,
        job_title: data.job_title,
        raw_data: data.raw_data || {},
        processing_status: 'pending',
        retry_count: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`)
    }

    return contact
  }

  /**
   * Create multiple contacts (bulk import)
   */
  async createBatch(contacts: CreateContactRequest[], batchId?: string): Promise<Contact[]> {
    const contactsWithBatch = contacts.map(contact => ({
      source: contact.source,
      source_details: contact.source_details || {},
      batch_id: batchId || contact.batch_id,
      external_id: contact.external_id,
      mobile: contact.mobile,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      company: contact.company,
      job_title: contact.job_title,
      raw_data: contact.raw_data || {},
      processing_status: 'pending',
      retry_count: 0
    }))

    const { data: createdContacts, error } = await supabase
      .from('contacts')
      .insert(contactsWithBatch)
      .select()

    if (error) {
      throw new Error(`Failed to create contact batch: ${error.message}`)
    }

    return createdContacts || []
  }

  /**
   * Get contact by ID
   */
  async getById(id: string): Promise<Contact | null> {
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Contact not found
      }
      throw new Error(`Failed to get contact: ${error.message}`)
    }

    return contact
  }

  /**
   * Get contacts by batch ID
   */
  async getByBatchId(batchId: string): Promise<Contact[]> {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get contacts by batch: ${error.message}`)
    }

    return contacts || []
  }

  /**
   * Update contact processing status and metadata
   */
  async updateProcessingStatus(
    id: string, 
    status: Contact['processing_status'],
    metadata?: {
      profile_id?: string
      match_confidence?: number
      match_method?: string
      potential_matches?: ProfileMatch[]
      processing_notes?: string
      processed_by?: string
    }
  ): Promise<Contact> {
    const updateData: any = {
      processing_status: status,
      processed_at: status === 'matched' || status === 'archived' ? new Date().toISOString() : undefined
    }

    if (metadata) {
      if (metadata.profile_id !== undefined) updateData.profile_id = metadata.profile_id
      if (metadata.match_confidence !== undefined) updateData.match_confidence = metadata.match_confidence
      if (metadata.match_method !== undefined) updateData.match_method = metadata.match_method
      if (metadata.potential_matches !== undefined) updateData.potential_matches = metadata.potential_matches
      if (metadata.processing_notes !== undefined) updateData.processing_notes = metadata.processing_notes
      if (metadata.processed_by !== undefined) updateData.processed_by = metadata.processed_by
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update contact processing status: ${error.message}`)
    }

    return contact
  }

  /**
   * Delete contact (hard delete - use with caution)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete contact: ${error.message}`)
    }
  }

  // =====================================================
  // SEARCH & FILTERING
  // =====================================================

  /**
   * Search contacts with filters and pagination
   */
  async search(
    filters: ContactSearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Contact>> {
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,mobile.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
    }

    if (filters.source?.length) {
      query = query.in('source', filters.source)
    }

    if (filters.processing_status?.length) {
      query = query.in('processing_status', filters.processing_status)
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }

    if (filters.has_profile !== undefined) {
      if (filters.has_profile) {
        query = query.not('profile_id', 'is', null)
      } else {
        query = query.is('profile_id', null)
      }
    }

    if (filters.batch_id) {
      query = query.eq('batch_id', filters.batch_id)
    }

    // Pagination
    const offset = (page - 1) * pageSize
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data: contacts, error, count } = await query

    if (error) {
      throw new Error(`Failed to search contacts: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: contacts || [],
      total,
      page,
      page_size: pageSize,
      has_next: page < totalPages,
      has_previous: page > 1
    }
  }

  // =====================================================
  // CONTACT PROCESSING WORKFLOW
  // =====================================================

  /**
   * Process a single contact (match to profile or create new)
   */
  async processContact(contactId: string): Promise<ProcessingResult> {
    const { data, error } = await supabase.rpc('process_contact', {
      contact_uuid: contactId
    })

    if (error) {
      throw new Error(`Failed to process contact: ${error.message}`)
    }

    return data
  }

  /**
   * Process multiple pending contacts in a batch
   */
  async processPendingContacts(batchSize: number = 100): Promise<BatchProcessingResult> {
    const { data, error } = await supabase.rpc('process_pending_contacts', {
      batch_size: batchSize
    })

    if (error) {
      throw new Error(`Failed to process pending contacts: ${error.message}`)
    }

    return data
  }

  /**
   * Get all pending contacts that need processing
   */
  async getPendingContacts(limit: number = 100): Promise<Contact[]> {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('processing_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get pending contacts: ${error.message}`)
    }

    return contacts || []
  }

  /**
   * Get contacts that failed processing and can be retried
   */
  async getFailedContacts(maxRetries: number = 3): Promise<Contact[]> {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('processing_status', 'failed')
      .lt('retry_count', maxRetries)
      .order('last_retry_at', { ascending: true, nullsFirst: true })

    if (error) {
      throw new Error(`Failed to get failed contacts: ${error.message}`)
    }

    return contacts || []
  }

  /**
   * Retry processing failed contacts
   */
  async retryFailedContacts(): Promise<BatchProcessingResult> {
    const failedContacts = await this.getFailedContacts()
    
    if (failedContacts.length === 0) {
      return {
        processed_count: 0,
        success_count: 0,
        error_count: 0,
        results: []
      }
    }

    // Reset failed contacts to pending for reprocessing
    const { error: resetError } = await supabase
      .from('contacts')
      .update({ 
        processing_status: 'pending',
        retry_count: supabase.sql`retry_count + 1`,
        last_retry_at: new Date().toISOString()
      })
      .in('id', failedContacts.map(c => c.id))

    if (resetError) {
      throw new Error(`Failed to reset failed contacts: ${resetError.message}`)
    }

    // Process the batch
    return this.processPendingContacts(failedContacts.length)
  }

  // =====================================================
  // ARCHIVE & CLEANUP
  // =====================================================

  /**
   * Archive processed contacts (move to archive table)
   */
  async archiveProcessedContacts(olderThanDays: number = 30): Promise<{ archived_count: number }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Get contacts to archive
    const { data: contactsToArchive, error: selectError } = await supabase
      .from('contacts')
      .select('*')
      .in('processing_status', ['matched', 'archived'])
      .lt('processed_at', cutoffDate.toISOString())

    if (selectError) {
      throw new Error(`Failed to select contacts for archival: ${selectError.message}`)
    }

    if (!contactsToArchive || contactsToArchive.length === 0) {
      return { archived_count: 0 }
    }

    // Move to archive table
    const archiveRecords = contactsToArchive.map(contact => ({
      id: contact.id,
      profile_id: contact.profile_id,
      source: contact.source,
      source_details: contact.source_details,
      raw_data: contact.raw_data,
      processing_result: {
        match_confidence: contact.match_confidence,
        match_method: contact.match_method,
        processed_at: contact.processed_at,
        processed_by: contact.processed_by
      },
      archive_reason: 'automated_cleanup'
    }))

    const { error: insertError } = await supabase
      .from('contacts_archive')
      .insert(archiveRecords)

    if (insertError) {
      throw new Error(`Failed to archive contacts: ${insertError.message}`)
    }

    // Delete from main table
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .in('id', contactsToArchive.map(c => c.id))

    if (deleteError) {
      throw new Error(`Failed to delete archived contacts: ${deleteError.message}`)
    }

    return { archived_count: contactsToArchive.length }
  }

  /**
   * Get archived contacts
   */
  async getArchivedContacts(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * pageSize

    const { data: archived, error, count } = await supabase
      .from('contacts_archive')
      .select('*', { count: 'exact' })
      .order('archived_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw new Error(`Failed to get archived contacts: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: archived || [],
      total,
      page,
      page_size: pageSize,
      has_next: page < totalPages,
      has_previous: page > 1
    }
  }

  // =====================================================
  // METRICS & ANALYTICS
  // =====================================================

  /**
   * Get contact metrics for dashboard
   */
  async getMetrics(): Promise<ContactMetrics> {
    // Get basic counts
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })

    const { count: pendingContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'pending')

    const { count: matchedContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'matched')

    const { count: contactsNeedingReview } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'needs_review')

    // Get source distribution
    const { data: sourceData } = await supabase
      .from('contacts')
      .select('source')

    const contactsBySource = sourceData?.reduce((acc, contact) => {
      acc[contact.source] = (acc[contact.source] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get average match confidence
    const { data: confidenceData } = await supabase
      .from('contacts')
      .select('match_confidence')
      .not('match_confidence', 'is', null)

    const averageMatchConfidence = confidenceData?.length 
      ? Math.round((confidenceData.reduce((sum, c) => sum + (c.match_confidence || 0), 0) / confidenceData.length) * 100) / 100
      : 0

    // Get today's contacts
    const today = new Date().toISOString().split('T')[0]
    const { count: contactsCreatedToday } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    // Calculate processing success rate
    const totalProcessed = (matchedContacts || 0) + (contactsNeedingReview || 0)
    const processingSuccessRate = totalProcessed > 0 
      ? Math.round(((matchedContacts || 0) / totalProcessed) * 100)
      : 0

    return {
      total_contacts: totalContacts || 0,
      pending_contacts: pendingContacts || 0,
      matched_contacts: matchedContacts || 0,
      contacts_needing_review: contactsNeedingReview || 0,
      contacts_by_source: contactsBySource,
      average_match_confidence: averageMatchConfidence,
      contacts_created_today: contactsCreatedToday || 0,
      processing_success_rate: processingSuccessRate
    }
  }

  /**
   * Get processing statistics for a batch
   */
  async getBatchStatistics(batchId: string): Promise<{
    total: number
    pending: number
    matched: number
    needs_review: number
    failed: number
    processing_rate: number
  }> {
    const { data: batchContacts } = await supabase
      .from('contacts')
      .select('processing_status')
      .eq('batch_id', batchId)

    if (!batchContacts) {
      return {
        total: 0,
        pending: 0,
        matched: 0,
        needs_review: 0,
        failed: 0,
        processing_rate: 0
      }
    }

    const statusCounts = batchContacts.reduce((acc, contact) => {
      acc[contact.processing_status] = (acc[contact.processing_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = batchContacts.length
    const processed = (statusCounts.matched || 0) + (statusCounts.needs_review || 0) + (statusCounts.failed || 0)
    const processingRate = total > 0 ? Math.round((processed / total) * 100) : 0

    return {
      total,
      pending: statusCounts.pending || 0,
      matched: statusCounts.matched || 0,
      needs_review: statusCounts.needs_review || 0,
      failed: statusCounts.failed || 0,
      processing_rate: processingRate
    }
  }

  // =====================================================
  // VALIDATION & DATA QUALITY
  // =====================================================

  /**
   * Validate contact data before processing
   */
  validateContactData(contact: CreateContactRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields validation
    if (!contact.source) {
      errors.push('Source is required')
    }

    // At least one contact method required
    if (!contact.mobile && !contact.email) {
      errors.push('Either mobile or email is required')
    }

    // Mobile number format validation (basic)
    if (contact.mobile && !/^\+?[\d\s\-\(\)]{10,}$/.test(contact.mobile)) {
      errors.push('Invalid mobile number format')
    }

    // Email format validation
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.push('Invalid email format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Clean and normalize contact data
   */
  normalizeContactData(contact: CreateContactRequest): CreateContactRequest {
    return {
      ...contact,
      // Normalize mobile number
      mobile: contact.mobile ? this.normalizeMobile(contact.mobile) : undefined,
      // Normalize email
      email: contact.email ? contact.email.toLowerCase().trim() : undefined,
      // Normalize names
      first_name: contact.first_name ? this.capitalizeName(contact.first_name) : undefined,
      last_name: contact.last_name ? this.capitalizeName(contact.last_name) : undefined
    }
  }

  private normalizeMobile(mobile: string): string {
    // Remove all non-digit characters except +
    let normalized = mobile.replace(/[^\d+]/g, '')
    
    // Add + if not present and appears to be international
    if (!normalized.startsWith('+') && normalized.length > 10) {
      normalized = '+' + normalized
    }
    
    return normalized
  }

  private capitalizeName(name: string): string {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim()
  }
}