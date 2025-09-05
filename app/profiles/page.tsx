"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import MainLayout from "@/components/MainLayout"
import { ProfileCounts } from "@/components/ProfileCounts"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Filter, Tag, UserX, Trash2, List, Download, Upload, Plus, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  getProfiles,
  createProfile,
  updateProfile,
  softDeleteProfile,
  restoreProfile,
  deleteProfile,
} from "@/lib/api/profiles-api"
import { logger } from "@/lib/utils/logger"
import { segmentsApi } from "@/lib/api/segments-api"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ListSelectionDialog } from "@/components/features/lists/ListSelectionDialog"
import { SegmentListDropdown } from "@/components/features/profiles/SegmentListDropdown"
import { ProfileAdvancedFilters } from "@/components/features/profiles/ProfileAdvancedFilters"
import { ProfileImportExport } from "@/components/features/profiles/ProfileImportExport"
import { LoadingSection } from "@/components/ui/loading"
import { FilterGroup, FilterEngine } from '@/components/ui/unified-filter-builder'
import { profileFilterFields, mergeFieldDefinitions, createCustomFieldDefinition } from '@/lib/utils/filter-definitions'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
  lifecycle_stage?: string  // Database field name
  created_at: string
  updated_at?: string
  last_activity_at?: string
  
  // Address fields
  address_line_1?: string | null
  address_line_2?: string | null
  postal_code?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  location?: string | null
  
  // Profile metadata
  timezone?: string | null
  language_preferences?: string | null
  device?: string | null
  os?: string | null
  source?: string | null
  notes?: string | null
  
  // Arrays and JSON fields
  tags?: string[]
  custom_fields?: Record<string, any>
  notification_preferences?: Record<string, boolean>
  
  // Duplicate management
  is_duplicate?: boolean
  duplicate_of_profile_id?: string | null
  merge_status?: string | null
  data_retention_date?: string | null
  
  // Account association
  account_id?: string
}

// Using unified filter types from UnifiedFilterBuilder

interface Segment {
  id: string
  name: string
  description?: string
  estimated_size: number
  profile_count?: number
  filter_criteria?: {
    conditions?: FilterCondition[]  // Legacy support for old segments
    filterGroups?: FilterGroup[]     // New grouped filter support
    profileType?: string
    searchTerm?: string
  }
  type: string
  created_at: string
}

// Field type definitions
type FieldType = 'text' | 'select' | 'date' | 'boolean' | 'number' | 'multiselect'

interface FieldDefinition {
  value: string
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
}

// Expanded list of all available profile fields for filtering with types
const availableFields: FieldDefinition[] = [
  // Core identity fields
  { value: "id", label: "ID", type: "text" },
  { value: "first_name", label: "First Name", type: "text" },
  { value: "last_name", label: "Last Name", type: "text" },
  { value: "email", label: "Email", type: "text" },
  { value: "mobile", label: "Mobile", type: "text" },
  { value: "status", label: "Status", type: "select", options: [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Deleted", label: "Deleted" }
  ]},

  // Address fields
  { value: "address_line_1", label: "Address Line 1", type: "text" },
  { value: "address_line_2", label: "Address Line 2", type: "text" },
  { value: "postal_code", label: "Postal Code", type: "text" },
  { value: "city", label: "City", type: "text" },
  { value: "state", label: "State", type: "text" },
  { value: "country", label: "Country", type: "select", options: [
    { value: "Australia", label: "Australia" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "United States", label: "United States" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "Canada", label: "Canada" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "Japan", label: "Japan" },
    { value: "China", label: "China" },
    { value: "India", label: "India" },
    { value: "Singapore", label: "Singapore" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "Thailand", label: "Thailand" },
    { value: "Philippines", label: "Philippines" },
  ]},
  { value: "location", label: "Location", type: "text" },

  // Profile metadata
  // Status field is already defined above with proper capitalization
  { value: "source", label: "Source", type: "select", options: [
    { value: "manual", label: "Manual Entry" },
    { value: "import", label: "CSV Import" },
    { value: "api", label: "API" },
    { value: "form", label: "Form Submission" },
    { value: "integration", label: "Integration" },
  ]},
  { value: "timezone", label: "Timezone", type: "text" },
  { value: "language_preferences", label: "Language", type: "select", options: [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
  ]},
  { value: "device", label: "Device", type: "text" },
  { value: "os", label: "Operating System", type: "text" },
  { value: "notes", label: "Notes", type: "text" },
  { value: "tags", label: "Tags", type: "text" },
  
  // Duplicate management
  { value: "is_duplicate", label: "Is Duplicate", type: "boolean" },
  { value: "merge_status", label: "Merge Status", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "duplicate", label: "Duplicate" },
    { value: "merged", label: "Merged" },
    { value: "archived", label: "Archived" },
  ]},

  // Timestamps
  { value: "created_at", label: "Created At", type: "date" },
  { value: "updated_at", label: "Updated At", type: "date" },
  { value: "last_activity_at", label: "Last Activity At", type: "date" },
]

const getCountryFlag = (country?: string) => {
  const flags: Record<string, string> = {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Australia: "🇦🇺",
    "New Zealand": "🇳🇿",
    Canada: "🇨🇦",
  }
  return flags[country || ""] || "🏳️"
}

export default function ProfilesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const isDeletionRef = useRef(false)
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: '1', conditions: [] }
  ])
  const [showInlineFilter, setShowInlineFilter] = useState(false)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [allAvailableFields, setAllAvailableFields] = useState<any[]>(availableFields)
  const [unifiedFieldDefinitions, setUnifiedFieldDefinitions] = useState(profileFilterFields)
  const [segments, setSegments] = useState<Segment[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [selectedFilterType, setSelectedFilterType] = useState<'segment' | 'list' | null>(null)
  const [segmentName, setSegmentName] = useState("")
  const [isSavingSegment, setIsSavingSegment] = useState(false)
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([])

  // Import/Export state removed - now handled by ProfileImportExport component

  const searchParams = useSearchParams()
  const listId = searchParams.get("listId")
  const [listName, setListName] = useState<string>("")
  const [showListDialog, setShowListDialog] = useState(false)

  // Data loading functions
  const fetchProfiles = async () => {
    try {
      const result = await getProfiles()
      if (result.data) {
        setProfiles(result.data)
      }
    } catch (error) {
      logger.error('Error fetching profiles:', error)
    }
  }

  const fetchSegments = async () => {
    try {
      const result = await segmentsApi.getSegments()
      if (result.data) {
        setSegments(result.data)
      }
    } catch (error) {
      logger.error('Error fetching segments:', error)
    }
  }

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchProfiles(), fetchSegments()])
        
        // Load custom fields for filtering
        try {
          const response = await fetch('/api/profiles/custom-fields')
          if (response.ok) {
            const data = await response.json()
            const customFieldOptions = data.custom_fields.map((field: any) => ({
              value: `custom_fields.${field.name}`,
              label: field.display_name || field.name,
              type: 'text' as const
            }))
            setCustomFields(customFieldOptions)
            setAllAvailableFields([...availableFields, ...customFieldOptions])
            
            // Convert to unified field definitions
            const unifiedCustomFields = data.custom_fields.map((field: any) => 
              createCustomFieldDefinition(
                `custom_fields.${field.name}`,
                field.display_name || field.name,
                'string'
              )
            )
            setUnifiedFieldDefinitions(mergeFieldDefinitions(profileFilterFields, unifiedCustomFields))
          }
        } catch (error) {
          logger.error("Error fetching custom fields:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Helper function to get nested value from an object
  const getNestedValue = (obj: any, path: string): any => {
    const keys = path.split('.')
    let value = obj
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    return value
  }

  // Helper function to evaluate a single condition
  const evaluateCondition = (fieldValue: any, operator: string, conditionValue: string): boolean => {
    // Skip empty filter conditions
    if (!conditionValue || conditionValue.trim() === "") {
      return true
    }

    const fieldStr = String(fieldValue || "").toLowerCase()
    const searchStr = conditionValue.toLowerCase()

    switch (operator) {
      case "equals":
        return fieldStr === searchStr
      case "not_equals":
        return fieldStr !== searchStr
      case "contains":
        return fieldStr.includes(searchStr)
      case "not_contains":
        return !fieldStr.includes(searchStr)
      case "starts_with":
        return fieldStr.startsWith(searchStr)
      case "ends_with":
        return fieldStr.endsWith(searchStr)
      case "is_empty":
        return !fieldValue || fieldStr === ""
      case "is_not_empty":
        return !!fieldValue && fieldStr !== ""
      case "exists":
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
      case "not_exists":
        return fieldValue === undefined || fieldValue === null || fieldValue === ""
      case "greater_than":
        return parseFloat(fieldStr) > parseFloat(searchStr)
      case "less_than":
        return parseFloat(fieldStr) < parseFloat(searchStr)
      case "greater_than_or_equal":
        return parseFloat(fieldStr) >= parseFloat(searchStr)
      case "less_than_or_equal":
        return parseFloat(fieldStr) <= parseFloat(searchStr)
      default:
        return true
    }
  }

  // Helper function to apply segment filter criteria to profiles
  const applySegmentFilter = (profiles: Profile[], filterCriteria: any): Profile[] => {
    // Check if there's an explicit status filter for deleted items
    const hasDeletedFilter = () => {
      if (filterCriteria?.filterGroups) {
        return filterCriteria.filterGroups.some((group: any) =>
          group.conditions.some((c: any) => 
            c.field === 'status' && (c.value === 'Deleted' || c.value === 'deleted')
          )
        )
      }
      if (filterCriteria?.conditions) {
        return filterCriteria.conditions.some((c: any) => 
          c.field === 'status' && (c.value === 'Deleted' || c.value === 'deleted')
        )
      }
      return false
    }
    
    // By default, exclude deleted profiles unless explicitly filtered for
    let filtered = hasDeletedFilter() 
      ? profiles // Include all profiles if filtering for deleted
      : profiles.filter(p => {
          const stage = (p.lifecycle_stage || p.status || '').toLowerCase()
          return stage !== 'deleted'
        }) // Exclude deleted by default
    
    if (!filterCriteria) {
      // No filter criteria means show all non-deleted profiles
      return filtered
    }
    
    // Handle new filterGroups format
    if (filterCriteria.filterGroups && filterCriteria.filterGroups.length > 0) {
      const groupResults = filterCriteria.filterGroups.map((group: any) => {
        return filtered.filter(profile => {
          // All conditions in a group must be true (AND)
          return group.conditions.every((condition: any) => {
            const profileValue = getNestedValue(profile, condition.field)
            return evaluateCondition(profileValue, condition.operator, condition.value)
          })
        })
      })
      
      // Combine group results with OR logic
      const profileIdSet = new Set<string>()
      groupResults.forEach((groupProfiles: Profile[]) => {
        groupProfiles.forEach(profile => profileIdSet.add(profile.id))
      })
      
      filtered = filtered.filter(profile => profileIdSet.has(profile.id))
    } 
    // Handle legacy conditions format
    else if (filterCriteria.conditions && filterCriteria.conditions.length > 0) {
      filtered = filtered.filter(profile => {
        return filterCriteria.conditions.every((condition: any) => {
          const profileValue = getNestedValue(profile, condition.field)
          return evaluateCondition(profileValue, condition.operator, condition.value)
        })
      })
    }
    
    return filtered
  }

  // Apply filters using the unified FilterEngine (much simpler!)
  const applyFilters = (filterGroups: FilterGroup[], profileType: string, searchTerm: string) => {
    // Check if there's an explicit status filter for deleted items
    const hasDeletedFilter = filterGroups.some(group =>
      group.conditions.some(c => 
        c.field === 'status' && (String(c.value).toLowerCase() === 'deleted')
      )
    )
    
    // Start with profiles, but exclude deleted unless explicitly filtered for
    let filtered = hasDeletedFilter || profileType === 'deleted'
      ? profiles // Include all profiles if filtering for deleted
      : profiles.filter(p => {
          const stage = (p.lifecycle_stage || p.status || '').toLowerCase()
          return stage !== 'deleted'
        }) // Exclude deleted by default

    // Filter by type (from summary cards)
    if (profileType && profileType !== "all" && profileType !== "") {
      filtered = filtered.filter((profile) => {
        switch (profileType) {
          case "active":
            const activeStage = profile.lifecycle_stage?.toLowerCase() || profile.status?.toLowerCase()
            return activeStage === 'active'
          case "archived":
            const archivedStage = profile.lifecycle_stage?.toLowerCase() || profile.status?.toLowerCase()
            return archivedStage === 'inactive'
          case "deleted":
            const deletedStage = profile.lifecycle_stage?.toLowerCase() || profile.status?.toLowerCase()
            return deletedStage === 'deleted'
          case "marketing":
            return profile.status !== 'destroyed' && hasMarketingChannel(profile)
          case "unsubscribed":
            return profile.status !== 'destroyed' && allMarketingRevoked(profile)
          default:
            return true
        }
      })
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((profile) =>
        `${profile.first_name} ${profile.last_name} ${profile.email || ""} ${profile.mobile || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    }

    // Use FilterEngine for complex filtering (much cleaner!)
    if (filterGroups.length > 0) {
      // Handle custom fields by transforming profiles data
      const transformedProfiles = filtered.map(profile => ({
        ...profile,
        // Flatten custom fields for FilterEngine compatibility
        ...Object.keys(profile.custom_fields || {}).reduce((acc, key) => {
          acc[`custom_fields.${key}`] = profile.custom_fields?.[key]
          return acc
        }, {} as Record<string, any>)
      }))

      filtered = FilterEngine.filterData(transformedProfiles, filterGroups, unifiedFieldDefinitions)
    }

    return filtered
  }

  // Handle segmentId or listId from URL parameters
  useEffect(() => {
    const segmentId = searchParams.get("segmentId")
    const listId = searchParams.get("listId")
    const listNameParam = searchParams.get("listName")
    const filterActive = searchParams.get("filterActive")
    const showInlineFilterParam = searchParams.get("showInlineFilter")
    const newSegment = searchParams.get("newSegment")
    const createSegment = searchParams.get("createSegment")
    
    if (newSegment === "true" || createSegment === "true") {
      // Initialize for new segment creation with Status = Active
      setFilterGroups([{ id: '1', conditions: [{ field: "status", operator: "equals", value: "Active" }] }])
      setShowInlineFilter(true)
      setSelectedSegment(null)
      setSelectedList(null)
      setSelectedType("") // Clear card selection when creating new segment
    } else if (listId) {
      // Load the list
      setSelectedList(listId)
      setSelectedSegment(null)
      setSelectedFilterType('list')
      setFilterGroups([{ id: '1', conditions: [] }])
      setShowInlineFilter(false)
      setSelectedType("") // Clear card selection when list is selected
      // Set the list name if provided
      if (listNameParam) {
        setListName(listNameParam)
      }
    } else if (segmentId && segments.length > 0) {
      // Find and load the segment
      const segment = segments.find((s) => s.id === segmentId)
      if (segment) {
        // Set the segment as selected
        setSelectedSegment(segmentId)
        
        // Load the segment's filter criteria
        if (segment.filter_criteria) {
          // Handle both legacy and new filter formats
          if (segment.filter_criteria.filterGroups) {
            setFilterGroups(segment.filter_criteria.filterGroups)
          } else if (segment.filter_criteria.conditions) {
            // Convert legacy conditions to a single filter group
            setFilterGroups([{
              id: '1',
              conditions: segment.filter_criteria.conditions
            }])
          } else {
            setFilterGroups([{ id: '1', conditions: [] }])
          }
          
                  // Clear selectedType when loading a segment from URL - keep cards unselected
        setSelectedType("")
        setSearchTerm(segment.filter_criteria.searchTerm || "")
        }
        
        // Show the filter UI if requested
        if (showInlineFilterParam === "true") {
          setShowInlineFilter(true)
          // Set the segment name for editing
          setSegmentName(segment.name)
        }
      }
    }
  }, [searchParams, segments, lists])

  // Filter profiles based on type, search, filter groups, selected segment, or selected list
  useEffect(() => {
    // Don't filter if still loading or profiles haven't loaded yet
    if (loading || !profiles) {
      return
    }
    
    // If profiles is empty array, that's valid - just set empty filtered profiles
    if (profiles.length === 0) {
      setFilteredProfiles([])
      return
    }
    
    let filtered: Profile[]

    if (selectedList) {
      // Check if this is a system list that needs special handling
      const selectedListObj = lists.find(l => l.id === selectedList)
      const listName = selectedListObj?.name?.toLowerCase() || ''
      
      // Handle system lists with dynamic filtering
      if (listName === 'active' || listName === 'inactive' || listName === 'deleted' || 
          listName === 'marketing enabled' || listName === 'unsubscribed') {
        // System lists use dynamic filtering based on profile properties
        filtered = profiles.filter(p => {
          const stage = (p.lifecycle_stage || p.status || '').toLowerCase()
          
          switch(listName) {
            case 'active':
              return stage === 'active'
            case 'inactive':
              return stage === 'inactive'
            case 'deleted':
              return stage === 'deleted'
            case 'marketing enabled':
              return stage !== 'deleted' && hasMarketingChannel(p)
            case 'unsubscribed':
              return stage !== 'deleted' && allMarketingRevoked(p)
            default:
              return true
          }
        })
        setFilteredProfiles(filtered)
      } else {
        // Regular lists - fetch members from database
        const fetchListMembers = async () => {
          try {
            const response = await fetch(`/api/lists/${selectedList}/members`)
            if (response.ok) {
              const data = await response.json()
              const memberProfileIds = data.members?.map((m: any) => m.profile?.id || m.profile_id) || []
              // Lists NEVER show deleted profiles (except for the Deleted list itself)
              let listFiltered = profiles.filter(p => {
                if (listName === 'deleted') {
                  const stage = (p.lifecycle_stage || p.status || '').toLowerCase()
                  return memberProfileIds.includes(p.id) && stage === 'deleted'
                } else {
                  const stage = (p.lifecycle_stage || p.status || '').toLowerCase()
                  return memberProfileIds.includes(p.id) && stage !== 'deleted'
                }
              })
            
            // Apply additional filters if needed
            if (searchTerm) {
              listFiltered = listFiltered.filter((profile) => {
                const searchLower = searchTerm.toLowerCase()
                return (
                  profile.first_name?.toLowerCase().includes(searchLower) ||
                  profile.last_name?.toLowerCase().includes(searchLower) ||
                  profile.email?.toLowerCase().includes(searchLower) ||
                  profile.mobile?.toLowerCase().includes(searchLower)
                )
              })
            }
            
            setFilteredProfiles(listFiltered)
          } else {
            logger.error('Failed to fetch list members:', response.status)
            setFilteredProfiles([])
          }
        } catch (error) {
          logger.error('Error fetching list members:', error)
          setFilteredProfiles([])
        }
      }
      
        fetchListMembers()
      }
    } else if (selectedSegment) {
      // When a segment is selected, check if the user has modified the filters
      const hasActiveFilterGroups = filterGroups.some(group => 
        group.conditions.some(c => c.value && c.value.trim() !== "")
      )
      
      if (hasActiveFilterGroups) {
        // User has modified the filters, use the current filterGroups
        filtered = applyFilters(filterGroups, selectedType, searchTerm)
      } else {
        // Use the segment's original filter criteria
      const segment = segments.find((s) => s.id === selectedSegment)
        
      if (segment?.filter_criteria) {
          // Use the applySegmentFilter function which excludes deleted profiles
          filtered = applySegmentFilter(profiles, segment.filter_criteria)
          
          // Apply search term if needed
          if (searchTerm) {
            filtered = filtered.filter((profile) => {
              const searchLower = searchTerm.toLowerCase()
              return (
                profile.first_name?.toLowerCase().includes(searchLower) ||
                profile.last_name?.toLowerCase().includes(searchLower) ||
                profile.email?.toLowerCase().includes(searchLower) ||
                profile.mobile?.toLowerCase().includes(searchLower)
              )
            })
          }
      } else {
          // No filter criteria, exclude deleted profiles by default
          // This handles segments that exist but don't have filter criteria defined
          filtered = profiles.filter(p => {
            const stage = (p.lifecycle_stage || p.status || '').toLowerCase()
            return stage !== 'deleted'
          })
        }
      }
    } else {
      filtered = applyFilters(filterGroups, selectedType, searchTerm)
    }

    setFilteredProfiles(filtered)
    
    // Only reset to first page if this is not a deletion operation
    if (!isDeletionRef.current) {
      setCurrentPage(1)
    } else {
      // Reset the flag after using it
      isDeletionRef.current = false
    }
  }, [profiles, selectedType, searchTerm, filterGroups, selectedSegment, selectedList, segments, loading, lists])

  // Helper function to check if profile has any active channel
  const hasActiveChannel = (profile: Profile): boolean => {
    if (!profile.notification_preferences) return false
    
    try {
      const prefs = typeof profile.notification_preferences === 'string' 
        ? JSON.parse(profile.notification_preferences) 
        : profile.notification_preferences
      
      // Check if any channel is active (marketing or transactional)
      return (
        prefs.marketing_email === true ||
        prefs.marketing_sms === true ||
        prefs.marketing_whatsapp === true ||
        prefs.marketing_rcs === true ||
        prefs.transactional_email === true ||
        prefs.transactional_sms === true ||
        prefs.transactional_whatsapp === true ||
        prefs.transactional_rcs === true
      )
    } catch {
      return false
    }
  }

  // Helper function to check if profile has any marketing channel active
  const hasMarketingChannel = (profile: Profile): boolean => {
    if (!profile.notification_preferences) return false
    
    try {
      const prefs = typeof profile.notification_preferences === 'string' 
        ? JSON.parse(profile.notification_preferences) 
        : profile.notification_preferences
      
      // Check if any marketing channel is active (true)
      // Note: database uses both 'marketing_emails' (plural) and 'marketing_email' (singular)
      return (
        prefs.marketing_emails === true ||
        prefs.marketing_email === true ||
        prefs.marketing_sms === true ||
        prefs.marketing_whatsapp === true ||
        prefs.marketing_rcs === true ||
        prefs.marketing_push === true ||
        prefs.marketing_in_app === true
      )
    } catch {
      return false
    }
  }

  // Helper function to check if all marketing channels are revoked or not consented
  const allMarketingRevoked = (profile: Profile): boolean => {
    if (!profile.notification_preferences) {
      // No preferences at all - not considered unsubscribed (no consent given)
      return false
    }
    
    try {
      const prefs = typeof profile.notification_preferences === 'string' 
        ? JSON.parse(profile.notification_preferences) 
        : profile.notification_preferences
      
      // Check the actual field names from the database
      // Note: some use 'marketing_emails' (plural) and some use 'marketing_email' (singular)
      const emailConsented = prefs.marketing_emails === true || prefs.marketing_email === true
      const smsConsented = prefs.marketing_sms === true
      const whatsappConsented = prefs.marketing_whatsapp === true
      const rcsConsented = prefs.marketing_rcs === true
      const pushConsented = prefs.marketing_push === true
      const inAppConsented = prefs.marketing_in_app === true
      
      // If ANY marketing channel has consent (is true), they are NOT unsubscribed
      if (emailConsented || smsConsented || whatsappConsented || 
          rcsConsented || pushConsented || inAppConsented) {
        return false
      }
      
      // Check if at least one channel is explicitly set to false (revoked/no consent)
      // This ensures we're only counting profiles that have made a choice
      const hasExplicitNoConsent = 
        prefs.marketing_emails === false || prefs.marketing_email === false ||
        prefs.marketing_sms === false ||
        prefs.marketing_whatsapp === false ||
        prefs.marketing_rcs === false ||
        prefs.marketing_push === false ||
        prefs.marketing_in_app === false
      
      // Only count as unsubscribed if they have explicitly set at least one channel to false
      // AND no channels are set to true
      return hasExplicitNoConsent
    } catch {
      return false // Error parsing - don't count as unsubscribed
    }
  }

  // Calculate counts based on lifecycle status and notification preferences
  const counts = {
    // All profiles except destroyed
    all: profiles.filter(p => p.status !== 'destroyed').length,
    
    // Active lifecycle status (not about channels, just lifecycle)
    active: profiles.filter(p => p.status === 'active').length,
    
    // Inactive lifecycle status (dormant profiles)
    archived: profiles.filter(p => p.status === 'inactive').length,
    
    // Soft deleted profiles
    deleted: profiles.filter(p => p.status === 'deleted').length,
    
    // Profiles with ANY marketing channel enabled (regardless of status)
    marketing: profiles.filter(p => 
      p.status !== 'destroyed' && hasMarketingChannel(p)
    ).length,
    
    // Profiles with ALL marketing channels disabled (regardless of status)
    unsubscribed: profiles.filter(p => 
      p.status !== 'destroyed' && allMarketingRevoked(p)
    ).length,
  }

  const handleRowEdit = (profile: Profile) => {
    router.push(`/profiles/edit/${profile.id}`)
  }

  // Save current filter as segment (create new or update existing)
  const saveAsSegment = async () => {
    const hasActiveFilters = filterGroups.some(group => 
      group.conditions.some(c => c.value && c.value.trim() !== "")
    )
    
    if (!segmentName.trim() || !hasActiveFilters) {
      alert("Please enter a segment name and add at least one filter condition.")
      return
    }

    setIsSavingSegment(true)
    try {
      // Check if we're updating an existing segment (same name as selected segment)
      const selectedSegmentData = selectedSegment ? segments.find(s => s.id === selectedSegment) : null
      const isUpdatingExisting = selectedSegmentData && selectedSegmentData.name === segmentName
      
      let result
      
      if (isUpdatingExisting && selectedSegment) {
        // Update existing segment
        result = await segmentsApi.updateSegment(selectedSegment, {
        name: segmentName,
        description: `Segment with ${filteredProfiles.length} profiles`,
        filter_criteria: {
            filterGroups: filterGroups,
          profileType: selectedType,
          searchTerm: searchTerm,
          },
          estimated_size: filteredProfiles.length,
          auto_update: true,
        })
      } else {
        // Create new segment (either no segment selected or name changed)
        result = await segmentsApi.createSegment({
          name: segmentName,
          description: `Segment with ${filteredProfiles.length} profiles`,
          filter_criteria: {
            filterGroups: filterGroups,
            profileType: selectedType,
            searchTerm: searchTerm,
        },
        estimated_size: filteredProfiles.length,
        auto_update: true,
        type: "Custom",
        shared: false,
        tags: [],
      })
      }

      if (result.error) {
        alert(`Error saving segment: ${result.error}`)
        return
      }

      // Get the segment ID (either newly created or updated)
      const segmentId = isUpdatingExisting ? selectedSegment : result.data?.id

      // Refresh segments list
      const segmentsResult = await segmentsApi.getSegments()
      if (segmentsResult.data) {
        // Calculate profile counts for each segment
        const segmentsWithCounts = segmentsResult.data.map(seg => ({
          ...seg,
          profile_count: seg.filter_criteria ? applySegmentFilter(profiles, seg.filter_criteria).length : 0
        }))
        setSegments(segmentsWithCounts)
        
        // Select the segment (whether updated or newly created)
        if (segmentId) {
          setSelectedSegment(segmentId)
          setSelectedList(null)
          setSelectedFilterType('segment')
          
          // Find the segment to load its data
          const segment = segmentsWithCounts.find(s => s.id === segmentId)
          if (segment) {
            // Keep the segment name if updating, clear if creating new
            if (!isUpdatingExisting) {
              setSegmentName("")
            }
            
            // Show success toast
            toast({
              title: isUpdatingExisting ? "Segment Updated" : "Segment Created",
              description: isUpdatingExisting 
                ? `"${segment.name}" has been updated.`
                : `"${segment.name}" has been created and selected.`,
            })
          }
        }
      } else {
        // Fallback if segments couldn't be refreshed
        if (!isUpdatingExisting) {
      setSegmentName("")
        }
        alert(`Segment "${segmentName}" ${isUpdatingExisting ? 'updated' : 'saved'} successfully!`)
      }
    } catch (error) {
      logger.error("Error saving segment:", error)
      alert("Failed to save segment. Please try again.")
    } finally {
      setIsSavingSegment(false)
    }
  }

  // Load segment filters
  const loadSegment = (segmentId: string) => {
    const segment = segments.find((s) => s.id === segmentId)
    if (segment?.filter_criteria) {
      setSelectedSegment(segmentId)
      
      // Handle both legacy and new filter formats
      if (segment.filter_criteria.filterGroups) {
        setFilterGroups(segment.filter_criteria.filterGroups)
      } else if (segment.filter_criteria.conditions) {
        // Convert legacy conditions to a single filter group
        setFilterGroups([{
          id: '1',
          conditions: segment.filter_criteria.conditions
        }])
      } else {
        setFilterGroups([{ id: '1', conditions: [] }])
      }
      
      // Don't set selectedType when loading a segment - keep cards unselected
      setSearchTerm(segment.filter_criteria.searchTerm || "")
      // Don't show filter UI when loading a segment from dropdown
      setShowInlineFilter(false)
    }
  }

  // Clear all filters and segments
  const clearFilters = () => {
    setFilterGroups([{ id: '1', conditions: [] }])
    setSelectedType("all")
    setSearchTerm("")
    setSelectedSegment(null)
    setSegmentName("")
    setShowInlineFilter(false)
    // Force refresh of filtered profiles
    setFilteredProfiles(profiles)
  }

  // CSV Export Helper
  const exportProfilesToCSV = (profiles: Profile[]) => {
    if (profiles.length === 0) return ''
    
    // Get all possible field names
    const fieldNames = new Set<string>()
    profiles.forEach(profile => {
      Object.keys(profile).forEach(key => fieldNames.add(key))
      if (profile.custom_fields) {
        Object.keys(profile.custom_fields).forEach(key => fieldNames.add(`custom_fields.${key}`))
      }
    })
    
    const headers = Array.from(fieldNames)
    const rows = profiles.map(profile => {
      return headers.map(header => {
        if (header.startsWith('custom_fields.')) {
          const fieldName = header.replace('custom_fields.', '')
          return profile.custom_fields?.[fieldName] || ''
        }
        const value = profile[header as keyof Profile]
        if (Array.isArray(value)) return value.join(';')
        if (typeof value === 'object' && value !== null) return JSON.stringify(value)
        return value || ''
      })
    })
    
    const csvContent = [headers.join(','), ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )].join('\n')
    
    return csvContent
  }
  
  // CSV Download Helper
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  
  // File Import Handler
  const handleFileImport = async (file: File) => {
    try {
      const text = await file.text()
      logger.info('File imported:', { filename: file.name, size: file.size })
      toast({
        title: "Import Started",
        description: `Processing ${file.name}...`,
      })
      
      // Here you would implement the actual CSV parsing and profile creation
      // For now, just show a placeholder message
      toast({
        title: "Import Feature",
        description: "CSV import functionality will be implemented here",
      })
    } catch (error) {
      logger.error('Error importing file:', error)
      toast({
        title: "Import Error",
        description: "Failed to import file. Please check the format and try again.",
        variant: "destructive",
      })
    }
  }

  const columns: DataTableColumn<Profile>[] = [
    {
      id: "id",
      header: "Id",
      accessorKey: "id",
      width: "80px",
      cell: (row) => (
        <button
          onClick={() => handleRowEdit(row)}
          className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          {row.id.slice(0, 8)}
        </button>
      ),
    },
    {
      id: "first_name",
      header: "First name",
      accessorKey: "first_name",
      width: "150px",
      cell: (row) => (
        <button onClick={() => handleRowEdit(row)} className="text-left hover:text-blue-600">
          {row.first_name}
        </button>
      ),
    },
    {
      id: "last_name",
      header: "Last name",
      accessorKey: "last_name",
      width: "150px",
      cell: (row) => (
        <button onClick={() => handleRowEdit(row)} className="text-left hover:text-blue-600">
          {row.last_name}
        </button>
      ),
    },
    {
      id: "email",
      header: "Email",
      width: "200px",
      cell: (row) => {
        if (!row.email) return <span className="text-gray-400">—</span>
        return <span className="text-sm">{row.email}</span>
      },
    },
    {
      id: "mobile",
      header: "Mobile number",
      width: "200px",
      cell: (row) => {
        if (!row.mobile) return <span className="text-gray-400">—</span>
        return (
          <div className="flex items-center gap-2">
            <span>{getCountryFlag(row.country)}</span>
            <span className="font-mono text-sm">{row.mobile}</span>
          </div>
        )
      },
    },
    {
      id: "country",
      header: "Country",
      width: "150px",
      cell: (row) => row.country || "",
    },
    {
      id: "created_at",
      header: "Date added",
      width: "150px",
      sortable: true,
      cell: (row) =>
        new Date(row.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      id: "status",
      header: "Status",
      width: "100px",
      cell: (row) => {
        const getStatusBadge = (status: string) => {
          // Normalize status to handle case variations
          const normalizedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Active"
          
          switch (normalizedStatus) {
            case "Active":
              return (
                <Badge variant="translucent-green" className="font-medium">
                  Active
                </Badge>
              )
            case "Deleted":
              return (
                <Badge variant="translucent-red" className="font-medium">
                  Deleted
                </Badge>
              )
            case "Inactive":
              return (
                <Badge variant="translucent-gray" className="font-medium">
                  Inactive
                </Badge>
              )
            case "Marketing":
              return (
                <Badge variant="translucent-blue" className="font-medium">
                  Marketing
                </Badge>
              )
            case "Suppressed":
              return (
                <Badge variant="translucent-yellow" className="font-medium">
                  Suppressed
                </Badge>
              )
            case "Unsubscribed":
              return (
                <Badge variant="translucent-orange" className="font-medium">
                  Unsubscribed
                </Badge>
              )
            default:
              return (
                <Badge variant="translucent-green" className="font-medium">
                  Active
                </Badge>
              )
          }
        }

        return getStatusBadge(row.status || "Active")
      },
    },
  ]

  const filterOptions = [
    { label: "Filter Profiles", value: "filter_profiles" },
    // Remove the built-in filters that are already shown as cards
    // Add custom segments to filter options (exclude predefined ones)
    ...(segments.length > 0 ? [
      { label: "---", value: "divider2" },
      ...segments
        .filter(segment => {
          // Exclude segments that match predefined filters
          const predefinedNames = ['all', 'active', 'marketing', 'suppressed', 'unsubscribed', 'deleted', 'inactive', 'archived'];
          return !predefinedNames.includes(segment.name.toLowerCase());
        })
        .map((segment) => ({
          label: segment.name,
          value: `segment_${segment.id}`,
        }))
    ] : []),
  ]

  // Data operations - all bulk actions (disabled when no selection)
  const dataOperations = [
    {
      label: "Tag",
      icon: <Tag className="h-4 w-4" />,
      disabled: selectedProfiles.length === 0,
      onClick: () => {
        if (selectedProfiles.length === 0) return;
        // TODO: Implement tag dialog
        const tag = prompt(`Enter tag to add to ${selectedProfiles.length} profiles:`)
        if (tag) {
          logger.debug(`Adding tag "${tag}" to ${selectedProfiles.length} profiles`)
          toast({
            title: "Tags added",
            description: `Added "${tag}" to ${selectedProfiles.length} profiles`,
          })
        }
      }
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      disabled: selectedProfiles.length === 0,
      onClick: async () => {
        if (selectedProfiles.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedProfiles.length} profiles? They will be marked as deleted but can be restored later.`)) {
          setLoading(true)
          let successCount = 0
          let errorCount = 0
          
          for (const profile of selectedProfiles) {
            try {
              const result = await softDeleteProfile(profile.id)
              if (result.error) {
                errorCount++
              } else {
                successCount++
              }
            } catch (error) {
              errorCount++
            }
          }
          
          // Refresh profiles
          const result = await getProfiles()
          if (result.data) {
            setProfiles(result.data)
            setFilteredProfiles(result.data)
          }
          
          setSelectedProfiles([])
          setLoading(false)
          
          toast({
            title: "Bulk delete completed",
            description: `Successfully deleted ${successCount} profiles${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
          })
        }
      }
    },
    {
      label: "Add to List",
      icon: <List className="h-4 w-4" />,
      disabled: selectedProfiles.length === 0,
      onClick: () => {
        if (selectedProfiles.length === 0) return;
        setShowListDialog(true);
      }
    },
  ]

  // Add Destroy bulk action if all selected profiles are deleted
  const allSelectedDeleted = selectedProfiles.length > 0 && 
    selectedProfiles.every(p => p.status === 'deleted')
  
  if (allSelectedDeleted) {
    dataOperations.push({
      label: "---divider---",
      icon: null,
      onClick: () => {},
    })
    dataOperations.push({
      label: "Destroy Permanently",
      icon: <Trash2 className="h-4 w-4 text-red-600" />,
      disabled: false,
      onClick: async () => {
        const confirmMessage = `⚠️ WARNING: You are about to permanently destroy ${selectedProfiles.length} profile(s).\n\n` +
          `This will:\n` +
          `• Completely remove all profile data from the database\n` +
          `• Delete all associated activity logs\n` +
          `• Remove from all lists and segments\n` +
          `• Delete all related metadata\n\n` +
          `This action CANNOT be undone.\n\n` +
          `Are you absolutely sure you want to destroy ${selectedProfiles.length} profile(s)?`
        
        if (window.confirm(confirmMessage)) {
          setLoading(true)
          let successCount = 0
          let errorCount = 0
          
          for (const profile of selectedProfiles) {
            try {
              const result = await deleteProfile(profile.id)
              if (result.error) {
                errorCount++
                logger.error(`Failed to destroy profile ${profile.id}:`, result.error)
              } else {
                successCount++
              }
            } catch (error) {
              errorCount++
              logger.error(`Error destroying profile ${profile.id}:`, error)
            }
          }
          
          // Refresh profiles
          const result = await getProfiles()
          if (result.data) {
            setProfiles(result.data)
            setFilteredProfiles(result.data)
          }
          
          setSelectedProfiles([])
          setLoading(false)
          
          toast({
            title: "Bulk destroy completed",
            description: `Successfully destroyed ${successCount} profiles${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            variant: errorCount > 0 ? "destructive" : "default",
          })
        }
      },
    })
  }

  const pageActions = [
    {
      label: "Create Profile",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => router.push("/profiles/new"),
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  const totalPages = Math.ceil((filteredProfiles?.length || 0) / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentProfiles = filteredProfiles?.slice(startIndex, endIndex) || []

  // Filter group management functions
  const addFilterGroup = () => {
    const newId = (Math.max(...filterGroups.map(g => parseInt(g.id))) + 1).toString()
    setFilterGroups([...filterGroups, { id: newId, conditions: [{ field: "status", operator: "equals", value: "Active" }] }])
  }

  const removeFilterGroup = (groupId: string) => {
    // Don't remove if it's the only group
    if (filterGroups.length <= 1) {
      setFilterGroups([{ id: '1', conditions: [] }])
    } else {
      setFilterGroups(filterGroups.filter(g => g.id !== groupId))
    }
  }

  const addConditionToGroup = (groupId: string) => {
    setFilterGroups(filterGroups.map(group => 
      group.id === groupId 
        ? { ...group, conditions: [...group.conditions, { field: "first_name", operator: "contains", value: "" }] }
        : group
    ))
  }

  const updateConditionInGroup = (groupId: string, conditionIndex: number, field: string, value: string) => {
    setFilterGroups(filterGroups.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: group.conditions.map((condition, index) => {
              if (index === conditionIndex) {
                const updatedCondition = { ...condition, [field]: value }
                // Auto-set value for exists/not exists operators
                if (field === 'operator' && (value === 'exists' || value === 'not exists')) {
                  updatedCondition.value = '1' // Placeholder value for exists operators
                }
                return updatedCondition
              }
              return condition
            })
          }
        : group
    ))
  }

  const removeConditionFromGroup = (groupId: string, conditionIndex: number) => {
    setFilterGroups(filterGroups.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: group.conditions.filter((_, index) => index !== conditionIndex)
          }
        : group
    ))
  }

  // Get appropriate operators based on field type
  const getOperatorsForField = (fieldName: string): { value: string; label: string }[] => {
    const field = allAvailableFields.find(f => f.value === fieldName)
    
    if (!field) {
      // Default operators for unknown fields
      return [
        { value: "contains", label: "contains" },
        { value: "equals", label: "equals" },
        { value: "is", label: "is" },
        { value: "is not", label: "is not" },
        { value: "starts with", label: "starts with" },
        { value: "ends with", label: "ends with" },
        { value: "exists", label: "exists" },
        { value: "not exists", label: "not exists" },
      ]
    }
    
    switch (field.type) {
      case 'select':
      case 'boolean':
        return [
          { value: "equals", label: "equals" },
          { value: "is", label: "is" },
          { value: "is not", label: "is not" },
          { value: "exists", label: "exists" },
          { value: "not exists", label: "not exists" },
        ]
      
      case 'date':
        return [
          { value: "equals", label: "equals" },
          { value: "greater than", label: "after" },
          { value: "less than", label: "before" },
          { value: "exists", label: "exists" },
          { value: "not exists", label: "not exists" },
        ]
      
      case 'number':
        return [
          { value: "equals", label: "equals" },
          { value: "greater than", label: "greater than" },
          { value: "less than", label: "less than" },
          { value: "exists", label: "exists" },
          { value: "not exists", label: "not exists" },
        ]
      
      case 'text':
      default:
        return [
          { value: "contains", label: "contains" },
          { value: "equals", label: "equals" },
          { value: "is", label: "is" },
          { value: "is not", label: "is not" },
          { value: "starts with", label: "starts with" },
          { value: "ends with", label: "ends with" },
          { value: "exists", label: "exists" },
          { value: "not exists", label: "not exists" },
        ]
    }
  }

  // Render appropriate input based on field type
  const handleAddToList = async (listId: string, listName: string, isNewList: boolean) => {
    try {
      // Add profiles to the list
      const profileIds = selectedProfiles.map(p => p.id);
      
      const response = await fetch(`/api/lists/${listId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
          profile_ids: profileIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add profiles to list');
      }

      const result = await response.json();
      
      // Handle partial success
      if (result.skipped_invalid && result.skipped_invalid > 0) {
        toast({
          title: isNewList ? "List created with partial success" : "Partially added to list",
          description: `Added ${result.added_count} profiles to "${listName}". ${result.skipped_invalid} profiles were invalid and skipped.`,
          variant: "default",
        });
      } else if (result.added_count === 0 && result.already_existed > 0) {
        toast({
          title: "Profiles already in list",
          description: `All selected profiles are already in "${listName}"`,
          variant: "default",
        });
      } else {
        toast({
          title: isNewList ? "List created and profiles added" : "Added to list",
          description: `Successfully added ${result.added_count} profiles to "${listName}"`,
        });
      }
      
      // Clear selection
      setSelectedProfiles([]);
    } catch (error) {
      logger.error('Error adding profiles to list:', error);
      toast({
        title: "Error",
        description: "Failed to add profiles to list",
        variant: "destructive",
      });
    }
  };

  const renderFieldValueInput = (condition: FilterCondition, groupId: string, conditionIndex: number) => {
    const field = allAvailableFields.find(f => f.value === condition.field)
    
    // For exists/not exists operators, don't show any value input
    if (condition.operator === "exists" || condition.operator === "not exists") {
      return null
    }
    
    // If field not found, default to text input
    if (!field) {
      return (
        <Input
          value={condition.value}
          onChange={(e) => updateConditionInGroup(groupId, conditionIndex, "value", e.target.value)}
          placeholder="Enter value"
          className="flex-1 h-10 bg-background border-border"
        />
      )
    }
    
    // Render based on field type
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={condition.value}
            onValueChange={(value) => updateConditionInGroup(groupId, conditionIndex, "value", value)}
          >
            <SelectTrigger className="flex-1 h-10 bg-background border-border">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-foreground">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'boolean':
        return (
          <Select
            value={condition.value}
            onValueChange={(value) => updateConditionInGroup(groupId, conditionIndex, "value", value)}
          >
            <SelectTrigger className="flex-1 h-10 bg-background border-border">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="true" className="text-foreground">Yes</SelectItem>
              <SelectItem value="false" className="text-foreground">No</SelectItem>
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={condition.value}
            onChange={(e) => updateConditionInGroup(groupId, conditionIndex, "value", e.target.value)}
            className="flex-1 h-10 bg-background border-border"
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={condition.value}
            onChange={(e) => updateConditionInGroup(groupId, conditionIndex, "value", e.target.value)}
            placeholder="Enter number"
            className="flex-1 h-10 bg-background border-border"
          />
        )
      
      case 'text':
      default:
        return (
          <Input
            value={condition.value}
            onChange={(e) => updateConditionInGroup(groupId, conditionIndex, "value", e.target.value)}
            placeholder="Enter value"
            className="flex-1 h-10 bg-background border-border"
          />
        )
    }
  }

  // Update the DataTable title to show list name when filtering by list
  const getTableTitle = () => {
    if (listId && listName) {
      return `${listName} Members`
    }

    if (selectedSegment) {
      const segment = segments.find((s) => s.id === selectedSegment)
      return segment ? segment.name : "Segment"
    }

    switch (selectedType) {
      case "active":
        return "Active Profiles"
      case "archived":
        return "Inactive Profiles"
      case "deleted":
        return "Deleted Profiles"
      case "marketing":
        return "Marketing Enabled Profiles"
      case "unsubscribed":
        return "Unsubscribed Profiles"
      default:
        return "All Profiles"
    }
  }



  if (loading) {
    return (
      <MainLayout>
        <LoadingSection message="Loading profiles..." />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageLayout title="Recipient Profiles" actions={pageActions} fullWidth>
        <div className="space-y-6">
          {/* Summary Cards */}
          <ProfileCounts 
            counts={counts} 
            selectedType={selectedType} 
            onTypeClick={(type) => {
              setSelectedType(type)
              // Clear segment/list selection when clicking a card
              setSelectedSegment(null)
              setSelectedList(null)
              setSelectedFilterType(null)
              setFilterGroups([{ id: '1', conditions: [] }])
              setShowInlineFilter(false)
            }} 
          />

          {/* Advanced Filters */}
          <ProfileAdvancedFilters
            showInlineFilter={showInlineFilter}
            onToggleInlineFilter={() => setShowInlineFilter(!showInlineFilter)}
            filterGroups={filterGroups}
            onFilterGroupsChange={setFilterGroups}
            filteredProfilesCount={filteredProfiles.length}
            selectedSegment={selectedSegment}
            onClearFilters={clearFilters}
            segmentName={segmentName}
            onSegmentNameChange={setSegmentName}
            onSaveSegment={saveAsSegment}
            isSavingSegment={isSavingSegment}
            segments={segments}
            allAvailableFields={allAvailableFields}
          />

          {/* Profiles Table */}
          <div>
            <DataTable
              data={currentProfiles}
              allFilteredData={filteredProfiles}  // Pass all filtered results
              columns={columns}
              title={getTableTitle()}
              searchPlaceholder="Search profiles..."
              onSearch={setSearchTerm}
              selectable
              customFilterComponent={
                <div className="flex items-center gap-2">
                  <SegmentListDropdown
                    segments={segments}
                    lists={lists}
                    selectedId={selectedSegment || selectedList}
                    onSelect={(type, id, name) => {
                      if (type === 'segment') {
                        loadSegment(id)
                        setSelectedList(null)
                        setSelectedFilterType('segment')
                        setSelectedType("") // Clear card selection when segment is selected
                      } else {
                        // Load list
                        setSelectedList(id)
                        setSelectedSegment(null)
                        setSelectedFilterType('list')
                        setFilterGroups([{ id: '1', conditions: [] }])
                        setShowInlineFilter(false)
                        setSelectedType("") // Clear card selection when list is selected
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowInlineFilter(!showInlineFilter)
                      if (!showInlineFilter) {
                        // If a segment is selected, populate the segment name for editing
                        if (selectedSegment) {
                          const segment = segments.find(s => s.id === selectedSegment)
                          if (segment) {
                            setSegmentName(segment.name)
                          }
                        } else if (filterGroups[0].conditions.length === 0) {
                          // Only set default filter if no conditions exist and no segment selected
                          setFilterGroups([{ id: '1', conditions: [{ field: "status", operator: "equals", value: "Active" }] }])
                        }
                      }
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  
                  {/* Import/Export buttons for selected segment */}
                  {(selectedSegment || filteredProfiles.length > 0) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Trigger export for current filtered profiles
                          const csvContent = exportProfilesToCSV(filteredProfiles)
                          downloadCSV(csvContent, `profiles-${selectedSegment ? segments.find(s => s.id === selectedSegment)?.name || 'filtered' : 'all'}.csv`)
                        }}
                        disabled={filteredProfiles.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Trigger import dialog
                          document.getElementById('file-upload-input')?.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                      
                      {/* Hidden file input for import */}
                      <input
                        id="file-upload-input"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileImport(file)
                          }
                        }}
                      />
                    </>
                  )}
                </div>
              }
              filterOptions={filterOptions}
              onFilterChange={(value) => {
                if (value === "filter_profiles") {
                  setShowInlineFilter(!showInlineFilter)
                  // Add an initial filter group with one condition if none exist
                  if (!showInlineFilter && filterGroups[0].conditions.length === 0) {
                    setFilterGroups([{ id: '1', conditions: [{ field: "first_name", operator: "contains", value: "" }] }])
                  }
                } else if (value.startsWith("divider")) {
                  // Do nothing for dividers
                  return
                } else if (value.startsWith("segment_")) {
                  const segmentId = value.replace("segment_", "")
                  loadSegment(segmentId)
                  setShowInlineFilter(false)  // Hide filter UI when selecting a segment
                }
                // Removed the else clause that was handling the now-removed filter options
              }}
              selectedFilter={selectedSegment ? `segment_${selectedSegment}` : selectedType}
              actions={dataOperations}
              onSelectionChange={setSelectedProfiles}
              onRowEdit={handleRowEdit}
              onRowDelete={async (profile) => {
                try {
                  // Note: Confirmation dialog is already shown in DataTable component
                  setLoading(true)

                  // Use soft delete by default
                  const result = await softDeleteProfile(profile.id)

                  if (result.error) {
                    toast({
                      title: "Error deleting profile",
                      description: result.error,
                      variant: "destructive",
                    })
                    return
                  }

                  // Update the profile status in local state to "deleted"
                  const updatedProfile = { ...profile, status: "deleted" }

                  // Set flag to prevent page reset
                  isDeletionRef.current = true
                  setProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))
                  
                  // If we're filtering by a specific type that excludes deleted profiles,
                  // we need to remove it from the filtered list
                  if (selectedType !== "all" && selectedType !== "deleted") {
                    setFilteredProfiles((prev) => {
                      const newFiltered = prev.filter((p) => p.id !== profile.id)
                      
                      // Check if we need to adjust the current page
                      const newTotalPages = Math.ceil(newFiltered.length / pageSize)
                      if (currentPage > newTotalPages && newTotalPages > 0) {
                        setCurrentPage(newTotalPages)
                      }
                      
                      return newFiltered
                    })
                  } else {
                    // Otherwise, just update the status
                    setFilteredProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))
                  }

                  toast({
                    title: "Profile deleted",
                    description: `${profile.first_name} ${profile.last_name} has been marked as deleted.`,
                  })
                } catch (error) {
                  logger.error("Error deleting profile:", error)
                  toast({
                    title: "Failed to delete profile",
                    description: "Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setLoading(false)
                }
              }}
              onRowRestore={async (profile) => {
                try {
                  setLoading(true)

                  const result = await restoreProfile(profile.id)

                  if (result.error) {
                    toast({
                      title: "Error restoring profile",
                      description: result.error,
                      variant: "destructive",
                    })
                    return
                  }

                  // Update the profile status in local state to "active"
                  const updatedProfile = { ...profile, status: "active" }

                  // Set flag to prevent page reset
                  isDeletionRef.current = true
                  setProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))
                  
                  // If we're filtering by deleted profiles only, remove it from the filtered list
                  if (selectedType === "deleted") {
                    setFilteredProfiles((prev) => {
                      const newFiltered = prev.filter((p) => p.id !== profile.id)
                      
                      // Check if we need to adjust the current page
                      const newTotalPages = Math.ceil(newFiltered.length / pageSize)
                      if (currentPage > newTotalPages && newTotalPages > 0) {
                        setCurrentPage(newTotalPages)
                      }
                      
                      return newFiltered
                    })
                  } else {
                    // Otherwise, just update the status
                    setFilteredProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))
                  }

                  toast({
                    title: "Profile restored",
                    description: `${profile.first_name} ${profile.last_name} has been restored.`,
                  })
                } catch (error) {
                  logger.error("Error restoring profile:", error)
                  toast({
                    title: "Failed to restore profile",
                    description: "Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setLoading(false)
                }
              }}
              onRowDestroy={async (profile) => {
                try {
                  setLoading(true)

                  const result = await deleteProfile(profile.id)

                  if (result.error) {
                    toast({
                      title: "Error destroying profile",
                      description: result.error,
                      variant: "destructive",
                    })
                    return
                  }

                  // Remove the profile from local state completely
                  // Set flag to prevent page reset
                  isDeletionRef.current = true
                  setProfiles((prev) => prev.filter((p) => p.id !== profile.id))
                  
                  setFilteredProfiles((prev) => {
                    const newFiltered = prev.filter((p) => p.id !== profile.id)
                    
                    // Check if we need to adjust the current page
                    const newTotalPages = Math.ceil(newFiltered.length / pageSize)
                    if (currentPage > newTotalPages && newTotalPages > 0) {
                      setCurrentPage(newTotalPages)
                    }
                    
                    return newFiltered
                  })

                  toast({
                    title: "Profile destroyed",
                    description: `${profile.first_name} ${profile.last_name} has been permanently removed.`,
                  })
                } catch (error) {
                  logger.error("Error destroying profile:", error)
                  toast({
                    title: "Failed to destroy profile",
                    description: "Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setLoading(false)
                }
              }}
              pagination={{
                currentPage,
                totalPages,
                pageSize,
                totalItems: filteredProfiles?.length || 0,
                onPageChange: setCurrentPage,
                onPageSizeChange: (newSize) => {
                  setPageSize(newSize)
                  setCurrentPage(1) // Reset to first page when changing page size
                },
              }}
            />
          </div>
        </div>

        {/* Export/Import dialogs replaced with ProfileImportExport component */}

      </PageLayout>
      
      {/* List Selection Dialog */}
      <ListSelectionDialog
        open={showListDialog}
        onClose={() => setShowListDialog(false)}
        onConfirm={handleAddToList}
        profileCount={selectedProfiles.length}
      />

      {/* Import/Export Component */}
      <ProfileImportExport
        profiles={filteredProfiles}
        selectedProfiles={selectedProfiles}
        availableFields={availableFields}
        customFields={customFields}
        onProfilesUpdated={() => {
          fetchProfiles()
          fetchSegments()
        }}
      />
    </MainLayout>
  )
}
