"use client"

import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MessageSquare,
  Edit,
  Trash2,
  Zap,
  Cloud,
  Database,
  Search,
} from "lucide-react"
import { logger } from "@/lib/utils/logger"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { segmentsApi, type Segment } from "@/lib/api/segments-api"
import { profilesApi } from "@/lib/api/profiles-api"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSection } from "@/components/ui/loading"

interface SegmentWithStats extends Segment {
  profileCount: number
  messagesSent: number
  revenue: number
  filter: string
  integrationStatus: "Active" | "Inactive" | "Paused"
  integrations: string[]
}

// Helper function to get nested values from an object
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Helper function to evaluate a single condition
const evaluateCondition = (profile: any, condition: any): boolean => {
  const { field, operator, value } = condition
  const fieldValue = getNestedValue(profile, field)
  
  // Handle null/undefined values
  if (fieldValue === null || fieldValue === undefined) {
    if (operator === 'is_empty' || operator === 'not_exists') return true
    if (operator === 'exists') return false
    if (operator === 'equals' && (value === '' || value === null)) return true
    return false
  }

  // Special handling for boolean fields
  if (typeof fieldValue === 'boolean') {
    // Convert the filter value to boolean for comparison
    let compareValue = value
    if (value === 'Yes' || value === 'yes' || value === 'true' || value === true || value === '1') {
      compareValue = true
    } else if (value === 'No' || value === 'no' || value === 'false' || value === false || value === '0') {
      compareValue = false
    }
    
    switch (operator) {
      case 'equals':
      case 'is':
        return fieldValue === compareValue
      case 'not_equals':
      case 'is not':
        return fieldValue !== compareValue
      default:
        return fieldValue === compareValue
    }
  }
  
  // Also handle when the field value is a string "true"/"false" but should be treated as boolean
  if (field.includes('is_') || field.includes('has_')) {
    const fieldStr = String(fieldValue).toLowerCase()
    const valueStr = String(value).toLowerCase()
    
    // Normalize boolean strings
    const normalizedField = (fieldStr === 'true' || fieldStr === 'yes' || fieldStr === '1') ? 'true' : 
                           (fieldStr === 'false' || fieldStr === 'no' || fieldStr === '0') ? 'false' : fieldStr
    const normalizedValue = (valueStr === 'true' || valueStr === 'yes' || valueStr === '1') ? 'true' : 
                           (valueStr === 'false' || valueStr === 'no' || valueStr === '0') ? 'false' : valueStr
    
    if (operator === 'equals' || operator === 'is') {
      return normalizedField === normalizedValue
    } else if (operator === 'not_equals' || operator === 'is not') {
      return normalizedField !== normalizedValue
    }
  }

  // Special handling for status field - always compare lowercase
  if (field === 'status') {
    const normalizedFieldValue = String(fieldValue).toLowerCase()
    const normalizedValue = String(value).toLowerCase()
    
    switch (operator) {
      case 'equals':
      case 'is':
        return normalizedFieldValue === normalizedValue
      case 'not_equals':
      case 'is not':
        return normalizedFieldValue !== normalizedValue
      case 'contains':
        return normalizedFieldValue.includes(normalizedValue)
      case 'not_contains':
        return !normalizedFieldValue.includes(normalizedValue)
      case 'starts_with':
        return normalizedFieldValue.startsWith(normalizedValue)
      case 'ends_with':
        return normalizedFieldValue.endsWith(normalizedValue)
      default:
        return false
    }
  }

  switch (operator) {
    case 'equals':
    case 'is':
      return String(fieldValue).toLowerCase() === String(value).toLowerCase()
    case 'not_equals':
    case 'is not':
      return String(fieldValue).toLowerCase() !== String(value).toLowerCase()
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
    case 'greater_than':
      return Number(fieldValue) > Number(value)
    case 'less_than':
      return Number(fieldValue) < Number(value)
    case 'exists':
      return true
    case 'not_exists':
    case 'is_empty':
      return false
    default:
      return false
  }
}

// Apply segment filter to profiles
const applySegmentFilter = (profiles: any[], filterCriteria: any): any[] => {
  if (!filterCriteria) return profiles
  
  // Check if there's an explicit status = 'Deleted' filter
  let hasDeletedFilter = false
  
  if (filterCriteria.filterGroups) {
    filterCriteria.filterGroups.forEach((group: any) => {
      group.conditions?.forEach((condition: any) => {
        if (condition.field === 'status' && 
            condition.operator === 'equals' && 
            condition.value?.toLowerCase() === 'deleted') {
          hasDeletedFilter = true
        }
      })
    })
  } else if (filterCriteria.conditions) {
    filterCriteria.conditions.forEach((condition: any) => {
      if (condition.field === 'status' && 
          condition.operator === 'equals' && 
          condition.value?.toLowerCase() === 'deleted') {
        hasDeletedFilter = true
      }
    })
  }
  
  // Start with profiles, excluding deleted unless explicitly filtered for
  let filtered = hasDeletedFilter 
    ? profiles 
    : profiles.filter(p => {
        const stage = (p.status || '').toLowerCase()
        return stage !== 'deleted'
      })
  
  // Apply filter groups or conditions
  if (filterCriteria.filterGroups && filterCriteria.filterGroups.length > 0) {
    filtered = filtered.filter(profile => {
      return filterCriteria.filterGroups.some((group: any) => {
        if (!group.conditions || group.conditions.length === 0) return true
        return group.conditions.every((condition: any) => 
          evaluateCondition(profile, condition)
        )
      })
    })
  } else if (filterCriteria.conditions && filterCriteria.conditions.length > 0) {
    filtered = filtered.filter(profile => {
      return filterCriteria.conditions.every((condition: any) => 
        evaluateCondition(profile, condition)
      )
    })
  }
  
  return filtered
}

const useSegments = () => {
  const [segments, setSegments] = useState<SegmentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSegments = async () => {
    try {
      setLoading(true)
      setError(null)

      // First fetch all profiles to calculate accurate counts
      logger.debug('SegmentList: Fetching all profiles for count calculation...')
      const profilesResult = await profilesApi.getProfiles()
      const profiles = profilesResult.data || []
      logger.debug(`SegmentList: Received ${profiles.length} profiles from API`)

      // Get custom segments from database
      const { data: customSegments, error: customError } = await segmentsApi.getSegments()

      if (customError) {
        setError(customError)
        return
      }

      // Get system segments
      const systemSegments = segmentsApi.getSystemSegments()

      // Combine and transform segments
      const allSegments = [...systemSegments, ...(customSegments || [])]

      const transformedSegments: SegmentWithStats[] = allSegments.map((segment) => ({
        ...segment,
        // Use cached profile_count from database, fallback to calculated count
        profileCount: (segment as any).profile_count || (segment.filter_criteria ? applySegmentFilter(profiles, segment.filter_criteria).length : 0),
        messagesSent: 0, // This would come from actual message tracking
        revenue: 0, // This would come from actual revenue tracking
        filter: segment.filter_criteria ? JSON.stringify(segment.filter_criteria, null, 2) : "No filter criteria",
        integrationStatus: segment.auto_update ? "Active" : "Inactive",
        integrations: [], // This would come from actual integration data
      }))

      setSegments(transformedSegments)
    } catch (err) {
      setError("Failed to fetch segments")
      logger.error("Error fetching segments:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSegments()
  }, [])

  return { segments, loading, error, refetch: fetchSegments }
}

const renderIntegrationIcons = (integrations: string[]) => {
  return (
    <div className="flex space-x-1">
      {integrations.map((integration, index) => {
        switch (integration) {
          case "Zapier":
            return <Zap key={index} className="h-4 w-4 text-blue-500" />
          case "Salesforce":
            return <Cloud key={index} className="h-4 w-4 text-blue-500" />
          case "Oracle":
            return <Database key={index} className="h-4 w-4 text-blue-500" />
          default:
            return null
        }
      })}
    </div>
  )
}

export default function SegmentList() {
  const router = useRouter()
  const { toast } = useToast()
  const { segments, loading, error, refetch } = useSegments()
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const filteredSegments = segments.filter((segment) => segment.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const toggleExpand = (id: string) => {
    setExpandedSegment(expandedSegment === id ? null : id)
  }

  const handleAction = async (action: string, segment: SegmentWithStats) => {
    if (action === "edit") {
      // Navigate to profiles page with segment loaded and filter conditions open
      const queryParams = new URLSearchParams({
        segmentId: segment.id.toString(),
        segmentName: segment.name,
        filterActive: "true",
        showInlineFilter: "true"
      }).toString()
      router.push(`/profiles?${queryParams}`)
    } else if (action === "delete") {
      if (segment.id.startsWith("system-")) {
        toast({
          title: "Cannot Delete",
          description: "System segments cannot be deleted",
          variant: "destructive",
        })
        return
      }

      if (confirm(`Are you sure you want to delete "${segment.name}"?`)) {
        try {
          const { success, error } = await segmentsApi.deleteSegment(segment.id)
          if (success) {
            toast({
              title: "Success",
              description: "Segment deleted successfully",
            })
            refetch()
          } else {
            toast({
              title: "Error",
              description: error || "Failed to delete segment",
              variant: "destructive",
            })
          }
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to delete segment",
            variant: "destructive",
          })
        }
      }
    } else if (action === "integration") {
      // Implement integration management logic here
      logger.debug("Managing integration for segment:", segment.id)
    } else {
      // Handle other actions
      logger.debug(`Action: ${action}, Segment ID: ${segment.id}`)
    }
  }

  const handleCreateNewSegment = () => {
    router.push("/profiles?newSegment=true&filterActive=true&createSegment=true")
  }

  const toggleSelectSegment = (id: string) => {
    setSelectedSegmentIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((segmentId) => segmentId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedSegmentIds([])
    } else {
      setSelectedSegmentIds(filteredSegments.map((segment) => segment.id))
    }
    setSelectAll(!selectAll)
  }

  // Expose functions to window object for the parent component
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).createNewSegment = handleCreateNewSegment
    }

    return () => {
      if (typeof window !== "undefined") {
        ;(window as any).createNewSegment = undefined
      }
    }
  }, [])

  if (loading) {
    return <LoadingSection message="Loading segments..." />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-md p-8 text-center">
          <div className="text-destructive">Error: {error}</div>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-md">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground">All Segments</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search segments..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/30 dark:bg-muted/40">
            <TableRow className="hover:bg-muted/40 dark:hover:bg-muted/50 border-border/50">
              <TableHead className="w-[40px]">
                <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} aria-label="Select all segments" />
              </TableHead>
              <TableHead className="w-[300px] font-medium text-foreground">Segment Name</TableHead>
              <TableHead className="font-medium text-foreground">Profiles</TableHead>
              <TableHead className="font-medium text-foreground">Messages Sent</TableHead>
              <TableHead className="font-medium text-foreground">Revenue</TableHead>
              <TableHead className="font-medium text-foreground">Integration</TableHead>
              <TableHead className="text-right font-medium text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSegments.map((segment) => (
              <React.Fragment key={segment.id}>
                <TableRow className="hover:bg-muted/20 dark:hover:bg-muted/30 border-border/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedSegmentIds.includes(segment.id)}
                      onCheckedChange={() => toggleSelectSegment(segment.id)}
                      aria-label={`Select ${segment.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center">
                      <Button variant="ghost" size="sm" className="mr-2 p-0" onClick={() => toggleExpand(segment.id)}>
                        {expandedSegment === segment.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <button
                        className="text-left hover:underline cursor-pointer"
                        onClick={() => router.push(`/profiles?segmentId=${segment.id}&segmentName=${encodeURIComponent(segment.name)}`)}
                      >
                        {segment.name}
                      </button>
                      {segment.id.startsWith("system-") && (
                        <Badge variant="translucent-blue" className="ml-2 text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{segment.profileCount.toLocaleString()}</TableCell>
                  <TableCell className="text-foreground">{segment.messagesSent.toLocaleString()}</TableCell>
                  <TableCell className="text-foreground">${segment.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          segment.integrationStatus === "Active"
                            ? "translucent-green"
                            : segment.integrationStatus === "Inactive"
                              ? "translucent-gray"
                              : "translucent-yellow"
                        }
                        className={
                          segment.integrationStatus === "Active"
                            ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
                            : segment.integrationStatus === "Inactive"
                              ? "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
                              : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
                        }
                      >
                        {segment.integrationStatus}
                      </Badge>
                      {renderIntegrationIcons(segment.integrations)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border-border/50">
                        <DropdownMenuItem onClick={() => handleAction("send", segment)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Send Message</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("edit", segment)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Segment Conditions</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("integration", segment)}>
                          <Zap className="mr-2 h-4 w-4" />
                          <span>Manage Integration</span>
                        </DropdownMenuItem>
                        {!segment.id.startsWith("system-") && (
                          <DropdownMenuItem onClick={() => handleAction("delete", segment)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Segment</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedSegment === segment.id && (
                  <TableRow className="border-border/50">
                    <TableCell colSpan={7} className="bg-muted/20 dark:bg-muted/30">
                      <div className="p-4">
                        <h4 className="text-sm font-semibold mb-2 text-foreground">Segment Filter:</h4>
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 p-3 rounded border border-border/50">
                          {segment.filter}
                        </pre>
                        {segment.tags && segment.tags.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-semibold mb-1 text-foreground">Tags:</h4>
                            <div className="flex flex-wrap gap-1">
                              {segment.tags.map((tag, index) => (
                                <Badge key={index} variant="translucent-blue" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
