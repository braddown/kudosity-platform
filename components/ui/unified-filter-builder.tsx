"use client"

/**
 * Unified Filter Builder Component
 * CC001: Consolidates filter components from Contacts, ProfileFilterBuilder, and Logs
 * 
 * Features:
 * - Type-safe filter conditions with proper validation
 * - Extensible field definitions for different data types
 * - Consistent operator application across components
 * - Proper glass morphism styling matching design system
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { X, Plus, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('UnifiedFilterBuilder')

// ==================== TYPES ====================

export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'array'

export type FilterOperator = 
  | 'equals' | 'not_equals' | 'contains' | 'not_contains' 
  | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal'
  | 'before' | 'after' | 'between' | 'in_last' | 'in_next'
  | 'is_true' | 'is_false'
  | 'includes' | 'excludes'

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: string | number | boolean | Date | string[]
  valueType?: FieldType
}

export interface FilterGroup {
  id: string
  conditions: FilterCondition[]
  logic?: 'AND' | 'OR' // Future enhancement for logical operators
}

export interface FieldDefinition {
  key: string
  label: string
  type: FieldType
  options?: Array<{ value: string; label: string }> // For enum fields
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: RegExp
  }
}

export interface UnifiedFilterBuilderProps {
  fieldDefinitions: FieldDefinition[]
  initialFilters?: FilterGroup[]
  onFilterChange: (filters: FilterGroup[]) => void
  className?: string
  placeholder?: string
  showLogic?: boolean // Enable AND/OR logic selection
  maxGroups?: number
}

// ==================== OPERATORS ====================

const operatorsByType: Record<FieldType, FilterOperator[]> = {
  string: [
    'equals', 'not_equals', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'is_empty', 'is_not_empty'
  ],
  number: [
    'equals', 'not_equals', 'greater_than', 'less_than',
    'greater_equal', 'less_equal', 'is_empty', 'is_not_empty'
  ],
  date: [
    'equals', 'not_equals', 'before', 'after',
    'between', 'in_last', 'in_next', 'is_empty', 'is_not_empty'
  ],
  boolean: ['is_true', 'is_false'],
  enum: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  array: ['includes', 'excludes', 'is_empty', 'is_not_empty']
}

const operatorLabels: Record<FilterOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  greater_than: 'greater than',
  less_than: 'less than',
  greater_equal: 'greater than or equal',
  less_equal: 'less than or equal',
  before: 'before',
  after: 'after',
  between: 'between',
  in_last: 'in last',
  in_next: 'in next',
  is_true: 'is true',
  is_false: 'is false',
  includes: 'includes',
  excludes: 'excludes'
}

// ==================== FILTER LOGIC ====================

export class FilterEngine {
  static applyStringOperator(value: string, operator: FilterOperator, conditionValue: string): boolean {
    const val = String(value || '').toLowerCase()
    const condVal = String(conditionValue || '').toLowerCase()

    switch (operator) {
      case 'equals': return val === condVal
      case 'not_equals': return val !== condVal
      case 'contains': return val.includes(condVal)
      case 'not_contains': return !val.includes(condVal)
      case 'starts_with': return val.startsWith(condVal)
      case 'ends_with': return val.endsWith(condVal)
      case 'is_empty': return val.trim() === ''
      case 'is_not_empty': return val.trim() !== ''
      default:
        logger.warn('Unknown string operator', { operator, value, conditionValue })
        return false
    }
  }

  static applyNumberOperator(value: number, operator: FilterOperator, conditionValue: number): boolean {
    switch (operator) {
      case 'equals': return value === conditionValue
      case 'not_equals': return value !== conditionValue
      case 'greater_than': return value > conditionValue
      case 'less_than': return value < conditionValue
      case 'greater_equal': return value >= conditionValue
      case 'less_equal': return value <= conditionValue
      case 'is_empty': return value === null || value === undefined || isNaN(value)
      case 'is_not_empty': return value !== null && value !== undefined && !isNaN(value)
      default:
        logger.warn('Unknown number operator', { operator, value, conditionValue })
        return false
    }
  }

  static applyDateOperator(value: Date, operator: FilterOperator, conditionValue: Date | string): boolean {
    const val = new Date(value)
    const condVal = new Date(conditionValue)

    if (isNaN(val.getTime()) || isNaN(condVal.getTime())) {
      return operator === 'is_empty'
    }

    switch (operator) {
      case 'equals': return val.toDateString() === condVal.toDateString()
      case 'not_equals': return val.toDateString() !== condVal.toDateString()
      case 'before': return val < condVal
      case 'after': return val > condVal
      case 'is_empty': return isNaN(val.getTime())
      case 'is_not_empty': return !isNaN(val.getTime())
      default:
        logger.warn('Unknown date operator', { operator, value, conditionValue })
        return false
    }
  }

  static applyBooleanOperator(value: boolean, operator: FilterOperator): boolean {
    switch (operator) {
      case 'is_true': return Boolean(value) === true
      case 'is_false': return Boolean(value) === false
      default:
        logger.warn('Unknown boolean operator', { operator, value })
        return false
    }
  }

  static applyArrayOperator(value: any[], operator: FilterOperator, conditionValue: string): boolean {
    if (!Array.isArray(value)) {
      return operator === 'is_empty'
    }

    switch (operator) {
      case 'includes': return value.includes(conditionValue)
      case 'excludes': return !value.includes(conditionValue)
      case 'is_empty': return value.length === 0
      case 'is_not_empty': return value.length > 0
      default:
        logger.warn('Unknown array operator', { operator, value, conditionValue })
        return false
    }
  }

  static evaluateCondition(condition: FilterCondition, data: Record<string, any>, fieldDef?: FieldDefinition): boolean {
    const fieldValue = data[condition.field]
    const fieldType = fieldDef?.type || condition.valueType || 'string'

    try {
      switch (fieldType) {
        case 'string':
        case 'enum':
          return this.applyStringOperator(fieldValue, condition.operator, String(condition.value))
        case 'number':
          return this.applyNumberOperator(Number(fieldValue), condition.operator, Number(condition.value))
        case 'date':
          return this.applyDateOperator(fieldValue, condition.operator, condition.value as Date)
        case 'boolean':
          return this.applyBooleanOperator(fieldValue, condition.operator)
        case 'array':
          return this.applyArrayOperator(fieldValue, condition.operator, String(condition.value))
        default:
          logger.warn('Unknown field type', { fieldType, condition })
          return false
      }
    } catch (error) {
      logger.error('Error evaluating filter condition', error, { condition, fieldValue, fieldType })
      return false
    }
  }

  static evaluateFilterGroup(group: FilterGroup, data: Record<string, any>, fieldDefinitions: FieldDefinition[]): boolean {
    if (!group.conditions.length) return true

    const fieldDefMap = new Map(fieldDefinitions.map(def => [def.key, def]))

    return group.conditions.every(condition => {
      if (!condition.field || !condition.operator) return true
      const fieldDef = fieldDefMap.get(condition.field)
      return this.evaluateCondition(condition, data, fieldDef)
    })
  }

  static filterData<T extends Record<string, any>>(
    data: T[],
    filterGroups: FilterGroup[],
    fieldDefinitions: FieldDefinition[]
  ): T[] {
    if (!filterGroups.length) return data

    return data.filter(item =>
      filterGroups.some(group => this.evaluateFilterGroup(group, item, fieldDefinitions))
    )
  }
}

// ==================== COMPONENT ====================

export function UnifiedFilterBuilder({
  fieldDefinitions,
  initialFilters = [],
  onFilterChange,
  className,
  placeholder = "Add filter...",
  showLogic = false,
  maxGroups = 10
}: UnifiedFilterBuilderProps) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(() => {
    if (initialFilters.length > 0) {
      return initialFilters
    }
    // Start with a single group with a default condition
    const firstField = fieldDefinitions.length > 0 ? fieldDefinitions[0].key : ''
    return [{ 
      id: crypto.randomUUID(), 
      conditions: [{ 
        field: firstField, 
        operator: 'equals', 
        value: '' 
      }] 
    }]
  })

  useEffect(() => {
    const validGroups = filterGroups.filter(group =>
      group.conditions.some(condition => condition.field && condition.operator)
    )
    
    if (validGroups.length !== filterGroups.length) {
      logger.debug('Filtered out invalid groups', { 
        total: filterGroups.length, 
        valid: validGroups.length 
      })
    }

    onFilterChange(validGroups)
  }, [filterGroups, onFilterChange])

  const addFilterGroup = () => {
    if (filterGroups.length >= maxGroups) {
      logger.warn('Maximum filter groups reached', { maxGroups })
      return
    }

    const firstField = fieldDefinitions.length > 0 ? fieldDefinitions[0].key : ''
    const newGroup: FilterGroup = {
      id: crypto.randomUUID(),
      conditions: [{ field: firstField, operator: 'equals', value: '' }]
    }
    
    setFilterGroups(prev => [...prev, newGroup])
    logger.debug('Added new filter group', { groupId: newGroup.id })
  }

  const removeFilterGroup = (groupId: string) => {
    setFilterGroups(prev => prev.filter(group => group.id !== groupId))
    logger.debug('Removed filter group', { groupId })
  }

  const addCondition = (groupId: string) => {
    const firstField = fieldDefinitions.length > 0 ? fieldDefinitions[0].key : ''
    setFilterGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            conditions: [...group.conditions, { field: firstField, operator: 'equals', value: '' }]
          }
        : group
    ))
    logger.debug('Added condition to group', { groupId })
  }

  const removeCondition = (groupId: string, conditionIndex: number) => {
    setFilterGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            conditions: group.conditions.filter((_, index) => index !== conditionIndex)
          }
        : group
    ))
    logger.debug('Removed condition from group', { groupId, conditionIndex })
  }

  const updateCondition = (groupId: string, conditionIndex: number, updates: Partial<FilterCondition>) => {
    setFilterGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            conditions: group.conditions.map((condition, index) =>
              index === conditionIndex
                ? { ...condition, ...updates }
                : condition
            )
          }
        : group
    ))
  }

  const getFieldDefinition = (fieldKey: string): FieldDefinition | undefined => {
    return fieldDefinitions.find(def => def.key === fieldKey)
  }

  const getAvailableOperators = (fieldKey: string): FilterOperator[] => {
    const fieldDef = getFieldDefinition(fieldKey)
    return fieldDef ? operatorsByType[fieldDef.type] : operatorsByType.string
  }

  const renderValueInput = (condition: FilterCondition, groupId: string, conditionIndex: number) => {
    const fieldDef = getFieldDefinition(condition.field)
    if (!fieldDef || !condition.operator) return null

    // Skip value input for operators that don't need values
    const noValueOperators: FilterOperator[] = ['is_empty', 'is_not_empty', 'is_true', 'is_false']
    if (noValueOperators.includes(condition.operator)) return null

    const updateValue = (value: any) => {
      updateCondition(groupId, conditionIndex, { value, valueType: fieldDef.type })
    }

    switch (fieldDef.type) {
      case 'string':
        return (
          <Input
            placeholder="Enter value..."
            value={String(condition.value || '')}
            onChange={(e) => updateValue(e.target.value)}
            className="flex-1 h-10 bg-background border-border"
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter number..."
            value={String(condition.value || '')}
            onChange={(e) => updateValue(Number(e.target.value))}
            className="flex-1 h-10 bg-background border-border"
          />
        )

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 h-10 bg-background border-border justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {condition.value 
                  ? format(new Date(condition.value as Date), 'PPP')
                  : 'Pick a date'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={condition.value ? new Date(condition.value as Date) : undefined}
                onSelect={(date) => updateValue(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case 'boolean':
        return (
          <Switch
            checked={Boolean(condition.value)}
            onCheckedChange={updateValue}
          />
        )

      case 'enum':
        return (
          <Select value={String(condition.value || '')} onValueChange={updateValue}>
            <SelectTrigger className="flex-1 h-10 bg-background border-border">
              <SelectValue placeholder="Select option..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {fieldDef.options?.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-foreground">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            placeholder="Enter value..."
            value={String(condition.value || '')}
            onChange={(e) => updateValue(e.target.value)}
            className="flex-1 h-10 bg-background border-border"
          />
        )
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
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
          
          <div className="bg-accent/30 rounded-lg p-3 border border-border/50">
            {/* Group Header - simplified */}
            <div className="mb-2">
              <span className="text-sm font-medium text-foreground">
                Group {groupIndex + 1} {group.conditions.length > 1 && "(All conditions must match)"}
              </span>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              {group.conditions.map((condition, conditionIndex) => (
                <div key={conditionIndex}>
                  {/* AND separator within group (except first condition) */}
                  {conditionIndex > 0 && (
                    <div className="flex items-center justify-center py-2">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                        AND
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {/* Field Select */}
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(group.id, conditionIndex, { 
                        field: value, 
                        operator: 'equals', 
                        value: '' 
                      })}
                    >
                      <SelectTrigger className="w-48 h-10 bg-background border-border">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[200px]">
                        {fieldDefinitions.map(field => (
                          <SelectItem key={field.key} value={field.key} className="text-foreground">
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operator Select */}
                    {condition.field && (
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(group.id, conditionIndex, { 
                          operator: value as FilterOperator,
                          value: ''
                        })}
                      >
                        <SelectTrigger className="w-32 h-10 bg-background border-border">
                          <SelectValue placeholder="Select operator..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {getAvailableOperators(condition.field).map(operator => (
                            <SelectItem key={operator} value={operator} className="text-foreground">
                              {operatorLabels[operator]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Value Input */}
                    {condition.field && condition.operator && (
                      <div className="flex-1">
                        {renderValueInput(condition, group.id, conditionIndex)}
                      </div>
                    )}

                    {/* Right side buttons - only show on last condition */}
                    <div className="flex items-center gap-2">
                      {/* Add Condition - only on last condition */}
                      {conditionIndex === group.conditions.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addCondition(group.id)}
                          className="h-10 px-2 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          AND
                        </Button>
                      )}
                      
                      {/* Remove Group - only on last condition of last group */}
                      {conditionIndex === group.conditions.length - 1 && filterGroups.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilterGroup(group.id)}
                          className="h-10 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Group
                        </Button>
                      )}
                      
                      {/* Remove Condition */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(group.id, conditionIndex)}
                        disabled={group.conditions.length === 1}
                        className="h-10 w-10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      ))}

      {/* Add OR group button */}
      <div className="flex justify-center">
        {filterGroups.length < maxGroups && (
          <Button
            variant="outline"
            onClick={addFilterGroup}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add OR Group
          </Button>
        )}
      </div>
    </div>
  )
}