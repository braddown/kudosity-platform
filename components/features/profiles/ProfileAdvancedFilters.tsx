"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { UnifiedFilterBuilder, FilterGroup } from '@/components/ui/unified-filter-builder'
import { profileFilterFields, mergeFieldDefinitions, createCustomFieldDefinition } from '@/lib/utils/filter-definitions'

interface Segment {
  id: string
  name: string
  description?: string
  estimated_size: number
  profile_count?: number
  filter_criteria?: {
    conditions?: any[]
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
  allAvailableFields?: any[] // Legacy support - will be ignored in favor of unified fields
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
  allAvailableFields = [] // Legacy parameter - ignored
}: ProfileAdvancedFiltersProps) {
  
  // Convert any custom fields from the legacy format to the unified format
  const customFields = allAvailableFields
    .filter(field => field.value?.startsWith('custom_fields.'))
    .map(field => createCustomFieldDefinition(
      field.value,
      field.label,
      field.type === 'text' ? 'string' : field.type === 'select' ? 'enum' : field.type
    ))

  // Use the unified field definitions with any custom fields merged
  const fieldDefinitions = mergeFieldDefinitions(profileFilterFields, customFields)

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

        {/* Use the UnifiedFilterBuilder instead of duplicated logic */}
        <UnifiedFilterBuilder
          fieldDefinitions={fieldDefinitions}
          initialFilters={filterGroups}
          onFilterChange={onFilterGroupsChange}
          placeholder="Add profile filter..."
          showLogic={true}
          maxGroups={5}
          className="mt-4"
        />
      </div>
    </div>
  )
}