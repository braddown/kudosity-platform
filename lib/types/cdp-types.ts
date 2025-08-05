// =====================================================
// Customer Data Platform (CDP) Type Definitions
// =====================================================
// These types reflect the new CDP architecture for:
// 1. Users (platform operators)
// 2. Profiles (master customer records)
// 3. Contacts (individual touchpoints)
// 4. Supporting entities for matching and activities
// =====================================================

export interface User {
  id: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  department?: string
  is_active: boolean
  permissions: string[]
  
  // Authentication & session
  last_login?: string
  password_reset_token?: string
  password_reset_expires?: string
  email_verified: boolean
  
  // Platform preferences
  timezone: string
  language_preference: string
  notification_preferences: Record<string, any>
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
}

export interface Profile {
  id: string
  
  // Primary matching field
  mobile: string
  
  // Consolidated customer data
  first_name?: string
  last_name?: string
  email?: string
  
  // Additional contact info
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  
  // Customer intelligence
  lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'churned' | 'blocked'
  lead_score: number
  lifetime_value: number
  data_quality_score: number
  
  // Custom data and preferences
  custom_fields: Record<string, any>
  notification_preferences: NotificationPreferences
  tags: string[]
  
  // Profile metadata
  source: string
  source_details: Record<string, any>
  created_at: string
  updated_at: string
  last_activity_at: string
  
  // Deduplication and merge management
  is_duplicate: boolean
  duplicate_of_profile_id?: string
  merge_status: 'active' | 'duplicate' | 'merged' | 'archived'
  
  // Data management
  data_retention_date?: string
  consent_date?: string
  consent_source?: string
}

export interface Contact {
  id: string
  profile_id?: string
  
  // Source information
  source: 'form_submission' | 'sms_inbound' | 'csv_upload' | 'api_import' | 
          'manual_entry' | 'webhook' | 'integration' | 'email_inbound'
  source_details: Record<string, any>
  batch_id?: string
  external_id?: string
  
  // Raw contact data
  mobile?: string
  email?: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  raw_data: Record<string, any>
  
  // Processing and matching status
  processing_status: 'pending' | 'processing' | 'matched' | 'needs_review' | 
                    'archived' | 'rejected' | 'failed'
  match_confidence?: number
  match_method?: string
  potential_matches: ProfileMatch[]
  
  // Processing metadata
  created_at: string
  processed_at?: string
  processed_by?: string
  processing_notes?: string
  retry_count: number
  last_retry_at?: string
}

export interface ProfileActivity {
  id: string
  profile_id: string
  contact_id?: string
  
  // Activity classification
  activity_type: 'profile_created' | 'contact_merged' | 'data_updated' | 'manual_edit' |
                'communication_sent' | 'communication_received' | 'tag_added' | 'tag_removed' |
                'lifecycle_changed' | 'preference_updated' | 'custom_field_updated'
  activity_description?: string
  
  // Change tracking
  changes: Record<string, any>
  data_source?: string
  channel?: string
  
  // Activity metadata
  created_at: string
  created_by?: string
  ip_address?: string
  user_agent?: string
}

export interface ContactReviewQueue {
  id: string
  contact_id: string
  
  // Review classification
  review_type: 'duplicate_check' | 'data_conflict' | 'low_confidence_match' | 
               'manual_verification' | 'compliance_review'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Review data
  potential_matches: ProfileMatch[]
  conflict_details: Record<string, any>
  review_notes?: string
  
  // Assignment and status
  assigned_to?: string
  status: 'pending' | 'in_review' | 'resolved' | 'escalated'
  resolution: Record<string, any>
  
  // Timestamps
  created_at: string
  assigned_at?: string
  resolved_at?: string
  resolved_by?: string
}

export interface ProfileMatch {
  profile_id: string
  score: number
  reasons: string[]
}

export interface NotificationPreferences {
  marketing_sms: boolean
  marketing_email: boolean
  transactional_sms: boolean
  transactional_email: boolean
  marketing_whatsapp: boolean
  transactional_whatsapp: boolean
  marketing_rcs: boolean
  transactional_rcs: boolean
}

export interface CustomFieldDefinition {
  id: string
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect'
  required: boolean
  default_value?: string
  description?: string
  options?: string[] // For select/multiselect types
  created_at: string
  updated_at: string
}

export interface NotificationPolicy {
  id: string
  name: string
  description?: string
  channel: 'sms' | 'email' | 'whatsapp' | 'rcs'
  type: 'marketing' | 'transactional'
  enabled: boolean
  rules: Record<string, any>
  created_at: string
  updated_at: string
}

// Processing result types
export interface ContactProcessingResult {
  success: boolean
  action: 'new_profile_created' | 'auto_matched' | 'auto_matched_needs_review' | 'needs_manual_review'
  profile_id?: string
  contact_id: string
  confidence?: number
  reasons?: string[]
  matches_found?: number
  potential_matches?: ProfileMatch[]
  error?: string
}

export interface BatchProcessingResult {
  processed_count: number
  success_count: number
  error_count: number
  results: ContactProcessingResult[]
}

// Hook interfaces for compatibility with existing code
export interface UseProfilesOptions {
  filters?: {
    status?: string
    lifecycle_stage?: string
    tags?: string[]
    source?: string
    search?: string
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

export interface UseProfilesResult {
  profiles: Profile[]
  loading: boolean
  error: string | null
  totalCount: number
  pagination: {
    page: number
    pageSize: number
    totalPages: number
  }
  // CRUD operations
  createProfile: (profile: Partial<Profile>) => Promise<Profile>
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<Profile>
  deleteProfile: (id: string) => Promise<void>
  mergeProfiles: (sourceId: string, targetId: string) => Promise<void>
  // Filtering and search
  setFilters: (filters: UseProfilesOptions['filters']) => void
  clearFilters: () => void
  refetch: () => Promise<void>
}

// Migration utility types
export interface MigrationProfile {
  // Maps existing profiles table to new cdp_profiles structure
  id: string
  mobile?: string
  first_name?: string
  last_name?: string
  email?: string
  custom_fields?: Record<string, any>
  notification_preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MigrationContact {
  // Maps existing contacts table to new cdp_contacts structure
  id: string
  mobile?: string
  email?: string
  first_name?: string
  last_name?: string
  source?: string
  created_at: string
}