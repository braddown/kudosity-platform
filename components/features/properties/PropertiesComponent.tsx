"use client"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenuItem, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { KudosityTableColumn } from "@/components/KudosityTable"
import { Lock, MoreHorizontal, Search, Loader2 } from "lucide-react"
import { profilesApi } from "@/api/profiles-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, AlertTriangle } from "lucide-react"

type PropertyCategory = "System" | "Contact" | "Custom"

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
  const excludeFields = ["avatar_url", "custom_fields", "lifetime_value"] // Hide custom_fields and lifetime_value from main list
  if (excludeFields.includes(columnName)) return null

  // System fields
  const systemFields = ["id", "created_at", "updated_at", "last_login", "performance_metrics"]

  // Contact fields (updated list)
  const contactFields = [
    "first_name",
    "last_name",
    "email",
    "mobile",
    "phone",
    "role",
    "status",
    "teams",
    "timezone",
    "language_preferences",
    "notification_preferences",
    "state",
    "country",
    "device",
    "os",
    "location",
    "source",
    "tags",
  ]

  if (systemFields.includes(columnName)) {
    return "System"
  } else if (contactFields.includes(columnName)) {
    return "Contact"
  } else {
    return "Custom"
  }
}

// Helper function to format field names
const formatFieldName = (columnName: string): string => {
  const specialNames: Record<string, string> = {
    last_login: "Last Login",
    performance_metrics: "Performance Metrics",
    timezone: "Timezone",
    language_preferences: "Language Preferences",
    notification_preferences: "Notification Preferences",
    lifetime_value: "Lifetime Value",
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
  } else if (dataType.includes("array") || dataType.includes("[]")) {
    return "array"
  } else {
    return dataType
  }
}

export const PropertiesComponent = forwardRef<PropertiesComponentRef>((props, ref) => {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [customFields, setCustomFields] = useState<Record<string, CustomField>>({})

  // Add debug logging
  useEffect(() => {
    console.log("PropertiesComponent mounted, starting data fetch...")
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

      console.log("Fetching table schema...")
      const { data, error } = await profilesApi.getTableSchema()

      if (error) {
        console.warn("Schema fetch error:", error)
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
            apiName: column.column_name,
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

        console.log("Base properties:", transformedProperties)
        setProperties(transformedProperties)

        // Now fetch and add custom fields
        await fetchAndMergeCustomFields(transformedProperties)
      } else {
        setError("No schema data returned")
      }
    } catch (err) {
      console.error("Error processing schema:", err)
      setError(err instanceof Error ? err.message : "Failed to process properties")
    } finally {
      setLoading(false)
    }
  }

  const fetchAndMergeCustomFields = async (baseProperties: Property[]) => {
    try {
      console.log("Fetching custom fields schema...")
      const { data, error } = await profilesApi.getCustomFieldsSchema()

      if (data && Object.keys(data).length > 0) {
        console.log("Custom fields data:", data)

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
        const customFieldProperties: Property[] = Object.entries(data).map(([key, field]: [string, any], index) => ({
          id: 1000 + index, // Use high IDs to avoid conflicts
          fieldName: field.label || formatFieldName(key),
          apiName: `custom_fields.${key}`,
          dataType: field.type,
          defaultValue: field.defaultValue || "",
          category: "Custom" as PropertyCategory,
          isSystem: false,
          isNullable: true,
          isCustomField: true,
          description: field.description || `Custom ${field.type} field`,
        }))

        console.log("Custom field properties:", customFieldProperties)

        // Merge base properties with custom field properties
        const allProperties = [...baseProperties, ...customFieldProperties]
        console.log("All properties combined:", allProperties)
        setProperties(allProperties)
      } else if (error) {
        console.warn("Custom fields fetch error:", error)
        // Still set the base properties even if custom fields fail
        setProperties(baseProperties)
      } else {
        console.log("No custom fields found, using base properties only")
        setProperties(baseProperties)
      }
    } catch (err) {
      console.error("Error fetching custom fields schema:", err)
      // Still set the base properties even if custom fields fail
      setProperties(baseProperties)
    }
  }

  const refreshData = async () => {
    await fetchTableSchema()
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.apiName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (property: Property) => {
    console.log("Editing property:", property) // Debug log

    if (property.isCustomField) {
      const fieldKey = property.apiName.replace("custom_fields.", "")
      router.push(`/properties/edit-custom-field/${fieldKey}`)
    } else if (!property.isSystem) {
      // For regular properties, navigate to the property edit page
      router.push(`/properties/edit/${property.id}`)
    } else {
      // System properties cannot be edited
      alert("System properties cannot be edited")
    }
  }

  const handleDelete = (id: number) => {
    const property = properties.find((p) => p.id === id)
    if (property && property.isCustomField) {
      const fieldKey = property.apiName.replace("custom_fields.", "")
      handleDeleteCustomField(fieldKey)
    } else if (property && !property.isSystem) {
      setProperties(properties.filter((property) => property.id !== id))
    }
  }

  const handleDeleteCustomField = async (fieldKey: string) => {
    const field = customFields[fieldKey]
    if (!field) return

    if (
      !confirm(
        `Are you sure you want to delete the "${field.label}" field? This will remove the field from all profiles.`,
      )
    ) {
      return
    }

    try {
      const result = await profilesApi.deleteCustomField(fieldKey)
      if (!result.error) {
        const updatedFields = { ...customFields }
        delete updatedFields[fieldKey]
        setCustomFields(updatedFields)

        // Remove from properties list
        setProperties((prev) => prev.filter((p) => p.apiName !== `custom_fields.${fieldKey}`))

        setSuccess(`Field "${field.label}" deleted successfully`)
        setTimeout(() => setSuccess(null), 3000)

        // Refresh the data to ensure consistency
        await refreshData()
      } else {
        setError(result.error || "Failed to delete field")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete field")
    }
  }

  const handleAddCustomField = () => {
    router.push("/properties/new")
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

  const handleViewDetails = (property: Property) => {
    // Show property details in a modal or navigate to details page
    alert(
      `Property Details:\n\nField: ${property.fieldName}\nAPI Name: ${property.apiName}\nType: ${property.dataType}\nCategory: ${property.category}\nNullable: ${property.isNullable ? "Yes" : "No"}`,
    )
  }

  const columns: KudosityTableColumn<Property>[] = [
    {
      header: "Field Name",
      accessorKey: "fieldName",
      cell: (row) => (
        <div className="font-medium flex items-center text-foreground">
          {row.fieldName}
          {row.apiName === "mobile" && <span className="ml-2 text-xs text-primary">📱 Primary</span>}
          {row.dataType === "json" && (
            <span
              className="ml-2 text-xs text-orange-600 dark:text-orange-400"
              title="JSON object with nested properties"
            >
              📄 JSON
            </span>
          )}
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
          displayValue = row.isNullable ? "NULL" : "Required"
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
          {row.isSystem ? (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">System</span>
            </div>
          ) : (
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
                <DropdownMenuItem onClick={() => handleViewDetails(row)} className="hover:bg-accent text-foreground">
                  View Details
                </DropdownMenuItem>
                {!row.isCustomField && (
                  <DropdownMenuItem
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
      width: "120px",
    },
  ]

  const categoryOrder: Record<PropertyCategory, number> = {
    Contact: 1,
    Custom: 2,
    System: 3,
  }

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    // First sort by category
    if (categoryOrder[a.category] !== categoryOrder[b.category]) {
      return categoryOrder[a.category] - categoryOrder[b.category]
    }

    // Within Contact category, put mobile first
    if (a.category === "Contact" && b.category === "Contact") {
      if (a.apiName === "mobile") return -1
      if (b.apiName === "mobile") return 1
    }

    // Default sort by field name
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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading properties from profiles table...</p>
        </div>
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
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
    </div>
  )
})

PropertiesComponent.displayName = "PropertiesComponent"

export default PropertiesComponent
