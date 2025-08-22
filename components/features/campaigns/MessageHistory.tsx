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
    loadMessages()
  }, [statusFilter])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('message_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setMessages(data || [])
      
      // Calculate statistics
      if (data) {
        const stats = data.reduce((acc, msg) => {
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
      
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
      // Ensure loading state is cleared even if component unmounts
      setTimeout(() => setLoading(false), 100)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMessages()
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
        </CardContent>
      </Card>
    </div>
  )
}
