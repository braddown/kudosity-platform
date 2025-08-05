/**
 * Customer Data Platform (CDP) Contacts Hook
 * 
 * Custom hook for managing Contact entities and processing workflow.
 * Handles contact ingestion, matching, processing, and review queue management.
 */

import { useState, useCallback, useMemo } from 'react'
import { useAsyncData } from './use-async-data'
import { CDPContactsRepository } from '@/lib/api/repositories/CDPContactsRepository'
import type { 
  Contact, 
  CreateContactRequest,
  ContactSearchFilters,
  PaginatedResponse,
  ProcessingResult,
  BatchProcessingResult,
  ContactMetrics
} from '@/lib/types'

// Initialize repository
const contactsRepo = new CDPContactsRepository()

// Types for hook options and state
export interface UseCDPContactsOptions {
  initialFilters?: ContactSearchFilters
  pageSize?: number
  autoFetch?: boolean
  enableRealTimeUpdates?: boolean
  processingPollingInterval?: number // ms
}

export interface UseCDPContactsResult {
  // Data state
  contacts: Contact[]
  contact: Contact | null
  isLoading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  
  // Search and filtering
  filters: ContactSearchFilters
  searchQuery: string
  
  // Metrics
  metrics: ContactMetrics | null
  metricsLoading: boolean
  
  // Processing state
  isProcessing: boolean
  processingProgress: number
  processingResults: ProcessingResult[]
  
  // Actions
  searchContacts: (filters?: ContactSearchFilters, page?: number) => Promise<void>
  setSearchQuery: (query: string) => void
  applyFilters: (filters: ContactSearchFilters) => void
  clearFilters: () => void
  goToPage: (page: number) => void
  refreshContacts: () => Promise<void>
  
  // CRUD operations
  createContact: (data: CreateContactRequest) => Promise<Contact>
  createContactBatch: (contacts: CreateContactRequest[], batchId?: string) => Promise<Contact[]>
  getContact: (id: string) => Promise<Contact | null>
  getContactsByBatch: (batchId: string) => Promise<Contact[]>
  deleteContact: (id: string) => Promise<void>
  
  // Processing workflow
  processContact: (contactId: string) => Promise<ProcessingResult>
  processPendingContacts: (batchSize?: number) => Promise<BatchProcessingResult>
  retryFailedContacts: () => Promise<BatchProcessingResult>
  
  // Batch operations
  getBatchStatistics: (batchId: string) => Promise<{
    total: number
    pending: number
    matched: number
    needs_review: number
    failed: number
    processing_rate: number
  }>
  
  // Archive & cleanup
  archiveProcessedContacts: (olderThanDays?: number) => Promise<{archived_count: number}>
  getArchivedContacts: (page?: number, pageSize?: number) => Promise<PaginatedResponse<any>>
  
  // Metrics and analytics
  loadMetrics: () => Promise<void>
  
  // Validation
  validateContactData: (contact: CreateContactRequest) => {isValid: boolean; errors: string[]}
  normalizeContactData: (contact: CreateContactRequest) => CreateContactRequest
}

/**
 * Main CDP Contacts Hook
 */
export function useCDPContacts(options: UseCDPContactsOptions = {}): UseCDPContactsResult {
  const {
    initialFilters = {},
    pageSize = 20,
    autoFetch = true,
    enableRealTimeUpdates = false,
    processingPollingInterval = 5000
  } = options

  // State management
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<ContactSearchFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [metrics, setMetrics] = useState<ContactMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])

  // Async data hook for main contacts list
  const {
    data: contactsData,
    isLoading,
    error,
    execute: fetchContacts,
    refresh: refreshContacts
  } = useAsyncData<PaginatedResponse<Contact>>(
    async () => {
      const searchFilters = searchQuery ? { ...filters, search: searchQuery } : filters
      return contactsRepo.search(searchFilters, currentPage, pageSize)
    },
    { immediate: autoFetch }
  )

  // Update contacts state when data changes
  useMemo(() => {
    if (contactsData) {
      setContacts(contactsData.data)
      setTotalPages(Math.ceil(contactsData.total / pageSize))
      setTotalCount(contactsData.total)
    }
  }, [contactsData, pageSize])

  // Computed pagination state
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // =====================================================
  // SEARCH & FILTERING ACTIONS
  // =====================================================

  const searchContacts = useCallback(async (newFilters?: ContactSearchFilters, page?: number) => {
    if (newFilters) {
      setFilters(newFilters)
    }
    if (page !== undefined) {
      setCurrentPage(page)
    }
    await fetchContacts()
  }, [fetchContacts])

  const applyFilters = useCallback((newFilters: ContactSearchFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    fetchContacts()
  }, [fetchContacts])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
    fetchContacts()
  }, [fetchContacts])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
    fetchContacts()
  }, [fetchContacts])

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    // Auto-search after a brief delay (can be debounced)
    const timer = setTimeout(() => {
      fetchContacts()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchContacts])

  // =====================================================
  // CRUD OPERATIONS
  // =====================================================

  const createContact = useCallback(async (data: CreateContactRequest): Promise<Contact> => {
    try {
      // Validate and normalize data first
      const validation = contactsRepo.validateContactData(data)
      if (!validation.isValid) {
        throw new Error(`Invalid contact data: ${validation.errors.join(', ')}`)
      }

      const normalizedData = contactsRepo.normalizeContactData(data)
      const newContact = await contactsRepo.create(normalizedData)
      
      // Refresh the list to include the new contact
      await refreshContacts()
      return newContact
    } catch (err) {
      throw new Error(`Failed to create contact: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [refreshContacts])

  const createContactBatch = useCallback(async (
    contactsData: CreateContactRequest[], 
    batchId?: string
  ): Promise<Contact[]> => {
    try {
      // Validate all contacts first
      const validationErrors: Array<{index: number; errors: string[]}> = []
      
      contactsData.forEach((contact, index) => {
        const validation = contactsRepo.validateContactData(contact)
        if (!validation.isValid) {
          validationErrors.push({ index, errors: validation.errors })
        }
      })

      if (validationErrors.length > 0) {
        const errorMessage = validationErrors
          .map(({ index, errors }) => `Contact ${index + 1}: ${errors.join(', ')}`)
          .join('; ')
        throw new Error(`Validation errors: ${errorMessage}`)
      }

      // Normalize all contacts
      const normalizedContacts = contactsData.map(contact => 
        contactsRepo.normalizeContactData(contact)
      )

      const newContacts = await contactsRepo.createBatch(normalizedContacts, batchId)
      
      // Refresh the list
      await refreshContacts()
      return newContacts
    } catch (err) {
      throw new Error(`Failed to create contact batch: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [refreshContacts])

  const getContact = useCallback(async (id: string): Promise<Contact | null> => {
    try {
      const contactData = await contactsRepo.getById(id)
      setContact(contactData)
      return contactData
    } catch (err) {
      throw new Error(`Failed to get contact: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const getContactsByBatch = useCallback(async (batchId: string): Promise<Contact[]> => {
    try {
      return await contactsRepo.getByBatchId(batchId)
    } catch (err) {
      throw new Error(`Failed to get contacts by batch: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    try {
      await contactsRepo.delete(id)
      
      // Remove from local state
      setContacts(prev => prev.filter(c => c.id !== id))
      if (contact?.id === id) {
        setContact(null)
      }
      
      // Refresh to get accurate counts
      await refreshContacts()
    } catch (err) {
      throw new Error(`Failed to delete contact: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [contact, refreshContacts])

  // =====================================================
  // PROCESSING WORKFLOW
  // =====================================================

  const processContact = useCallback(async (contactId: string): Promise<ProcessingResult> => {
    try {
      setIsProcessing(true)
      const result = await contactsRepo.processContact(contactId)
      
      // Update local state
      if (result.success) {
        setContacts(prev => prev.map(c => 
          c.id === contactId 
            ? { ...c, processing_status: result.action === 'needs_manual_review' ? 'needs_review' : 'matched' }
            : c
        ))
      }
      
      setProcessingResults(prev => [result, ...prev])
      return result
    } catch (err) {
      throw new Error(`Failed to process contact: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const processPendingContacts = useCallback(async (batchSize: number = 100): Promise<BatchProcessingResult> => {
    try {
      setIsProcessing(true)
      setProcessingProgress(0)
      
      const result = await contactsRepo.processPendingContacts(batchSize)
      
      // Update processing progress
      setProcessingProgress(100)
      setProcessingResults(prev => [...result.results, ...prev])
      
      // Refresh contacts list to show updated statuses
      await refreshContacts()
      
      return result
    } catch (err) {
      throw new Error(`Failed to process pending contacts: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }, [refreshContacts])

  const retryFailedContacts = useCallback(async (): Promise<BatchProcessingResult> => {
    try {
      setIsProcessing(true)
      const result = await contactsRepo.retryFailedContacts()
      
      setProcessingResults(prev => [...result.results, ...prev])
      await refreshContacts()
      
      return result
    } catch (err) {
      throw new Error(`Failed to retry failed contacts: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [refreshContacts])

  // =====================================================
  // BATCH OPERATIONS
  // =====================================================

  const getBatchStatistics = useCallback(async (batchId: string) => {
    try {
      return await contactsRepo.getBatchStatistics(batchId)
    } catch (err) {
      throw new Error(`Failed to get batch statistics: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // =====================================================
  // ARCHIVE & CLEANUP
  // =====================================================

  const archiveProcessedContacts = useCallback(async (olderThanDays: number = 30) => {
    try {
      const result = await contactsRepo.archiveProcessedContacts(olderThanDays)
      await refreshContacts() // Refresh to show updated counts
      return result
    } catch (err) {
      throw new Error(`Failed to archive contacts: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [refreshContacts])

  const getArchivedContacts = useCallback(async (page: number = 1, archivePageSize: number = 20) => {
    try {
      return await contactsRepo.getArchivedContacts(page, archivePageSize)
    } catch (err) {
      throw new Error(`Failed to get archived contacts: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // =====================================================
  // METRICS & ANALYTICS
  // =====================================================

  const loadMetrics = useCallback(async (): Promise<void> => {
    setMetricsLoading(true)
    try {
      const metricsData = await contactsRepo.getMetrics()
      setMetrics(metricsData)
    } catch (err) {
      console.error('Failed to load contact metrics:', err)
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateContactData = useCallback((contact: CreateContactRequest) => {
    return contactsRepo.validateContactData(contact)
  }, [])

  const normalizeContactData = useCallback((contact: CreateContactRequest) => {
    return contactsRepo.normalizeContactData(contact)
  }, [])

  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================

  return {
    // Data state
    contacts,
    contact,
    isLoading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    
    // Search and filtering
    filters,
    searchQuery,
    
    // Metrics
    metrics,
    metricsLoading,
    
    // Processing state
    isProcessing,
    processingProgress,
    processingResults,
    
    // Actions
    searchContacts,
    setSearchQuery: handleSetSearchQuery,
    applyFilters,
    clearFilters,
    goToPage,
    refreshContacts,
    
    // CRUD operations
    createContact,
    createContactBatch,
    getContact,
    getContactsByBatch,
    deleteContact,
    
    // Processing workflow
    processContact,
    processPendingContacts,
    retryFailedContacts,
    
    // Batch operations
    getBatchStatistics,
    
    // Archive & cleanup
    archiveProcessedContacts,
    getArchivedContacts,
    
    // Metrics and analytics
    loadMetrics,
    
    // Validation
    validateContactData,
    normalizeContactData
  }
}

/**
 * Hook for contact processing monitoring
 */
export function useContactProcessingMonitor(pollingInterval: number = 5000) {
  const [pendingCount, setPendingCount] = useState(0)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    
    const checkPendingContacts = async () => {
      try {
        const pendingContacts = await contactsRepo.getPendingContacts(1) // Just get count
        setPendingCount(pendingContacts.length)
      } catch (err) {
        console.error('Failed to check pending contacts:', err)
      }
    }

    checkPendingContacts() // Initial check
    
    const interval = setInterval(checkPendingContacts, pollingInterval)
    
    return () => {
      clearInterval(interval)
      setIsMonitoring(false)
    }
  }, [pollingInterval])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  return {
    pendingCount,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  }
}