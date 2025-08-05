/**
 * Customer Data Platform (CDP) Types
 * 
 * This file contains all TypeScript interfaces for the CDP architecture:
 * - Users (platform operators)  
 * - Profiles (master customer records)
 * - Contacts (individual touchpoints)
 * - Activities, reviews, and processing types
 */

// =====================================================
// BASE TYPES & ENUMS
// =====================================================

export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer'
export type LifecycleStage = 'lead' | 'prospect' | 'customer' | 'churned' | 'blocked'
export type MergeStatus = 'active' | 'duplicate' | 'merged' | 'archived'

export type ContactSource = 
  | 'form_submission' 
  | 'sms_inbound' 
  | 'csv_upload' 
  | 'api_import' 
  | 'manual_entry' 
  | 'webhook' 
  | 'integration' 
  | 'email_inbound'

export type ProcessingStatus = 
  | 'pending' 
  | 'processing' 
  | 'matched' 
  | 'needs_review' 
  | 'archived' 
  | 'rejected' 
  | 'failed'

export type ActivityType = 
  | 'profile_created' 
  | 'contact_merged' 
  | 'data_updated' 
  | 'manual_edit'
  | 'communication_sent' 
  | 'communication_received' 
  | 'tag_added' 
  | 'tag_removed'
  | 'lifecycle_changed' 
  | 'preference_updated' 
  | 'custom_field_updated'

export type ReviewType = 
  | 'duplicate_check' 
  | 'data_conflict' 
  | 'low_confidence_match' 
  | 'manual_verification' 
  | 'compliance_review'

export type ReviewStatus = 'pending' | 'in_review' | 'resolved' | 'escalated'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

// =====================================================
// NOTIFICATION PREFERENCES
// =====================================================

export interface NotificationPreferences {
  // Marketing channels
  marketing_sms: boolean
  marketing_email: boolean
  marketing_whatsapp: boolean
  marketing_rcs: boolean
  
  // Transactional channels
  transactional_sms: boolean
  transactional_email: boolean
  transactional_whatsapp: boolean
  transactional_rcs: boolean
  
  // Additional preferences
  frequency_cap?: number  // Max messages per day
  quiet_hours?: {
    start: string  // HH:MM format
    end: string    // HH:MM format
    timezone: string
  }
  unsubscribe_date?: string
  dnc_status?: boolean  // Do Not Call
}

// =====================================================
// CUSTOM FIELD TYPES
// =====================================================

export type CustomFieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'textarea'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'datetime'
  | 'single_select'
  | 'multi_select'
  | 'file'
  | 'color'

export interface CustomFieldDefinition {
  id: string
  key: string
  label: string
  type: CustomFieldType
  required: boolean
  default_value?: any
  description?: string
  entity_type: 'contact' | 'profile'
  options?: string[]  // For select fields
  validation_rules?: {
    min?: number
    max?: number
    pattern?: string
    file_types?: string[]
  }
  is_system_field: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// USER (Platform Operators) 
// =====================================================

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
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
  notification_preferences: {
    email_alerts: boolean
    desktop_notifications: boolean
    daily_reports: boolean
    weekly_reports: boolean
  }
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CreateUserRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  department?: string
  permissions?: string[]
  timezone?: string
  language_preference?: string
}

export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  role?: UserRole
  department?: string
  is_active?: boolean
  permissions?: string[]
  timezone?: string
  language_preference?: string
  notification_preferences?: User['notification_preferences']
}

// =====================================================
// PROFILE (Master Customer Records)
// =====================================================

export interface Profile {
  id: string
  mobile: string  // Primary matching field
  
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
  lifecycle_stage: LifecycleStage
  lead_score: number  // 0-100
  lifetime_value: number
  data_quality_score: number  // 0-1
  
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
  merge_status: MergeStatus
  
  // Data management (GDPR compliance)
  data_retention_date?: string
  consent_date?: string
  consent_source?: string
}

export interface CreateProfileRequest {
  mobile: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  source: string
  source_details?: Record<string, any>
  custom_fields?: Record<string, any>
  notification_preferences?: Partial<NotificationPreferences>
  tags?: string[]
  lifecycle_stage?: LifecycleStage
  consent_date?: string
  consent_source?: string
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  email?: string
  mobile?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  lifecycle_stage?: LifecycleStage
  lead_score?: number
  lifetime_value?: number
  custom_fields?: Record<string, any>
  notification_preferences?: Partial<NotificationPreferences>
  tags?: string[]
}

// =====================================================
// CONTACT (Individual Touchpoints)
// =====================================================

export interface Contact {
  id: string
  profile_id?: string  // NULL until matched
  
  // Source information
  source: ContactSource
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
  processing_status: ProcessingStatus
  match_confidence?: number  // 0-1
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

export interface CreateContactRequest {
  source: ContactSource
  source_details?: Record<string, any>
  batch_id?: string
  external_id?: string
  mobile?: string
  email?: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  raw_data?: Record<string, any>
}

export interface ProfileMatch {
  profile_id: string
  score: number
  reasons: string[]
  profile?: Profile  // Populated for UI display
}

// =====================================================
// PROFILE ACTIVITY (Activity Log)
// =====================================================

export interface ProfileActivity {
  id: string
  profile_id: string
  contact_id?: string
  
  // Activity classification
  activity_type: ActivityType
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

export interface CreateActivityRequest {
  profile_id: string
  contact_id?: string
  activity_type: ActivityType
  activity_description?: string
  changes?: Record<string, any>
  data_source?: string
  channel?: string
}

// =====================================================
// CONTACT REVIEW QUEUE
// =====================================================

export interface ContactReview {
  id: string
  contact_id: string
  
  // Review classification
  review_type: ReviewType
  priority: Priority
  
  // Review data
  potential_matches: ProfileMatch[]
  conflict_details: Record<string, any>
  review_notes?: string
  
  // Assignment and status
  assigned_to?: string
  status: ReviewStatus
  resolution?: Record<string, any>
  
  // Timestamps
  created_at: string
  assigned_at?: string
  resolved_at?: string
  resolved_by?: string
  
  // Populated for UI
  contact?: Contact
  assigned_user?: User
  resolved_user?: User
}

export interface UpdateReviewRequest {
  assigned_to?: string
  status?: ReviewStatus
  review_notes?: string
  resolution?: Record<string, any>
}

// =====================================================
// PROFILE MERGE LOG
// =====================================================

export interface ProfileMerge {
  id: string
  source_profile_id: string
  target_profile_id: string
  
  // Merge details
  merge_reason?: string
  data_conflicts: Record<string, any>
  resolution_strategy: Record<string, any>
  
  // Metadata
  merged_at: string
  merged_by?: string
  can_be_undone: boolean
  
  // Populated for UI
  source_profile?: Profile
  target_profile?: Profile
  merged_by_user?: User
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface ProcessingResult {
  success: boolean
  action?: 'new_profile_created' | 'auto_matched' | 'needs_manual_review' | 'auto_matched_needs_review'
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
  results: ProcessingResult[]
}

export interface MergeResult {
  success: boolean
  source_profile_id?: string
  target_profile_id?: string
  contacts_moved?: number
  activities_moved?: number
  error?: string
}

// =====================================================
// SEARCH & FILTER TYPES
// =====================================================

export interface ProfileSearchFilters {
  search?: string  // Search name, email, mobile
  lifecycle_stage?: LifecycleStage[]
  tags?: string[]
  source?: string[]
  created_after?: string
  created_before?: string
  last_activity_after?: string
  last_activity_before?: string
  lead_score_min?: number
  lead_score_max?: number
  has_email?: boolean
  has_mobile?: boolean
  merge_status?: MergeStatus[]
  custom_fields?: Record<string, any>
}

export interface ContactSearchFilters {
  search?: string
  source?: ContactSource[]
  processing_status?: ProcessingStatus[]
  created_after?: string
  created_before?: string
  has_profile?: boolean
  batch_id?: string
}

export interface ReviewSearchFilters {
  review_type?: ReviewType[]
  status?: ReviewStatus[]
  priority?: Priority[]
  assigned_to?: string
  created_after?: string
  created_before?: string
}

// =====================================================
// DASHBOARD & ANALYTICS TYPES
// =====================================================

export interface ProfileMetrics {
  total_profiles: number
  active_profiles: number
  duplicate_profiles: number
  profiles_by_lifecycle: Record<LifecycleStage, number>
  average_lead_score: number
  total_lifetime_value: number
  profiles_created_today: number
  profiles_created_this_week: number
  profiles_created_this_month: number
}

export interface ContactMetrics {
  total_contacts: number
  pending_contacts: number
  matched_contacts: number
  contacts_needing_review: number
  contacts_by_source: Record<ContactSource, number>
  average_match_confidence: number
  contacts_created_today: number
  processing_success_rate: number
}

export interface ReviewMetrics {
  total_reviews: number
  pending_reviews: number
  in_review_count: number
  resolved_today: number
  average_resolution_time_hours: number
  reviews_by_type: Record<ReviewType, number>
  reviews_by_priority: Record<Priority, number>
}

export interface DashboardMetrics {
  profiles: ProfileMetrics
  contacts: ContactMetrics
  reviews: ReviewMetrics
  last_updated: string
}

// =====================================================
// EXPORT TYPES
// =====================================================

export interface ExportRequest {
  entity_type: 'profiles' | 'contacts' | 'activities'
  format: 'csv' | 'xlsx' | 'json'
  filters?: ProfileSearchFilters | ContactSearchFilters
  fields?: string[]
  include_custom_fields?: boolean
}

export interface ExportStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress_percentage: number
  download_url?: string
  error_message?: string
  created_at: string
  completed_at?: string
  expires_at?: string
}