"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import type { FilterCondition, FilterGroup } from "./Contacts"
import { profilesApi } from "@/lib/profiles-api"

interface ProfileFilterBuilderProps {
  onFilterChange: (filters: FilterGroup[]) => void
  initialFilters?: FilterGroup[]
}

// Base profile fields (non-custom)
const baseProfileFields = [
  // Core Identity
  "id",
  "first_name",
  "last_name",
  "email",
  "mobile",
  "mobile_number",
  "phone",

  // Location & Demographics
  "postcode",
  "suburb",
  "state",
  "timezone",
  "country",
  "location",
  "language_preferences",

  // Device & Technical
  "device",
  "os",
  "source",
  "avatar_url",

  // Status & Permissions
  "status",
  "role",
  "teams",
  "is_suppressed",
  "is_transactional",
  "is_high_value",
  "is_subscribed",
  "is_marketing",

  // Purchase & Engagement Data
  "last_purchase_date",
  "total_purchases",
  "lifetime_value",
  "loyalty_points",
  "preferred_category",
  "total_spent",
  "customer_since",

  // Timestamps
  "created_at",
  "updated_at",
  "last_login",

  // Complex Fields
  "tags",
  "notification_preferences",
  "performance_metrics",
]

// Operators for different field types
const operators = {
  string: ["contains", "is", "is not", "starts with", "ends with", "is empty", "is not empty"],
  number: [
    "equals",
    "greater than",
    "less than",
    "greater than or equal to",
    "less than or equal to",
    "is empty",
    "is not empty",
  ],
  date: ["is", "is before", "is after", "is on or before", "is on or after", "is empty", "is not empty"],
  boolean: ["is", "is not"],
  array: ["contains", "does not contain", "is empty", "is not empty"],
  json: ["contains key", "does not contain key", "is empty", "is not empty"],
}

// Determine field type based on field name
const getFieldType = (field: string): "string" | "number" | "date" | "boolean" | "array" | "json" => {
  // Number fields
  if (["total_purchases", "lifetime_value", "loyalty_points", "total_spent"].includes(field)) {
    return "number"
  }

  // Date fields
  if (["created_at", "updated_at", "last_purchase_date", "last_login", "customer_since"].includes(field)) {
    return "date"
  }

  // Boolean fields
  if (["is_suppressed", "is_transactional", "is_high_value", "is_subscribed", "is_marketing"].includes(field)) {
    return "boolean"
  }

  // Array fields
  if (["tags", "teams"].includes(field)) {
    return "array"
  }

  // JSON fields
  if (["notification_preferences", "performance_metrics"].includes(field)) {
    return "json"
  }

  // Custom fields - try to infer type from field name or default to string
  if (field.startsWith("custom_fields.")) {
    const fieldName = field.split(".")[1].toLowerCase()

    // Try to infer type from field name patterns
    if (
      fieldName.includes("date") ||
      fieldName.includes("time") ||
      fieldName.includes("created") ||
      fieldName.includes("updated")
    ) {
      return "date"
    }
    if (
      fieldName.includes("count") ||
      fieldName.includes("number") ||
      fieldName.includes("amount") ||
      fieldName.includes("price") ||
      fieldName.includes("value")
    ) {
      return "number"
    }
    if (
      fieldName.includes("is_") ||
      fieldName.includes("has_") ||
      fieldName.includes("active") ||
      fieldName.includes("enabled")
    ) {
      return "boolean"
    }

    return "string" // Default for custom fields
  }

  // Default to string
  return "string"
}

// Format field names for display
const formatFieldName = (field: string): string => {
  const specialNames: Record<string, string> = {
    first_name: "First Name",
    last_name: "Last Name",
    mobile_number: "Mobile Number",
    is_suppressed: "Is Suppressed",
    is_transactional: "Is Transactional",
    is_high_value: "Is High Value",
    is_subscribed: "Is Subscribed",
    is_marketing: "Is Marketing",
    last_purchase_date: "Last Purchase Date",
    total_purchases: "Total Purchases",
    lifetime_value: "Lifetime Value",
    loyalty_points: "Loyalty Points",
    preferred_category: "Preferred Category",
    total_spent: "Total Spent",
    customer_since: "Customer Since",
    created_at: "Created At",
    updated_at: "Updated At",
    last_login: "Last Login",
    notification_preferences: "Notification Preferences",
    performance_metrics: "Performance Metrics",
    language_preferences: "Language Preferences",
    avatar_url: "Avatar URL",
  }

  if (specialNames[field]) {
    return specialNames[field]
  }

  // Handle custom fields
  if (field.startsWith("custom_fields.")) {
    const customFieldName = field.split(".")[1]
    return `Custom: ${customFieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")}`
  }

  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function ProfileFilterBuilder({ onFilterChange, initialFilters = [] }: ProfileFilterBuilderProps) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(
    initialFilters.length > 0 ? initialFilters : [{ conditions: [{ field: "", operator: "", value: "" }] }],
  )
  const [customFields, setCustomFields] = useState<string[]>([])
  const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(true)

  // Fetch custom fields from the database
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        setIsLoadingCustomFields(true)
        const result = await profilesApi.getCustomFieldsSchema()

        if (result.data) {
          // getCustomFieldsSchema returns an object with field definitions
          const customFieldKeys = Object.keys(result.data).map((key) => `custom_fields.${key}`)
          setCustomFields(customFieldKeys.sort())
        }
      } catch (error) {
        console.error("Error fetching custom fields:", error)
        setCustomFields([])
      } finally {
        setIsLoadingCustomFields(false)
      }
    }

    fetchCustomFields()
  }, [])

  // Combine base fields with custom fields
  const allAvailableFields = [...baseProfileFields, ...customFields]

  useEffect(() => {
    onFilterChange(
      filterGroups.filter((group) =>
        group.conditions.some((condition) => condition.field && condition.operator && condition.value),
      ),
    )
  }, [filterGroups, onFilterChange])

  const addFilterGroup = () => {
    setFilterGroups([...filterGroups, { conditions: [{ field: "", operator: "", value: "" }] }])
  }

  const removeFilterGroup = (groupIndex: number) => {
    if (filterGroups.length > 1) {
      setFilterGroups(filterGroups.filter((_, index) => index !== groupIndex))
    }
  }

  const addCondition = (groupIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].conditions.push({ field: "", operator: "", value: "" })
    setFilterGroups(newGroups)
  }

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...filterGroups]
    if (newGroups[groupIndex].conditions.length > 1) {
      newGroups[groupIndex].conditions.splice(conditionIndex, 1)
    } else if (filterGroups.length > 1) {
      // If this is the last condition in the group and there are other groups, remove the group
      newGroups.splice(groupIndex, 1)
    } else {
      // If this is the last condition in the last group, reset it
      newGroups[groupIndex].conditions[conditionIndex] = { field: "", operator: "", value: "" }
    }
    setFilterGroups(newGroups)
  }

  const updateCondition = (groupIndex: number, conditionIndex: number, updates: Partial<FilterCondition>) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].conditions[conditionIndex] = {
      ...newGroups[groupIndex].conditions[conditionIndex],
      ...updates,
    }

    // Reset operator and value when field changes
    if (updates.field !== undefined) {
      newGroups[groupIndex].conditions[conditionIndex].operator = ""
      newGroups[groupIndex].conditions[conditionIndex].value = ""
    }

    setFilterGroups(newGroups)
  }

  const getAvailableOperators = (field: string) => {
    const fieldType = getFieldType(field)
    return operators[fieldType] || operators.string
  }

  const renderValueInput = (condition: FilterCondition, groupIndex: number, conditionIndex: number) => {
    const fieldType = getFieldType(condition.field)

    // Don't show value input for "is empty" and "is not empty" operators
    if (["is empty", "is not empty"].includes(condition.operator)) {
      return null
    }

    switch (fieldType) {
      case "boolean":
        return (
          <Select
            value={condition.value}
            onValueChange={(value) => updateCondition(groupIndex, conditionIndex, { value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )

      case "date":
        return (
          <Input
            type="date"
            value={condition.value}
            onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
            className="w-40"
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={condition.value}
            onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
            placeholder="Enter number"
            className="w-32"
          />
        )

      default:
        return (
          <Input
            type="text"
            value={condition.value}
            onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
            placeholder="Enter value"
            className="w-40"
          />
        )
    }
  }

  // Group fields for better organization in the dropdown
  const groupedFields = {
    "Core Information": baseProfileFields.filter((field) =>
      ["id", "first_name", "last_name", "email", "mobile", "mobile_number", "phone"].includes(field),
    ),
    "Location & Demographics": baseProfileFields.filter((field) =>
      ["postcode", "suburb", "state", "timezone", "country", "location", "language_preferences"].includes(field),
    ),
    "Status & Permissions": baseProfileFields.filter((field) =>
      [
        "status",
        "role",
        "teams",
        "is_suppressed",
        "is_transactional",
        "is_high_value",
        "is_subscribed",
        "is_marketing",
      ].includes(field),
    ),
    "Purchase & Engagement": baseProfileFields.filter((field) =>
      [
        "last_purchase_date",
        "total_purchases",
        "lifetime_value",
        "loyalty_points",
        "preferred_category",
        "total_spent",
        "customer_since",
      ].includes(field),
    ),
    Technical: baseProfileFields.filter((field) =>
      ["device", "os", "source", "avatar_url", "created_at", "updated_at", "last_login"].includes(field),
    ),
    Advanced: baseProfileFields.filter((field) =>
      ["tags", "notification_preferences", "performance_metrics"].includes(field),
    ),
    "Custom Fields": customFields,
  }

  return (
    <div className="space-y-4">
      {filterGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Filter Group {groupIndex + 1}</span>
            {filterGroups.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeFilterGroup(groupIndex)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {group.conditions.map((condition, conditionIndex) => (
              <div key={conditionIndex} className="flex items-center gap-2 flex-wrap">
                {conditionIndex > 0 && <span className="text-xs font-medium text-gray-500 px-2">AND</span>}

                {/* Field Selector */}
                <Select
                  value={condition.field}
                  onValueChange={(value) => updateCondition(groupIndex, conditionIndex, { field: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={isLoadingCustomFields ? "Loading fields..." : "Select field"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(groupedFields).map(
                      ([groupName, fields]) =>
                        fields.length > 0 && (
                          <div key={groupName}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100">
                              {groupName}
                            </div>
                            {fields.map((field) => (
                              <SelectItem key={field} value={field}>
                                {formatFieldName(field)}
                              </SelectItem>
                            ))}
                          </div>
                        ),
                    )}
                    {isLoadingCustomFields && (
                      <div className="px-2 py-1.5 text-xs text-gray-500">Loading custom fields...</div>
                    )}
                  </SelectContent>
                </Select>

                {/* Operator Selector */}
                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(groupIndex, conditionIndex, { operator: value })}
                  disabled={!condition.field}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {condition.field &&
                      getAvailableOperators(condition.field).map((operator) => (
                        <SelectItem key={operator} value={operator}>
                          {operator}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Value Input */}
                {renderValueInput(condition, groupIndex, conditionIndex)}

                {/* Remove Condition Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(groupIndex, conditionIndex)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Condition Button */}
          <Button variant="outline" size="sm" onClick={() => addCondition(groupIndex)} className="mt-2">
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
        </div>
      ))}

      {/* Add Filter Group Button */}
      <Button variant="outline" onClick={addFilterGroup} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Filter Group (OR)
      </Button>
    </div>
  )
}
