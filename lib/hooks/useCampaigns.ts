/**
 * useCampaigns Hook
 * 
 * Comprehensive hook for managing campaign operations:
 * - Campaign CRUD operations (Create, Read, Update, Delete)
 * - Campaign status management (pause, resume, stop, start)
 * - Campaign metrics and analytics
 * - Template management for campaigns
 * - Audience/segment selection
 * - Scheduling functionality
 * - Broadcast message management
 * 
 * Built on top of useAsyncData for consistent state management.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAsyncData } from './use-async-data'
import { supabase } from '@/lib/supabase'
import { logger } from "@/lib/utils/logger"

// Types
export interface Campaign {
  id: string
  name: string
  type: 'broadcast' | 'journey'
  status: 'active' | 'paused' | 'completed' | 'draft' | 'scheduled'
  channel: 'email' | 'sms' | 'multi'
  created_at: string
  updated_at: string
  start_date: string
  end_date?: string | null
  recipients?: number | null
  sent?: number | null
  delivered?: number | null
  opened?: number | null
  clicked?: number | null
  conversions?: number | null
  revenue?: number | null
  creator: string
  message_content?: string
  sender_id?: string
  template_id?: string
  audience_segments?: string[]
  schedule_config?: ScheduleConfig
  metadata?: Record<string, any>
}

export interface ScheduleConfig {
  type: 'immediate' | 'scheduled' | 'recurring'
  scheduled_time?: string
  timezone?: string
  recurring_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    days_of_week?: number[]
    end_date?: string
  }
}

export interface CampaignMetrics {
  deliveryRate: number
  openRate: number
  clickRate: number
  conversionRate: number
  unsubscribeRate: number
  bounceRate: number
  roi?: number
}

export interface CampaignTemplate {
  id: string
  name: string
  type: 'standard' | 'personalized' | 'multi-step'
  content: string
  variables: string[]
  category: string
  created_at: string
  usage_count: number
}

export interface CampaignFilters {
  status?: string[]
  type?: string[]
  channel?: string[]
  creator?: string
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface UseCampaignsOptions {
  /** Auto-fetch campaigns on mount */
  immediate?: boolean
  /** Initial filters */
  filters?: CampaignFilters
  /** Cache TTL in milliseconds */
  cacheTTL?: number
  /** Include archived campaigns */
  includeArchived?: boolean
  /** Real-time updates for active campaigns */
  enableRealTimeUpdates?: boolean
}

export interface UseCampaignsResult {
  // Data state
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  isEmpty: boolean
  totalCount: number
  
  // Metrics
  overallMetrics: CampaignMetrics
  
  // Actions
  refetch: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  
  // CRUD operations
  createCampaign: (data: Partial<Campaign>) => Promise<Campaign | null>
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<Campaign | null>
  deleteCampaign: (id: string) => Promise<boolean>
  duplicateCampaign: (id: string, newName?: string) => Promise<Campaign | null>
  
  // Status management
  startCampaign: (id: string) => Promise<boolean>
  pauseCampaign: (id: string) => Promise<boolean>
  resumeCampaign: (id: string) => Promise<boolean>
  stopCampaign: (id: string) => Promise<boolean>
  scheduleCampaign: (id: string, schedule: ScheduleConfig) => Promise<boolean>
  
  // Metrics and analytics
  getCampaignMetrics: (id: string) => Promise<CampaignMetrics | null>
  getMetricsForPeriod: (startDate: string, endDate: string) => Promise<CampaignMetrics>
  
  // Templates
  templates: CampaignTemplate[]
  loadTemplates: () => Promise<void>
  createTemplate: (template: Partial<CampaignTemplate>) => Promise<CampaignTemplate | null>
  updateTemplate: (id: string, data: Partial<CampaignTemplate>) => Promise<CampaignTemplate | null>
  deleteTemplate: (id: string) => Promise<boolean>
  
  // Filtering and search
  setFilters: (filters: CampaignFilters) => void
  clearFilters: () => void
  searchCampaigns: (query: string) => void
  
  // Utility functions
  getCampaignById: (id: string) => Campaign | undefined
  getCampaignsByStatus: (status: string) => Campaign[]
  getActiveCampaigns: () => Campaign[]
  getScheduledCampaigns: () => Campaign[]
  
  // Message utilities
  calculateSMSCount: (text: string) => number
  estimateCosts: (recipientCount: number, messageLength: number, channel: string) => number
  validateMessage: (content: string, channel: string) => { valid: boolean; errors: string[] }
  
  // Audience utilities
  getEstimatedReach: (segmentIds: string[]) => Promise<number>
  validateAudience: (segmentIds: string[]) => Promise<{ valid: boolean; errors: string[] }>
}

/**
 * Mock campaign API functions (replace with actual API calls)
 */
const campaignsApi = {
  async getCampaigns(filters?: CampaignFilters) {
    // Mock implementation - replace with actual API
    return { data: [], error: null }
  },
  
  async createCampaign(data: Partial<Campaign>) {
    // Mock implementation
    return { data: null, error: null }
  },
  
  async updateCampaign(id: string, data: Partial<Campaign>) {
    // Mock implementation
    return { data: null, error: null }
  },
  
  async deleteCampaign(id: string) {
    // Mock implementation
    return { data: true, error: null }
  },
  
  async updateCampaignStatus(id: string, status: string) {
    // Mock implementation
    return { data: true, error: null }
  },
  
  async getCampaignMetrics(id: string) {
    // Mock implementation
    return { data: null, error: null }
  },
  
  async getTemplates() {
    // Mock implementation
    return { data: [], error: null }
  },
}

/**
 * Hook for comprehensive campaign management
 */
export function useCampaigns(options: UseCampaignsOptions = {}): UseCampaignsResult {
  const {
    immediate = true,
    filters: initialFilters = {},
    cacheTTL = 3 * 60 * 1000, // 3 minutes
    includeArchived = false,
    enableRealTimeUpdates = false,
  } = options

  // State
  const [filters, setFiltersState] = useState<CampaignFilters>(initialFilters)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [overallMetrics, setOverallMetrics] = useState<CampaignMetrics>({
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
    unsubscribeRate: 0,
    bounceRate: 0,
  })
  const [totalCount, setTotalCount] = useState(0)

  // Generate cache key
  const cacheKey = useMemo(() => {
    return `campaigns-${JSON.stringify({ filters, includeArchived })}`
  }, [filters, includeArchived])

  // Main async data hook
  const {
    data: campaigns,
    loading,
    error,
    execute: fetchCampaigns,
    refetch,
    reset,
  } = useAsyncData<Campaign[]>(
    async () => {
      const result = await campaignsApi.getCampaigns(filters)
      
      if (result.error) {
        throw new Error(result.error)
      }

      const campaignData = result.data || []
      setTotalCount(campaignData.length)
      
      // Calculate overall metrics
      if (campaignData.length > 0) {
        const metrics = calculateOverallMetrics(campaignData)
        setOverallMetrics(metrics)
      }

      return campaignData
    },
    {
      immediate,
      cache: { key: cacheKey, ttl: cacheTTL },
      transformError: (error) => ({
        message: error instanceof Error ? error.message : 'Failed to fetch campaigns',
        code: 'FETCH_ERROR',
      }),
    }
  )

  /**
   * Calculate overall metrics from campaigns
   */
  const calculateOverallMetrics = useCallback((campaignData: Campaign[]): CampaignMetrics => {
    if (campaignData.length === 0) {
      return {
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        unsubscribeRate: 0,
        bounceRate: 0,
      }
    }

    const totals = campaignData.reduce(
      (acc, campaign) => ({
        recipients: acc.recipients + (campaign.recipients || 0),
        sent: acc.sent + (campaign.sent || 0),
        delivered: acc.delivered + (campaign.delivered || 0),
        opened: acc.opened + (campaign.opened || 0),
        clicked: acc.clicked + (campaign.clicked || 0),
        conversions: acc.conversions + (campaign.conversions || 0),
      }),
      { recipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, conversions: 0 }
    )

    return {
      deliveryRate: totals.sent > 0 ? (totals.delivered / totals.sent) * 100 : 0,
      openRate: totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0,
      clickRate: totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0,
      conversionRate: totals.recipients > 0 ? (totals.conversions / totals.recipients) * 100 : 0,
      unsubscribeRate: 0, // Would need to be calculated from actual data
      bounceRate: totals.sent > 0 ? ((totals.sent - totals.delivered) / totals.sent) * 100 : 0,
    }
  }, [])

  // Computed values
  const isEmpty = !loading && (!campaigns || campaigns.length === 0)

  /**
   * CRUD Operations
   */
  const createCampaign = useCallback(async (data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const result = await campaignsApi.createCampaign(data)
      
      if (result.error) {
        throw new Error(result.error)
      }

      refetch() // Refresh the list
      return result.data as Campaign || null
    } catch (error) {
      logger.error('Failed to create campaign:', error)
      return null
    }
  }, [refetch])

  const updateCampaign = useCallback(async (id: string, data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const result = await campaignsApi.updateCampaign(id, data)
      
      if (result.error) {
        throw new Error(result.error)
      }

      refetch()
      return result.data as Campaign || null
    } catch (error) {
      logger.error('Failed to update campaign:', error)
      return null
    }
  }, [refetch])

  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await campaignsApi.deleteCampaign(id)
      
      if (result.error) {
        throw new Error(result.error)
      }

      refetch()
      return true
    } catch (error) {
      logger.error('Failed to delete campaign:', error)
      return false
    }
  }, [refetch])

  const duplicateCampaign = useCallback(async (id: string, newName?: string): Promise<Campaign | null> => {
    const originalCampaign = campaigns?.find(c => c.id === id)
    if (!originalCampaign) return null

    const duplicateData = {
      ...originalCampaign,
      id: undefined, // Let the API generate a new ID
      name: newName || `${originalCampaign.name} (Copy)`,
      status: 'draft' as const,
      created_at: undefined,
      updated_at: undefined,
    }

    return createCampaign(duplicateData)
  }, [campaigns, createCampaign])

  /**
   * Status Management
   */
  const updateCampaignStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
    try {
      const result = await campaignsApi.updateCampaignStatus(id, status)
      
      if (result.error) {
        throw new Error(result.error)
      }

      refetch()
      return true
    } catch (error) {
      logger.error(`Failed to ${status} campaign:`, error)
      return false
    }
  }, [refetch])

  const startCampaign = useCallback((id: string) => updateCampaignStatus(id, 'active'), [updateCampaignStatus])
  const pauseCampaign = useCallback((id: string) => updateCampaignStatus(id, 'paused'), [updateCampaignStatus])
  const resumeCampaign = useCallback((id: string) => updateCampaignStatus(id, 'active'), [updateCampaignStatus])
  const stopCampaign = useCallback((id: string) => updateCampaignStatus(id, 'completed'), [updateCampaignStatus])

  const scheduleCampaign = useCallback(async (id: string, schedule: ScheduleConfig): Promise<boolean> => {
    return updateCampaign(id, { 
      schedule_config: schedule,
      status: 'scheduled'
    }).then(result => !!result)
  }, [updateCampaign])

  /**
   * Metrics and Analytics
   */
  const getCampaignMetrics = useCallback(async (id: string): Promise<CampaignMetrics | null> => {
    try {
      const result = await campaignsApi.getCampaignMetrics(id)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return result.data as CampaignMetrics || null
    } catch (error) {
      logger.error('Failed to get campaign metrics:', error)
      return null
    }
  }, [])

  const getMetricsForPeriod = useCallback(async (startDate: string, endDate: string): Promise<CampaignMetrics> => {
    // Filter campaigns by date range and calculate metrics
    const periodCampaigns = campaigns?.filter(campaign => {
      const campaignDate = new Date(campaign.created_at)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return campaignDate >= start && campaignDate <= end
    }) || []

    return calculateOverallMetrics(periodCampaigns)
  }, [campaigns, calculateOverallMetrics])

  /**
   * Template Management
   */
  const loadTemplates = useCallback(async () => {
    try {
      const result = await campaignsApi.getTemplates()
      
      if (result.error) {
        throw new Error(result.error)
      }

      setTemplates(result.data || [])
    } catch (error) {
      logger.error('Failed to load templates:', error)
    }
  }, [])

  const createTemplate = useCallback(async (template: Partial<CampaignTemplate>): Promise<CampaignTemplate | null> => {
    // Mock implementation
    const newTemplate: CampaignTemplate = {
      id: `template-${Date.now()}`,
      name: template.name || 'Untitled Template',
      type: template.type || 'standard',
      content: template.content || '',
      variables: template.variables || [],
      category: template.category || 'General',
      created_at: new Date().toISOString(),
      usage_count: 0,
    }
    
    setTemplates(prev => [...prev, newTemplate])
    return newTemplate
  }, [])

  const updateTemplate = useCallback(async (id: string, data: Partial<CampaignTemplate>): Promise<CampaignTemplate | null> => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...data } : template
    ))
    
    const updatedTemplate = templates.find(t => t.id === id)
    return updatedTemplate || null
  }, [templates])

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    setTemplates(prev => prev.filter(template => template.id !== id))
    return true
  }, [])

  /**
   * Filtering and Search
   */
  const setFilters = useCallback((newFilters: CampaignFilters) => {
    setFiltersState(newFilters)
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({})
  }, [])

  const searchCampaigns = useCallback((query: string) => {
    setFilters({ ...filters, search: query })
  }, [filters, setFilters])

  /**
   * Utility Functions
   */
  const getCampaignById = useCallback((id: string): Campaign | undefined => {
    return campaigns?.find(campaign => campaign.id === id)
  }, [campaigns])

  const getCampaignsByStatus = useCallback((status: string): Campaign[] => {
    return campaigns?.filter(campaign => campaign.status === status) || []
  }, [campaigns])

  const getActiveCampaigns = useCallback(() => getCampaignsByStatus('active'), [getCampaignsByStatus])
  const getScheduledCampaigns = useCallback(() => getCampaignsByStatus('scheduled'), [getCampaignsByStatus])

  /**
   * Message Utilities
   */
  const calculateSMSCount = useCallback((text: string): number => {
    return Math.ceil(text.length / 160)
  }, [])

  const estimateCosts = useCallback((recipientCount: number, messageLength: number, channel: string): number => {
    // Mock cost calculation
    const baseRate = channel === 'sms' ? 0.05 : 0.01 // Per message
    const smsCount = channel === 'sms' ? calculateSMSCount('x'.repeat(messageLength)) : 1
    return recipientCount * baseRate * smsCount
  }, [calculateSMSCount])

  const validateMessage = useCallback((content: string, channel: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!content.trim()) {
      errors.push('Message content is required')
    }
    
    if (channel === 'sms' && content.length > 1600) {
      errors.push('SMS message is too long (max 1600 characters)')
    }
    
    if (channel === 'email' && content.length < 10) {
      errors.push('Email content is too short')
    }
    
    return { valid: errors.length === 0, errors }
  }, [])

  /**
   * Audience Utilities
   */
  const getEstimatedReach = useCallback(async (segmentIds: string[]): Promise<number> => {
    // Mock implementation - would calculate actual reach from segments
    return segmentIds.length * 100 // Mock: 100 contacts per segment
  }, [])

  const validateAudience = useCallback(async (segmentIds: string[]): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = []
    
    if (segmentIds.length === 0) {
      errors.push('At least one audience segment must be selected')
    }
    
    return { valid: errors.length === 0, errors }
  }, [])

  /**
   * Refresh function (void return type)
   */
  const refresh = useCallback(async () => {
    reset()
    await fetchCampaigns()
  }, [reset, fetchCampaigns])

  /**
   * Refetch function (void return type)
   */
  const refetchData = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  return {
    // Data state
    campaigns: campaigns || [],
    loading,
    error: error?.message || null,
    isEmpty,
    totalCount,
    
    // Metrics
    overallMetrics,
    
    // Actions
    refetch: refetchData,
    refresh,
    reset,
    
    // CRUD operations
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    
    // Status management
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    stopCampaign,
    scheduleCampaign,
    
    // Metrics and analytics
    getCampaignMetrics,
    getMetricsForPeriod,
    
    // Templates
    templates,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Filtering and search
    setFilters,
    clearFilters,
    searchCampaigns,
    
    // Utility functions
    getCampaignById,
    getCampaignsByStatus,
    getActiveCampaigns,
    getScheduledCampaigns,
    
    // Message utilities
    calculateSMSCount,
    estimateCosts,
    validateMessage,
    
    // Audience utilities
    getEstimatedReach,
    validateAudience,
  }
}