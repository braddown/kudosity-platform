"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus } from 'lucide-react'

interface FilterCondition {
  field: string
  operator: string
  value: string
}

interface FilterGroup {
  id: string
  conditions: FilterCondition[]
}

interface FieldDefinition {
  value: string
  label: string
  type: 'text' | 'select' | 'date' | 'boolean' | 'number' | 'multiselect'
  options?: { value: string; label: string }[]
}

interface Segment {
  id: string
  name: string
  description?: string
  estimated_size: number
  profile_count?: number
  filter_criteria?: {
    conditions?: FilterCondition[]
    filterGroups?: FilterGroup[]
    profileType?: string
    searchTerm?: string
  }
  type: string
  created_at: string
}

interface ProfileAdvancedFiltersProps {
  showInlineFilter: boolean
  onToggleInlineFilter: () => void
  filterGroups: FilterGroup[]
  onFilterGroupsChange: (groups: FilterGroup[]) => void
  filteredProfilesCount: number
  selectedSegment: string | null
  onClearFilters: () => void
  segmentName: string
  onSegmentNameChange: (name: string) => void
  onSaveSegment: () => void
  isSavingSegment: boolean
  segments: Segment[]
  allAvailableFields: FieldDefinition[]
}

export function ProfileAdvancedFilters({
  showInlineFilter,
  onToggleInlineFilter,
  filterGroups,
  onFilterGroupsChange,
  filteredProfilesCount,
  selectedSegment,
  onClearFilters,
  segmentName,
  onSegmentNameChange,
  onSaveSegment,
  isSavingSegment,
  segments,
  allAvailableFields
}: ProfileAdvancedFiltersProps) {
  
  // Helper functions for filter management
  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: Date.now().toString(),
      conditions: [{ field: "first_name", operator: "contains", value: "" }]
    }
    onFilterGroupsChange([...filterGroups, newGroup])
  }

  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length > 1) {
      onFilterGroupsChange(filterGroups.filter(g => g.id !== groupId))
    }
  }

  const addConditionToGroup = (groupId: string) => {
    const updatedGroups = filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, { field: "first_name", operator: "contains", value: "" }]
        }
      }
      return group
    })
    onFilterGroupsChange(updatedGroups)
  }

  const removeConditionFromGroup = (groupId: string, conditionIndex: number) => {
    const updatedGroups = filterGroups.map(group => {
      if (group.id === groupId && group.conditions.length > 1) {
        return {
          ...group,
          conditions: group.conditions.filter((_, index) => index !== conditionIndex)
        }
      }
      return group
    })
    onFilterGroupsChange(updatedGroups)
  }

  const updateConditionInGroup = (groupId: string, conditionIndex: number, field: keyof FilterCondition, value: string) => {
    const updatedGroups = filterGroups.map(group => {
      if (group.id === groupId) {
        const updatedConditions = group.conditions.map((condition, index) => {
          if (index === conditionIndex) {
            return { ...condition, [field]: value }
          }
          return condition
        })
        return { ...group, conditions: updatedConditions }
      }
      return group
    })
    onFilterGroupsChange(updatedGroups)
  }

  const renderConditionValueInput = (groupId: string, conditionIndex: number, condition: FilterCondition) => {
    const field = allAvailableFields.find(f => f.value === condition.field)
    
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

  if (!showInlineFilter) {
    return null
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">{filteredProfilesCount} Profiles</h2>
            {selectedSegment && (
              <Button
                onClick={onClearFilters}
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
              onChange={(e) => onSegmentNameChange(e.target.value)}
              className="w-[200px] h-10 bg-background border-border"
            />
            <Button
              onClick={onSaveSegment}
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
              onClick={onToggleInlineFilter}
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addConditionToGroup(group.id)}
                      className="h-8 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Condition
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFilterGroup(group.id)}
                      disabled={filterGroups.length === 1}
                      className="h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Group
                    </Button>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-2">
                  {group.conditions.map((condition, conditionIndex) => (
                    <div key={conditionIndex} className="flex items-center gap-2">
                      {/* Field selection */}
                      <Select
                        value={condition.field}
                        onValueChange={(value) => updateConditionInGroup(group.id, conditionIndex, "field", value)}
                      >
                        <SelectTrigger className="w-48 h-10 bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-[200px]">
                          {allAvailableFields.map((field) => (
                            <SelectItem key={field.value} value={field.value} className="text-foreground">
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator selection */}
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateConditionInGroup(group.id, conditionIndex, "operator", value)}
                      >
                        <SelectTrigger className="w-32 h-10 bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="contains" className="text-foreground">contains</SelectItem>
                          <SelectItem value="equals" className="text-foreground">equals</SelectItem>
                          <SelectItem value="starts with" className="text-foreground">starts with</SelectItem>
                          <SelectItem value="ends with" className="text-foreground">ends with</SelectItem>
                          <SelectItem value="is" className="text-foreground">is</SelectItem>
                          <SelectItem value="is not" className="text-foreground">is not</SelectItem>
                          <SelectItem value="greater than" className="text-foreground">greater than</SelectItem>
                          <SelectItem value="less than" className="text-foreground">less than</SelectItem>
                          <SelectItem value="exists" className="text-foreground">exists</SelectItem>
                          <SelectItem value="not exists" className="text-foreground">not exists</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Value input */}
                      {renderConditionValueInput(group.id, conditionIndex, condition)}

                      {/* Remove condition button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConditionFromGroup(group.id, conditionIndex)}
                        disabled={group.conditions.length === 1}
                        className="h-10 w-10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add AND condition within group */}
                {group.conditions.length > 1 && (
                  <div className="flex items-center justify-center mt-2 pt-2 border-t border-border/50">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                      AND
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add OR group button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={addFilterGroup}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add OR Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}