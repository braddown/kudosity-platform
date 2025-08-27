"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSection } from "@/components/ui/loading"
import { Search, RefreshCw, MessageSquare, CheckCircle, XCircle, Clock, MousePointer } from "lucide-react"
import { kudosityAPI } from "@/lib/api/kudosity-api"
import { createClient } from "@/lib/auth/client"

interface Message {
  id: string
  recipient: string
  message: string
  sender: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  segments: number
  cost: number
  click_count: number
  sent_at: string
  delivered_at?: string
  failed_at?: string
  error_message?: string
  created_at: string
}

export function MessageHistory() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalMessages, setTotalMessages] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    clicks: 0,
    cost: 0,
  })

  useEffect(() => {
    loadMessages(1, false) // Load first page
    
    // Auto-refresh every 5 seconds to catch webhook updates
    const interval = setInterval(() => {
      loadMessages(1, false, true) // Pass true for auto-refresh
    }, 5000)
    
    return () => clearInterval(interval)
  }, [statusFilter, pageSize])

  const loadMessages = async (page: number = 1, append: boolean = false, isAutoRefresh = false) => {
    try {
      if (page === 1 && !isAutoRefresh) {
        setLoading(true)
      } else if (!isAutoRefresh) {
        setIsLoadingMore(true)
      }
      
      const supabase = createClient()
      
      // First get the total count
      let countQuery = supabase
        .from('message_history')
        .select('*', { count: 'exact', head: true })
      
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter)
      }
      
      const { count } = await countQuery
      setTotalMessages(count || 0)
      
      // Then get the paginated data
      const offset = (page - 1) * pageSize
      let query = supabase
        .from('message_history')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      if (append) {
        setMessages(prev => [...prev, ...(data || [])])
      } else {
        setMessages(data || [])
      }
      
      setCurrentPage(page)
      
      // Calculate statistics - fetch all for stats (or use a separate query)
      if (!isAutoRefresh && page === 1) {
        let statsQuery = supabase
          .from('message_history')
          .select('status, click_count, cost')
        
        if (statusFilter !== 'all') {
          statsQuery = statsQuery.eq('status', statusFilter)
        }
        
        const { data: statsData } = await statsQuery
        
        if (statsData) {
          const stats = statsData.reduce((acc, msg) => {
            acc.total++
            if (msg.status === 'sent') acc.sent++
            if (msg.status === 'delivered') acc.delivered++
            if (msg.status === 'failed' || msg.status === 'bounced') acc.failed++
            acc.clicks += msg.click_count || 0
            acc.cost += msg.cost || 0
            return acc
          }, { total: 0, sent: 0, delivered: 0, failed: 0, clicks: 0, cost: 0 })
          
          setStats(stats)
        }
      }
      
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      if (!isAutoRefresh) {
        setLoading(false)
        setIsLoadingMore(false)
      }
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMessages(1, false)
    setRefreshing(false)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      sent: { variant: "default", icon: MessageSquare },
      delivered: { variant: "success", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle },
      bounced: { variant: "destructive", icon: XCircle },
    }
    
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const filteredMessages = messages.filter(msg => 
    msg.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingSection message="Loading message history..." />
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Messages</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.delivered}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Clicks</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.clicks}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cost</CardDescription>
            <CardTitle className="text-2xl">${stats.cost.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-2xl">
              {stats.total > 0 
                ? `${((stats.delivered / stats.total) * 100).toFixed(1)}%`
                : '0%'
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Message History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by recipient or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Segments</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">{message.recipient}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span title={message.message}>{message.message}</span>
                      </TableCell>
                      <TableCell>{message.sender || 'Default'}</TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell>{message.segments}</TableCell>
                      <TableCell>
                        {message.click_count > 0 && (
                          <div className="flex items-center gap-1">
                            <MousePointer className="h-3 w-3" />
                            {message.click_count}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>${(message.cost || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {message.sent_at 
                          ? format(new Date(message.sent_at), 'MMM d, yyyy HH:mm')
                          : format(new Date(message.created_at), 'MMM d, yyyy HH:mm')
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalMessages > 0 && (
            <div className="flex items-center justify-between space-x-2 p-4 border-t">
              <div className="flex items-center gap-4">
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setCurrentPage(1)  // Reset to first page when changing page size
                  }}
                >
                  <SelectTrigger className="w-20 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, totalMessages)} to{" "}
                  {Math.min(currentPage * pageSize, totalMessages)} of {totalMessages} messages
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 1) {
                      loadMessages(currentPage - 1, false)
                    }
                  }}
                  disabled={currentPage === 1 || isLoadingMore}
                >
                  Previous
                </Button>

                {/* Page numbers */}
                {(() => {
                  const totalPages = Math.ceil(totalMessages / pageSize)
                  if (totalPages <= 7) {
                    // Show all pages if 7 or fewer
                    return Array.from({ length: totalPages }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => loadMessages(page, false)}
                          disabled={isLoadingMore}
                        >
                          {page}
                        </Button>
                      )
                    })
                  } else {
                    // Show smart pagination for large datasets
                    const pages = []
                    
                    // First page
                    pages.push(
                      <Button
                        key={1}
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => loadMessages(1, false)}
                        disabled={isLoadingMore}
                      >
                        1
                      </Button>
                    )
                    
                    // Show ellipsis if current page is far from start
                    if (currentPage > 4) {
                      pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>)
                    }
                    
                    // Show pages around current page
                    for (let i = -1; i <= 1; i++) {
                      const page = currentPage + i
                      if (page > 1 && page < totalPages) {
                        pages.push(
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => loadMessages(page, false)}
                            disabled={isLoadingMore}
                          >
                            {page}
                          </Button>
                        )
                      }
                    }
                    
                    // Show ellipsis if current page is far from end
                    if (currentPage < totalPages - 3) {
                      pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>)
                    }
                    
                    // Last page
                    if (totalPages > 1) {
                      pages.push(
                        <Button
                          key={totalPages}
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => loadMessages(totalPages, false)}
                          disabled={isLoadingMore}
                        >
                          {totalPages}
                        </Button>
                      )
                    }
                    
                    return pages
                  }
                })()}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const totalPages = Math.ceil(totalMessages / pageSize)
                    if (currentPage < totalPages) {
                      loadMessages(currentPage + 1, false)
                    }
                  }}
                  disabled={currentPage === Math.ceil(totalMessages / pageSize) || isLoadingMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
