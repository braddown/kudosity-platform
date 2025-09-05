"use client"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenuItem, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { KudosityTableColumn } from "@/components/KudosityTable"
import { Lock, MoreHorizontal, Search, Plus } from "lucide-react"
import { profilesApi } from "@/lib/api/profiles-api"
import { LoadingSection } from "@/components/ui/loading"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { logger } from "@/lib/utils/logger"

type PropertyCategory = "System" | "Contact" | "Custom" | "Scoring"

interface Property {
  id: number
  fieldName: string
  apiName: string
  dataType: string
  defaultValue: string
  category: PropertyCategory
  isSystem?: boolean
  isNullable?: boolean
  isCustomField?: boolean
  description?: string
}

interface CustomField {
  key: string
  label: string
  type: "string" | "number" | "boolean" | "date" | "email" | "phone" | "url" | "textarea"
  required: boolean
  defaultValue?: string
  description?: string
}

interface PropertiesComponentRef {
  handleAddCustomField: () => void
  refreshData: () => void
}

const getPropertyCategory = (columnName: string): PropertyCategory | null => {
  // Fields to exclude (remove from display)
  const excludeFields = ["custom_fields", "duplicate_of_profile_id"] // Hide complex/internal fields from main list
  if (excludeFields.includes(columnName)) return null

  // System fields (internal/metadata) - in specified sort order
  const systemFields = [
    "id", 
    "created_at", 
    "updated_at",
    "last_activity_at",
    "data_retention_date",
    "is_duplicate",
    "merge_status",
    "tags",
    "notification_preferences"
  ]

  // Contact fields (customer-facing information) - in the specified order
  const contactFields = [
    // Basic contact info (required field first)
    "mobile",       // Required field - shown first
    
    // Basic contact info (optional)
    "first_name",
    "last_name", 
    "email",
    "notes",        // Added notes as a core contact field
    
    // Address information (in specified order: address, postcode, city, state, country)
    "address_line_1",
    "address_line_2", 
    "postal_code",  // Moved between address and city as requested
    "city",
    "state",        // Moved below city as requested
    "country",
    
    // Contact properties (preferences and metadata)
    "timezone",
    "language_preferences", 
    "os",
    "device",
    "source",
    "location"
  ]
  
  // Scoring fields (analytics and scoring metrics)
  const scoringFields = [
    "data_quality_score",
    "lead_score",
    "lifecycle_stage",
    "lifetime_value"
  ]

  if (systemFields.includes(columnName)) {
    return "System"
  } else if (contactFields.includes(columnName)) {
    return "Contact"
  } else if (scoringFields.includes(columnName)) {
    return "Scoring"
  } else {
    return "Custom"
  }
}

// Helper function to format field names
const formatFieldName = (columnName: string): string => {
  const specialNames: Record<string, string> = {
    // Address fields
    address_line_1: "Address Line 1",
    address_line_2: "Address Line 2", 
    postal_code: "Postcode/ZIP",
    
    // Customer intelligence
    lifecycle_stage: "Lifecycle Stage",
    lead_score: "Lead Score",
    lifetime_value: "Lifetime Value",
    data_quality_score: "Data Quality Score",
    
    // Profile metadata
    last_activity_at: "Last Activity",
    notification_preferences: "Notification Preferences",
    
    // Deduplication
    is_duplicate: "Is Duplicate",
    duplicate_of_profile_id: "Duplicate Of Profile",
    merge_status: "Merge Status",
    
    // GDPR compliance
    data_retention_date: "Data Retention Date",
    
    // Contact properties
    os: "Operating System",
    language_preferences: "Language Preferences",
    
    // Legacy fields (for backward compatibility)
    custom_fields: "Custom Fields",
  }

  if (specialNames[columnName]) {
    return specialNames[columnName]
  }

  return columnName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Helper function to simplify data types
const simplifyDataType = (dataType: string): string => {
  if (dataType.includes("character varying") || dataType.includes("varchar") || dataType.includes("text")) {
    return "string"
  } else if (dataType.includes("timestamp")) {
    return "timestamp"
  } else if (dataType.includes("uuid")) {
    return "uuid"
  } else if (dataType.includes("integer") || dataType.includes("bigint") || dataType.includes("numeric")) {
    return "number"
  } else if (dataType.includes("boolean")) {
    return "boolean"
  } else if (dataType.includes("jsonb") || dataType.includes("json")) {
    return "json"
  } else if (dataType.includes("ARRAY") || dataType.includes("array") || dataType.includes("[]")) {
    return "array"  // Always return lowercase "array"
  } else {
    return dataType
  }
}

export const PropertiesComponent = forwardRef<PropertiesComponentRef>((props, ref) => {
  const router = useRouter()
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [customFields, setCustomFields] = useState<Record<string, CustomField>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    type: "text",
    required: false,
    defaultValue: "",
    description: "",
  })

  // Add debug logging
  useEffect(() => {
    logger.debug("PropertiesComponent mounted, starting data fetch...")
    fetchTableSchema()
  }, [])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const fetchTableSchema = async () => {
    try {
      setLoading(true)
      setError(null)

      logger.debug("Fetching table schema...")
      const { data, error } = await profilesApi.getTableSchema()

      if (error) {
        logger.warn("Schema fetch error:", error)
        setError("Failed to fetch schema: " + error)
        return
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const transformedProperties: Property[] = []
        let currentId = 1

        // Process regular columns - data is now directly an array
        data.forEach((column) => {
          const category = getPropertyCategory(column.column_name)

          // Skip excluded fields
          if (category === null) return

          const baseProperty: Property = {
            id: currentId++,
            fieldName: formatFieldName(column.column_name),
            apiName: `${category.toLowerCase()}.${column.column_name}`,
            dataType: simplifyDataType(column.data_type),
            defaultValue: "",
            category: category,
            isSystem: ["id", "created_at", "updated_at", "last_login", "performance_metrics"].includes(
              column.column_name,
            ),
            isNullable: column.is_nullable === "YES",
            isCustomField: false,
          }

          transformedProperties.push(baseProperty)
        })

        logger.debug("Base properties:", transformedProperties)
        setProperties(transformedProperties)

        // Now fetch and add custom fields
        await fetchAndMergeCustomFields(transformedProperties)
      } else {
        setError("No schema data returned")
      }
    } catch (err) {
      logger.error("Error processing schema:", err)
      setError(err instanceof Error ? err.message : "Failed to process properties")
    } finally {
      setLoading(false)
    }
  }

  const fetchAndMergeCustomFields = async (baseProperties: Property[]) => {
    try {
      logger.debug("Fetching custom fields schema...")
      const { data, error } = await profilesApi.getCustomFieldsSchema()

      if (data && Object.keys(data).length > 0) {
        logger.debug("Custom fields data:", data)

        // Convert object format to the format expected by this component
        const customFieldsObj: Record<string, CustomField> = {}
        Object.entries(data).forEach(([key, field]: [string, any]) => {
          customFieldsObj[key] = {
            key: key,
            label: field.label || formatFieldName(key),
            type: field.type as CustomField["type"],
            required: field.required || false,
            description: field.description || `Custom ${field.type} field`,
            defaultValue: field.defaultValue,
          }
        })

        setCustomFields(customFieldsObj)

        // Add custom fields to properties list
        const customFieldProperties: Property[] = Object.entries(data).map(([key, field]: [string, any], index) => {
          // Check if this is a scoring field
          const scoringFields = ["data_quality_score", "lead_score", "lifecycle_stage", "lifetime_value"]
          const category = scoringFields.includes(key) ? "Scoring" : "Custom"
          
          return {
            id: 1000 + index, // Use high IDs to avoid conflicts
            fieldName: field.label || formatFieldName(key),
            apiName: `${category.toLowerCase()}.${key}`,
            dataType: field.type,
            defaultValue: field.defaultValue || "",
            category: category as PropertyCategory,
            isSystem: false,
            isNullable: true,
            isCustomField: true,
          }
        })

        logger.debug("Custom field properties:", customFieldProperties)

        // Merge base properties with custom field properties
        const allProperties = [...baseProperties, ...customFieldProperties]
        logger.debug("All properties combined:", allProperties)
        setProperties(allProperties)
      } else if (error) {
        logger.warn("Custom fields fetch error:", error)
        // Still set the base properties even if custom fields fail
        setProperties(baseProperties)
      } else {
        logger.debug("No custom fields found, using base properties only")
        setProperties(baseProperties)
      }
    } catch (err) {
      logger.error("Error fetching custom fields schema:", err)
      // Still set the base properties even if custom fields fail
      setProperties(baseProperties)
    }
  }

  const refreshData = async () => {
    // Refresh both base schema and custom fields
    await fetchTableSchema()
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.apiName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (property: Property) => {
    logger.debug("Editing property:", property) // Debug log

    if (property.isCustomField) {
      // Extract field key from apiName (format: category.field_name)
      const fieldKey = property.apiName.split('.').pop() || property.apiName
      const field = customFields[fieldKey]
      if (field) {
        setFormData({
          key: fieldKey,
          label: field.label,
          type: field.type,
          required: field.required || false,
          defaultValue: field.defaultValue || "",
          description: field.description || "",
        })
        setEditingField(fieldKey)
        setIsModalOpen(true)
      }
    } else {
      // System and Contact properties cannot be edited
      alert("System properties cannot be edited")
    }
  }

  const handleDelete = (id: number) => {
    const property = properties.find((p) => p.id === id)
    
    if (!property) {
      setError("Property not found")
      return
    }

    if (property.isSystem) {
      setError("System properties cannot be deleted")
      return
    }
    
    if (property.isCustomField) {
      // Custom fields can be deleted - they're stored in JSONB
      // Extract field key from apiName (format: category.field_name)
      const fieldKey = property.apiName.split('.').pop() || property.apiName
      handleDeleteCustomField(fieldKey)
    } else {
      // Contact properties are database columns and cannot be deleted
      setError(`Cannot delete "${property.fieldName}" - this is a core database field that profiles depend on`)
    }
  }

  const handleDeleteCustomField = async (fieldKey: string) => {
    const field = customFields[fieldKey]
    if (!field) {
      toast({
        title: "Error",
        description: "Custom field not found",
        variant: "destructive",
      })
      return
    }

    // Prevent deletion of scoring fields
    const scoringFields = ["data_quality_score", "lead_score", "lifecycle_stage", "lifetime_value"]
    if (scoringFields.includes(fieldKey)) {
      toast({
        title: "Cannot Delete Core Field",
        description: `"${field.label}" is a core scoring field and cannot be deleted.`,
        variant: "destructive",
      })
      return
    }

    if (
      !confirm(
        `⚠️  Delete Property: "${field.label}"\n\nThis will permanently remove this field from all profiles and cannot be undone.\n\nAre you sure you want to continue?`,
      )
    ) {
      return
    }

    try {
      logger.debug(`Attempting to delete custom field: ${fieldKey}`)
      
      const result = await profilesApi.deleteCustomField(fieldKey)
      
      logger.debug(`Delete result:`, result)
      
      if (result.error) {
        logger.error(`Delete failed with error: ${result.error}`)
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: `Failed to delete field "${field.label}": ${result.error}`,
        })
        return
      }

      if (result.data) {
        logger.debug(`Delete successful: ${result.data.removedFromProfiles} profiles updated`)
        
        // Immediately update local state
        const updatedFields = { ...customFields }
        delete updatedFields[fieldKey]
        setCustomFields(updatedFields)

        // Remove from properties list immediately
        setProperties((prev) => prev.filter((p) => p.apiName !== `custom_fields.${fieldKey}`))

        // Show success toast
        toast({
          title: "Field Deleted Successfully",
          description: `"${field.label}" has been removed from ${result.data.removedFromProfiles} profiles.`,
          duration: 5000,
        })
        
        // Refresh the data after a delay to ensure database changes are committed
        setTimeout(async () => {
          try {
            logger.debug("Refreshing data after delete operation...")
            await refreshData()
            logger.debug("Data refreshed after delete")
          } catch (refreshErr) {
            logger.warn("Failed to refresh data after delete:", refreshErr)
          }
        }, 1500) // Reduced delay to 1.5 seconds for faster feedback
        
      } else {
        logger.error("Delete returned no data")
        toast({
          variant: "destructive",
          title: "Delete Warning",
          description: "Delete operation completed but no confirmation received",
        })
      }
    } catch (err) {
      logger.error("Exception during delete:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to delete field"
      toast({
        variant: "destructive",
        title: "Delete Error",
        description: `Error deleting field "${field.label}": ${errorMessage}`,
      })
    }
  }

  const handleAddCustomField = () => {
    setFormData({
      key: "",
      label: "",
      type: "text",
      required: false,
      defaultValue: "",
      description: "",
    })
    setEditingField(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const fieldData = {
        key: formData.key,
        label: formData.label,
        type: formData.type,
        required: formData.required,
        defaultValue: formData.defaultValue,
        description: formData.description,
      }

      let result
      if (editingField) {
        result = await profilesApi.updateCustomField(editingField, fieldData)
      } else {
        result = await profilesApi.createCustomField(fieldData)
      }

      if (!result.error) {
        toast({
          title: editingField ? "Property Updated" : "Property Created",
          description: `"${formData.label}" has been ${editingField ? "updated" : "created"} successfully.`,
        })
        setIsModalOpen(false)
        setEditingField(null)
        setFormData({
          key: "",
          label: "",
          type: "text",
          required: false,
          defaultValue: "",
          description: "",
        })
        await refreshData()
      } else {
        toast({
          variant: "destructive",
          title: editingField ? "Update Failed" : "Creation Failed",
          description: result.error,
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
      })
    }
  }

  // Expose the handleAddCustomField function to parent component
  useImperativeHandle(ref, () => ({
    handleAddCustomField,
    refreshData,
  }))

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const getCategoryBadge = (category: PropertyCategory) => {
    switch (category) {
      case "System":
        return (
          <Badge variant="translucent-gray" className="font-medium">
            System
          </Badge>
        )
      case "Contact":
        return (
          <Badge variant="translucent-blue" className="font-medium">
            Contact
          </Badge>
        )
      case "Scoring":
        return (
          <Badge variant="translucent-purple" className="font-medium">
            Scoring
          </Badge>
        )
      case "Custom":
        return (
          <Badge variant="translucent-green" className="font-medium">
            Custom
          </Badge>
        )
      default:
        return null
    }
  }



  const columns: KudosityTableColumn<Property>[] = [
    {
      header: "Field Name",
      accessorKey: "fieldName",
      cell: (row) => (
        <div className="font-medium flex items-center text-foreground">
          {row.fieldName}
          {row.apiName === "mobile" && <span className="ml-2 text-xs text-primary">📱 Primary</span>}
        </div>
      ),
      width: "200px",
    },
    {
      header: "API Name",
      accessorKey: "apiName",
      cell: (row) => <code className="text-sm bg-muted px-1 py-0.5 rounded text-foreground">{row.apiName}</code>,
      width: "200px",
    },
    {
      header: "Type",
      accessorKey: "dataType",
      width: "150px",
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (row) => getCategoryBadge(row.category),
      width: "120px",
    },
    {
      header: "Default Value",
      accessorKey: "defaultValue",
      cell: (row) => {
        let displayValue = row.defaultValue

        // Handle different types of default values
        if (displayValue === null || displayValue === undefined || displayValue === "") {
          // For numeric types, show 0 as default instead of NULL
          const numericTypes = ["integer", "numeric", "number", "bigint", "decimal", "float", "double precision"]
          if (numericTypes.includes(row.dataType.toLowerCase())) {
            displayValue = "0"
          } else {
            displayValue = row.isNullable ? "NULL" : "Required"
          }
        } else if (typeof displayValue === "object") {
          displayValue = JSON.stringify(displayValue)
        } else {
          displayValue = String(displayValue)
        }

        return <span className="text-sm text-muted-foreground">{displayValue}</span>
      },
      width: "150px",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row) => (
        <div className="flex justify-center">
          {row.category === "System" ? (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">System</span>
            </div>
          ) : row.category === "Scoring" ? (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Core Field</span>
            </div>
          ) : row.category === "Contact" ? (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Core Field</span>
            </div>
          ) : row.category === "Custom" && row.isCustomField ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => handleEdit(row)} className="hover:bg-accent text-foreground">
                  Edit Property
                </DropdownMenuItem>
                {row.isCustomField && (
                  <DropdownMenuItem
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Delete Property
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Protected</span>
            </div>
          )}
        </div>
      ),
      width: "120px",
    },
  ]

  const categoryOrder: Record<PropertyCategory, number> = {
    Contact: 1,
    Scoring: 2,
    Custom: 3,
    System: 4,
  }

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    // First sort by category
    if (categoryOrder[a.category] !== categoryOrder[b.category]) {
      return categoryOrder[a.category] - categoryOrder[b.category]
    }

    // Within Contact category, maintain the specified order
    if (a.category === "Contact" && b.category === "Contact") {
      const contactFieldsOrder = [
        "mobile", "first_name", "last_name", "email", "notes",
        "address_line_1", "address_line_2", "city", "state", "postal_code", "country"
      ]
      
      // Extract field name from apiName (format: category.field_name)
      const aFieldName = a.apiName.split('.').pop() || a.apiName
      const bFieldName = b.apiName.split('.').pop() || b.apiName
      
      const aIndex = contactFieldsOrder.indexOf(aFieldName)
      const bIndex = contactFieldsOrder.indexOf(bFieldName)
      
      // If both fields are in our defined order, use that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the defined order, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
    }
    
    // Within System category, maintain the specified order
    if (a.category === "System" && b.category === "System") {
      const systemFieldsOrder = [
        "id", "created_at", "updated_at", "last_activity_at",
        "data_retention_date", "is_duplicate", "merge_status", 
        "tags", "notification_preferences"
      ]
      
      // Extract field name from apiName (format: category.field_name)
      const aFieldName = a.apiName.split('.').pop() || a.apiName
      const bFieldName = b.apiName.split('.').pop() || b.apiName
      
      const aIndex = systemFieldsOrder.indexOf(aFieldName)
      const bIndex = systemFieldsOrder.indexOf(bFieldName)
      
      // If both fields are in our defined order, use that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the defined order, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
    }
    
    // Within Scoring category, maintain alphabetical order
    if (a.category === "Scoring" && b.category === "Scoring") {
      const scoringFieldsOrder = [
        "data_quality_score", "lead_score", "lifecycle_stage", "lifetime_value"
      ]
      
      const aIndex = scoringFieldsOrder.indexOf(a.apiName)
      const bIndex = scoringFieldsOrder.indexOf(b.apiName)
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
    }

    // Default sort by field name for other categories
    return a.fieldName.localeCompare(b.fieldName)
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProperties = sortedProperties.slice(startIndex, endIndex)
  const pageCount = Math.ceil(sortedProperties.length / itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSection message="Loading properties from profiles table..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">Error loading properties:</p>
          <p className="text-sm text-muted-foreground mb-4 bg-muted p-3 rounded">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="w-full bg-card rounded-lg shadow-sm border border-border">
        {/* Table Controls */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-card-foreground">Profile Properties</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-[250px] h-10 bg-background border-border"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border hover:bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.accessorKey as string}
                    style={{ width: column.width }}
                    className="bg-muted/50 font-medium text-foreground text-left p-4"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProperties.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-muted-foreground p-4">
                    No results found.
                  </td>
                </tr>
              ) : (
                paginatedProperties.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border hover:bg-muted/50 ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                  >
                    {columns.map((column) => (
                      <td key={column.accessorKey as string} className="bg-card p-4">
                        {column.cell
                          ? column.cell(row)
                          : column.accessorKey
                            ? (() => {
                                const value = row[column.accessorKey]
                                if (value === null || value === undefined) {
                                  return ""
                                }
                                if (typeof value === "object") {
                                  return JSON.stringify(value)
                                }
                                return String(value)
                              })()
                            : ""}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 p-6 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-accent">
                  {itemsPerPage} per page
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card border-border">
                {[10, 25, 50, 100].map((count) => (
                  <DropdownMenuItem
                    key={count}
                    onClick={() => setItemsPerPage(count)}
                    className="hover:bg-accent text-foreground"
                  >
                    {count} per page
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-card-foreground ml-4">
              Showing {Math.min(startIndex + 1, sortedProperties.length)} to{" "}
              {Math.min(endIndex, sortedProperties.length)} of {sortedProperties.length} properties
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="hover:bg-accent"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              let pageNum = currentPage
              if (pageCount <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= pageCount - 2) {
                pageNum = pageCount - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 ${currentPage === pageNum ? "" : "hover:bg-accent"}`}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage === pageCount}
              className="hover:bg-accent"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Property Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Property" : "Add Property"}</DialogTitle>
            <DialogDescription>
              {editingField
                ? "Update the property definition. Changes will apply to all profiles."
                : "Create a new property that will be available across all profiles."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Property Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., company_size"
                disabled={!!editingField}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Display Name</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Company Size"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Field Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this field"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="required">Required field</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingField ? "Update Property" : "Create Property"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
})

PropertiesComponent.displayName = "PropertiesComponent"

export default PropertiesComponent
