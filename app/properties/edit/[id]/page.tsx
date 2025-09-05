"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { profilesApi } from "@/lib/api/profiles-api"
import { Save, X, Info } from "lucide-react"
import PageLayout from "@/components/layouts/PageLayout"
import { logger } from "@/lib/utils/logger"

type PropertyDataType = "string" | "number" | "boolean" | "date"

interface Property {
  id: number
  fieldName: string
  apiName: string
  dataType: PropertyDataType
  defaultValue: string
  description: string
}

// Add these helper functions at the top of the component:
const formatFieldName = (columnName: string): string => {
  return columnName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const simplifyDataType = (dataType: string): PropertyDataType => {
  if (dataType.includes("character varying") || dataType.includes("varchar") || dataType.includes("text")) {
    return "string"
  } else if (dataType.includes("timestamp")) {
    return "date"
  } else if (dataType.includes("uuid")) {
    return "string"
  } else if (dataType.includes("integer") || dataType.includes("bigint")) {
    return "number"
  } else if (dataType.includes("boolean")) {
    return "boolean"
  } else {
    return "string" // Default fallback to string instead of returning the raw dataType
  }
}

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = Number.parseInt(params.id as string)

  // Add loading state to the component:
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Property>({
    id: 0,
    fieldName: "",
    apiName: "",
    dataType: "string",
    defaultValue: "",
    description: "",
  })

  const [originalFieldName, setOriginalFieldName] = useState("")

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true)
        const { data, error } = await profilesApi.getTableSchema()

        if (error) {
          setError(error)
          return
        }

        // Find the property by matching the API name with the ID
        // Since we're using array index as ID, we need to find the actual column
        const property = data?.[propertyId - 1]

        if (property) {
          const transformedProperty: Property = {
            id: propertyId,
            fieldName: formatFieldName(property.column_name),
            apiName: property.column_name,
            dataType: simplifyDataType(property.data_type),
            defaultValue: property.column_default || "",
            description: "", // Schema doesn't include description
          }

          setFormData(transformedProperty)
          setOriginalFieldName(transformedProperty.fieldName)
        } else {
          setError("Property not found")
          router.push("/properties")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch property")
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [propertyId, router])

  // Auto-generate API name when field name changes (only if it's a new property or the field name has changed)
  useEffect(() => {
    if (formData.fieldName && formData.fieldName !== originalFieldName) {
      // Convert to camelCase and remove spaces/special characters
      const apiName = formData.fieldName
        .replace(/[^\w\s]/gi, "") // Remove special characters
        .split(/\s+/) // Split by whitespace
        .map((word, index) => {
          // First word lowercase, subsequent words capitalized
          return index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join("")

      setFormData((prev) => ({ ...prev, apiName }))
    }
  }, [formData.fieldName, originalFieldName])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      // For now, just show success since we can't easily modify existing columns
      logger.debug("Property would be updated:", formData)

      // In a real implementation, you'd call an API to update the column
      // This is complex for existing columns, so we'll just show a message
      alert(
        "Property editing is not yet implemented for existing columns. This would require careful database migration.",
      )

      router.push("/properties")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update property")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/properties")
  }

  return (
    <MainLayout>
      <PageLayout
        title="Edit Property"
        actions={[
          {
            label: "Save",
            onClick: handleSave,
            icon: <Save className="h-4 w-4" />,
          },
          {
            onClick: handleCancel,
            variant: "ghost",
            icon: <X className="h-4 w-4" />,
          },
        ]}
      >
        {error && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <p className="text-destructive mb-4">Error loading property:</p>
              <p className="text-sm text-muted-foreground mb-4 bg-muted/50 p-3 rounded border border-border">{error}</p>
              <Button onClick={() => router.push("/properties")}>Back to Properties</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading property...</p>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="max-w-5xl mx-auto">
          {/* Property Details */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4 text-foreground">Property Details</h3>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fieldName">Field Name</Label>
                <Input
                  id="fieldName"
                  value={formData.fieldName}
                  onChange={(e) => handleChange("fieldName", e.target.value)}
                  placeholder="Enter field name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiName">API Name</Label>
                <Input
                  id="apiName"
                  value={formData.apiName}
                  readOnly
                  className="bg-muted/50 border-border"
                  placeholder="Auto-generated from field name"
                />
                <p className="text-xs text-muted-foreground">API name is automatically generated from the field name</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataType">Data Type</Label>
                <Select value={formData.dataType} onValueChange={(value) => handleChange("dataType", value)}>
                  <SelectTrigger id="dataType">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="defaultValue">Default Value</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[220px] text-sm">
                          This value will be set for this property when a profile is created
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="defaultValue"
                  value={formData.defaultValue}
                  onChange={(e) => handleChange("defaultValue", e.target.value)}
                  placeholder="Enter default value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Add a description for this property"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </MainLayout>
  )
}
