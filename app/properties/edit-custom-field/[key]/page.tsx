"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  X,
  Loader2,
  AlertTriangle,
  Check,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Mail,
  Phone,
  Link,
  Save,
} from "lucide-react"
import MainLayout from "@/components/MainLayout"
import { profilesApi } from "@/lib/api/profiles-api"
import { usePageHeader } from "@/components/PageHeaderContext"

interface CustomField {
  key: string
  label: string
  type: "string" | "number" | "boolean" | "date" | "email" | "phone" | "url" | "textarea"
  required: boolean
  defaultValue?: string
  description?: string
}

const fieldTypeOptions = [
  { value: "string", label: "Text (Short)", icon: Type, description: "Single line text up to 255 characters" },
  { value: "textarea", label: "Text (Long)", icon: Type, description: "Multi-line text for longer content" },
  { value: "number", label: "Number", icon: Hash, description: "Numeric values (integers or decimals)" },
  { value: "boolean", label: "True/False", icon: ToggleLeft, description: "Yes/No or True/False values" },
  { value: "date", label: "Date", icon: Calendar, description: "Date picker (YYYY-MM-DD format)" },
  { value: "email", label: "Email Address", icon: Mail, description: "Email format validation" },
  { value: "phone", label: "Phone Number", icon: Phone, description: "Phone number format" },
  { value: "url", label: "Website URL", icon: Link, description: "Web address format validation" },
]

export default function EditCustomFieldPage() {
  const router = useRouter()
  const params = useParams()
  const fieldKey = params.key as string
  const { setPageHeader } = usePageHeader()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<CustomField>({
    key: "",
    label: "",
    type: "string",
    required: false,
    defaultValue: "",
    description: "",
  })

  const [originalKey, setOriginalKey] = useState("")

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Edit Custom Field",
      actions: [
        {
          label: saving ? "Saving..." : "Save Changes",
          onClick: handleSave,
          icon: <Save className="h-4 w-4" />,
        },
        {
          onClick: handleCancel,
          variant: "ghost",
          icon: <X className="h-4 w-4" />,
        },
      ],
    })
  }, [setPageHeader, saving, formData.label])

  useEffect(() => {
    const fetchCustomField = async () => {
      try {
        setLoading(true)
        const { data, error } = await profilesApi.getCustomFieldsSchema()

        if (error) {
          setError(error)
          return
        }

        const field = data?.[fieldKey]
        if (field) {
          setFormData({
            ...field,
            defaultValue: field.defaultValue || "",
            description: field.description || "",
          })
          setOriginalKey(field.key)
        } else {
          setError("Custom field not found")
          router.push("/properties")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch custom field")
      } finally {
        setLoading(false)
      }
    }

    if (fieldKey) {
      fetchCustomField()
    }
  }, [fieldKey, router])

  const handleSave = async () => {
    if (!formData.label || !formData.key) {
      setError("Field label and key are required")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await profilesApi.updateCustomField(originalKey, formData)

      if (!result.error) {
        setSuccess("Custom field updated successfully!")
        setTimeout(() => {
          router.push("/properties")
        }, 1500)
      } else {
        setError(result.error || "Failed to update custom field")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push("/properties")
  }

  const getDefaultValuePlaceholder = () => {
    switch (formData.type) {
      case "boolean":
        return "true or false"
      case "number":
        return "0"
      case "date":
        return "YYYY-MM-DD"
      case "email":
        return "example@domain.com"
      case "phone":
        return "+1 234 567 8900"
      case "url":
        return "https://example.com"
      default:
        return "Optional default value"
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading custom field...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the field name, type, and key identifier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Field Label *</Label>
                  <Input
                    id="label"
                    value={formData.label || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., Company Size, Industry"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key">Field Key *</Label>
                  <Input
                    id="key"
                    value={formData.key || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                    placeholder="field_key"
                    className="font-mono text-sm"
                    disabled={fieldKey === "lifetime_value"}
                  />
                  {fieldKey === "lifetime_value" && (
                    <p className="text-xs text-amber-600">Protected field - key cannot be changed</p>
                  )}
                </div>
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
                    {fieldTypeOptions.map((option) => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <IconComponent className="h-4 w-4 mr-2" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
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
                  placeholder={getDefaultValuePlaceholder()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of what this field is used for"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Field requirements and options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="required" className="text-base">
                    Required Field
                  </Label>
                  <p className="text-sm text-muted-foreground">Must have a value</p>
                </div>
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, required: checked }))}
                />
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Label:</span>
                    <span>{formData.label || "Field Label"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{fieldTypeOptions.find((opt) => opt.value === formData.type)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Required:</span>
                    <span>{formData.required ? "Yes" : "No"}</span>
                  </div>
                  {formData.key && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground text-xs">API Key:</span>
                      <code className="block mt-1 text-xs bg-muted px-2 py-1 rounded font-mono">
                        custom_fields.{formData.key}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
