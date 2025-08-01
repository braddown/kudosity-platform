// Generated Database Types for Kudosity
// This file contains all the database types and utility functions

export interface ActiveContacts {
  id?: string
  created_at?: string
  updated_at?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  status?: string
  source?: string
  tags?: string[]
  lifetime_value?: number
  last_activity_date?: string
  first_contact_date?: string
  device?: string
  os?: string
  location?: string
  timezone?: string
  opt_in_date?: string
  opt_out_date?: string
  custom_fields?: Record<string, any>
}

export interface Activities {
  id: string
  activity_time?: string
  type?: ActivityType
  contact_id?: string
  campaign_id?: string
  message_id?: string
  value?: number
  details?: Record<string, any>
  source?: string
  url?: string
  duration?: number
  conversion?: boolean
}

export interface Campaigns {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  description?: string
  status?: CampaignStatus
  type?: CampaignType
  start_date?: string
  end_date?: string
  creator_id?: string
  template_id?: string
  segment_id?: string
  list_id?: string
  channel?: Channel
  budget?: number
  performance_metrics?: Record<string, any>
  a_b_test?: boolean
  a_b_test_variables?: Record<string, any>
  tags?: string[]
}

export interface Chats {
  id: string
  created_at?: string
  updated_at?: string
  contact_id?: string
  profile_id?: string
  status?: ChatStatus
  channel?: ChatChannel
  first_message_id?: string
  last_message_id?: string
  tags?: string[]
  priority?: ChatPriority
  resolution_time?: number
  satisfaction_score?: number
  ai_handled?: boolean
  notes?: string
}

export interface Contacts {
  id: string
  created_at?: string
  updated_at?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  status?: ContactStatus
  source?: string
  tags?: string[]
  lifetime_value?: number
  last_activity_date?: string
  first_contact_date?: string
  device?: DeviceType
  os?: string
  location?: string
  timezone?: string
  opt_in_date?: string
  opt_out_date?: string
  custom_fields?: Record<string, any>
}

export interface Lists {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  description?: string
  creator_id?: string
  type?: ListType
  source?: string
  contact_count?: number
  tags?: string[]
  shared?: boolean
}

export interface ListMemberships {
  id: string
  list_id?: string
  contact_id?: string
  date_added?: string
  added_by?: string
  status?: MembershipStatus
  date_removed?: string
}

export interface Logs {
  id: string
  log_time?: string
  event_type?: LogEventType
  contact_id?: string
  campaign_id?: string
  message_id?: string
  profile_id?: string
  ip_address?: string
  user_agent?: string
  device?: string
  os?: string
  location?: string
  details?: Record<string, any>
}

export interface MessagesReceived {
  id: string
  received_at?: string
  contact_id?: string
  recipient_id?: string
  cost?: number
  message_content: string
  intent_standard?: MessageIntent
  intent_custom?: string
  sentiment?: MessageSentiment
  chat_id?: string
  channel?: MessageChannel
  metadata?: Record<string, any>
}

export interface MessagesSent {
  id: string
  created_at?: string
  updated_at?: string
  recipient_id?: string
  sender_id?: string
  campaign_id?: string
  cost?: number
  message_content: string
  template_id?: string
  template_name?: string
  status?: MessageStatus
  type?: MessageType
  channel?: MessageChannel
  metadata?: Record<string, any>
  chat_id?: string
}

export interface Profiles {
  id: string
  created_at?: string
  updated_at?: string
  first_name: string
  last_name: string
  email: string
  role?: ProfileRole
  status?: ProfileStatus
  last_login?: string
  teams?: string[]
  skills?: string[]
  performance_metrics?: Record<string, any>
  avatar_url?: string
  timezone?: string
  language_preferences?: string[]
  notification_preferences?: Record<string, any>
}

export interface Segments {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  description?: string
  creator_id?: string
  filter_criteria: Record<string, any>
  estimated_size?: number
  last_refresh?: string
  auto_update?: boolean
  tags?: string[]
  shared?: boolean
  type?: SegmentType
}

export interface Templates {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  description?: string
  creator_id?: string
  content: string
  variables?: string[]
  channel?: TemplateChannel
  category?: string
  tags?: string[]
  version?: string
  status?: TemplateStatus
  performance_metrics?: Record<string, any>
}

// Enum types based on database constraints
export type ActivityType = "Website Visit" | "Purchase" | "Form Submission" | "App Usage" | "Custom Event"

export type CampaignStatus = "Draft" | "Scheduled" | "Running" | "Completed" | "Paused" | "Cancelled"

export type CampaignType =
  | "Email"
  | "SMS"
  | "Push"
  | "In-app"
  | "Promotional"
  | "Transactional"
  | "Onboarding"
  | "Re-engagement"
  | "Newsletter"
  | "Announcement"
  | "Draft"

export type Channel =
  | "email"
  | "sms"
  | "push"
  | "social"
  | "whatsapp"
  | "Email"
  | "SMS"
  | "Push"
  | "Social"
  | "WhatsApp"

export type ChatStatus = "Active" | "Closed" | "Waiting"

export type ChatChannel = "SMS" | "WhatsApp" | "Web" | "Email"

export type ChatPriority = "Low" | "Medium" | "High" | "Urgent"

export type ContactStatus = "Active" | "Unsubscribed" | "Bounced" | "Spam Complaint"

export type DeviceType = "mobile" | "desktop" | "tablet" | "Mobile" | "Desktop" | "Tablet"

export type ListType = "Static" | "Dynamic"

export type MembershipStatus = "Active" | "Removed"

export type LogEventType =
  | "Test"
  | "Message Delivery"
  | "Open"
  | "Click"
  | "Conversion"
  | "Bounce"
  | "Unsubscribe"
  | "Spam Report"
  | "Error"
  | "Warning"
  | "Info"
  | "Debug"
  | "System"

export type MessageIntent = "Unsubscribe" | "Wrong Number" | "Thank You" | "Help" | "Stop"

export type MessageSentiment = "Positive" | "Neutral" | "Negative"

export type MessageChannel = "SMS" | "MMS" | "RCS" | "WhatsApp" | "Email"

export type MessageStatus = "Sent" | "Failed" | "Delivered" | "Read" | "Scheduled"

export type MessageType = "API" | "Campaign" | "Chat"

export type ProfileRole =
  | "admin"
  | "user"
  | "manager"
  | "customer"
  | "client"
  | "staff"
  | "employee"
  | "guest"
  | "Admin"
  | "User"
  | "Manager"
  | "Customer"
  | "Client"
  | "Staff"
  | "Employee"
  | "Guest"

export type ProfileStatus = "Active" | "Inactive"

export type SegmentType = "Demographic" | "Behavioral" | "Value-based" | "Custom"

export type TemplateChannel = "SMS" | "MMS" | "RCS" | "WhatsApp" | "Email"

export type TemplateStatus = "Draft" | "Active" | "Archived"

// Insert types (for creating new records)
export type ContactsInsert = Omit<Contacts, "id" | "created_at" | "updated_at">
export type CampaignsInsert = Omit<Campaigns, "id" | "created_at" | "updated_at">
export type ProfilesInsert = Omit<Profiles, "id" | "created_at" | "updated_at">
export type TemplatesInsert = Omit<Templates, "id" | "created_at" | "updated_at">
export type ListsInsert = Omit<Lists, "id" | "created_at" | "updated_at">
export type SegmentsInsert = Omit<Segments, "id" | "created_at" | "updated_at">
export type ChatsInsert = Omit<Chats, "id" | "created_at" | "updated_at">
export type MessagesSentInsert = Omit<MessagesSent, "id" | "created_at" | "updated_at">
export type MessagesReceivedInsert = Omit<MessagesReceived, "id">
export type ActivitiesInsert = Omit<Activities, "id">
export type LogsInsert = Omit<Logs, "id">

// Update types (for updating existing records)
export type ContactsUpdate = Partial<ContactsInsert> & { id: string }
export type CampaignsUpdate = Partial<CampaignsInsert> & { id: string }
export type ProfilesUpdate = Partial<ProfilesInsert> & { id: string }
export type TemplatesUpdate = Partial<TemplatesInsert> & { id: string }
export type ListsUpdate = Partial<ListsInsert> & { id: string }
export type SegmentsUpdate = Partial<SegmentsInsert> & { id: string }
export type ChatsUpdate = Partial<ChatsInsert> & { id: string }

// Database table names
export const TABLE_NAMES = {
  CONTACTS: "contacts",
  CAMPAIGNS: "campaigns",
  PROFILES: "profiles",
  TEMPLATES: "templates",
  LISTS: "lists",
  SEGMENTS: "segments",
  CHATS: "chats",
  MESSAGES_SENT: "messages_sent",
  MESSAGES_RECEIVED: "messages_received",
  ACTIVITIES: "activities",
  LOGS: "logs",
  LIST_MEMBERSHIPS: "list_memberships",
} as const

// Validation helpers
export const VALIDATION_RULES = {
  CONTACT_STATUS: ["Active", "Unsubscribed", "Bounced", "Spam Complaint"],
  CAMPAIGN_STATUS: ["Draft", "Scheduled", "Running", "Completed", "Paused", "Cancelled"],
  CAMPAIGN_TYPE: [
    "Email",
    "SMS",
    "Push",
    "In-app",
    "Promotional",
    "Transactional",
    "Onboarding",
    "Re-engagement",
    "Newsletter",
    "Announcement",
    "Draft",
  ],
  PROFILE_ROLE: [
    "admin",
    "user",
    "manager",
    "customer",
    "client",
    "staff",
    "employee",
    "guest",
    "Admin",
    "User",
    "Manager",
    "Customer",
    "Client",
    "Staff",
    "Employee",
    "Guest",
  ],
  PROFILE_STATUS: ["Active", "Inactive"],
  MESSAGE_CHANNEL: ["SMS", "MMS", "RCS", "WhatsApp", "Email"],
  MESSAGE_STATUS: ["Sent", "Failed", "Delivered", "Read", "Scheduled"],
  LOG_EVENT_TYPE: [
    "Test",
    "Message Delivery",
    "Open",
    "Click",
    "Conversion",
    "Bounce",
    "Unsubscribe",
    "Spam Report",
    "Error",
    "Warning",
    "Info",
    "Debug",
    "System",
  ],
} as const

// Utility functions
export function isValidContactStatus(status: string): status is ContactStatus {
  return VALIDATION_RULES.CONTACT_STATUS.includes(status as ContactStatus)
}

export function isValidCampaignStatus(status: string): status is CampaignStatus {
  return VALIDATION_RULES.CAMPAIGN_STATUS.includes(status as CampaignStatus)
}

export function isValidProfileRole(role: string): role is ProfileRole {
  return VALIDATION_RULES.PROFILE_ROLE.includes(role as ProfileRole)
}

export function isValidMessageChannel(channel: string): channel is MessageChannel {
  return VALIDATION_RULES.MESSAGE_CHANNEL.includes(channel as MessageChannel)
}

export function isValidLogEventType(eventType: string): eventType is LogEventType {
  return VALIDATION_RULES.LOG_EVENT_TYPE.includes(eventType as LogEventType)
}

// Default values
export const DEFAULT_VALUES = {
  CONTACT: {
    status: "Active" as ContactStatus,
    lifetime_value: 0,
    tags: [],
    custom_fields: {},
  },
  CAMPAIGN: {
    status: "Draft" as CampaignStatus,
    budget: 0,
    performance_metrics: {},
    a_b_test: false,
    tags: [],
  },
  PROFILE: {
    role: "user" as ProfileRole,
    status: "Active" as ProfileStatus,
    teams: [],
    skills: [],
    performance_metrics: {},
    language_preferences: [],
    notification_preferences: {},
  },
} as const
