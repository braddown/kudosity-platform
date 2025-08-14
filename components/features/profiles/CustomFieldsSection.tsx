"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Settings2 } from "lucide-react"

interface CustomFieldsSchema {
  [key: string]: {
    label?: string
    type?: 'text' | 'number' | 'boolean' | 'textarea'
    description?: string
    defaultValue?: any
  }
}

interface CustomFieldsSectionProps {
  profile: any
  customFieldsSchema: CustomFieldsSchema
  onCustomFieldChange: (fieldKey: string, value: any) => void
}

/**
 * CustomFieldsSection - Component for rendering dynamic custom fields
 * 
 * @param profile - The current profile data
 * @param customFieldsSchema - Schema defining the available custom fields
 * @param onCustomFieldChange - Handler for custom field changes
 * 
 * @example
 * ```tsx
 * <CustomFieldsSection
 *   profile={currentProfile}
 *   customFieldsSchema={schema}
 *   onCustomFieldChange={handleCustomFieldChange}
 * />
 * ```
 */
export function CustomFieldsSection({
  profile,
  customFieldsSchema,
  onCustomFieldChange
}: CustomFieldsSectionProps) {
  const hasCustomFields = Object.keys(customFieldsSchema).length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium text-foreground">
          <Settings2 className="h-4 w-4 text-green-500" />
          Custom Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasCustomFields ? (
          <div className="space-y-4">
            {Object.entries(customFieldsSchema).map(([key, fieldSchema]) => {
              const currentValue = profile.custom_fields?.[key] ?? fieldSchema.defaultValue ?? ""

              return (
                <CustomFieldInput
                  key={key}
                  fieldKey={key}
                  fieldSchema={fieldSchema}
                  value={currentValue}
                  onChange={onCustomFieldChange}
                />
              )
            })}
          </div>
        ) : (
          <CustomFieldsEmptyState />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * CustomFieldInput - Individual custom field input component
 */
interface CustomFieldInputProps {
  fieldKey: string
  fieldSchema: CustomFieldsSchema[string]
  value: any
  onChange: (fieldKey: string, value: any) => void
}

function CustomFieldInput({
  fieldKey,
  fieldSchema,
  value,
  onChange
}: CustomFieldInputProps) {
  const fieldId = `custom_${fieldKey}`
  const fieldLabel = fieldSchema.label || fieldKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  const placeholder = fieldSchema.description || `Enter ${fieldSchema.label || fieldKey}`

  const renderInput = () => {
    switch (fieldSchema.type) {
      case "number":
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => onChange(fieldKey, Number.parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
          />
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(fieldKey, checked)}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor={fieldId} className="text-sm text-gray-600">
              {fieldSchema.description || `Enable ${fieldSchema.label || fieldKey}`}
            </Label>
          </div>
        )

      case "textarea":
        return (
          <Textarea
            id={fieldId}
            value={String(value)}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={placeholder}
            rows={4}
          />
        )

      default:
        return (
          <Input
            id={fieldId}
            value={String(value)}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={placeholder}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {fieldLabel}
      </Label>
      
      {renderInput()}

      {fieldSchema.description && (
        <p className="text-xs text-gray-500">{fieldSchema.description}</p>
      )}
    </div>
  )
}

/**
 * CustomFieldsEmptyState - Empty state when no custom fields are defined
 */
function CustomFieldsEmptyState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <p>No custom fields have been created yet.</p>
      <p className="text-sm mt-2">Go to Properties to create custom fields that will appear here.</p>
    </div>
  )
}