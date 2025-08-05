"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  MoreHorizontal,
  Play,
  Pause,
  Square,
  BarChart3,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Campaign {
  id: string
  name: string
  type: "broadcast" | "journey"
  status: "active" | "paused" | "completed" | "draft"
  channel: "email" | "sms" | "multi"
  created_at: string
  start_date: string
  end_date?: string | null
  recipients: number | null | undefined
  sent: number | null | undefined
  delivered: number | null | undefined
  opened: number | null | undefined
  clicked: number | null | undefined
  conversions: number | null | undefined
  revenue: number | null | undefined
  creator: string
}

interface CampaignActivityTableProps {
  campaigns: Campaign[]
  loading: boolean
  onRefresh: () => void
}

export function CampaignActivityTable({ campaigns, loading, onRefresh }: CampaignActivityTableProps) {
  const router = useRouter()
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <Smartphone className="h-4 w-4" />
      case "multi":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    return type === "broadcast" ? "bg-purple-100 text-purple-800" : "bg-indigo-100 text-indigo-800"
  }

  const calculateOpenRate = (opened: number | null | undefined, delivered: number | null | undefined) => {
    const safeOpened = opened || 0
    const safeDelivered = delivered || 0
    return safeDelivered > 0 ? Math.round((safeOpened / safeDelivered) * 100) : 0
  }

  const calculateClickRate = (clicked: number | null | undefined, opened: number | null | undefined) => {
    const safeClicked = clicked || 0
    const safeOpened = opened || 0
    return safeOpened > 0 ? Math.round((safeClicked / safeOpened) * 100) : 0
  }

  const calculateConversionRate = (conversions: number | null | undefined, recipients: number | null | undefined) => {
    const safeConversions = conversions || 0
    const safeRecipients = recipients || 0
    return safeRecipients > 0 ? Math.round((safeConversions / safeRecipients) * 100) : 0
  }

  const handleViewDetails = (campaign: Campaign) => {
    if (campaign.type === "broadcast") {
      router.push(`/campaigns/broadcasts/${campaign.id}`)
    } else {
      router.push(`/campaigns/journeys/${campaign.id}`)
    }
  }

  const handleAction = (action: string, campaignId: string) => {
    console.log(`${action} campaign ${campaignId}`)
    // Implement actions like pause, resume, stop, etc.
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading campaign activity...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Campaign Activity</h3>
            <p className="text-muted-foreground mb-4">
              Create your first broadcast or journey to start engaging with your audience.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push("/broadcast")}>Create Broadcast</Button>
              <Button variant="outline" onClick={() => router.push("/journeys")}>
                Create Journey
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter((c) => c.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + (c.sent || 0), 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total messages delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Campaign generated revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">by {campaign.creator}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getTypeColor(campaign.type)}>
                      {campaign.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getChannelIcon(campaign.channel)}
                      <span className="capitalize">{campaign.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{(campaign.recipients || 0).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{(campaign.sent || 0).toLocaleString()} sent</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Open: {calculateOpenRate(campaign.opened, campaign.delivered)}%</span>
                        <span>Click: {calculateClickRate(campaign.clicked, campaign.opened)}%</span>
                      </div>
                      <Progress value={calculateOpenRate(campaign.opened, campaign.delivered)} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {campaign.conversions || 0} conversions (
                        {calculateConversionRate(campaign.conversions, campaign.recipients)}%)
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${(campaign.revenue || 0).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(campaign)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {campaign.status === "active" && (
                          <DropdownMenuItem onClick={() => handleAction("pause", campaign.id)}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "paused" && (
                          <DropdownMenuItem onClick={() => handleAction("resume", campaign.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        {(campaign.status === "active" || campaign.status === "paused") && (
                          <DropdownMenuItem onClick={() => handleAction("stop", campaign.id)}>
                            <Square className="mr-2 h-4 w-4" />
                            Stop
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
