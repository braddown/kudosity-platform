"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Plus, Save } from 'lucide-react'
import { UnifiedFilterBuilder, type FilterGroup } from '@/components/ui/unified-filter-builder'
import { profileFilterFields } from '@/lib/utils/filter-definitions'
import { SegmentListDropdown } from '@/components/features/profiles/SegmentListDropdown'
import { segmentsApi } from '@/lib/api/segments-api'
import { useToast } from '@/components/ui/use-toast'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('ProfileFilters')

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
  lifecycle_stage?: string
  created_at: string
  updated_at?: string
  last_activity_at?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  [key: string]: any
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

interface ProfileFiltersProps {
  profiles: Profile[]
  onFiltersChange: (filteredProfiles: Profile[]) => void
  segments: Segment[]
  lists: any[]
  selectedSegment: string | null
  selectedList: string | null
  onSegmentSelect: (segmentId: string | null) => void
  onListSelect: (listId: string | null) => void
  onSegmentsUpdated: () => void
  selectedType: string
  onTypeChange: (type: string) => void
}

export function ProfileFilters({
  profiles,
  onFiltersChange,
  segments,
  lists,
  selectedSegment,
  selectedList,
  onSegmentSelect,
  onListSelect,
  onSegmentsUpdated,
  selectedType,
  onTypeChange
}: ProfileFiltersProps) {
  const { toast } = useToast()
  
  // Helper functions defined with useCallback to avoid unnecessary re-renders
  const hasMarketingChannelFilter = useCallback((profile: Profile): boolean => {
    const prefs = profile.notification_preferences || {}
    return prefs.sms === true || prefs.email === true || prefs.push === true
  }, [])

  const allMarketingRevokedFilter = useCallback((profile: Profile): boolean => {
    const prefs = profile.notification_preferences || {}
    return prefs.sms === false && prefs.email === false && prefs.push === false
  }, [])
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: '1', conditions: [] }
  ])
  const [showInlineFilter, setShowInlineFilter] = useState(false)
  
  // Segment creation
  const [segmentName, setSegmentName] = useState('')
  const [isSavingSegment, setIsSavingSegment] = useState(false)

  // Profile type filter options
  const filterOptions = [
    { value: 'all', label: 'All Profiles' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'marketing', label: 'Marketing Enabled' },
    { value: 'unsubscribed', label: 'Unsubscribed' }
  ]

  // Apply filters whenever dependencies change
  useEffect(() => {
    const filteredProfiles = applyAllFilters()
    onFiltersChange(filteredProfiles)
    logger.debug('Filters applied', { count: filteredProfiles.length })
  }, [profiles, selectedType, searchTerm, filterGroups, selectedSegment, selectedList])

  const applyAllFilters = (): Profile[] => {
    if (!profiles || profiles.length === 0) return []

    let filtered = [...profiles]

    // Apply segment filter if selected
    if (selectedSegment && segments && segments.length > 0) {
      const segment = segments.find(s => s.id === selectedSegment)
      if (segment && segment.filter_criteria) {
        filtered = applySegmentFilter(filtered, segment.filter_criteria)
      }
    }

    // Apply list filter if selected
    if (selectedList && lists && lists.length > 0) {
      const list = lists.find(l => l.id === selectedList)
      if (list && (list as any).profile_ids) {
        filtered = filtered.filter(profile => (list as any).profile_ids.includes(profile.id))
      }
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(profile => {
        switch (selectedType) {
          case 'active':
            return profile.status?.toLowerCase() === 'active'
          case 'inactive':
            return profile.status?.toLowerCase() === 'inactive'
          case 'pending':
            return profile.status?.toLowerCase() === 'pending'
          case 'archived':
            return profile.lifecycle_stage?.toLowerCase() === 'inactive'
          case 'deleted':
            return profile.lifecycle_stage?.toLowerCase() === 'deleted'
          case 'marketing':
            return hasMarketingChannelFilter(profile)
          case 'unsubscribed':
            return allMarketingRevokedFilter(profile)
          default:
            return true
        }
      })
    }

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(profile =>
        `${profile.first_name} ${profile.last_name} ${profile.email || ''} ${profile.mobile || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    }

    // Apply advanced filter groups using UnifiedFilterBuilder logic
    const hasActiveFilters = filterGroups.some(group => 
      group.conditions.some(c => c.value && String(c.value).trim() !== '')
    )
    
    if (hasActiveFilters) {
      // We can use the FilterEngine from unified-filter-builder here if needed
      // For now, using the existing logic but it could be refactored to use FilterEngine
      filtered = filtered.filter(profile => {
        return filterGroups.some(group => {
          const activeConditions = group.conditions.filter(c => c.value && String(c.value).trim() !== '')
          if (activeConditions.length === 0) return false
          
          return activeConditions.every(condition => evaluateCondition(profile, condition))
        })
      })
    }

    return filtered
  }

  const evaluateCondition = (profile: Profile, condition: any): boolean => {
    if (!condition.value || condition.value.trim() === '') return true

    let fieldValue: any
    if (condition.field.startsWith('custom_fields.')) {
      const customFieldKey = condition.field.replace('custom_fields.', '')
      fieldValue = profile.custom_fields?.[customFieldKey]
    } else if (condition.field === 'tags') {
      fieldValue = profile.tags
    } else {
      fieldValue = profile[condition.field as keyof Profile]
    }

    // Handle null/undefined values
    if (fieldValue === undefined || fieldValue === null) {
      switch (condition.operator) {
        case 'exists':
        case 'is_not_empty':
          return false
        case 'not_exists':
        case 'is_empty':
          return true
        case 'equals':
        case 'is':
          return condition.value === '' || condition.value.toLowerCase() === 'null'
        default:
          return false
      }
    }

    // Handle array fields
    if (Array.isArray(fieldValue)) {
      const arrayValue = fieldValue.join(' ').toLowerCase()
      const conditionValue = condition.value.toLowerCase()
      
      switch (condition.operator) {
        case 'contains':
          return arrayValue.includes(conditionValue)
        case 'equals':
          return fieldValue.includes(condition.value)
        default:
          return arrayValue.includes(conditionValue)
      }
    }

    const profileValue = String(fieldValue).toLowerCase()
    const conditionValue = condition.value.toLowerCase()

    switch (condition.operator) {
      case 'contains':
        return profileValue.includes(conditionValue)
      case 'equals':
        return profileValue === conditionValue
      case 'starts with':
        return profileValue.startsWith(conditionValue)
      case 'ends with':
        return profileValue.endsWith(conditionValue)
      case 'is':
        return profileValue === conditionValue
      case 'is not':
        return profileValue !== conditionValue
      case 'greater than':
        return Number(fieldValue) > Number(condition.value)
      case 'less than':
        return Number(fieldValue) < Number(condition.value)
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
      case 'not exists':
        return fieldValue === null || fieldValue === undefined || fieldValue === ''
      default:
        return true
    }
  }

  const applySegmentFilter = (profiles: Profile[], filterCriteria: any): Profile[] => {
    if (!filterCriteria) return profiles

    let filtered = [...profiles]

    // Apply search term from segment
    if (filterCriteria.searchTerm) {
      filtered = filtered.filter(profile =>
        `${profile.first_name} ${profile.last_name} ${profile.email || ''} ${profile.mobile || ''}`
          .toLowerCase()
          .includes(filterCriteria.searchTerm.toLowerCase())
      )
    }

    // Apply profile type from segment
    if (filterCriteria.profileType && filterCriteria.profileType !== 'all') {
      filtered = filtered.filter(profile => {
        switch (filterCriteria.profileType) {
          case 'active':
            return profile.status?.toLowerCase() === 'active'
          case 'inactive':
            return profile.status?.toLowerCase() === 'inactive'
          case 'pending':
            return profile.status?.toLowerCase() === 'pending'
          case 'archived':
            return profile.lifecycle_stage?.toLowerCase() === 'inactive'
          case 'deleted':
            return profile.lifecycle_stage?.toLowerCase() === 'deleted'
          case 'marketing':
            return hasMarketingChannelFilter(profile)
          case 'unsubscribed':
            return allMarketingRevokedFilter(profile)
          default:
            return true
        }
      })
    }

    // Apply filter groups or legacy conditions
    if (filterCriteria.filterGroups) {
      const hasActiveFilters = filterCriteria.filterGroups.some((group: any) => 
        group.conditions.some((c: any) => c.value && c.value.trim() !== '')
      )
      
      if (hasActiveFilters) {
        filtered = filtered.filter(profile => {
          return filterCriteria.filterGroups.some((group: any) => {
            const activeConditions = group.conditions.filter((c: any) => c.value && c.value.trim() !== '')
            if (activeConditions.length === 0) return false
            
            return activeConditions.every((condition: any) => evaluateCondition(profile, condition))
          })
        })
      }
    } else if (filterCriteria.conditions) {
      // Legacy condition support
      filtered = filtered.filter(profile => {
        return filterCriteria.conditions.every((condition: any) => evaluateCondition(profile, condition))
      })
    }

    return filtered
  }


  const saveAsSegment = async () => {
    if (!segmentName.trim()) {
      toast({
        title: 'Segment Name Required',
        description: 'Please enter a name for the segment',
        variant: 'destructive'
      })
      return
    }

    setIsSavingSegment(true)
    try {
      const creatorId = localStorage.getItem('user_id') || 'unknown'
      const currentFilters = applyAllFilters()
      
      await segmentsApi.createSegment({
        name: segmentName.trim(),
        description: `Created from profile filters on ${new Date().toLocaleString()}`,
        creator_id: creatorId,
        filter_criteria: {
          filterGroups: filterGroups.map(group => ({
            id: group.id,
            conditions: group.conditions.map(condition => ({
              field: condition.field,
              operator: condition.operator,
              value: Array.isArray(condition.value) ? condition.value.join(',') : String(condition.value)
            }))
          })),
          profileType: selectedType,
          searchTerm: searchTerm
        },
        estimated_size: currentFilters.length,
        type: 'dynamic',
        shared: false,
        tags: []
      })

      toast({
        title: 'Segment Saved',
        description: `Segment "${segmentName}" created with ${currentFilters.length} profiles`
      })

      setSegmentName('')
      setShowInlineFilter(false)
      onSegmentsUpdated()
      
      logger.info('Segment created from filters', { name: segmentName, count: currentFilters.length })
    } catch (error) {
      logger.error('Failed to save segment', { error })
      toast({
        title: 'Save Failed',
        description: 'Failed to save segment',
        variant: 'destructive'
      })
    } finally {
      setIsSavingSegment(false)
    }
  }

  const clearFilters = () => {
    onTypeChange('all')
    setSearchTerm('')
    setFilterGroups([{ id: '1', conditions: [] }])
    setShowInlineFilter(false)
    onSegmentSelect(null)
    onListSelect(null)
    logger.info('Filters cleared')
  }

  return (
    <div className="space-y-4">
      {/* Quick Filter Cards - Removed since they're now in ProfileStatistics */}

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInlineFilter(!showInlineFilter)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>

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

          {(selectedType !== 'all' || searchTerm || filterGroups.some(g => g.conditions.some(c => c.value)) || selectedSegment || selectedList) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Builder */}
      {showInlineFilter && (
        <div className="border border-border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Advanced Filters</h3>
            <p className="text-sm text-muted-foreground">
              Create complex filters to find specific profiles. Conditions within each group are AND'd together, while groups are OR'd together.
            </p>
          </div>

          <UnifiedFilterBuilder
            initialFilters={filterGroups}
            onFilterChange={setFilterGroups}
            fieldDefinitions={profileFilterFields}
            className="mb-4"
          />

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <div className="flex-1">
              <Input
                placeholder="Segment name (optional)"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
              />
            </div>
            <Button
              onClick={saveAsSegment}
              disabled={isSavingSegment || !segmentName.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSavingSegment ? 'Saving...' : 'Save as Segment'}
            </Button>
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {(selectedType !== 'all' || searchTerm || selectedSegment || selectedList) && (
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
                onClick={() => setSearchTerm('')}
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