"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Mail,
  Phone,
  Link,
  AlertTriangle,
  Check,
} from "lucide-react"
import { profilesApi } from "@/api/profiles-api"

interface CustomField {
  key: string
  label: string
  type: "string" | "number" | "boolean" | "date" | "email" | "phone" | "url" | "textarea"
  required: boolean
  defaultValue?: string
  description?: string
  options?: string[] // For select/radio fields in future
}

interface CustomFieldsManagerProps {
  customFields: Record<string, CustomField>
  onUpdate: (fields: Record<string, CustomField>) => void
  onRefresh: () => void
}

const fieldTypeIcons = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  email: Mail,
  phone: Phone,
  url: Link,
  textarea: Type,
}

const fieldTypeLabels = {
  string: "Text (Short)",
  number: "Number",
  boolean: "True/False",
  date: "Date",
  email: "Email",
  phone: "Phone",
  url: "URL",
  textarea: "Text (Long)",
}

export function CustomFieldsManager({ customFields, onUpdate, onRefresh }: CustomFieldsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<CustomField>>({
    key: "",
    label: "",
    type: "string",
    required: false,
    defaultValue: "",
    description: "",
  })

  const resetForm = () => {
    setFormData({
      key: "",
      label: "",
      type: "string",
      required: false,
      defaultValue: "",
      description: "",
    })
    setEditingField(null)
    setError(null)
    setSuccess(null)
  }

  const handleAddField = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleEditField = (fieldKey: string) => {
    const field = customFields[fieldKey]
    if (field) {
      setFormData(field)
      setEditingField(fieldKey)
      setIsAddModalOpen(true)
    }
  }

  const handleDeleteField = async (fieldKey: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the "${customFields[fieldKey]?.label}" field? This will remove the field from all profiles.`,
      )
    ) {
      return
    }

    try {
      setLoading(true)
      const result = await profilesApi.deleteCustomField(fieldKey)

      if (!result.error) {
        const updatedFields = { ...customFields }
        delete updatedFields[fieldKey]
        onUpdate(updatedFields)
        setSuccess(`Field "${customFields[fieldKey]?.label}" deleted successfully`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to delete field")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete field")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.key || !formData.label) {
      setError("Key and label are required")
      return
    }

    // Generate key from label if not provided
    const fieldKey =
      formData.key ||
      formData
        .label!.toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^[0-9]/, "_$&")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")

    try {
      setLoading(true)
      setError(null)

      const fieldData: CustomField = {
        key: fieldKey,
        label: formData.label!,
        type: formData.type!,
        required: formData.required!,
        defaultValue: formData.defaultValue,
        description: formData.description,
      }

      const result = editingField
        ? await profilesApi.updateCustomField(editingField, fieldData)
        : await profilesApi.createCustomField(fieldData)

      if (!result.error) {
        const updatedFields = { ...customFields }
        if (editingField && editingField !== fieldKey) {
          // If key changed, remove old key
          delete updatedFields[editingField]
        }
        updatedFields[fieldKey] = fieldData
        onUpdate(updatedFields)

        setSuccess(editingField ? "Field updated successfully" : "Field added successfully")
        setIsAddModalOpen(false)
        resetForm()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to save field")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save field")
    } finally {
      setLoading(false)
    }
  }

  const generateKeyFromLabel = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^[0-9]/, "_$&")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  }

  const handleLabelChange = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      label,
      key: !editingField ? generateKeyFromLabel(label) : prev.key,
    }))
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Custom Fields List */}
      <div className="grid gap-4">
        {Object.entries(customFields).length === 0 ? (
          <div className="text-center py-8">
            <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom fields defined</h3>
            <p className="text-gray-600 mb-4">Create custom fields that will appear across all profiles</p>
            <Button onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Custom Field
            </Button>
          </div>
        ) : (
          Object.entries(customFields).map(([key, field]) => {
            const IconComponent = fieldTypeIcons[field.type]
            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{field.label}</CardTitle>
                        <CardDescription>
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded mr-2">
                            custom_fields.{field.key}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {fieldTypeLabels[field.type]}
                          </Badge>
                          {field.required && (
                            <Badge variant="outline" className="text-xs ml-1 text-red-600 border-red-200">
                              Required
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditField(key)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteField(key)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                {(field.description || field.defaultValue) && (
                  <CardContent className="pt-0">
                    {field.description && <p className="text-sm text-gray-600 mb-2">{field.description}</p>}
                    {field.defaultValue && (
                      <p className="text-xs text-gray-500">
                        Default: <code className="bg-gray-100 px-1 py-0.5 rounded">{field.defaultValue}</code>
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Add/Edit Field Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Custom Field" : "Add Custom Field"}</DialogTitle>
            <DialogDescription>
              {editingField
                ? "Update the custom field definition. Changes will apply to all profiles."
                : "Create a new custom field that will be available across all profiles."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Field Label *</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., Company Size, Industry, Preferences"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Field Key</Label>
              <Input
                id="key"
                value={formData.key || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="Auto-generated from label"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">Used in API calls: custom_fields.{formData.key || "field_key"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Field Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fieldTypeLabels).map(([value, label]) => {
                    const IconComponent = fieldTypeIcons[value as keyof typeof fieldTypeIcons]
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center">
                          <IconComponent className="h-4 w-4 mr-2" />
                          {label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                value={formData.defaultValue || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, defaultValue: e.target.value }))}
                placeholder={
                  formData.type === "boolean"
                    ? "true or false"
                    : formData.type === "number"
                      ? "0"
                      : "Optional default value"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of what this field is used for"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, required: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="required" className="text-sm">
                Required field (must have a value for all profiles)
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingField ? "Update Field" : "Add Field"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomFieldsManager
