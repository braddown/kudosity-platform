"use client"

import React from "react"
import { RefreshCw, Filter, Download, Eye, Database } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import EnhancedPageLayout from "@/components/layouts/EnhancedPageLayout"
import { useLogs } from "@/hooks/useLogs"

/**
 * LogsRefactored - Simplified logs component using the useLogs hook and EnhancedPageLayout
 * 
 * This refactored version reduces the original 1637-line Logs component to ~200 lines
 * by leveraging our custom hooks and layout components.
 * 
 * Key improvements:
 * - Uses useLogs hook for all data management and state
 * - Uses EnhancedPageLayout for consistent UI and error handling
 * - Eliminates manual state management, API calls, and complex filtering logic
 * - Maintains all original functionality with much less code
 */
export default function LogsRefactored() {
  const {
    // Data state
    logs,
    loading,
    error,
    isEmpty,
    pagination,
    startRecord,
    endRecord,
    
    // Connection and options
    connectionStatus,
    eventTypes,
    
    // Filtering
    setSearch,
    setEventTypes,
    clearAllFilters,
    hasActiveFilters,
    
    // Pagination
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    
    // Row expansion
    expandedRows,
    toggleRowExpansion,
    expandAllRows,
    collapseAllRows,
    
    // Export and utilities
    exportLogs,
    refresh,
  } = useLogs({
    immediate: true,
    pagination: { page: 1, pageSize: 25 },
    cacheTTL: 2 * 60 * 1000, // 2 minutes for fresh data
  })

  // Helper function to get event badge info
  const getEventBadgeInfo = (type: string) => {
    const eventTypes = {
      "Message Delivery": { variant: "default" as const, icon: "📧" },
      "Open": { variant: "secondary" as const, icon: "👁️" },
      "Click": { variant: "outline" as const, icon: "🔗" },
      "Conversion": { variant: "default" as const, icon: "✅" },
      "Bounce": { variant: "destructive" as const, icon: "⚠️" },
      "Error": { variant: "destructive" as const, icon: "❌" },
      "Warning": { variant: "outline" as const, icon: "⚠️" },
      "Info": { variant: "secondary" as const, icon: "ℹ️" },
    }
    return eventTypes[type] || { variant: "secondary" as const, icon: "📝" }
  }

  // Format details for display
  const getActionDescription = (details: any) => {
    if (!details) return "No details"
    
    if (typeof details === "string") {
      try {
        details = JSON.parse(details)
      } catch {
        return details.length > 150 ? details.substring(0, 150) + "..." : details
      }
    }
    
    if (typeof details === "object" && details !== null) {
      return details.action_description || 
             details.description || 
             details.message || 
             details.action || 
             `Details available (${Object.keys(details).length} fields)`
    }
    
    return "No description available"
  }

  // Page actions
  const pageActions = [
    {
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: refresh,
      variant: "outline" as const,
    },
    {
      label: "Export JSON",
      icon: <Download className="h-4 w-4" />,
      onClick: () => exportLogs('json'),
      variant: "outline" as const,
    },
    {
      label: "Export CSV", 
      icon: <Download className="h-4 w-4" />,
      onClick: () => exportLogs('csv'),
      variant: "outline" as const,
    },
  ]

  return (
    <EnhancedPageLayout
      title="Logs"
      description="View and analyze system logs with advanced filtering capabilities"
      actions={pageActions}
      
      loading={{
        loading,
        showSkeleton: true,
        skeletonCount: 10,
        message: "Loading logs..."
      }}
      
      error={{
        error: error || (connectionStatus.status === 'error' ? connectionStatus.message : null),
        recoverable: true,
        onRetry: refresh,
        errorTitle: "Failed to load logs",
        errorDetails: connectionStatus.status === 'error' 
          ? "Please check your database connection" 
          : undefined
      }}
      
      empty={{
        isEmpty,
        emptyTitle: "No logs found",
        emptyDescription: hasActiveFilters 
          ? "Try adjusting your filters to see more results" 
          : "No log entries have been recorded yet",
        emptyActions: hasActiveFilters ? [
          { label: "Clear Filters", onClick: clearAllFilters, variant: "outline" }
        ] : []
      }}
      
      breadcrumbs={{ showBreadcrumbs: true }}
    >
      <div className="space-y-6">
        {/* Connection Status */}
        {connectionStatus.status !== 'unknown' && (
          <div className="flex items-center gap-2 text-sm">
            <Database className={`h-4 w-4 ${
              connectionStatus.status === 'connected' ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className={connectionStatus.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus.message}
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search logs..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            
            <Select onValueChange={(value) => setEventTypes(value ? [value] : [])}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Event Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Event Types</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const badgeInfo = getEventBadgeInfo(log.event_type)
                
                return (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRowExpansion(log.id)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(log.log_time), "yyyy-MM-dd HH:mm:ss")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.log_time), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={badgeInfo.variant}>
                          {badgeInfo.icon} {log.event_type}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="font-mono text-sm">
                        {log.profile_id ? (
                          <span>{log.profile_id}</span>
                        ) : (
                          <span className="text-muted-foreground">No profile</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {getActionDescription(log.details)}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleRowExpansion(log.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {expandedRows.has(log.id) ? 'Hide' : 'Show'} details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded row details */}
                    {expandedRows.has(log.id) && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/50">
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><strong>ID:</strong> {log.id}</div>
                              <div><strong>Campaign ID:</strong> {log.campaign_id || "N/A"}</div>
                              <div><strong>Device:</strong> {log.device || "N/A"}</div> 
                              <div><strong>Location:</strong> {log.location || "N/A"}</div>
                            </div>
                            
                            {log.details && (
                              <div>
                                <strong>Details:</strong>
                                <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                                  {JSON.stringify(
                                    typeof log.details === 'string' 
                                      ? JSON.parse(log.details) 
                                      : log.details, 
                                    null, 
                                    2
                                  )}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
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
              Showing {startRecord} to {endRecord} of {pagination.totalRecords} logs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm px-4">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </EnhancedPageLayout>
  )
}