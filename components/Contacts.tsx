"use client"

import React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Inter } from "next/font/google"
import { ProfileCounts } from "./ProfileCounts"
import { KudosityContactsTable } from "./KudosityContactsTable"
import { profilesApi } from "@/api/profiles-api"
import { segmentsApi, listsApi } from "@/api/segments-api"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Download, X, Users, List, Tag, Trash2, Upload } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ProfileFilterBuilder } from "./ProfileFilterBuilder"

import * as SelectPrimitive from "@radix-ui/react-select"

const inter = Inter({ subsets: ["latin"] })

export interface FilterCondition {
  field: string
  operator: string
  value: string
}

export interface FilterGroup {
  conditions: FilterCondition[]
}

export interface Segment {
  id: string
  name: string
  description?: string
  estimated_size: number
  type: string
}

export interface ContactList {
  id: string
  name: string
  description?: string
  contact_count: number
  type: string
}

// Extended Contact interface to handle UUID IDs
interface ExtendedContact {
  id: string // Keep as UUID string
  numericIndex: number // For React keys and selection
  first_name?: string
  last_name?: string
  email?: string
  mobile?: string // Changed from phone to mobile
  mobile_number?: string
  phone?: string // Add phone field
  device?: string
  os?: string
  postcode?: string
  suburb?: string
  state?: string // Add state field
  timezone?: string
  country?: string
  created_at?: Date
  updated_at?: Date
  is_suppressed?: boolean
  is_transactional?: boolean
  status?: string
  is_high_value?: boolean
  is_subscribed?: boolean
  last_purchase_date?: Date | null
  total_purchases?: number
  lifetime_value?: number
  is_marketing?: boolean
  role?: string
  teams?: string
  last_login?: Date | null
  source?: string // Add source field
  location?: string // Add location field
  language_preferences?: string // Add language preferences
  avatar_url?: string // Add avatar URL
  tags?: string[] // Add tags field
  custom_fields?: Record<string, any> // Add custom fields
  notification_preferences?: Record<string, any> // Add notification preferences
  performance_metrics?: Record<string, any> // Add performance metrics
  // Custom properties
  loyalty_points?: number
  preferred_category?: string
  total_spent?: number
  customer_since?: Date
}

// Updated profile fields to match database schema exactly
const profileFields = [
  "id",
  "first_name",
  "last_name",
  "email",
  "mobile",
  "mobile_number",
  "phone", // Add phone field
  "device",
  "os",
  "postcode",
  "suburb",
  "state", // Add state field
  "timezone",
  "country",
  "created_at",
  "updated_at",
  "status",
  "role",
  "teams",
  "last_login",
  "is_suppressed",
  "is_transactional",
  "is_high_value",
  "is_subscribed",
  "is_marketing",
  "last_purchase_date",
  "total_purchases",
  "lifetime_value",
  "loyalty_points",
  "preferred_category",
  "total_spent",
  "customer_since",
  "source", // Add source field
  "location", // Add location field
  "language_preferences", // Add language preferences
  "avatar_url", // Add avatar URL
  "tags", // Add tags field
  "custom_fields", // Add custom fields
  "notification_preferences", // Add notification preferences
  "performance_metrics", // Add performance metrics
]

const operators = {
  string: ["contains", "is", "is not", "starts with", "ends with"],
  number: ["equals", "greater than", "less than", "greater than or equal to", "less than or equal to"],
  date: ["is", "is before", "is after", "is on or before", "is on or after"],
  boolean: ["is"],
}

const getProfileFieldType = (field: string): "string" | "number" | "date" | "boolean" => {
  switch (field) {
    case "total_purchases":
    case "lifetime_value":
    case "loyalty_points":
    case "total_spent":
      return "number"
    case "created_at":
    case "updated_at":
    case "last_purchase_date":
    case "last_login":
    case "customer_since":
      return "date"
    case "is_suppressed":
    case "is_transactional":
    case "is_high_value":
    case "is_subscribed":
    case "is_marketing":
      return "boolean"
    default:
      return "string"
  }
}

// Select component implementation
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
        position === "popper" && "translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export interface LogFilter {
  id: string
  name: string
  userId: string
  filter: string
  createdAt: Date
  updatedAt: Date
}

// Format field names for display
const formatFieldName = (field: string): string => {
  // Replace underscores with spaces and capitalize each word
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Main Contacts component
export default function Contacts({
  segmentId,
  segmentName,
  segmentFilter,
  newSegment = false,
  onProfileSelect,
  listId, // Add listId prop
  listName, // Add listName prop
}: {
  segmentId?: string | null
  segmentName?: string | null
  segmentFilter?: string | null
  newSegment?: boolean
  onProfileSelect: (profileId: string) => void
  listId?: string | null // Add listId prop
  listName?: string | null // Add listName prop
}) {
  const [contacts, setContacts] = useState<ExtendedContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set()) // Use numeric indices for selection
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedProfileType, setSelectedProfileType] = useState("all")

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ExtendedContact
    direction: "asc" | "desc"
  }>({
    key: "updated_at",
    direction: "desc",
  })

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(["updated_at", "first_name", "last_name", "email", "status", "mobile"]), // Changed from phone to mobile
  )

  // Add filter states
  const [filters, setFilters] = useState<FilterGroup[]>([])
  const [showFilterBuilder, setShowFilterBuilder] = useState(false)
  const [savedFilters, setSavedFilters] = useState<LogFilter[]>([])
  const [saveFilterName, setSaveFilterName] = useState("")
  const [currentUserId] = useState("user-123") // Replace with actual user ID from auth
  const [currentFilterName, setCurrentFilterName] = useState("")
  const [saveType, setSaveType] = useState<"segment" | "list">("segment")
  const [isSaving, setIsSaving] = useState(false)

  // Add segments and lists states
  const [segments, setSegments] = useState<Segment[]>([])
  const [lists, setLists] = useState<ContactList[]>([])
  const [selectedSegmentOrList, setSelectedSegmentOrList] = useState<string | null>(null)

  // All available fields from the database
  const allAvailableFields = profileFields

  // Sort function with proper implementation
  const requestSort = useCallback((key: keyof ExtendedContact) => {
    console.log("Requesting sort for key:", key)
    setSortConfig((prevConfig) => {
      const newDirection = prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc"
      console.log("New sort config:", { key, direction: newDirection })
      return { key, direction: newDirection }
    })
  }, [])

  // Apply sorting to contacts
  const sortedContacts = useMemo(() => {
    if (!sortConfig.key) return contacts

    return [...contacts].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime()
        return sortConfig.direction === "asc" ? comparison : -comparison
      }

      // Handle numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        const comparison = aValue - bValue
        return sortConfig.direction === "asc" ? comparison : -comparison
      }

      // Handle strings
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()
      const comparison = aString.localeCompare(bString)
      return sortConfig.direction === "asc" ? comparison : -comparison
    })
  }, [contacts, sortConfig])

  // Fetch contacts from database
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true)

        let result

        if (listId) {
          // Fetch list members
          result = await listsApi.getListMembers(listId)
        } else {
          // Fetch all profiles
          result = await profilesApi.getProfiles()
        }

        if (result.error) {
          throw new Error(result.error)
        }

        const profiles = result.data || []

        // Transform database profiles to match ExtendedContact interface with UUID IDs preserved
        const transformedContacts: ExtendedContact[] = profiles
          .map((profile, index) => {
            // Keep the original UUID ID and add a numeric index for React keys
            const profileId = profile.id || `temp-${index}`

            return {
              id: profileId, // Keep as UUID string
              numericIndex: index, // For React keys and selection
              first_name: profile.first_name || "",
              last_name: profile.last_name || "",
              email: profile.email || "",
              mobile: profile.mobile || "", // Changed from phone to mobile
              mobile_number: profile.mobile_number || "",
              phone: profile.phone || "",
              device: profile.device || "",
              os: profile.os || "",
              postcode: profile.postcode || "",
              suburb: profile.suburb || "",
              state: profile.state || "",
              timezone: profile.timezone || "",
              country: profile.country || "",
              created_at: profile.created_at ? new Date(profile.created_at) : new Date(),
              updated_at: profile.updated_at ? new Date(profile.updated_at) : new Date(),
              is_suppressed: profile.is_suppressed || false,
              is_transactional: profile.is_transactional || false,
              status: profile.status || "Active",
              is_high_value: profile.is_high_value || false,
              is_subscribed: profile.is_subscribed !== false,
              last_purchase_date: profile.last_purchase_date ? new Date(profile.last_purchase_date) : null,
              total_purchases: profile.total_purchases || 0,
              lifetime_value: profile.lifetime_value || 0,
              is_marketing: profile.is_marketing || false,
              role: profile.role || "",
              teams: profile.teams || "",
              last_login: profile.last_login ? new Date(profile.last_login) : null,
              source: profile.source || "",
              location: profile.location || "",
              language_preferences: profile.language_preferences || "",
              avatar_url: profile.avatar_url || "",
              tags: profile.tags || [],
              custom_fields: profile.custom_fields || {},
              notification_preferences: profile.notification_preferences || {},
              performance_metrics: profile.performance_metrics || {},
              // Custom properties (these would come from a separate table in a real implementation)
              loyalty_points: Math.floor(Math.random() * 1000),
              preferred_category: ["Electronics", "Clothing", "Home", "Books"][Math.floor(Math.random() * 4)],
              total_spent: Number.parseFloat((Math.random() * 1000).toFixed(2)),
              customer_since: new Date(Date.now() - Math.random() * 365 * 86400000 * 3),
            }
          })
          .filter((contact) => contact.id && contact.id !== `temp-${contact.numericIndex}`)

        console.log(`Loaded ${listId ? "list members" : "all profiles"}:`, transformedContacts.length)
        setContacts(transformedContacts)
        setError(null)
      } catch (err) {
        console.error(`Error fetching ${listId ? "list members" : "profiles"}:`, err)
        setError(
          err instanceof Error ? err.message : `Failed to load ${listId ? "list members" : "profiles"} from database`,
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [listId]) // Add listId to dependencies

  // Fetch segments and lists
  useEffect(() => {
    const fetchSegmentsAndLists = async () => {
      try {
        const [segmentsResult, listsResult] = await Promise.all([segmentsApi.getSegments(), listsApi.getLists()])

        if (segmentsResult.data) {
          setSegments(segmentsResult.data)
        }

        if (listsResult.data) {
          setLists(listsResult.data)
        }
      } catch (error) {
        console.error("Error fetching segments and lists:", error)
      }
    }

    fetchSegmentsAndLists()
  }, [])

  // Helper functions for applying filters - move these before filteredContacts useMemo
  const applyStringOperator = (contactValue: string, operator: string, conditionValue: string): boolean => {
    if (!contactValue) return false
    switch (operator) {
      case "contains":
        return contactValue.toLowerCase().includes(conditionValue.toLowerCase())
      case "is":
        return contactValue.toLowerCase() === conditionValue.toLowerCase()
      case "is not":
        return contactValue.toLowerCase() !== conditionValue.toLowerCase()
      case "starts with":
        return contactValue.toLowerCase().startsWith(conditionValue.toLowerCase())
      case "ends with":
        return contactValue.toLowerCase().endsWith(conditionValue.toLowerCase())
      default:
        return false
    }
  }

  const applyNumberOperator = (contactValue: number, operator: string, conditionValue: number): boolean => {
    switch (operator) {
      case "equals":
        return contactValue === conditionValue
      case "greater than":
        return contactValue > conditionValue
      case "less than":
        return contactValue < conditionValue
      case "greater than or equal to":
        return contactValue >= conditionValue
      case "less than or equal to":
        return contactValue <= conditionValue
      default:
        return false
    }
  }

  const applyDateOperator = (contactValue: Date, operator: string, conditionValue: Date): boolean => {
    const contactDate = contactValue instanceof Date ? contactValue.getTime() : new Date(contactValue).getTime()
    const conditionDate = conditionValue instanceof Date ? conditionValue.getTime() : new Date(conditionValue).getTime()

    switch (operator) {
      case "is":
        return contactDate === conditionDate
      case "is before":
        return contactDate < conditionDate
      case "is after":
        return contactDate > conditionDate
      case "is on or before":
        return contactDate <= conditionDate
      case "is on or after":
        return contactDate >= conditionDate
      default:
        return false
    }
  }

  // Filter contacts based on search term, profile type, and advanced filters
  const filteredContacts = useMemo(() => {
    let filtered = sortedContacts // Use sorted contacts instead of original contacts

    // Apply profile type filter
    if (selectedProfileType !== "all") {
      switch (selectedProfileType) {
        case "active":
          filtered = filtered.filter((c) => c.status === "Active")
          break
        case "marketing":
          filtered = filtered.filter((c) => c.is_marketing === true)
          break
        case "suppressed":
          filtered = filtered.filter((c) => c.is_suppressed === true)
          break
        case "unsubscribed":
          filtered = filtered.filter((c) => c.is_subscribed === false)
          break
        case "deleted":
          filtered = filtered.filter((c) => c.status === "Deleted")
          break
      }
    }

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter((contact) =>
        Object.values(contact).some((value) => value?.toString().toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply advanced filters
    if (filters.length > 0) {
      filtered = filtered.filter((contact) => {
        return filters.some((group) => {
          return group.conditions.every((condition) => {
            const contactValue = contact[condition.field as keyof ExtendedContact]
            const fieldType = getProfileFieldType(condition.field)

            if (!contactValue && condition.value) return false

            switch (fieldType) {
              case "string":
                return applyStringOperator(contactValue?.toString() || "", condition.operator, condition.value)
              case "number":
                return applyNumberOperator(
                  Number(contactValue) || 0,
                  condition.operator,
                  Number.parseFloat(condition.value),
                )
              case "date":
                return applyDateOperator(new Date(contactValue as any), condition.operator, new Date(condition.value))
              case "boolean":
                // This logic correctly handles "true" or "false" string values from the filter
                return contactValue === (condition.value.toLowerCase() === "true")
              default:
                return false
            }
          })
        })
      })
    }

    return filtered
  }, [sortedContacts, searchTerm, filters, selectedProfileType])

  const clearAllFilters = () => {
    setFilters([])
    setSearchTerm("")
    setSaveFilterName("")
    setCurrentFilterName("")
    setShowFilterBuilder(false)
    setSelectedProfileType("all")
    setSelectedSegmentOrList(null)
  }

  // Save filter as segment or list
  const saveFilter = async () => {
    if (!saveFilterName.trim() || filters.length === 0) return

    setIsSaving(true)
    try {
      const filterCriteria = {
        conditions: filters.flatMap((group) => group.conditions),
        searchTerm: searchTerm,
        profileType: selectedProfileType,
      }

      if (saveType === "segment") {
        const result = await segmentsApi.createSegment({
          name: saveFilterName,
          description: `Segment created from filter with ${filteredContacts.length} profiles`,
          creator_id: currentUserId,
          filter_criteria: filterCriteria,
          estimated_size: filteredContacts.length,
          auto_update: true,
          type: "Custom",
          shared: false,
          tags: [],
        })

        if (result.error) {
          throw new Error(result.error)
        }

        // Refresh segments list
        const segmentsResult = await segmentsApi.getSegments()
        if (segmentsResult.data) {
          setSegments(segmentsResult.data)
        }

        console.log("Segment saved successfully:", result.data)
      } else {
        const result = await listsApi.createList({
          name: saveFilterName,
          description: `List created from filter with ${filteredContacts.length} profiles`,
          creator_id: currentUserId,
          filter_criteria: filterCriteria,
          estimated_size: filteredContacts.length,
          auto_update: true,
          type: "Custom",
          shared: false,
          tags: [],
        })

        if (result.error) {
          throw new Error(result.error)
        }

        // Refresh lists
        const listsResult = await listsApi.getLists()
        if (listsResult.data) {
          setLists(listsResult.data)
        }

        console.log("List saved successfully:", result.data)
      }

      // Clear the form after successful save
      setSaveFilterName("")
      setCurrentFilterName(saveFilterName)

      // Show success message (you might want to add a toast notification here)
      alert(`${saveType === "segment" ? "Segment" : "List"} "${saveFilterName}" saved successfully!`)
    } catch (error) {
      console.error(`Error saving ${saveType}:`, error)
      alert(`Failed to save ${saveType}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle segment or list selection
  const handleSegmentOrListSelect = (id: string, type: "segment" | "list") => {
    setSelectedSegmentOrList(id)
    // TODO: Apply the segment/list filter criteria
    // For now, just clear other filters
    setFilters([])
    setSearchTerm("")
    setSelectedProfileType("all")
  }

  // Bulk action handlers
  const handleBulkAction = async (action: string) => {
    const selectedContactsArray = Array.from(selectedContacts)

    switch (action) {
      case "tag":
        // TODO: Open tag dialog for selected contacts
        console.log("Tagging contacts:", selectedContactsArray)
        alert(`Tagging ${selectedContactsArray.length} contacts`)
        break

      case "unsubscribe":
        if (confirm(`Are you sure you want to unsubscribe ${selectedContactsArray.length} contacts?`)) {
          // TODO: Implement bulk unsubscribe
          console.log("Unsubscribing contacts:", selectedContactsArray)
          alert(`Unsubscribed ${selectedContactsArray.length} contacts`)
          setSelectedContacts(new Set())
        }
        break

      case "delete":
        if (
          confirm(
            `Are you sure you want to delete ${selectedContactsArray.length} contacts? This action cannot be undone.`,
          )
        ) {
          // TODO: Implement bulk delete
          console.log("Deleting contacts:", selectedContactsArray)
          alert(`Deleted ${selectedContactsArray.length} contacts`)
          setSelectedContacts(new Set())
        }
        break

      case "addToList":
        // TODO: Open list selection dialog
        console.log("Adding contacts to list:", selectedContactsArray)
        alert(`Adding ${selectedContactsArray.length} contacts to list`)
        break

      case "export":
        const contactsToExport =
          selectedContactsArray.length > 0
            ? filteredContacts.filter((c) => selectedContactsArray.includes(c.numericIndex))
            : filteredContacts

        // TODO: Implement CSV export
        console.log("Exporting contacts:", contactsToExport)
        alert(`Exporting ${contactsToExport.length} contacts to CSV`)
        break

      case "import":
        // TODO: Open import dialog
        console.log("Opening import dialog")
        alert("Opening CSV import dialog")
        break

      default:
        console.log("Unknown action:", action)
    }
  }

  // Toggle individual contact selection - use numeric index for selection
  const toggleSelectContact = (contactIndex: number) => {
    console.log("toggleSelectContact called with index:", contactIndex, "Type:", typeof contactIndex)
    setSelectedContacts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(contactIndex)) {
        newSet.delete(contactIndex)
        console.log("Removed contact index:", contactIndex)
      } else {
        newSet.add(contactIndex)
        console.log("Added contact index:", contactIndex)
      }
      console.log("Updated selectedContacts:", Array.from(newSet))
      return newSet
    })
  }

  // Toggle select all contacts
  const toggleSelectAll = () => {
    if (selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(paginatedContacts.map((c) => c.numericIndex)))
    }
  }

  // Pagination
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredContacts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredContacts, currentPage, itemsPerPage])

  const pageCount = Math.ceil(filteredContacts.length / itemsPerPage)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profiles from database...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading profiles</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ProfileCounts
        counts={{
          all: contacts.length,
          active: contacts.filter((c) => c.status === "Active").length,
          marketing: contacts.filter((c) => c.is_marketing).length,
          suppressed: contacts.filter((c) => c.is_suppressed).length,
          unsubscribed: contacts.filter((c) => c.is_subscribed === false).length,
          deleted: contacts.filter((c) => c.status === "Deleted").length,
        }}
        selectedType={selectedProfileType}
        onTypeClick={(type) => {
          setSelectedProfileType(type)
          setCurrentPage(1) // Reset to first page when changing filter
        }}
      />

      {/* Filter Profiles Section - only show when activated */}
      {showFilterBuilder && (
        <Card className="shadow-sm mb-6">
          <CardContent className="px-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{filteredContacts.length} Profiles</h3>
                <div className="flex items-center gap-2">
                  <Select value={saveType} onValueChange={(value: "segment" | "list") => setSaveType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="segment">Segment</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Enter name"
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                    className="w-40"
                  />
                  <Button
                    onClick={saveFilter}
                    disabled={!saveFilterName.trim() || filters.length === 0 || isSaving}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      clearAllFilters()
                      setShowFilterBuilder(false)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ProfileFilterBuilder
                onFilterChange={(newFilters) => {
                  setFilters(newFilters)
                }}
                initialFilters={filters}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-white border rounded-md shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 py-4 px-4 md:px-6 border-b">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h2 className="text-[18px] md:text-[20px] text-[#374151] font-semibold">
              {listId && listName
                ? `${listName} (${filteredContacts.length})`
                : `All Profiles (${filteredContacts.length})`}
              {selectedContacts.size > 0 && ` (${selectedContacts.size} selected)`}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Segments and Lists Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  {selectedSegmentOrList
                    ? segments.find((s) => s.id === selectedSegmentOrList)?.name ||
                      lists.find((l) => l.id === selectedSegmentOrList)?.name ||
                      "Selected"
                    : selectedProfileType === "all"
                      ? "All Profiles"
                      : selectedProfileType === "active"
                        ? "Active"
                        : selectedProfileType === "marketing"
                          ? "Marketing"
                          : selectedProfileType === "suppressed"
                            ? "Suppressed"
                            : selectedProfileType === "unsubscribed"
                              ? "Unsubscribed"
                              : selectedProfileType === "deleted"
                                ? "Deleted"
                                : "All"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Default Profile Types */}
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Profile Types</div>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSegmentOrList(null)
                    setSelectedProfileType("all")
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  All Profiles
                  <span className="ml-auto text-xs text-gray-500">{contacts.length}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSegmentOrList(null)
                    setSelectedProfileType("active")
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Active
                  <span className="ml-auto text-xs text-gray-500">
                    {contacts.filter((c) => c.status === "Active").length}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSegmentOrList(null)
                    setSelectedProfileType("marketing")
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Marketing
                  <span className="ml-auto text-xs text-gray-500">{contacts.filter((c) => c.is_marketing).length}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSegmentOrList(null)
                    setSelectedProfileType("suppressed")
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Suppressed
                  <span className="ml-auto text-xs text-gray-500">
                    {contacts.filter((c) => c.is_suppressed).length}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSegmentOrList(null)
                    setSelectedProfileType("unsubscribed")
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Unsubscribed
                  <span className="ml-auto text-xs text-gray-500">
                    {contacts.filter((c) => c.is_subscribed === false).length}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSegmentOrList(null)
                    setSelectedProfileType("deleted")
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Deleted
                  <span className="ml-auto text-xs text-gray-500">
                    {contacts.filter((c) => c.status === "Deleted").length}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Custom Segments */}
                {segments.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Custom Segments</div>
                    {segments.map((segment) => (
                      <DropdownMenuItem
                        key={segment.id}
                        onClick={() => handleSegmentOrListSelect(segment.id, "segment")}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        {segment.name}
                        <span className="ml-auto text-xs text-gray-500">{segment.estimated_size}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Custom Lists */}
                {lists.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Custom Lists</div>
                    {lists.map((list) => (
                      <DropdownMenuItem key={list.id} onClick={() => handleSegmentOrListSelect(list.id, "list")}>
                        <List className="mr-2 h-4 w-4" />
                        {list.name}
                        <span className="ml-auto text-xs text-gray-500">{list.contact_count}</span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {segments.length === 0 && lists.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-gray-500">No custom segments or lists</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions
                  {selectedContacts.size > 0 && (
                    <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {selectedContacts.size}
                    </span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowFilterBuilder(true)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filter Profiles
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {selectedContacts.size > 0 ? (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
                      {selectedContacts.size} selected
                    </div>
                    <DropdownMenuItem onClick={() => handleBulkAction("tag")}>
                      <Tag className="mr-2 h-4 w-4" />
                      Tag
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("unsubscribe")}>
                      <X className="mr-2 h-4 w-4" />
                      Unsubscribe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("delete")}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("addToList")}>
                      <List className="mr-2 h-4 w-4" />
                      Add to List
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("import")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <KudosityContactsTable
          contacts={filteredContacts}
          isLoading={isLoading}
          onEditContact={(contact) => onProfileSelect(String(contact.id))}
          onTagContact={(contactId) => {
            console.log("Tagging contact:", contactId)
            alert(`Tagging contact ${contactId}`)
          }}
          onAddToList={(contactId) => {
            console.log("Adding contact to list:", contactId)
            alert(`Adding contact ${contactId} to list`)
          }}
          onUnsubscribeContact={(contactId) => {
            console.log("Unsubscribing contact:", contactId)
            alert(`Unsubscribing contact ${contactId}`)
          }}
          onDeleteContact={(contactId) => {
            console.log("Deleting contact:", contactId)
            alert(`Deleting contact ${contactId}`)
          }}
        />
      </div>
    </div>
  )
}
