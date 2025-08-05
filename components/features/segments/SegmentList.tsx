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
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { segmentsApi, type Segment } from "@/api/segments-api"
import { useToast } from "@/components/ui/use-toast"

interface SegmentWithStats extends Segment {
  profileCount: number
  messagesSent: number
  revenue: number
  filter: string
  integrationStatus: "Active" | "Inactive" | "Paused"
  integrations: string[]
}

const useSegments = () => {
  const [segments, setSegments] = useState<SegmentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSegments = async () => {
    try {
      setLoading(true)
      setError(null)

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
        profileCount: segment.estimated_size || 0,
        messagesSent: 0, // This would come from actual message tracking
        revenue: 0, // This would come from actual revenue tracking
        filter: segment.filter_criteria ? JSON.stringify(segment.filter_criteria, null, 2) : "No filter criteria",
        integrationStatus: segment.auto_update ? "Active" : "Inactive",
        integrations: [], // This would come from actual integration data
      }))

      setSegments(transformedSegments)
    } catch (err) {
      setError("Failed to fetch segments")
      console.error("Error fetching segments:", err)
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
      const queryParams = new URLSearchParams({
        segmentId: segment.id.toString(),
        segmentName: segment.name,
        segmentFilter: segment.filter,
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
      console.log("Managing integration for segment:", segment.id)
    } else {
      // Handle other actions
      console.log(`Action: ${action}, Segment ID: ${segment.id}`)
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
    return (
      <div className="space-y-4">
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-md p-8 text-center">
          <div className="text-muted-foreground">Loading segments...</div>
        </div>
      </div>
    )
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
                      {segment.name}
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
                        <DropdownMenuItem onClick={() => handleAction("rename", segment)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("integration", segment)}>
                          <Zap className="mr-2 h-4 w-4" />
                          <span>Manage Integration</span>
                        </DropdownMenuItem>
                        {!segment.id.startsWith("system-") && (
                          <DropdownMenuItem onClick={() => handleAction("delete", segment)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
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
