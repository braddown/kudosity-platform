"use client"

import type React from "react"

import { useState, useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import { ProfileCounts } from "@/components/ProfileCounts"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Filter, Tag, UserX, Trash2, List, Download, Upload, Plus, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
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

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
  created_at: string
  country: string
  state?: string
  timezone?: string
  source?: string
  lifetime_value?: number
  phone?: string | null
  postcode?: string
  suburb?: string
  device?: string
  os?: string
  role?: string
  teams?: string[]
  is_suppressed?: boolean
  is_transactional?: boolean
  is_high_value?: boolean
  is_subscribed?: boolean
  is_marketing?: boolean
  last_purchase_date?: string
  total_purchases?: number
  loyalty_points?: number
  preferred_category?: string
  total_spent?: number
  customer_since?: string
  last_login?: string
  updated_at?: string
  mobile_number?: string
  location?: string
  avatar_url?: string
  language_preferences?: string
  tags?: string[]
  custom_fields?: { [key: string]: any }
  notification_preferences?: string
  performance_metrics?: string
}

interface FilterCondition {
  field: string
  operator: string
  value: string
}

interface Segment {
  id: string
  name: string
  description?: string
  estimated_size: number
  filter_criteria?: {
    conditions: FilterCondition[]
    profileType?: string
    searchTerm?: string
  }
  type: string
  created_at: string
}

// Expanded list of all available profile fields for filtering
const availableFields = [
  // Core identity fields
  { value: "id", label: "ID" },
  { value: "custom_id", label: "Custom ID" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "mobile", label: "Mobile" },
  { value: "mobile_number", label: "Mobile Number" },

  // Location fields
  { value: "postcode", label: "Postcode" },
  { value: "suburb", label: "Suburb" },
  { value: "state", label: "State" },
  { value: "country", label: "Country" },
  { value: "timezone", label: "Timezone" },
  { value: "location", label: "Location" },

  // Device and technical fields
  { value: "device", label: "Device" },
  { value: "os", label: "Operating System" },
  { value: "source", label: "Source" },
  { value: "avatar_url", label: "Avatar URL" },

  // Status and preferences
  { value: "status", label: "Status" },
  { value: "role", label: "Role" },
  { value: "teams", label: "Teams" },
  { value: "is_suppressed", label: "Is Suppressed" },
  { value: "is_transactional", label: "Is Transactional" },
  { value: "is_high_value", label: "Is High Value" },
  { value: "is_subscribed", label: "Is Subscribed" },
  { value: "is_marketing", label: "Is Marketing" },

  // Purchase and engagement data
  { value: "last_purchase_date", label: "Last Purchase Date" },
  { value: "total_purchases", label: "Total Purchases" },
  { value: "lifetime_value", label: "Lifetime Value" },
  { value: "loyalty_points", label: "Loyalty Points" },
  { value: "preferred_category", label: "Preferred Category" },
  { value: "total_spent", label: "Total Spent" },
  { value: "customer_since", label: "Customer Since" },

  // Timestamps
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
  { value: "last_login", label: "Last Login" },

  // Additional fields
  { value: "language_preferences", label: "Language Preferences" },
  { value: "tags", label: "Tags" },
  { value: "custom_fields", label: "Custom Fields" },
  { value: "notification_preferences", label: "Notification Preferences" },
  { value: "performance_metrics", label: "Performance Metrics" },
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
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [showInlineFilter, setShowInlineFilter] = useState(false)
  const [customFields, setCustomFields] = useState<{ value: string; label: string }[]>([])
  const [allAvailableFields, setAllAvailableFields] = useState(availableFields)
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [segmentName, setSegmentName] = useState("")
  const [isSavingSegment, setIsSavingSegment] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set())

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

  // CSV Export function
  const exportToCSV = () => {
    const dataToExport =
      selectedContacts.size > 0 ? filteredProfiles.filter((_, index) => selectedContacts.has(index)) : filteredProfiles

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
            country: "Australia",
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

  // Fetch segments
  useEffect(() => {
    async function fetchSegments() {
      try {
        const result = await segmentsApi.getSegments()
        if (result.data) {
          setSegments(result.data)
        }
      } catch (error) {
        console.error("Error fetching segments:", error)
      }
    }

    fetchSegments()
  }, [])

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

          // Convert to field options
          const customFieldOptions = Array.from(customFieldKeys).map((key) => ({
            value: `custom_fields.${key}`,
            label: `Custom: ${key
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}`,
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

  // Apply filters based on conditions or selected segment
  const applyFilters = (conditions: FilterCondition[], profileType: string, searchTerm: string) => {
    let filtered = profiles

    // Filter by type (from summary cards)
    if (profileType !== "all") {
      filtered = filtered.filter((profile) => {
        switch (profileType) {
          case "active":
            return profile.status === "Active"
          case "marketing":
            return profile.status === "Marketing"
          case "suppressed":
            return profile.status === "Suppressed"
          case "unsubscribed":
            return profile.status === "Unsubscribed"
          case "deleted":
            return profile.status === "Inactive"
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

    // Apply filter conditions
    if (conditions.length > 0) {
      filtered = filtered.filter((profile) => {
        return conditions.every((condition) => {
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

          if (fieldValue === undefined || fieldValue === null) return false

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
            default:
              return true
          }
        })
      })
    }

    return filtered
  }

  // Filter profiles based on type, search, filter conditions, or selected segment
  useEffect(() => {
    let filtered: Profile[]

    if (selectedSegment) {
      const segment = segments.find((s) => s.id === selectedSegment)
      if (segment?.filter_criteria) {
        filtered = applyFilters(
          segment.filter_criteria.conditions || [],
          segment.filter_criteria.profileType || "all",
          segment.filter_criteria.searchTerm || "",
        )
      } else {
        filtered = profiles
      }
    } else {
      filtered = applyFilters(filterConditions, selectedType, searchTerm)
    }

    setFilteredProfiles(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [profiles, selectedType, searchTerm, filterConditions, selectedSegment, segments])

  // Calculate counts
  const counts = {
    all: profiles.length,
    active: profiles.filter((p) => p.status === "Active").length,
    marketing: profiles.filter((p) => p.status === "Marketing").length,
    suppressed: profiles.filter((p) => p.status === "Suppressed").length,
    unsubscribed: profiles.filter((p) => p.status === "Unsubscribed").length,
    deleted: profiles.filter((p) => p.status === "Inactive").length,
  }

  const handleRowEdit = (profile: Profile) => {
    router.push(`/profiles/edit/${profile.id}`)
  }

  // Save current filter as segment
  const saveAsSegment = async () => {
    if (!segmentName.trim() || filterConditions.length === 0) {
      alert("Please enter a segment name and add at least one filter condition.")
      return
    }

    setIsSavingSegment(true)
    try {
      // Get an existing profile ID to use as creator_id (due to foreign key constraint)
      let creatorId = "00000000-0000-0000-0000-000000000001" // fallback

      if (profiles.length > 0) {
        // Use the first available profile ID as creator
        creatorId = profiles[0].id
      } else {
        // If no profiles exist, try to fetch one
        const profilesResult = await getProfiles()
        if (profilesResult.data && profilesResult.data.length > 0) {
          creatorId = profilesResult.data[0].id
        } else {
          alert("Cannot create segment: No profiles found in the system. Please create a profile first.")
          return
        }
      }

      const result = await segmentsApi.createSegment({
        name: segmentName,
        description: `Segment with ${filteredProfiles.length} profiles`,
        creator_id: creatorId,
        filter_criteria: {
          conditions: filterConditions,
          profileType: selectedType,
          searchTerm: searchTerm,
        },
        estimated_size: filteredProfiles.length,
        auto_update: true,
        type: "Custom",
        shared: false,
        tags: [],
      })

      if (result.error) {
        alert(`Error saving segment: ${result.error}`)
        return
      }

      // Refresh segments list
      const segmentsResult = await segmentsApi.getSegments()
      if (segmentsResult.data) {
        setSegments(segmentsResult.data)
      }

      // Clear form
      setSegmentName("")
      alert(`Segment "${segmentName}" saved successfully!`)
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
      setFilterConditions(segment.filter_criteria.conditions || [])
      setSelectedType(segment.filter_criteria.profileType || "all")
      setSearchTerm(segment.filter_criteria.searchTerm || "")
      setShowInlineFilter(true)
    }
  }

  // Clear all filters and segments
  const clearFilters = () => {
    setFilterConditions([])
    setSelectedType("all")
    setSearchTerm("")
    setSelectedSegment(null)
    setSegmentName("")
    setShowInlineFilter(false)
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
      cell: (row) => row.country || "Australia",
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
          switch (status) {
            case "Active":
              return (
                <Badge variant="translucent-green" className="font-medium">
                  Active
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
            case "Inactive":
              return (
                <Badge variant="translucent-red" className="font-medium">
                  Deleted
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
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Marketing", value: "marketing" },
    { label: "Suppressed", value: "suppressed" },
    { label: "Unsubscribed", value: "unsubscribed" },
    { label: "Deleted", value: "deleted" },
    // Add segments to filter options
    ...segments.map((segment) => ({
      label: segment.name,
      value: `segment_${segment.id}`,
    })),
  ]

  const tableActions = [
    {
      label: "Filter Profiles",
      icon: <Filter className="h-4 w-4" />,
      onClick: () => setShowInlineFilter(!showInlineFilter),
    },
    { label: "Tag", icon: <Tag className="h-4 w-4" />, onClick: () => console.log("Tag selected") },
    { label: "Unsubscribe", icon: <UserX className="h-4 w-4" />, onClick: () => console.log("Unsubscribe selected") },
    { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: () => console.log("Delete selected") },
    { label: "Add to List", icon: <List className="h-4 w-4" />, onClick: () => console.log("Add to list") },
    {
      label: "Export CSV",
      icon: <Download className="h-4 w-4" />,
      onClick: () => setShowExportDialog(true),
    },
    {
      label: "Import CSV",
      icon: <Upload className="h-4 w-4" />,
      onClick: () => setShowImportDialog(true),
    },
  ]

  const pageActions = [
    {
      label: "Create Profile",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => router.push("/profiles/new"),
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  const totalPages = Math.ceil(filteredProfiles.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentProfiles = filteredProfiles.slice(startIndex, endIndex)

  const addFilterCondition = () => {
    setFilterConditions([...filterConditions, { field: "first_name", operator: "contains", value: "" }])
  }

  const updateFilterCondition = (index: number, field: string, value: string) => {
    const newConditions = [...filterConditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setFilterConditions(newConditions)
  }

  const removeFilterCondition = (index: number) => {
    const newConditions = [...filterConditions]
    newConditions.splice(index, 1)
    setFilterConditions(newConditions)
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
      case "marketing":
        return "Marketing Profiles"
      case "suppressed":
        return "Suppressed Profiles"
      case "unsubscribed":
        return "Unsubscribed Profiles"
      case "deleted":
        return "Deleted Profiles"
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
          <ProfileCounts counts={counts} selectedType={selectedType} onTypeClick={setSelectedType} />

          {/* Inline Filter UI */}
          {showInlineFilter && (
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">{filteredProfiles.length} Profiles</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter segment name"
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                      className="w-[200px] h-10 bg-background border-border"
                    />
                    <Button
                      onClick={saveAsSegment}
                      disabled={!segmentName.trim() || filterConditions.length === 0 || isSavingSegment}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-10"
                    >
                      {isSavingSegment ? "Saving..." : "Save Segment"}
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

                <div className="space-y-3">
                  {filterConditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={condition.field}
                        onValueChange={(value) => updateFilterCondition(index, "field", value)}
                      >
                        <SelectTrigger className="w-[180px] h-10 bg-background border-border">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto bg-card border-border">
                          {allAvailableFields.map((field) => (
                            <SelectItem key={field.value} value={field.value} className="text-foreground">
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateFilterCondition(index, "operator", value)}
                      >
                        <SelectTrigger className="w-[120px] h-10 bg-background border-border">
                          <SelectValue placeholder="contains" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="contains" className="text-foreground">
                            contains
                          </SelectItem>
                          <SelectItem value="equals" className="text-foreground">
                            equals
                          </SelectItem>
                          <SelectItem value="is" className="text-foreground">
                            is
                          </SelectItem>
                          <SelectItem value="is not" className="text-foreground">
                            is not
                          </SelectItem>
                          <SelectItem value="starts with" className="text-foreground">
                            starts with
                          </SelectItem>
                          <SelectItem value="ends with" className="text-foreground">
                            ends with
                          </SelectItem>
                          <SelectItem value="greater than" className="text-foreground">
                            greater than
                          </SelectItem>
                          <SelectItem value="less than" className="text-foreground">
                            less than
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        value={condition.value}
                        onChange={(e) => updateFilterCondition(index, "value", e.target.value)}
                        placeholder="Enter value"
                        className="flex-1 h-10 bg-background border-border"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilterCondition(index)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-accent h-10 w-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {filterConditions.length === 0 && (
                    <div className="flex items-center gap-2">
                      <Select
                        onValueChange={(value) =>
                          setFilterConditions([{ field: value, operator: "contains", value: "" }])
                        }
                      >
                        <SelectTrigger className="w-[180px] h-10 bg-background border-border">
                          <SelectValue placeholder="firstName" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto bg-card border-border">
                          {allAvailableFields.map((field) => (
                            <SelectItem key={field.value} value={field.value} className="text-foreground">
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select defaultValue="contains">
                        <SelectTrigger className="w-[120px] h-10 bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="contains" className="text-foreground">
                            contains
                          </SelectItem>
                          <SelectItem value="equals" className="text-foreground">
                            equals
                          </SelectItem>
                          <SelectItem value="is" className="text-foreground">
                            is
                          </SelectItem>
                          <SelectItem value="is not" className="text-foreground">
                            is not
                          </SelectItem>
                          <SelectItem value="starts with" className="text-foreground">
                            starts with
                          </SelectItem>
                          <SelectItem value="ends with" className="text-foreground">
                            ends with
                          </SelectItem>
                          <SelectItem value="greater than" className="text-foreground">
                            greater than
                          </SelectItem>
                          <SelectItem value="less than" className="text-foreground">
                            less than
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Input placeholder="Enter value" className="flex-1 h-10 bg-background border-border" />
                      <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10 hover:bg-accent">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFilterCondition}
                    className="flex items-center gap-2 h-10 hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                    Condition
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Profiles Table */}
          <div>
            <DataTable
              data={currentProfiles}
              columns={columns}
              title={getTableTitle()}
              searchPlaceholder="Search profiles..."
              onSearch={setSearchTerm}
              selectable
              filterOptions={filterOptions}
              onFilterChange={(value) => {
                if (value.startsWith("segment_")) {
                  const segmentId = value.replace("segment_", "")
                  loadSegment(segmentId)
                } else {
                  setSelectedType(value)
                  setSelectedSegment(null)
                }
              }}
              selectedFilter={selectedSegment ? `segment_${selectedSegment}` : selectedType}
              actions={tableActions}
              onRowEdit={handleRowEdit}
              onRowDelete={async (profile) => {
                try {
                  // Show confirmation dialog
                  const confirmDelete = confirm(
                    `Are you sure you want to delete the profile for ${profile.first_name} ${profile.last_name}?\n\nThis will mark the profile as deleted but preserve the data.`,
                  )

                  if (!confirmDelete) return // User cancelled

                  setLoading(true)

                  // Use soft delete by default
                  const result = await softDeleteProfile(profile.id)

                  if (result.error) {
                    alert(`Error deleting profile: ${result.error}`)
                    return
                  }

                  // Update the profile status in local state to "Inactive"
                  const updatedProfile = { ...profile, status: "Inactive" }

                  setProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))
                  setFilteredProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))

                  alert("Profile marked as deleted successfully")
                } catch (error) {
                  console.error("Error deleting profile:", error)
                  alert("Failed to delete profile. Please try again.")
                } finally {
                  setLoading(false)
                }
              }}
              onRowRestore={async (profile) => {
                try {
                  setLoading(true)

                  const result = await restoreProfile(profile.id)

                  if (result.error) {
                    alert(`Error restoring profile: ${result.error}`)
                    return
                  }

                  // Update the profile status in local state to "Active"
                  const updatedProfile = { ...profile, status: "Active" }

                  setProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))
                  setFilteredProfiles((prev) => prev.map((p) => (p.id === profile.id ? updatedProfile : p)))

                  alert("Profile restored successfully")
                } catch (error) {
                  console.error("Error restoring profile:", error)
                  alert("Failed to restore profile. Please try again.")
                } finally {
                  setLoading(false)
                }
              }}
              onRowDestroy={async (profile) => {
                try {
                  setLoading(true)

                  const result = await deleteProfile(profile.id)

                  if (result.error) {
                    alert(`Error destroying profile: ${result.error}`)
                    return
                  }

                  // Remove the profile from local state completely
                  setProfiles((prev) => prev.filter((p) => p.id !== profile.id))
                  setFilteredProfiles((prev) => prev.filter((p) => p.id !== profile.id))

                  alert("Profile permanently destroyed")
                } catch (error) {
                  console.error("Error destroying profile:", error)
                  alert("Failed to destroy profile. Please try again.")
                } finally {
                  setLoading(false)
                }
              }}
              pagination={{
                currentPage,
                totalPages,
                pageSize,
                totalItems: filteredProfiles.length,
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
                  {selectedContacts.size > 0
                    ? `Exporting ${selectedContacts.size} selected profiles`
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
    </MainLayout>
  )
}
