/**
 * Filter Field Definitions for different data types
 * CC001: Consolidate Filter Components - Centralized field definitions
 */

import type { FieldDefinition } from '@/components/ui/unified-filter-builder'

// ==================== PROFILE FILTER DEFINITIONS ====================

export const profileFilterFields: FieldDefinition[] = [
  // Core Identity
  {
    key: 'id',
    label: 'Profile ID',
    type: 'string'
  },
  {
    key: 'first_name',
    label: 'First Name',
    type: 'string'
  },
  {
    key: 'last_name',
    label: 'Last Name',
    type: 'string'
  },
  {
    key: 'email',
    label: 'Email',
    type: 'string'
  },
  {
    key: 'mobile',
    label: 'Mobile',
    type: 'string'
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'string'
  },

  // Location & Demographics
  {
    key: 'postcode',
    label: 'Postcode',
    type: 'string'
  },
  {
    key: 'suburb',
    label: 'Suburb',
    type: 'string'
  },
  {
    key: 'state',
    label: 'State',
    type: 'enum',
    options: [
      { value: 'NSW', label: 'New South Wales' },
      { value: 'VIC', label: 'Victoria' },
      { value: 'QLD', label: 'Queensland' },
      { value: 'WA', label: 'Western Australia' },
      { value: 'SA', label: 'South Australia' },
      { value: 'TAS', label: 'Tasmania' },
      { value: 'NT', label: 'Northern Territory' },
      { value: 'ACT', label: 'Australian Capital Territory' }
    ]
  },
  {
    key: 'country',
    label: 'Country',
    type: 'string'
  },
  {
    key: 'timezone',
    label: 'Timezone',
    type: 'string'
  },
  {
    key: 'language_preferences',
    label: 'Language',
    type: 'string'
  },

  // Device & Technical
  {
    key: 'device',
    label: 'Device',
    type: 'enum',
    options: [
      { value: 'mobile', label: 'Mobile' },
      { value: 'tablet', label: 'Tablet' },
      { value: 'desktop', label: 'Desktop' },
      { value: 'unknown', label: 'Unknown' }
    ]
  },
  {
    key: 'os',
    label: 'Operating System',
    type: 'enum',
    options: [
      { value: 'iOS', label: 'iOS' },
      { value: 'Android', label: 'Android' },
      { value: 'Windows', label: 'Windows' },
      { value: 'macOS', label: 'macOS' },
      { value: 'Linux', label: 'Linux' },
      { value: 'unknown', label: 'Unknown' }
    ]
  },
  {
    key: 'source',
    label: 'Source',
    type: 'string'
  },

  // Status & Permissions
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'deleted', label: 'Deleted' }
    ]
  },
  {
    key: 'lifecycle_stage',
    label: 'Lifecycle Stage',
    type: 'enum',
    options: [
      { value: 'lead', label: 'Lead' },
      { value: 'customer', label: 'Customer' },
      { value: 'subscriber', label: 'Subscriber' },
      { value: 'prospect', label: 'Prospect' }
    ]
  },
  {
    key: 'is_suppressed',
    label: 'Is Suppressed',
    type: 'boolean'
  },
  {
    key: 'is_transactional',
    label: 'Is Transactional',
    type: 'boolean'
  },
  {
    key: 'is_high_value',
    label: 'Is High Value',
    type: 'boolean'
  },
  {
    key: 'is_subscribed',
    label: 'Is Subscribed',
    type: 'boolean'
  },
  {
    key: 'is_marketing',
    label: 'Is Marketing',
    type: 'boolean'
  },

  // Timestamps
  {
    key: 'created_at',
    label: 'Created Date',
    type: 'date'
  },
  {
    key: 'updated_at',
    label: 'Updated Date',
    type: 'date'
  },
  {
    key: 'last_activity_at',
    label: 'Last Activity',
    type: 'date'
  },

  // Numeric Fields
  {
    key: 'total_purchases',
    label: 'Total Purchases',
    type: 'number'
  },
  {
    key: 'total_spent',
    label: 'Total Spent',
    type: 'number'
  },
  {
    key: 'avg_order_value',
    label: 'Average Order Value',
    type: 'number'
  },

  // Array Fields
  {
    key: 'tags',
    label: 'Tags',
    type: 'array'
  },
  {
    key: 'teams',
    label: 'Teams',
    type: 'array'
  }
]

// ==================== LOG FILTER DEFINITIONS ====================

export const logFilterFields: FieldDefinition[] = [
  {
    key: 'event_type',
    label: 'Event Type',
    type: 'enum',
    options: [
      { value: 'profile_created', label: 'Profile Created' },
      { value: 'profile_updated', label: 'Profile Updated' },
      { value: 'profile_deleted', label: 'Profile Deleted' },
      { value: 'campaign_sent', label: 'Campaign Sent' },
      { value: 'message_delivered', label: 'Message Delivered' },
      { value: 'message_failed', label: 'Message Failed' },
      { value: 'webhook_received', label: 'Webhook Received' },
      { value: 'api_request', label: 'API Request' },
      { value: 'user_login', label: 'User Login' },
      { value: 'error', label: 'Error' }
    ]
  },
  {
    key: 'level',
    label: 'Log Level',
    type: 'enum',
    options: [
      { value: 'debug', label: 'Debug' },
      { value: 'info', label: 'Info' },
      { value: 'warn', label: 'Warning' },
      { value: 'error', label: 'Error' },
      { value: 'fatal', label: 'Fatal' }
    ]
  },
  {
    key: 'message',
    label: 'Message',
    type: 'string'
  },
  {
    key: 'component',
    label: 'Component',
    type: 'string'
  },
  {
    key: 'user_id',
    label: 'User ID',
    type: 'string'
  },
  {
    key: 'profile_id',
    label: 'Profile ID',
    type: 'string'
  },
  {
    key: 'campaign_id',
    label: 'Campaign ID',
    type: 'string'
  },
  {
    key: 'ip_address',
    label: 'IP Address',
    type: 'string'
  },
  {
    key: 'user_agent',
    label: 'User Agent',
    type: 'string'
  },
  {
    key: 'timestamp',
    label: 'Timestamp',
    type: 'date'
  },
  {
    key: 'created_at',
    label: 'Created Date',
    type: 'date'
  },
  {
    key: 'duration',
    label: 'Duration (ms)',
    type: 'number'
  },
  {
    key: 'status_code',
    label: 'Status Code',
    type: 'number'
  },
  {
    key: 'error_count',
    label: 'Error Count',
    type: 'number'
  }
]

// ==================== CAMPAIGN FILTER DEFINITIONS ====================

export const campaignFilterFields: FieldDefinition[] = [
  {
    key: 'id',
    label: 'Campaign ID',
    type: 'string'
  },
  {
    key: 'name',
    label: 'Campaign Name',
    type: 'string'
  },
  {
    key: 'type',
    label: 'Campaign Type',
    type: 'enum',
    options: [
      { value: 'sms', label: 'SMS' },
      { value: 'email', label: 'Email' },
      { value: 'push', label: 'Push Notification' },
      { value: 'webhook', label: 'Webhook' }
    ]
  },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'sending', label: 'Sending' },
      { value: 'sent', label: 'Sent' },
      { value: 'paused', label: 'Paused' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'failed', label: 'Failed' }
    ]
  },
  {
    key: 'channel',
    label: 'Channel',
    type: 'enum',
    options: [
      { value: 'sms', label: 'SMS' },
      { value: 'email', label: 'Email' },
      { value: 'push', label: 'Push' },
      { value: 'webhook', label: 'Webhook' }
    ]
  },
  {
    key: 'created_at',
    label: 'Created Date',
    type: 'date'
  },
  {
    key: 'updated_at',
    label: 'Updated Date',
    type: 'date'
  },
  {
    key: 'sent_at',
    label: 'Sent Date',
    type: 'date'
  },
  {
    key: 'scheduled_at',
    label: 'Scheduled Date',
    type: 'date'
  },
  {
    key: 'target_count',
    label: 'Target Count',
    type: 'number'
  },
  {
    key: 'sent_count',
    label: 'Sent Count',
    type: 'number'
  },
  {
    key: 'delivered_count',
    label: 'Delivered Count',
    type: 'number'
  },
  {
    key: 'failed_count',
    label: 'Failed Count',
    type: 'number'
  },
  {
    key: 'delivery_rate',
    label: 'Delivery Rate (%)',
    type: 'number'
  },
  {
    key: 'budget',
    label: 'Budget',
    type: 'number'
  },
  {
    key: 'cost',
    label: 'Cost',
    type: 'number'
  }
]

// ==================== FIELD DEFINITION HELPERS ====================

export function getFieldDefinitions(type: 'profile' | 'log' | 'campaign'): FieldDefinition[] {
  switch (type) {
    case 'profile':
      return profileFilterFields
    case 'log':
      return logFilterFields
    case 'campaign':
      return campaignFilterFields
    default:
      return profileFilterFields
  }
}

export function createCustomFieldDefinition(
  key: string,
  label: string,
  type: 'string' | 'number' | 'date' | 'boolean' = 'string'
): FieldDefinition {
  return {
    key,
    label,
    type,
    validation: {
      required: false
    }
  }
}

export function mergeFieldDefinitions(
  baseFields: FieldDefinition[],
  customFields: FieldDefinition[]
): FieldDefinition[] {
  const baseFieldKeys = new Set(baseFields.map(field => field.key))
  
  // Add custom fields that don't conflict with base fields
  const nonConflictingCustomFields = customFields.filter(field => 
    !baseFieldKeys.has(field.key)
  )
  
  return [
    ...baseFields,
    ...nonConflictingCustomFields
  ]
}