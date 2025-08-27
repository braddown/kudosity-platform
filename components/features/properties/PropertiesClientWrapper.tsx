"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { profilesApi } from "@/lib/api/profiles-api"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import CustomFieldsManager from "./CustomFieldsManager"

type PropertyCategory = "System" | "Contact" | "Custom"

interface Property {
  id: number | string
  fieldName: string
  apiName: string
  dataType: string
  defaultValue: string
  category: PropertyCategory
  isSystem?: boolean
  isNullable?: boolean
}

// Helper function to determine property category
const getPropertyCategory = (columnName: string): PropertyCategory => {
  const systemFields = ["id", "created_at", "updated_at"]
  const contactFields = ["first_name", "last_name", "email", "mobile", "role", "status", "last_login", "teams"]

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
  } else if (dataType.includes("integer") || dataType.includes("bigint")) {
    return "number"
  } else if (dataType.includes("boolean")) {
    return "boolean"
  } else {
    return dataType
  }
}

export default function PropertiesClientWrapper() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [customFields, setCustomFields] = useState<any>({})
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false)

  const fetchTableSchema = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await profilesApi.getTableSchema()

      if (error) {
        console.warn("Schema fetch error, using fallback:", error)
      }

      if (data) {
        const transformedProperties: Property[] = data.map((column, index) => ({
          id: index + 1,
          fieldName: formatFieldName(column.column_name),
          apiName: column.column_name,
          dataType: simplifyDataType(column.data_type),
          defaultValue: column.column_default || "",
          category: getPropertyCategory(column.column_name),
          isSystem: ["id", "created_at", "updated_at"].includes(column.column_name),
          isNullable: column.is_nullable === "YES",
        }))

        setProperties(transformedProperties)
      }
    } catch (err) {
      console.error("Error fetching table schema:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch properties")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomFieldsSchema = async () => {
    try {
      const { data, error } = await profilesApi.getCustomFieldsSchema()
      if (data) {
        setCustomFields(data)
      }
    } catch (err) {
      console.error("Error fetching custom fields schema:", err)
    }
  }

  useEffect(() => {
    fetchTableSchema()
    fetchCustomFieldsSchema()
  }, [])

  const filteredProperties = properties.filter(
    (property) =>
      property.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.apiName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (property: Property) => {
    if (!property.isSystem) {
      router.push(`/properties/edit/${property.id}`)
    }
  }

  const handleDelete = (id: number | string) => {
    const propertyToDelete = properties.find((property) => property.id === id)
    if (propertyToDelete && !propertyToDelete.isSystem) {
      setProperties(properties.filter((property) => property.id !== id))
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const getCategoryBadge = (category: PropertyCategory) => {
    switch (category) {
      case "System":
        return <Badge variant="translucent-gray">System</Badge>
      case "Contact":
        return <Badge variant="translucent-blue">Contact</Badge>
      case "Custom":
        return <Badge variant="translucent-green">Custom</Badge>
      default:
        return null
    }
  }

  const columns = [
    {
      id: "fieldName",
      header: "Field Name",
      accessorKey: "fieldName" as keyof Property,
      cell: (row: Property) => (
        <div className="font-medium">
          {row.fieldName}
          {row.apiName === "mobile" && <span className="ml-2 text-xs text-blue-600">📱 Primary</span>}
          {row.category === "Custom" && <span className="ml-2 text-xs text-green-600">✨ Custom</span>}
        </div>
      ),
      width: "200px",
      sortable: true,
    },
    {
      id: "apiName",
      header: "API Name",
      accessorKey: "apiName" as keyof Property,
      cell: (row: Property) => <code className="text-sm bg-gray-100 px-1 py-0.5 rounded">{row.apiName}</code>,
      width: "200px",
      sortable: true,
    },
    {
      id: "dataType",
      header: "Type",
      accessorKey: "dataType" as keyof Property,
      width: "150px",
      sortable: true,
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category" as keyof Property,
      cell: (row: Property) => getCategoryBadge(row.category),
      width: "120px",
      sortable: true,
    },
    {
      id: "defaultValue",
      header: "Default Value",
      accessorKey: "defaultValue" as keyof Property,
      cell: (row: Property) => (
        <span className="text-sm text-gray-600">{row.defaultValue || (row.isNullable ? "NULL" : "Required")}</span>
      ),
      width: "150px",
    },
  ]

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    // Put mobile first in Contact category
    if (a.category === "Contact" && b.category === "Contact") {
      if (a.apiName === "mobile") return -1
      if (b.apiName === "mobile") return 1
    }

    const categoryOrder = { Contact: 1, Custom: 2, System: 3 }
    return categoryOrder[a.category] - categoryOrder[b.category]
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProperties = sortedProperties.slice(startIndex, endIndex)
  const pageCount = Math.ceil(sortedProperties.length / itemsPerPage)

  const actions = [
    {
      label: "Refresh Schema",
      onClick: fetchTableSchema,
    },
    {
      label: "Add Custom Property",
      onClick: () => router.push("/properties/new"),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading properties from profiles table...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">Error loading properties:</p>
          <p className="text-sm text-gray-600 mb-4 bg-gray-100 p-3 rounded">{error}</p>
          <button onClick={() => window.location.reload()} className="text-blue-600">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DataTable
        data={paginatedProperties}
        columns={columns}
        searchPlaceholder="Search properties..."
        onSearch={handleSearch}
        selectable={false}
        actions={actions}
        pagination={{
          currentPage,
          totalPages: pageCount,
          pageSize: itemsPerPage,
          totalItems: sortedProperties.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: setItemsPerPage,
        }}
      />

      {/* Custom Fields Section */}
      <div className="bg-white border rounded-md mt-6">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Custom Fields Schema</h3>
            <p className="text-sm text-gray-600">Manage custom fields that appear across all profiles</p>
          </div>
          <Button onClick={() => setShowCustomFieldsModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>
        </div>
        <CustomFieldsManager
          customFields={customFields}
          onUpdate={setCustomFields}
          onRefresh={fetchCustomFieldsSchema}
        />
      </div>
    </div>
  )
}
