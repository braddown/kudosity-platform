"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SegmentListDropdown } from '@/components/features/profiles/SegmentListDropdown'
import { Filter, X, Search, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
  lifecycle_stage?: string
  created_at: string
  [key: string]: any
}

interface FilterGroup {
  id: string
  conditions: Array<{
    field: string
    operator: string
    value: string
  }>
}

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

interface ProfileTableActionsProps {
  searchTerm: string
  onSearchTermChange: (term: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  showInlineFilter: boolean
  onToggleInlineFilter: () => void
  segments: Segment[]
  lists: any[]
  selectedSegment: string | null
  selectedList: string | null
  onSegmentSelect: (id: string | null) => void
  onListSelect: (id: string | null) => void
  onClearFilters: () => void
  filterGroups: FilterGroup[]
}

export function ProfileTableActions({
  searchTerm,
  onSearchTermChange,
  selectedType,
  onTypeChange,
  showInlineFilter,
  onToggleInlineFilter,
  segments,
  lists,
  selectedSegment,
  selectedList,
  onSegmentSelect,
  onListSelect,
  onClearFilters,
  filterGroups
}: ProfileTableActionsProps) {

  const hasActiveFilters = (
    selectedType !== 'all' || 
    searchTerm || 
    filterGroups.some(g => g.conditions.some(c => c.value)) || 
    selectedSegment || 
    selectedList
  )

  const filterOptions = [
    { label: "All Profiles", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Archived", value: "archived" },
    { label: "Deleted", value: "deleted" },
    { label: "Marketing Enabled", value: "marketing" },
    { label: "Unsubscribed", value: "unsubscribed" }
  ]

  return (
    <div className="space-y-4">
      {/* Main Search and Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search profiles by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2">
          {/* Profile Type Filter */}
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant={showInlineFilter ? "default" : "outline"}
            onClick={onToggleInlineFilter}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
          </Button>

          {/* Segments and Lists Dropdown */}
          <SegmentListDropdown
            segments={segments}
            lists={lists}
            selectedId={selectedSegment || selectedList}
            onSelect={(type, id, name) => {
              if (type === 'segment') {
                onSegmentSelect(id)
                onListSelect(null)
              } else if (type === 'list') {
                onListSelect(id)
                onSegmentSelect(null)
              }
            }}
          />

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedType !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {filterOptions.find(o => o.value === selectedType)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onTypeChange('all')}
              />
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchTerm}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchTermChange('')}
              />
            </Badge>
          )}
          {selectedSegment && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Segment: {segments.find(s => s.id === selectedSegment)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSegmentSelect(null)}
              />
            </Badge>
          )}
          {selectedList && (
            <Badge variant="secondary" className="flex items-center gap-1">
              List: {lists.find(l => l.id === selectedList)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onListSelect(null)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}