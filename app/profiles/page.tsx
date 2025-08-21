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
import { segmentsApi } from "@/lib/api/segments-api"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ListSelectionDialog } from "@/components/features/lists/ListSelectionDialog"
import { SegmentListDropdown } from "@/components/features/profiles/SegmentListDropdown"

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

interface FilterCondition {
  field: string
  operator: string
  value: string
}

interface FilterGroup {
  id: string
  conditions: FilterCondition[]
}

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
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([])
  const [allAvailableFields, setAllAvailableFields] = useState<FieldDefinition[]>(availableFields)
  const [segments, setSegments] = useState<Segment[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [selectedFilterType, setSelectedFilterType] = useState<'segment' | 'list' | null>(null)
  const [segmentName, setSegmentName] = useState("")
  const [isSavingSegment, setIsSavingSegment] = useState(false)
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([])

  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [exportFields, setExportFields] = useState<string[]>([
    "first_name",
    "last_name",
    "email",
    "mobile",
    "status",
    "country",
    "created_at",
  ])

  const searchParams = useSearchParams()
  const listId = searchParams.get("listId")
  const [listName, setListName] = useState<string>("")

  const [createSegmentFromImport, setCreateSegmentFromImport] = useState(true)
  const [segmentNameFromImport, setSegmentNameFromImport] = useState("")
  const [showListDialog, setShowListDialog] = useState(false)

  // CSV Export function
  const exportToCSV = () => {
    const dataToExport =
      selectedProfiles.length > 0 ? selectedProfiles : filteredProfiles

    const headers = exportFields.map((field) => availableFields.find((f) => f.value === field)?.label || field)

    const csvContent = [
      headers.join(","),
      ...dataToExport.map((profile) =>
        exportFields
          .map((field) => {
            let value = profile[field as keyof Profile]
            if (field.startsWith("custom_fields.")) {
              const customFieldKey = field.replace("custom_fields.", "")
              value = profile.custom_fields?.[customFieldKey]
            }
            // Escape commas and quotes in CSV
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              value = `"${value.replace(/"/g, '""')}"`
            }
            return value || ""
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `profiles_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportDialog(false)
  }

  // CSV Import functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/csv") {
      setCsvFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
        const data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ""
          })
          return row
        })
        setCsvHeaders(headers)
        setCsvData(data)
        setSegmentNameFromImport(file.name.replace(".csv", ""))

        // Auto-map common fields
        const autoMapping: Record<string, string> = {}
        headers.forEach((header) => {
          const lowerHeader = header.toLowerCase()
          if (lowerHeader.includes("first") && lowerHeader.includes("name")) {
            autoMapping[header] = "first_name"
          } else if (lowerHeader.includes("last") && lowerHeader.includes("name")) {
            autoMapping[header] = "last_name"
          } else if (lowerHeader.includes("email")) {
            autoMapping[header] = "email"
          } else if (lowerHeader.includes("mobile") || lowerHeader.includes("phone") || lowerHeader === "msisdn") {
            autoMapping[header] = "mobile"
          } else if (lowerHeader.includes("country")) {
            autoMapping[header] = "country"
          } else if (lowerHeader.includes("status")) {
            autoMapping[header] = "status"
          } else if (lowerHeader.includes("custom") && lowerHeader.includes("id")) {
            autoMapping[header] = "custom_id"
          }
        })
        setFieldMapping(autoMapping)
      }
      reader.readAsText(file)
    } else {
      alert("Please select a valid CSV file")
    }
  }

  const importCSV = async () => {
    if (!csvData.length) return

    setIsProcessing(true)
    try {
      let successCount = 0 // New profiles created
      let updatedCount = 0 // Existing profiles updated
      let errorCount = 0
      let skippedCount = 0
      const errors: string[] = []
      const skipped: string[] = []
      const createdProfileIds: string[] = []
      const updatedProfileIds: string[] = []

      // Create the import tag for this batch
      const importTag =
        createSegmentFromImport && segmentNameFromImport.trim()
          ? segmentNameFromImport.trim().toLowerCase().replace(/\s+/g, "_")
          : null

      for (const row of csvData) {
        try {
          const profileData: any = {
            status: "Active",
            updated_at: new Date().toISOString(),
          }

          // Map CSV fields to profile fields
          Object.entries(fieldMapping).forEach(([csvField, profileField]) => {
            if (row[csvField] && profileField !== "ignore") {
              const value = row[csvField].trim() // Trim whitespace
              if (value) {
                // Only set if not empty after trimming
                if (profileField.startsWith("custom_fields.")) {
                  if (!profileData.custom_fields) profileData.custom_fields = {}
                  const customFieldKey = profileField.replace("custom_fields.", "")
                  profileData.custom_fields[customFieldKey] = value
                } else {
                  // Handle mobile number field variations
                  if (profileField === "mobile_number") {
                    profileData.mobile = value // Map mobile_number to mobile
                  } else {
                    profileData[profileField] = value
                  }
                }
              }
            }
          })

          // Validate and set default values for required fields
          if (!profileData.first_name) {
            profileData.first_name = "Unknown"
          }

          if (!profileData.last_name) {
            profileData.last_name = "User"
          }

          // Check for mobile number (required unless custom_id is provided)
          const hasMobileNumber =
            profileData.mobile ||
            profileData.phone ||
            profileData.mobile_number ||
            profileData.msisdn ||
            // Also check if any mapped field contains mobile data
            Object.entries(fieldMapping).some(([csvField, profileField]) => {
              if (
                (profileField === "mobile" || profileField === "phone" || profileField === "mobile_number") &&
                row[csvField] &&
                row[csvField].trim()
              ) {
                return true
              }
              return false
            })

          // Skip if no mobile number and no custom ID
          if (!hasMobileNumber && !profileData.custom_id) {
            skipped.push(
              `Row ${successCount + updatedCount + errorCount + skippedCount + 1}: No mobile number or custom ID provided`,
            )
            skippedCount++
            continue
          }

          // Handle email - set to NULL if empty or invalid, don't reject the row
          if (profileData.email) {
            // Validate email format if provided
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
              // Set to NULL instead of rejecting the row
              profileData.email = null
            }
          } else {
            // Explicitly set to NULL if not provided
            profileData.email = null
          }

          // Add import tag if segment creation is enabled
          if (importTag) {
            if (!profileData.tags) profileData.tags = []
            if (!profileData.tags.includes(importTag)) {
              profileData.tags.push(importTag)
            }
          }

          // Check if profile exists by mobile number (if mobile is provided)
          let existingProfile = null
          if (profileData.mobile) {
            existingProfile = profiles.find((p) => p.mobile === profileData.mobile)
          }

          if (existingProfile) {
            // UPDATE EXISTING PROFILE
            try {
              // Merge new data with existing profile
              const updateData = {
                ...profileData,
                id: existingProfile.id, // Keep the same ID
                created_at: existingProfile.created_at, // Keep original creation date
              }

              // Merge custom fields if they exist
              if (existingProfile.custom_fields && profileData.custom_fields) {
                updateData.custom_fields = {
                  ...existingProfile.custom_fields,
                  ...profileData.custom_fields,
                }
              }

              // Merge tags if they exist
              if (existingProfile.tags && profileData.tags) {
                const existingTags = Array.isArray(existingProfile.tags) ? existingProfile.tags : []
                const newTags = Array.isArray(profileData.tags) ? profileData.tags : []
                updateData.tags = Array.from(new Set([...existingTags, ...newTags]))
              }

              const result = await updateProfile(existingProfile.id, updateData)
              if (result.error) {
                errors.push(
                  `Row ${successCount + updatedCount + errorCount + skippedCount + 1}: Update failed - ${result.error}`,
                )
                errorCount++
              } else {
                updatedCount++
                updatedProfileIds.push(existingProfile.id)
              }
            } catch (error) {
              errors.push(`Row ${successCount + updatedCount + errorCount + skippedCount + 1}: Update error - ${error}`)
              errorCount++
            }
          } else {
            // CREATE NEW PROFILE
            try {
              // Set creation timestamp for new profiles
              profileData.created_at = new Date().toISOString()

              // Store custom_id in custom_fields if provided
              if (profileData.custom_id) {
                if (!profileData.custom_fields) profileData.custom_fields = {}
                profileData.custom_fields.custom_id = profileData.custom_id
                delete profileData.custom_id // Remove from main fields
              }

              const result = await createProfile(profileData)
              if (result.error) {
                errors.push(
                  `Row ${successCount + updatedCount + errorCount + skippedCount + 1}: Create failed - ${result.error}`,
                )
                errorCount++
              } else {
                successCount++
                createdProfileIds.push(result.data.id)
              }
            } catch (error) {
              errors.push(`Row ${successCount + updatedCount + errorCount + skippedCount + 1}: Create error - ${error}`)
              errorCount++
            }
          }
        } catch (error) {
          errors.push(`Row ${successCount + updatedCount + errorCount + skippedCount + 1}: Processing error - ${error}`)
          errorCount++
        }
      }

      // Refresh profiles list - fetch ALL profiles without limit
      const result = await getProfiles()
      if (result.data) {
        setProfiles(result.data)
        setFilteredProfiles(result.data)
      }

      let segmentCreationMessage = ""

      // Create segment from import if requested
      if (
        createSegmentFromImport &&
        segmentNameFromImport.trim() &&
        (createdProfileIds.length > 0 || updatedProfileIds.length > 0)
      ) {
        const allProfileIds = [...createdProfileIds, ...updatedProfileIds]

        // Use the first profile as the creator, or try to get an existing profile
        let creatorId = allProfileIds[0]

        if (!creatorId && profiles.length > 0) {
          creatorId = profiles[0].id
        }

        try {
          // Create a segment from the uploaded list using tag-based filtering
          const segmentResult = await segmentsApi.createSegment({
            name: segmentNameFromImport.trim(),
            description: `Imported from ${csvFile?.name || "CSV"} on ${new Date().toLocaleString()}. ${successCount} new, ${updatedCount} updated.`,
            creator_id: creatorId,
            filter_criteria: {
              conditions: [
                {
                  field: "tags",
                  operator: "contains",
                  value: importTag || segmentNameFromImport.trim().toLowerCase().replace(/\s+/g, "_"),
                },
              ],
              profileType: "all",
              searchTerm: "",
            },
            estimated_size: allProfileIds.length,
            auto_update: true,
            type: "Custom", // Changed from "Import" to "Custom"
            shared: false,
            tags: [importTag || segmentNameFromImport.trim().toLowerCase().replace(/\s+/g, "_")],
          })

          if (segmentResult.data) {
            console.log(`Created segment "${segmentNameFromImport}" for uploaded list`)

            // Refresh segments list
            const segmentsResult = await segmentsApi.getSegments()
            if (segmentsResult.data) {
              setSegments(segmentsResult.data)
            }

            segmentCreationMessage = `\n\n✅ Segment "${segmentNameFromImport}" created with ${allProfileIds.length} profiles`
          } else if (segmentResult.error) {
            console.warn(`Failed to create segment: ${segmentResult.error}`)
            segmentCreationMessage = `\n\n⚠️ Failed to create segment: ${segmentResult.error}`
          }
        } catch (error) {
          console.error("Error creating segment:", error)
          segmentCreationMessage = `\n\n⚠️ Error creating segment: ${error}`
        }
      }

      // Show detailed results with all categories
      const errorSummary =
        errors.length > 0
          ? `\n\nFirst 5 errors:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? "\n..." : ""}`
          : ""

      const skippedSummary =
        skipped.length > 0
          ? `\n\nFirst 5 skipped:\n${skipped.slice(0, 5).join("\n")}${skipped.length > 5 ? "\n..." : ""}`
          : ""

      alert(
        `Import completed!\n\nNew Profiles: ${successCount}\nUpdated Profiles: ${updatedCount}\nErrors: ${errorCount}\nSkipped: ${skippedCount}${errorSummary}${skippedSummary}${segmentCreationMessage}`,
      )

      // Reset import state
      setShowImportDialog(false)
      setCsvFile(null)
      setCsvData([])
      setCsvHeaders([])
      setFieldMapping({})
      setCreateSegmentFromImport(true)
      setSegmentNameFromImport("")
    } catch (error) {
      console.error("Import error:", error)
      alert("Import failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Fetch profiles from database
  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true)
        // Fetch ALL profiles without any limit - don't pass any parameters
        const result = await getProfiles()

        if (result.error) {
          console.error("Error fetching profiles:", result.error)
          return
        }

        console.log(`Loaded ${result.data?.length || 0} profiles from database`)
        setProfiles(result.data || [])
        setFilteredProfiles(result.data || [])
      } catch (error) {
        console.error("Error fetching profiles:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [])

  // Fetch segments and lists with profile counts
  useEffect(() => {
    async function fetchSegments() {
      try {
        const result = await segmentsApi.getSegments()
        if (result.data) {
          // Calculate profile counts for each segment
          const segmentsWithCounts = result.data.map(segment => {
            let count = 0
            
            // Calculate count based on segment filter criteria
            if (segment.filter_criteria) {
              const filtered = applySegmentFilter(profiles, segment.filter_criteria)
              count = filtered.length
            }
            
            return {
              ...segment,
              profile_count: count
            }
          })
          
          setSegments(segmentsWithCounts)
        }
      } catch (error) {
        console.error("Error fetching segments:", error)
      }
    }

    async function fetchLists() {
      try {
        const response = await fetch('/api/lists')
        if (response.ok) {
          const data = await response.json()
          setLists(data)
        }
      } catch (error) {
        console.error('Error fetching lists:', error)
      }
    }

    fetchSegments()
    fetchLists()
  }, [profiles])

  useEffect(() => {
    async function fetchCustomFields() {
      try {
        // Get all profiles to analyze custom fields (no limit)
        const result = await getProfiles()

        if (result.data) {
          const customFieldKeys = new Set<string>()

          // Extract all unique custom field keys from all profiles
          result.data.forEach((profile) => {
            if (profile.custom_fields && typeof profile.custom_fields === "object") {
              Object.keys(profile.custom_fields).forEach((key) => {
                customFieldKeys.add(key)
              })
            }
          })

          // Convert to field options with default text type for custom fields
          const customFieldOptions: FieldDefinition[] = Array.from(customFieldKeys)
            .filter(key => {
              // Skip custom fields that duplicate built-in fields
              const normalizedKey = key.toLowerCase()
              return !availableFields.some(f => f.value.toLowerCase() === normalizedKey)
            })
            .map((key) => ({
            value: `custom_fields.${key}`,
              label: key
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") + " (Custom)",
              type: "text" as FieldType, // Default to text for custom fields
          }))

          setCustomFields(customFieldOptions)
          setAllAvailableFields([...availableFields, ...customFieldOptions])
        }
      } catch (error) {
        console.error("Error fetching custom fields:", error)
      }
    }

    fetchCustomFields()
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

  // Apply filters based on filter groups or selected segment
  const applyFilters = (filterGroups: FilterGroup[], profileType: string, searchTerm: string) => {
    // Check if there's an explicit status filter for deleted items
    const hasDeletedFilter = filterGroups.some(group =>
      group.conditions.some(c => 
        c.field === 'status' && (c.value === 'Deleted' || c.value === 'deleted')
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
            // Active lifecycle status - check both fields for compatibility (case-insensitive)
            const activeStage = profile.lifecycle_stage?.toLowerCase() || profile.status?.toLowerCase()
            return activeStage === 'active'
          case "archived":
            // Inactive lifecycle status - check both fields for compatibility (case-insensitive)
            const archivedStage = profile.lifecycle_stage?.toLowerCase() || profile.status?.toLowerCase()
            return archivedStage === 'inactive'
          case "deleted":
            // Soft deleted profiles - check both fields for compatibility (case-insensitive)
            const deletedStage = profile.lifecycle_stage?.toLowerCase() || profile.status?.toLowerCase()
            return deletedStage === 'deleted'
          case "marketing":
            // Profiles with ANY marketing channel enabled (regardless of status)
            return profile.status !== 'destroyed' && hasMarketingChannel(profile)
          case "unsubscribed":
            // Profiles with ALL marketing channels disabled (regardless of status)
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

    // Apply filter groups (groups are OR'd together, conditions within a group are AND'd)
    const hasActiveFilters = filterGroups.some(group => 
      group.conditions.some(c => c.value && c.value.trim() !== "")
    )
    
    if (hasActiveFilters) {
      filtered = filtered.filter((profile) => {
        // Evaluate a single condition
        const evaluateCondition = (condition: FilterCondition): boolean => {
          // Skip empty filter conditions
          if (!condition.value || condition.value.trim() === "") {
            return true
          }

          let fieldValue: any

          // Handle custom fields
          if (condition.field.startsWith("custom_fields.")) {
            const customFieldKey = condition.field.replace("custom_fields.", "")
            fieldValue = profile.custom_fields?.[customFieldKey]
          } else if (condition.field === "tags") {
            fieldValue = profile.tags
          } else {
            fieldValue = profile[condition.field as keyof Profile]
          }

          // Handle null/undefined values based on operator
          if (fieldValue === undefined || fieldValue === null) {
            switch (condition.operator) {
              case "exists":
              case "is_not_empty":
                return false
              case "not_exists":
              case "is_empty":
                return true
              case "equals":
              case "is":
                return condition.value === "" || condition.value.toLowerCase() === "null"
              default:
                return false
            }
          }

          // Handle array fields like tags
          if (Array.isArray(fieldValue)) {
            const arrayValue = fieldValue.join(" ").toLowerCase()
            const conditionValue = condition.value.toLowerCase()

            switch (condition.operator) {
              case "contains":
                return arrayValue.includes(conditionValue)
              case "equals":
                return fieldValue.includes(condition.value)
              default:
                return arrayValue.includes(conditionValue)
            }
          }

          const profileValue = String(fieldValue).toLowerCase()
          const conditionValue = condition.value.toLowerCase()

          switch (condition.operator) {
            case "contains":
              return profileValue.includes(conditionValue)
            case "equals":
              return profileValue === conditionValue
            case "starts with":
              return profileValue.startsWith(conditionValue)
            case "ends with":
              return profileValue.endsWith(conditionValue)
            case "is":
              return profileValue === conditionValue
            case "is not":
              return profileValue !== conditionValue
            case "greater than":
              return Number(fieldValue) > Number(condition.value)
            case "less than":
              return Number(fieldValue) < Number(condition.value)
            case "exists":
              return fieldValue !== null && fieldValue !== undefined && fieldValue !== ""
            case "not exists":
              return fieldValue === null || fieldValue === undefined || fieldValue === ""
            default:
              return true
          }
        }

        // Evaluate filter groups: OR between groups, AND within each group
        return filterGroups.some(group => {
          // Skip empty groups
          const activeConditions = group.conditions.filter(c => c.value && c.value.trim() !== "")
          if (activeConditions.length === 0) return false
          
          // All conditions within a group must be true (AND)
          return activeConditions.every(evaluateCondition)
        })
      })
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
            console.error('Failed to fetch list members:', response.status)
            setFilteredProfiles([])
          }
        } catch (error) {
          console.error('Error fetching list members:', error)
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
      console.error("Error saving segment:", error)
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
    { label: "Import CSV", value: "import_csv" },
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
      label: "Export CSV",
      icon: <Download className="h-4 w-4" />,
      onClick: () => setShowExportDialog(true),
      disabled: false, // Always enabled
    },
    {
      label: "---divider---",
      icon: null,
      onClick: () => {},
    },
    {
      label: "Tag",
      icon: <Tag className="h-4 w-4" />,
      disabled: selectedProfiles.length === 0,
      onClick: () => {
        if (selectedProfiles.length === 0) return;
        // TODO: Implement tag dialog
        const tag = prompt(`Enter tag to add to ${selectedProfiles.length} profiles:`)
        if (tag) {
          console.log(`Adding tag "${tag}" to ${selectedProfiles.length} profiles`)
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
                console.error(`Failed to destroy profile ${profile.id}:`, result.error)
              } else {
                successCount++
              }
            } catch (error) {
              errorCount++
              console.error(`Error destroying profile ${profile.id}:`, error)
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
      console.error('Error adding profiles to list:', error);
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-muted-foreground text-sm">Loading profiles...</p>
          </div>
        </div>
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

          {/* Inline Filter UI */}
          {showInlineFilter && (
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-foreground">{filteredProfiles.length} Profiles</h2>
                    {selectedSegment && (
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        className="h-10 flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Segment
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter segment name"
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                      className="w-[200px] h-10 bg-background border-border"
                    />
                    <Button
                      onClick={saveAsSegment}
                      disabled={!segmentName.trim() || !filterGroups.some(g => g.conditions.length > 0) || isSavingSegment}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-10"
                    >
                      {(() => {
                        const selectedSegmentData = selectedSegment ? segments.find(s => s.id === selectedSegment) : null
                        const isUpdating = selectedSegmentData && selectedSegmentData.name === segmentName
                        if (isSavingSegment) return "Saving..."
                        if (isUpdating) return "Update Segment"
                        return "Save Segment"
                      })()}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowInlineFilter(false)}
                      className="h-10 w-10 hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filterGroups.map((group, groupIndex) => (
                    <div key={group.id}>
                      {/* OR separator between groups */}
                      {groupIndex > 0 && (
                        <div className="flex items-center justify-center py-2 mb-4">
                          <div className="flex-1 border-t border-border"></div>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded mx-3">
                            OR
                          </span>
                          <div className="flex-1 border-t border-border"></div>
                        </div>
                      )}

                      {/* Filter Group */}
                      <div className="bg-accent/30 rounded-lg p-3 border border-border/50">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                          <span className="text-sm font-medium text-foreground">
                            Group {groupIndex + 1} {group.conditions.length > 1 && "(All conditions must match)"}
                          </span>
                          {filterGroups.length > 1 && (
                      <Button
                              variant="ghost"
                        size="sm"
                              onClick={() => removeFilterGroup(group.id)}
                              className="h-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                              <X className="h-3 w-3 mr-1" />
                              Remove Group
                      </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {/* Show Add AND button if group has no conditions */}
                          {group.conditions.length === 0 && (
                      <Button
                              variant="outline"
                        size="sm"
                              onClick={() => addConditionToGroup(group.id)}
                              className="flex items-center gap-1 h-10 px-3 hover:bg-accent"
                      >
                              <Plus className="h-3 w-3" />
                              Add Condition
                      </Button>
                          )}
                          
                          {group.conditions.map((condition, conditionIndex) => (
                            <div key={conditionIndex}>
                              {/* AND separator within group */}
                              {conditionIndex > 0 && (
                        <div className="flex items-center justify-center py-1">
                                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded">
                                    AND
                          </span>
                        </div>
                      )}

                              <div className="flex items-center gap-2">
                      <Select
                        value={condition.field}
                                  onValueChange={(value) => updateConditionInGroup(group.id, conditionIndex, "field", value)}
                      >
                        <SelectTrigger className="w-[180px] h-10 bg-background border-border">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto bg-card border-border">
                          {allAvailableFields.map((field) => (
                            <SelectItem 
                              key={field.value} 
                              value={field.value} 
                              className="text-foreground text-left"
                            >
                              <span className="block text-left w-full">{field.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                                  onValueChange={(value) => updateConditionInGroup(group.id, conditionIndex, "operator", value)}
                      >
                                  <SelectTrigger className="w-[140px] h-10 bg-background border-border">
                                    <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                                    {getOperatorsForField(condition.field).map((op) => (
                                      <SelectItem key={op.value} value={op.value} className="text-foreground">
                                        {op.label}
                          </SelectItem>
                                    ))}
                        </SelectContent>
                      </Select>

                                {/* Render appropriate value input based on field type */}
                                {renderFieldValueInput(condition, group.id, conditionIndex)}

                                {/* Trash can right after the filter fields */}
                      <Button
                        variant="ghost"
                        size="icon"
                                  onClick={() => removeConditionFromGroup(group.id, conditionIndex)}
                                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 h-10 w-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                                {/* Add AND button right next to trash can for the last condition */}
                                {conditionIndex === group.conditions.length - 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addConditionToGroup(group.id)}
                                    className="flex items-center gap-1 h-10 px-3 hover:bg-accent"
                                  >
                                    <Plus className="h-3 w-3" />
                                    AND
                      </Button>
                  )}
                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add new group button - centered */}
                  <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                      onClick={addFilterGroup}
                      className="flex items-center gap-1 h-10 px-4 hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                      OR
                  </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
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
                } else if (value === "import_csv") {
                  setShowImportDialog(true)
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
                  console.error("Error deleting profile:", error)
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
                  console.error("Error restoring profile:", error)
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
                  console.error("Error destroying profile:", error)
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

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto border border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Export Profiles to CSV</h3>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedProfiles.length > 0
                    ? `Exporting ${selectedProfiles.length} selected profiles`
                    : `Exporting ${filteredProfiles.length} profiles`}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select fields to export:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2 border-border bg-background">
                  {[...availableFields, ...customFields].map((field) => (
                    <label key={field.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportFields.includes(field.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportFields([...exportFields, field.value])
                          } else {
                            setExportFields(exportFields.filter((f) => f !== field.value))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={exportToCSV} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" onClick={() => setShowExportDialog(false)} className="flex-1 hover:bg-accent">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto border border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Import Profiles from CSV</h3>

              {!csvFile ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-foreground">Select CSV file:</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
                  />
                  <p className="text-xs text-muted-foreground mt-1">CSV should contain headers in the first row</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      File: {csvFile.name} ({csvData.length} rows)
                    </p>
                  </div>

                  {/* Segment Creation Section */}
                  <div className="bg-accent/30 p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="createSegment"
                        checked={createSegmentFromImport}
                        onChange={(e) => setCreateSegmentFromImport(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="createSegment" className="text-sm font-medium text-foreground">
                        Create segment from this import
                      </label>
                    </div>

                    {createSegmentFromImport && (
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Segment name:</label>
                        <Input
                          value={segmentNameFromImport}
                          onChange={(e) => setSegmentNameFromImport(e.target.value)}
                          placeholder="Enter segment name (e.g., 'VIP Customers', 'Newsletter Subscribers')"
                          className="w-full bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          All imported profiles will be tagged with this name and grouped into a segment
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-foreground">Map CSV fields to profile fields:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {csvHeaders.map((header) => (
                        <div key={header} className="flex items-center gap-2">
                          <span className="text-sm w-32 truncate text-foreground" title={header}>
                            {header}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <Select
                            value={fieldMapping[header] || "ignore"}
                            onValueChange={(value) =>
                              setFieldMapping({
                                ...fieldMapping,
                                [header]: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-48 bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="ignore" className="text-foreground">
                                Ignore
                              </SelectItem>
                              {[...availableFields, ...customFields].map((field) => (
                                <SelectItem key={field.value} value={field.value} className="text-foreground">
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50/10 p-3 rounded border border-yellow-200/20 dark:border-yellow-900/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Import Logic:</strong>
                      <br />• <strong>Update:</strong> If mobile number exists, profile will be updated with new data
                      <br />• <strong>Create:</strong> If mobile number is new, a new profile will be created
                      <br />• <strong>Custom ID:</strong> Allows duplicate mobile numbers (stored in custom fields)
                      <br />• <strong>Skip:</strong> Rows without mobile number or custom ID will be skipped
                      <br />• Email is optional, invalid formats will cause errors
                      <br />• Empty names default to "Unknown" and "User"
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                {csvFile && (
                  <Button
                    onClick={importCSV}
                    disabled={isProcessing || Object.keys(fieldMapping).length === 0}
                    className="flex-1"
                  >
                    {isProcessing ? "Importing..." : "Import"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false)
                    setCsvFile(null)
                    setCsvData([])
                    setCsvHeaders([])
                    setFieldMapping({})
                    setCreateSegmentFromImport(true)
                    setSegmentNameFromImport("")
                  }}
                  className="flex-1 hover:bg-accent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
      
      {/* List Selection Dialog */}
      <ListSelectionDialog
        open={showListDialog}
        onClose={() => setShowListDialog(false)}
        onConfirm={handleAddToList}
        profileCount={selectedProfiles.length}
      />
    </MainLayout>
  )
}
