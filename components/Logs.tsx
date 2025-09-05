"use client"
import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Info,
  ExternalLink,
  MessageSquare,
  Activity,
  Eye,
  MoreHorizontal,
  Plus,
  Trash2,
  Check,
  Database,
  Copy,
  Shield,
  Filter,
  Download,
} from "lucide-react"
import { logger } from "@/lib/utils/logger"
import { format, formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import React from "react"

import * as SelectPrimitive from "@radix-ui/react-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import { logFiltersApi, type LogFilter } from "@/api/log-filters-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Select component implementation for the filter builder
const FilterSelect = SelectPrimitive.Root
const FilterSelectGroup = SelectPrimitive.Group
const FilterSelectValue = SelectPrimitive.Value

const FilterSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </SelectPrimitive.Trigger>
))
FilterSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const FilterSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
        position === "popper" && "translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
FilterSelectContent.displayName = SelectPrimitive.Content.displayName

const FilterSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
FilterSelectItem.displayName = SelectPrimitive.Item.displayName

// Log field definitions
const logFields = [
  "id",
  "log_time",
  "event_type",
  "contact_id",
  "campaign_id",
  "message_id",
  "profile_id",
  "ip_address",
  "user_agent",
  "device",
  "os",
  "location",
  "details.action_description",
  "details.description",
  "details.message",
  "details.action",
  "details.event",
  "details.url",
  "details.error_code",
  "details.status_code",
]

const operators = {
  string: ["contains", "is", "is not", "starts with", "ends with"],
  number: ["equals", "greater than", "less than", "greater than or equal to", "less than or equal to"],
  date: ["is", "is before", "is after", "is on or before", "is on or after"],
  boolean: ["is"],
}

export interface FilterCondition {
  field: string
  operator: string
  value: string
}

export interface FilterGroup {
  conditions: FilterCondition[]
}

const getLogFieldType = (field: string): "string" | "number" | "date" | "boolean" => {
  switch (field) {
    case "id":
      return "string" // UUIDs are treated as strings
    case "log_time":
      return "date"
    case "details.status_code":
    case "details.error_code":
      return "number"
    default:
      return "string"
  }
}

// Combined Filter Selector Component
function CombinedFilterSelector({
  eventTypes,
  savedFilters,
  selectedTypes,
  currentFilterName,
  onEventTypeChange,
  onSavedFilterSelect,
  onClearFilters,
  tableStatus,
}: {
  eventTypes: string[]
  savedFilters: LogFilter[]
  selectedTypes: string[]
  currentFilterName: string
  onEventTypeChange: (types: string[]) => void
  onSavedFilterSelect: (filter: LogFilter) => void
  onClearFilters: () => void
  tableStatus: { needsCreation: boolean; needsRLSFix: boolean }
}) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Determine what to display in the trigger
  const getDisplayValue = () => {
    if (currentFilterName) {
      return currentFilterName
    }
    if (selectedTypes.length > 0) {
      return selectedTypes[0]
    }
    return "All"
  }

  // Filter event types based on search
  const filteredEventTypes = eventTypes.filter((type) => type.toLowerCase().includes(searchValue.toLowerCase()))

  // Filter saved filters based on search
  const filteredSavedFilters = savedFilters.filter((filter) =>
    filter.name.toLowerCase().includes(searchValue.toLowerCase()),
  )

  const handleSelect = (value: string, type: "event" | "saved" | "clear") => {
    if (type === "clear") {
      onClearFilters()
    } else if (type === "event") {
      if (value === "all") {
        onEventTypeChange([])
      } else {
        onEventTypeChange([value])
      }
    } else if (type === "saved") {
      const filter = savedFilters.find((f) => f.id === value)
      if (filter) {
        onSavedFilterSelect(filter)
      }
    }
    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {getDisplayValue()}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search filters..." value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            <CommandEmpty>No filters found.</CommandEmpty>

            {/* Event Types Section */}
            <CommandGroup heading="Event Types">
              <CommandItem
                value="all"
                onSelect={() => handleSelect("all", "event")}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedTypes.length === 0 && !currentFilterName ? "opacity-100" : "opacity-0",
                  )}
                />
                All
              </CommandItem>
              {filteredEventTypes.map((type) => (
                <CommandItem
                  key={type}
                  value={type}
                  onSelect={() => handleSelect(type, "event")}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTypes.includes(type) && !currentFilterName ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {type}
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Saved Filters Section */}
            {!tableStatus.needsCreation && !tableStatus.needsRLSFix && filteredSavedFilters.length > 0 && (
              <CommandGroup heading="Saved Filters">
                {filteredSavedFilters.map((filter) => (
                  <CommandItem
                    key={filter.id}
                    value={filter.name}
                    onSelect={() => handleSelect(filter.id, "saved")}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", currentFilterName === filter.name ? "opacity-100" : "opacity-0")}
                    />
                    <Database className="mr-2 h-4 w-4 opacity-50" />
                    {filter.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Clear Filters Option */}
            {(selectedTypes.length > 0 || currentFilterName || savedFilters.length > 0) && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleSelect("", "clear")}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// LogFilterBuilder component
function LogFilterBuilder({
  onFilterChange,
  initialFilters,
}: {
  onFilterChange: (filters: FilterGroup[]) => void
  initialFilters: FilterGroup[]
}) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(
    initialFilters.length > 0
      ? initialFilters
      : [{ conditions: [{ field: "event_type", operator: "contains", value: "" }] }],
  )

  useEffect(() => {
    onFilterChange(filterGroups)
  }, [filterGroups, onFilterChange])

  const addCondition = (groupIndex: number) => {
    setFilterGroups((prevFilters) => {
      const newFilters = [...prevFilters]
      newFilters[groupIndex].conditions.push({ field: "event_type", operator: "contains", value: "" })
      return newFilters
    })
  }

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    setFilterGroups((prevFilters) => {
      const newFilters = [...prevFilters]
      newFilters[groupIndex].conditions.splice(conditionIndex, 1)
      if (newFilters[groupIndex].conditions.length === 0) {
        newFilters.splice(groupIndex, 1)
      }
      return newFilters
    })
  }

  const updateCondition = (groupIndex: number, conditionIndex: number, field: keyof FilterCondition, value: string) => {
    setFilterGroups((prevFilters) => {
      const newFilters = [...prevFilters]
      newFilters[groupIndex].conditions[conditionIndex][field] = value

      if (field === "field") {
        const fieldType = getLogFieldType(value)
        newFilters[groupIndex].conditions[conditionIndex].operator = operators[fieldType][0]
        newFilters[groupIndex].conditions[conditionIndex].value = ""
      }

      return newFilters
    })
  }

  const addGroup = () => {
    setFilterGroups((prevGroups) => [
      ...prevGroups,
      { conditions: [{ field: "event_type", operator: "contains", value: "" }] },
    ])
  }

  return (
    <div className="space-y-4">
      {filterGroups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          <div className="space-y-4">
            {group.conditions.map((condition, conditionIndex) => (
              <React.Fragment key={conditionIndex}>
                {conditionIndex > 0 && <div className="text-sm font-medium text-gray-500 my-2 text-center">AND</div>}
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                    <FilterSelect
                      value={condition.field}
                      onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "field", value)}
                    >
                      <FilterSelectTrigger>
                        <FilterSelectValue placeholder="Select field" />
                      </FilterSelectTrigger>
                      <FilterSelectContent>
                        {logFields.map((field) => (
                          <FilterSelectItem key={field} value={field}>
                            {field.replace("details.", "Details: ")}
                          </FilterSelectItem>
                        ))}
                      </FilterSelectContent>
                    </FilterSelect>
                    <FilterSelect
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "operator", value)}
                    >
                      <FilterSelectTrigger>
                        <FilterSelectValue placeholder="Select operator" />
                      </FilterSelectTrigger>
                      <FilterSelectContent>
                        {operators[getLogFieldType(condition.field)].map((operator) => (
                          <FilterSelectItem key={operator} value={operator}>
                            {operator}
                          </FilterSelectItem>
                        ))}
                      </FilterSelectContent>
                    </FilterSelect>
                    <Input
                      type={
                        getLogFieldType(condition.field) === "number"
                          ? "number"
                          : getLogFieldType(condition.field) === "date"
                            ? "datetime-local"
                            : "text"
                      }
                      value={condition.value}
                      onChange={(e) => updateCondition(groupIndex, conditionIndex, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(groupIndex, conditionIndex)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </React.Fragment>
            ))}
            <Button
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white mt-2"
              onClick={() => addCondition(groupIndex)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Condition
            </Button>
          </div>
          {groupIndex < filterGroups.length - 1 && (
            <div className="text-sm font-medium text-gray-500 my-4 text-center">OR</div>
          )}
        </React.Fragment>
      ))}

      <Button variant="outline" className="mt-2" onClick={addGroup}>
        <Plus className="mr-2 h-4 w-4" />
        Filter Group
      </Button>
    </div>
  )
}

// Helper functions for filtering logs
const applyStringOperator = (logValue: string, operator: string, conditionValue: string): boolean => {
  if (!logValue) return false
  switch (operator) {
    case "contains":
      return logValue.toLowerCase().includes(conditionValue.toLowerCase())
    case "is":
      return logValue.toLowerCase() === conditionValue.toLowerCase()
    case "is not":
      return logValue.toLowerCase() !== conditionValue.toLowerCase()
    case "starts with":
      return logValue.toLowerCase().startsWith(conditionValue.toLowerCase())
    case "ends with":
      return logValue.toLowerCase().endsWith(conditionValue.toLowerCase())
    default:
      return false
  }
}

const applyNumberOperator = (logValue: number, operator: string, conditionValue: number): boolean => {
  switch (operator) {
    case "equals":
      return logValue === conditionValue
    case "greater than":
      return logValue > conditionValue
    case "less than":
      return logValue < conditionValue
    case "greater than or equal to":
      return logValue >= conditionValue
    case "less than or equal to":
      return logValue <= conditionValue
    default:
      return false
  }
}

const applyDateOperator = (logValue: Date, operator: string, conditionValue: Date): boolean => {
  const logDate = logValue instanceof Date ? logValue.getTime() : new Date(logValue).getTime()
  const conditionDate = conditionValue instanceof Date ? conditionValue.getTime() : new Date(conditionValue).getTime()

  switch (operator) {
    case "is":
      return logDate === conditionDate
    case "is before":
      return logDate < conditionDate
    case "is after":
      return logDate > conditionDate
    case "is on or before":
      return logDate <= conditionDate
    case "is on or after":
      return logDate >= conditionDate
    default:
      return false
  }
}

// Function to get value from log object, including nested details
const getLogValue = (log: any, field: string): any => {
  if (field.startsWith("details.")) {
    const detailField = field.replace("details.", "")
    const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details
    return details?.[detailField]
  }
  return log[field]
}

function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "log_time",
    direction: "desc",
  })
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const [connectionMessage, setConnectionMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>("Loading...")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [totalDatabaseRecords, setTotalDatabaseRecords] = useState<number>(0)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterGroup[]>([])
  const [allLogs, setAllLogs] = useState<any[]>([]) // Store all logs for client-side filtering
  const [showFilterBuilder, setShowFilterBuilder] = useState(false)

  const [savedFilters, setSavedFilters] = useState<LogFilter[]>([])
  const [saveFilterName, setSaveFilterName] = useState("")
  const [currentUserId] = useState("user-123") // Replace with actual user ID from auth
  const [tableStatus, setTableStatus] = useState<{
    exists: boolean
    needsCreation: boolean
    needsRLSFix: boolean
    sql?: string
  }>({ exists: false, needsCreation: false, needsRLSFix: false })
  const [showTableSetup, setShowTableSetup] = useState(false)
  const [currentFilterName, setCurrentFilterName] = useState("")

  // Function to check table status
  const checkTableStatus = useCallback(async () => {
    try {
      const status = await logFiltersApi.checkTableStatus()
      if (status.needsTableCreation) {
        setTableStatus({
          exists: false,
          needsCreation: true,
          needsRLSFix: false,
          sql: status.sql,
        })
      } else if (status.needsRLSFix) {
        setTableStatus({
          exists: true,
          needsCreation: false,
          needsRLSFix: true,
          sql: status.sql,
        })
      } else if (status.success) {
        setTableStatus({
          exists: true,
          needsCreation: false,
          needsRLSFix: false,
        })
      }
    } catch (error) {
      logger.error("Error checking table status:", error)
    }
  }, [])

  // Function to load saved filters
  const loadSavedFilters = useCallback(async () => {
    try {
      const { data, error, needsTableCreation, needsRLSFix, sql } = await logFiltersApi.getLogFilters(currentUserId)

      if (needsTableCreation) {
        setTableStatus({
          exists: false,
          needsCreation: true,
          needsRLSFix: false,
          sql,
        })
        setSavedFilters([])
        return
      }

      if (needsRLSFix) {
        setTableStatus({
          exists: true,
          needsCreation: false,
          needsRLSFix: true,
          sql,
        })
        setSavedFilters([])
        return
      }

      if (error) {
        logger.error("Error loading saved filters:", error)
        setSavedFilters([])
        return
      }

      setSavedFilters(data)
      setTableStatus({
        exists: true,
        needsCreation: false,
        needsRLSFix: false,
      })
    } catch (error) {
      logger.error("Error loading saved filters:", error)
      setSavedFilters([])
    }
  }, [currentUserId])

  // Function to save current filter
  const saveCurrentFilter = async () => {
    if (!saveFilterName.trim()) return

    try {
      const { data, error, needsTableCreation, needsRLSFix, sql } = await logFiltersApi.saveLogFilter({
        name: saveFilterName,
        description: "",
        user_id: currentUserId,
        filter_data: filters,
        is_public: false,
        tags: [],
      })

      if (needsTableCreation) {
        setTableStatus({
          exists: false,
          needsCreation: true,
          needsRLSFix: false,
          sql,
        })
        setShowTableSetup(true)
        return
      }

      if (needsRLSFix) {
        setTableStatus({
          exists: true,
          needsCreation: false,
          needsRLSFix: true,
          sql,
        })
        setShowTableSetup(true)
        return
      }

      if (error) {
        logger.error("Error saving filter:", error)
        return
      }

      // Reload saved filters
      await loadSavedFilters()

      // Reset form
      setSaveFilterName("")

      logger.debug("Filter saved successfully!")
    } catch (error) {
      logger.error("Error saving filter:", error)
    }
  }

  // Function to load a saved filter
  const loadSavedFilter = async (savedFilter: LogFilter) => {
    try {
      // Apply the filter
      setFilters(savedFilter.filter_data)
      setSelectedTypes([]) // Clear event type selection when loading saved filter
      setCurrentFilterName(savedFilter.name) // Set the current filter name
      setPage(1)

      logger.debug(`Loaded filter: ${savedFilter.name}`)
    } catch (error) {
      logger.error("Error loading filter:", error)
    }
  }

  // Function to delete a saved filter
  const deleteSavedFilter = async (filterId: string) => {
    try {
      const { success, error } = await logFiltersApi.deleteLogFilter(filterId)
      if (error) {
        logger.error("Error deleting filter:", error)
        return
      }

      // Reload saved filters
      await loadSavedFilters()
      logger.debug("Filter deleted successfully!")
    } catch (error) {
      logger.error("Error deleting filter:", error)
    }
  }

  // Function to copy SQL to clipboard
  const copySqlToClipboard = async (sql: string) => {
    try {
      await navigator.clipboard.writeText(sql)
      logger.debug("SQL copied to clipboard!")
    } catch (error) {
      logger.error("Failed to copy SQL:", error)
    }
  }

  // Function to get total record count
  const getTotalRecordCount = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      let countQuery = supabase.from("logs").select("*", { count: "exact", head: true })

      if (searchTerm) {
        countQuery = countQuery.or(
          `event_type.ilike.%${searchTerm}%,profile_id.ilike.%${searchTerm}%,campaign_id.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,device.ilike.%${searchTerm}%,os.ilike.%${searchTerm}%`,
        )
      }

      if (selectedTypes.length > 0) {
        countQuery = countQuery.in("event_type", selectedTypes)
      }

      const { count, error } = await countQuery

      if (error) {
        logger.error("Error getting count:", error)
        throw error
      }

      logger.debug(`Total record count: ${count}`)
      return count || 0
    } catch (error) {
      logger.error("Error in getTotalRecordCount:", error)
      return 0
    }
  }, [searchTerm, selectedTypes])

  // Function to get total count of all records in the database
  const getTotalDatabaseRecords = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      const { count, error } = await supabase.from("logs").select("*", { count: "exact", head: true })

      if (error) {
        logger.error("Error getting total database count:", error)
        throw error
      }

      logger.debug(`Total database records: ${count}`)
      return count || 0
    } catch (error) {
      logger.error("Error in getTotalDatabaseRecords:", error)
      return 0
    }
  }, [])

  // Function to fetch all logs for client-side filtering
  const fetchAllLogs = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      logger.debug("🔍 Fetching all logs for filtering...")

      // Build query with basic filters (search and event type)
      let query = supabase.from("logs").select("*")

      if (searchTerm) {
        query = query.or(
          `event_type.ilike.%${searchTerm}%,profile_id.ilike.%${searchTerm}%,campaign_id.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,device.ilike.%${searchTerm}%,os.ilike.%${searchTerm}%`,
        )
      }

      if (selectedTypes.length > 0) {
        query = query.in("event_type", selectedTypes)
      }

      // Apply sorting
      query = query.order(sortConfig.key, { ascending: sortConfig.direction === "asc" })

      const { data, error } = await query

      if (error) {
        logger.error("❌ Query execution failed:", error)
        throw error
      }

      logger.debug(`✅ Fetched ${data?.length || 0} logs for filtering`)
      return data || []
    } catch (error) {
      logger.error("💥 Error in fetchAllLogs:", error)
      return []
    }
  }, [searchTerm, selectedTypes, sortConfig])

  // Function to apply advanced filters client-side
  const applyAdvancedFilters = useCallback(
    (logs: any[]) => {
      if (filters.length === 0) return logs

      return logs.filter((log) => {
        return filters.some((group) => {
          return group.conditions.every((condition) => {
            const logValue = getLogValue(log, condition.field)
            const fieldType = getLogFieldType(condition.field)

            if (!logValue && condition.value) return false

            switch (fieldType) {
              case "string":
                return applyStringOperator(logValue?.toString() || "", condition.operator, condition.value)
              case "number":
                return applyNumberOperator(
                  Number(logValue) || 0,
                  condition.operator,
                  Number.parseFloat(condition.value),
                )
              case "date":
                return applyDateOperator(new Date(logValue), condition.operator, new Date(condition.value))
              default:
                return false
            }
          })
        })
      })
    },
    [filters],
  )

  // Function to fetch logs with Supabase client
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      logger.debug(`🔍 Fetching logs for page ${page}, pageSize ${pageSize}...`)

      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      // Test basic connection first
      logger.debug("🔗 Testing basic connection...")
      const { data: testData, error: testError } = await supabase.from("logs").select("id").limit(1)

      if (testError) {
        logger.error("❌ Basic connection test failed:", testError)
        throw new Error(`Connection test failed: ${testError.message}`)
      }

      logger.debug("✅ Basic connection successful")

      // Fetch all logs for filtering
      const allLogsData = await fetchAllLogs()
      setAllLogs(allLogsData)

      // Apply advanced filters
      const filteredLogs = applyAdvancedFilters(allLogsData)

      // Update total records and pages based on filtered results
      setTotalRecords(filteredLogs.length)
      setTotalPages(Math.ceil(filteredLogs.length / pageSize))

      // Apply pagination to filtered results
      const offset = (page - 1) * pageSize
      const paginatedLogs = filteredLogs.slice(offset, offset + pageSize)

      logger.debug(`✅ Query successful: received ${paginatedLogs.length} records (${filteredLogs.length} total after filtering)`, )

      setLogs(paginatedLogs)
      setDebugInfo(
        `✅ Success: Page ${page}/${Math.ceil(filteredLogs.length / pageSize)}, Records: ${paginatedLogs.length}/${filteredLogs.length}`,
      )
    } catch (error) {
      logger.error("💥 Error in fetchLogs:", error)
      setErrorMessage(`Error: ${error.message || "Failed to fetch logs"}`)
      setLogs([])
      setDebugInfo(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, fetchAllLogs, applyAdvancedFilters])

  // Function to update total database count
  const updateTotalDatabaseCount = useCallback(async () => {
    const count = await getTotalDatabaseRecords()
    setTotalDatabaseRecords(count)
  }, [getTotalDatabaseRecords])

  // Function to fetch all event types
  const fetchEventTypes = useCallback(async () => {
    try {
      if (!supabase) {
        logger.error("Supabase client is not initialized")
        return
      }

      const { data, error } = await supabase.from("logs").select("event_type")

      if (error) {
        logger.error("Error fetching event types:", error)
        return
      }

      const uniqueTypes = Array.from(new Set(data.map((log) => log.event_type).filter(Boolean)))
      setEventTypes(uniqueTypes)
    } catch (error) {
      logger.error("Error fetching event types:", error)
    }
  }, [])

  // Function to request sort
  const requestSort = (key: string) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction: direction as "asc" | "desc" })
  }

  // Function to get event badge color and icon
  const getEventBadgeInfo = (type: string) => {
    switch (type) {
      case "Message Delivery":
        return { variant: "translucent-blue" as const, icon: MessageSquare }
      case "Open":
        return { variant: "translucent-green" as const, icon: Eye }
      case "Click":
        return { variant: "translucent-purple" as const, icon: ExternalLink }
      case "Conversion":
        return { variant: "translucent-green" as const, icon: Activity }
      case "Bounce":
        return { variant: "translucent-orange" as const, icon: AlertCircle }
      case "Unsubscribe":
        return { variant: "translucent-orange" as const, icon: X }
      case "Spam Report":
        return { variant: "translucent-orange" as const, icon: AlertCircle }
      case "Error":
        return { variant: "translucent-orange" as const, icon: AlertCircle }
      case "Warning":
        return { variant: "translucent-orange" as const, icon: AlertCircle }
      case "Info":
        return { variant: "translucent-blue" as const, icon: Info }
      case "Debug":
        return { variant: "translucent-gray" as const, icon: Info }
      case "System":
        return { variant: "translucent-neutral" as const, icon: Activity }
      case "Test":
        return { variant: "translucent-blue" as const, icon: Activity }
      default:
        return { variant: "translucent-gray" as const, icon: Info }
    }
  }

  // Function to format details for display
  const formatDetails = (details: any) => {
    if (!details) return "No details"

    if (typeof details === "string") {
      try {
        const parsed = JSON.parse(details)
        return parsed
      } catch {
        return details
      }
    }

    return details
  }

  // Function to get action description from details
  const getActionDescription = (details: any) => {
    const formatted = formatDetails(details)

    if (typeof formatted === "object" && formatted !== null) {
      // Look specifically for action_description
      if (formatted.action_description) {
        return formatted.action_description
      }

      // Fallback to other description fields
      if (formatted.description) {
        return formatted.description
      }

      if (formatted.message) {
        return formatted.message
      }

      if (formatted.action) {
        return formatted.action
      }

      if (formatted.event) {
        return formatted.event
      }

      // If no description fields found, show that it's available in details
      const keys = Object.keys(formatted)
      if (keys.length > 0) {
        return `Details available (${keys.length} fields)`
      }
    }

    if (typeof formatted === "string") {
      return formatted.length > 150 ? formatted.substring(0, 150) + "..." : formatted
    }

    return "No description available"
  }

  // Function to toggle row expansion
  const toggleRowExpansion = (logId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  // Function to handle page change
  const handlePageChange = (newPage) => {
    logger.debug(`Changing page from ${page} to ${newPage}`)
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Function to display full profile ID
  const displayProfileId = (profileId: string | null) => {
    if (!profileId) return "No profile"
    return profileId
  }

  // Function to clear all filters
  const clearAllFilters = () => {
    setFilters([])
    setSearchTerm("")
    setSelectedTypes([])
    setSaveFilterName("")
    setCurrentFilterName("") // Clear the current filter name
    setPage(1)
    setShowFilterBuilder(false)
  }

  // Check Supabase availability on initial load
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        if (!supabase) {
          setConnectionStatus("error")
          setConnectionMessage("Supabase client is not initialized")
          return
        }

        const { data, error } = await supabase.from("logs").select("id").limit(1)

        if (error) {
          logger.error("Supabase connection test failed:", error)
          setConnectionStatus("error")
          setConnectionMessage(`Failed to connect to Supabase: ${error.message}`)
          return
        }

        logger.debug("Supabase connection test successful")
        setConnectionStatus("connected")
        setConnectionMessage("Connected to Supabase")

        fetchEventTypes()

        const totalCount = await getTotalDatabaseRecords()
        setTotalDatabaseRecords(totalCount)
      } catch (error: any) {
        logger.error("Error checking Supabase availability:", error)
        setConnectionStatus("error")
        setConnectionMessage(`Error checking Supabase connection: ${error.message}`)
      }
    }

    checkSupabase()
  }, [fetchEventTypes, getTotalDatabaseRecords])

  // Fetch logs when filters change or page changes
  useEffect(() => {
    fetchLogs()
    updateTotalDatabaseCount()
  }, [fetchLogs, updateTotalDatabaseCount])

  // Load saved filters on component mount
  useEffect(() => {
    loadSavedFilters()
  }, [loadSavedFilters])

  const startRecord = (page - 1) * pageSize + 1
  const endRecord = Math.min(page * pageSize, totalRecords)

  const hasActiveFilters = filters.length > 0 || searchTerm || selectedTypes.length > 0

  return (
    <div className="space-y-6">
      {/* Table Setup Alert - Updated to handle RLS issues */}
      {(tableStatus.needsCreation || tableStatus.needsRLSFix) && (
        <Alert className="border-red-200 bg-red-50">
          <Database className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {tableStatus.needsCreation ? (
                <p>
                  <strong>Database Setup Required:</strong> The log_filters table doesn't exist yet. To save and load
                  filters, please create the table using the SQL below.
                </p>
              ) : (
                <p>
                  <strong>RLS Policy Issue:</strong> Row Level Security policies are blocking filter operations. Please
                  run the SQL below to fix this issue.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTableSetup(true)}
                  className="text-red-700 border-red-300"
                >
                  <Database className="mr-2 h-4 w-4" />
                  {tableStatus.needsCreation ? "View Setup Instructions" : "Fix RLS Policies"}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error message - keep as is */}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-md bg-red-50 text-red-800">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {errorMessage}
          </p>
        </div>
      )}

      {/* Filter Logs Section - only show when activated */}
      {showFilterBuilder && (
        <Card className="shadow-sm">
          <CardContent className="px-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Filter Logs</h3>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter name"
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                    className="w-32"
                  />
                  <Button
                    onClick={saveCurrentFilter}
                    disabled={
                      !saveFilterName.trim() ||
                      filters.length === 0 ||
                      tableStatus.needsCreation ||
                      tableStatus.needsRLSFix
                    }
                    className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      clearAllFilters()
                      setShowFilterBuilder(false)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <LogFilterBuilder
                onFilterChange={(newFilters) => {
                  setFilters(newFilters)
                  setPage(1)
                }}
                initialFilters={filters}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table with simplified header */}
      <div className="bg-background border border-border rounded-md">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-background">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedTypes.length > 0
              ? `${selectedTypes[0]} Logs${searchTerm ? ` - "${searchTerm}"` : ""}`
              : searchTerm
                ? `All Logs - "${searchTerm}"`
                : "All Logs"}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filters.length > 0 ? `${filters.length} filter${filters.length > 1 ? "s" : ""}` : "filtered"}
              </Badge>
            )}
          </h2>
          <div className="flex items-center gap-3">
            <CombinedFilterSelector
              eventTypes={eventTypes}
              savedFilters={savedFilters}
              selectedTypes={selectedTypes}
              currentFilterName={currentFilterName}
              onEventTypeChange={(types) => {
                setSelectedTypes(types)
                setCurrentFilterName("") // Clear filter name when selecting event type
                setPage(1)
              }}
              onSavedFilterSelect={loadSavedFilter}
              onClearFilters={clearAllFilters}
              tableStatus={tableStatus}
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-9 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowFilterBuilder(true)}>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filter Logs
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export logs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Keep the rest of the table structure as is */}
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead
                  className="text-left text-sm font-medium text-muted-foreground px-6 py-3 cursor-pointer"
                  onClick={() => requestSort("log_time")}
                >
                  <div className="flex items-center">
                    Time
                    {sortConfig.key === "log_time" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="inline ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="text-left text-sm font-medium text-muted-foreground px-6 py-3 cursor-pointer"
                  onClick={() => requestSort("event_type")}
                >
                  <div className="flex items-center">
                    Event type
                    {sortConfig.key === "event_type" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="inline ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="text-left text-sm font-medium text-muted-foreground px-6 py-3 cursor-pointer"
                  onClick={() => requestSort("profile_id")}
                >
                  <div className="flex items-center">
                    Profile
                    {sortConfig.key === "profile_id" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="inline ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="text-left text-sm font-medium text-muted-foreground px-6 py-3">
                  Description
                </TableHead>
                <TableHead className="text-right text-sm font-medium text-muted-foreground px-6 py-3 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No logs found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const badgeInfo = getEventBadgeInfo(log.event_type)
                  const IconComponent = badgeInfo.icon

                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleRowExpansion(log.id)}
                      >
                        <TableCell className="px-6 py-4 text-sm text-foreground">
                          <div className="flex flex-col">
                            <span>{format(new Date(log.log_time), "yyyy-MM-dd HH:mm:ss")}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.log_time), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={badgeInfo.variant} className="inline-flex items-center gap-1">
                            <IconComponent className="h-3 w-3" />
                            {log.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-foreground font-mono">
                          {log.profile_id ? (
                            <span className="break-all">{displayProfileId(log.profile_id)}</span>
                          ) : (
                            <span className="text-muted-foreground">No profile</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-foreground">
                          {getActionDescription(log.details)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleRowExpansion(log.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={5} className="px-6 py-6 bg-muted/50 border-b border-border">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">ID</Label>
                                  <p className="text-sm font-mono text-gray-900">{log.id}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Contact ID</Label>
                                  <p className="text-sm font-mono text-gray-900">{log.contact_id || "N/A"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Campaign ID</Label>
                                  <p className="text-sm font-mono text-gray-900">{log.campaign_id || "N/A"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Message ID</Label>
                                  <p className="text-sm font-mono text-gray-900">{log.message_id || "N/A"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">IP Address</Label>
                                  <p className="text-sm text-gray-900">{log.ip_address || "N/A"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Device</Label>
                                  <p className="text-sm text-gray-900">{log.device || "N/A"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">OS</Label>
                                  <p className="text-sm text-gray-900">{log.os || "N/A"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Location</Label>
                                  <p className="text-sm text-gray-900">{log.location || "N/A"}</p>
                                </div>
                              </div>
                              {log.user_agent && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">User Agent</Label>
                                  <p className="text-sm break-all bg-white p-2 rounded border text-gray-900">
                                    {log.user_agent}
                                  </p>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Details</Label>
                                <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-40 text-gray-900">
                                  {JSON.stringify(formatDetails(log.details), null, 2)}
                                </pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination inside border */}
        <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                const newPageSize = Number(value)
                setPageSize(newPageSize)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
            <span className="text-sm text-muted-foreground ml-4">
              Showing {startRecord} to {endRecord} of {totalRecords} logs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table Setup Dialog */}
      <Dialog open={showTableSetup} onOpenChange={setShowTableSetup}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{tableStatus.needsCreation ? "Database Setup Required" : "Fix RLS Policies"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {tableStatus.needsCreation ? (
                  <p>
                    <strong>Important:</strong> The SQL below will create the table and disable Row Level Security (RLS)
                    for demo purposes. In production, you should implement proper authentication and RLS policies.
                  </p>
                ) : (
                  <p>
                    <strong>RLS Issue:</strong> The table exists but Row Level Security policies are blocking
                    operations. The SQL below will fix this by disabling RLS for demo purposes.
                  </p>
                )}
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground">
              {tableStatus.needsCreation
                ? "To enable saving and loading log filters, you need to create the log_filters table in your Supabase database. Please run the following SQL in your Supabase SQL editor:"
                : "To fix the RLS policy issues, please run the following SQL in your Supabase SQL editor:"}
            </p>
            <div className="relative">
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96 border">
                <code>{tableStatus.sql}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copySqlToClipboard(tableStatus.sql || "")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTableSetup(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowTableSetup(false)
                  loadSavedFilters() // Retry loading filters
                }}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
              >
                {tableStatus.needsCreation ? "I've Created the Table" : "I've Fixed the RLS Policies"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Logs
