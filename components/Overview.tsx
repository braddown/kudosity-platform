"use client"
import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, MessageSquare } from "lucide-react"
import { LoadingInline, LoadingSpinner } from "@/components/ui/loading"
import { format, subDays, parseISO, isWithinInterval } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import Link from "next/link"

interface CampaignMetric {
  metric_type: string
  count: number
}

interface CampaignSend {
  id: number
  date_sent: string
  total_recipients: number
  cost: number
  campaign_metrics: CampaignMetric[]
}

interface Campaign {
  id: number | string
  name: string
  campaign_sends: CampaignSend[]
}

interface CampaignPerformance {
  id?: number | string
  name?: string
  campaign_name?: string
  recipients_count?: number
  total_recipients?: number
  delivered_count?: number
  opened_count?: number
  clicked_count?: number
  responded_count?: number
  conversions_count?: number
  revenue?: number
  cost?: number
  sent_at?: string
  engagement_rate?: number
  roi?: number
  open_rate?: number
  click_rate?: number
  response_rate?: number
  conversion_rate?: number
}

interface DashboardData {
  metrics: {
    message_stats: {
      total_messages: number
      opens: number
      clicks: number
      responses: number
      conversions: number
      total_revenue: number
      delivered?: number
      failed?: number
    }
    campaign_stats: {
      campaign_count: number
      total_recipients: number
      total_cost: number
    }
    contact_stats: {
      total_contacts: number
      new_contacts: number
    }
  }
  dailyData: Array<{
    date: string
    messages: number
  }>
  campaignData: CampaignPerformance[]
  schemaSetup?: boolean
  needsSqlFunctions?: boolean
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  suffix?: string
  isLoading?: boolean
}

function MetricCard({ title, value, change, suffix = "", isLoading = false }: MetricCardProps) {
  const isPositive = Number.parseFloat(change) >= 0
  const chipColor = isPositive
    ? "bg-green-500/10 text-green-400 border-green-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20"
  const arrowIcon = isPositive ? <ArrowUpIcon className="mr-1 h-4 w-4" /> : <ArrowDownIcon className="mr-1 h-4 w-4" />

  return (
    <Card className="glass-card enhanced-shadow border-border/50 hover:border-border/80 transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingInline message="Loading..." />
        ) : (
          <>
            <div className="text-2xl md:text-3xl font-light text-foreground">
              {value}
              {suffix}
            </div>
            <div className="flex items-center text-xs mt-2">
              <div className={`inline-flex items-center px-2 py-1 rounded-full border ${chipColor}`}>
                {arrowIcon}
                {change}%
              </div>
              <span className="ml-2 text-muted-foreground">vs previous period</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Simple CSS-based chart component to replace Recharts
function SimpleBarChart({ data }: { data: Array<{ date: string; messages: number }> }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No message data available for the selected period</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.messages))

  return (
    <div className="w-full h-full p-4">
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.messages / maxValue) * 100 : 0
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-w-0">
              <div
                className="w-full bg-primary rounded-t-sm hover:bg-primary/80 transition-colors cursor-pointer relative group"
                style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0px" }}
                title={`${format(parseISO(item.date), "MMM dd")}: ${item.messages} messages`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <div className="flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {item.messages} messages
                  </div>
                  <div className="text-xs text-muted-foreground">{format(parseISO(item.date), "MMM dd")}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                {format(parseISO(item.date), "dd")}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper function to safely format numbers
const safeFormat = (value?: number | null) => {
  if (value === undefined || value === null) return "0"
  return value.toLocaleString()
}

// Helper function to safely format currency
const safeFormatCurrency = (value?: number | null, maximumFractionDigits = 0) => {
  if (value === undefined || value === null) return "$0"
  return `$${value.toLocaleString(undefined, { maximumFractionDigits })}`
}

// Helper function to safely format percentages
const safeFormatPercent = (value?: number | null, maximumFractionDigits = 2) => {
  if (value === undefined || value === null) return "0"
  return value.toLocaleString(undefined, { maximumFractionDigits })
}

export default function Overview({ data }: { data: DashboardData }) {
  // Ensure data has the expected structure with default values
  const safeData: DashboardData = {
    metrics: {
      message_stats: {
        total_messages: 0,
        opens: 0,
        clicks: 0,
        responses: 0,
        conversions: 0,
        total_revenue: 0,
        delivered: 0,
        failed: 0,
        ...(data?.metrics?.message_stats || {}),
      },
      campaign_stats: {
        campaign_count: 0,
        total_recipients: 0,
        total_cost: 0,
        ...(data?.metrics?.campaign_stats || {}),
      },
      contact_stats: {
        total_contacts: 0,
        new_contacts: 0,
        ...(data?.metrics?.contact_stats || {}),
      },
    },
    dailyData: data?.dailyData || [],
    campaignData: data?.campaignData || [],
    schemaSetup: data?.schemaSetup || false,
    needsSqlFunctions: data?.needsSqlFunctions || false,
  }

  const [activeTab, setActiveTab] = useState<string>("last30days")
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [filteredData, setFilteredData] = useState<DashboardData>(safeData)

  // Filter data based on selected date range
  useEffect(() => {
    if (!date?.from || !date?.to) return

    setIsLoading(true)

    try {
      // Filter daily data based on date range
      const filteredDailyData = safeData.dailyData.filter((item) => {
        try {
          const itemDate = parseISO(item.date)
          return isWithinInterval(itemDate, { start: date.from!, end: date.to! })
        } catch (error) {
          return false
        }
      })

      // Filter campaign data based on date range
      const filteredCampaignData = safeData.campaignData.filter((campaign) => {
        try {
          const campaignDate = parseISO(campaign.sent_at || "")
          return isWithinInterval(campaignDate, { start: date.from!, end: date.to! })
        } catch (error) {
          return false
        }
      })

      // For this example, we'll just filter the data we have
      // In a real implementation, you might want to fetch new data from the server
      setFilteredData({
        ...safeData,
        dailyData: filteredDailyData,
        campaignData: filteredCampaignData,
      })
    } catch (error) {
      console.error("Error filtering data:", error)
      setFilteredData(safeData)
    } finally {
      setIsLoading(false)
    }
  }, [date])

  // Update date range when tab changes
  useEffect(() => {
    switch (activeTab) {
      case "today":
        setDate({ from: new Date(), to: new Date() })
        break
      case "thisWeek":
        setDate({ from: subDays(new Date(), 6), to: new Date() })
        break
      case "thisMonth":
        setDate({ from: subDays(new Date(), 29), to: new Date() })
        break
      case "last30days":
        setDate({ from: subDays(new Date(), 29), to: new Date() })
        break
    }
  }, [activeTab])

  // Calculate metrics from the data
  const metrics = filteredData.metrics || {
    message_stats: { total_messages: 0, opens: 0, clicks: 0, responses: 0, conversions: 0, total_revenue: 0 },
    campaign_stats: { campaign_count: 0, total_recipients: 0, total_cost: 0 },
    contact_stats: { total_contacts: 0, new_contacts: 0 },
  }

  // Calculate derived metrics
  const openRate =
    metrics.message_stats.total_messages > 0
      ? (metrics.message_stats.opens / metrics.message_stats.total_messages) * 100
      : 0

  const responseRate =
    metrics.message_stats.total_messages > 0
      ? (metrics.message_stats.responses / metrics.message_stats.total_messages) * 100
      : 0

  const conversionRate =
    metrics.message_stats.total_messages > 0
      ? (metrics.message_stats.conversions / metrics.message_stats.total_messages) * 100
      : 0

  const revenuePerRecipient =
    metrics.campaign_stats.total_recipients > 0
      ? metrics.message_stats.total_revenue / metrics.campaign_stats.total_recipients
      : 0

  const costPerConversion =
    metrics.message_stats.conversions > 0 ? metrics.campaign_stats.total_cost / metrics.message_stats.conversions : 0

  const engagementRate =
    metrics.message_stats.total_messages > 0
      ? ((metrics.message_stats.opens + metrics.message_stats.clicks + metrics.message_stats.responses) /
          metrics.message_stats.total_messages) *
        100
      : 0

  // Format chart data
  const chartData = filteredData.dailyData || []

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full h-full overflow-auto p-6">
        {/* Date selector row */}
        <div className="w-full flex flex-col sm:flex-row sm:justify-start items-start sm:items-center gap-4 mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto bg-muted/50">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="thisWeek">This Week</TabsTrigger>
              <TabsTrigger value="thisMonth">This Month</TabsTrigger>
              <TabsTrigger value="last30days">Last 30 Days</TabsTrigger>
            </TabsList>
          </Tabs>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-auto sm:max-w-[300px] justify-start text-left font-normal bg-card/50 border-border/50",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
              <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Campaigns section */}
        <div className="w-full mb-8">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-foreground">Highest Performing Campaigns</h3>
                            <Button variant="default">
              <Link href="/performance">View Campaigns</Link>
            </Button>
          </div>

          <div className="w-full overflow-auto">
            <Card className="glass-card enhanced-shadow border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="w-[35%] text-left text-muted-foreground">Campaign</TableHead>
                      <TableHead className="text-right text-muted-foreground">Sent</TableHead>
                      <TableHead className="text-right text-muted-foreground">Opened</TableHead>
                      <TableHead className="text-right text-muted-foreground">Clicked</TableHead>
                      <TableHead className="text-right text-muted-foreground">Converted</TableHead>
                      <TableHead className="text-right text-muted-foreground">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          <div className="flex justify-center items-center">
                            <LoadingInline message="Loading campaign data..." />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredData.campaignData && filteredData.campaignData.length > 0 ? (
                      filteredData.campaignData.slice(0, 4).map((campaign, index) => (
                        <TableRow key={campaign.id || index} className="border-border/30 hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <Link
                              href={`/performance?campaign=${campaign.id || ""}`}
                              className="text-primary hover:text-primary/80 hover:underline"
                            >
                              {campaign.name || campaign.campaign_name || "Unnamed Campaign"}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {safeFormat(campaign.recipients_count || campaign.total_recipients)}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {safeFormat(campaign.opened_count)}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {safeFormat(campaign.clicked_count)}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {safeFormat(campaign.conversions_count)}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {safeFormatCurrency(campaign.revenue)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No campaign data available for the selected period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Business Performance section */}
        <div className="w-full mb-8">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-foreground">Business Performance Summary</h3>
                            <Button variant="default">
              <Link href="/performance">View Dashboard</Link>
            </Button>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard
              title="Total revenue"
              value={safeFormatCurrency(metrics.message_stats.total_revenue)}
              change="0.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Attributed revenue"
              value={safeFormatCurrency(metrics.message_stats.total_revenue * 0.4)}
              change="0.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Total spend"
              value={safeFormatCurrency(metrics.campaign_stats.total_cost)}
              change="-1.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Cost per conversion"
              value={safeFormatCurrency(costPerConversion, 2)}
              change="0.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Revenue per Recipient"
              value={safeFormatCurrency(revenuePerRecipient, 2)}
              change="0.5"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Customer Engagement section */}
        <div className="w-full mb-8">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-foreground">Customer Engagement Summary</h3>
                            <Button variant="default">
              <Link href="/logs">View Dashboard</Link>
            </Button>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard
              title="Profiles updated"
              value={safeFormat(metrics.contact_stats.new_contacts)}
              change="0.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Link hits"
              value={safeFormat(metrics.message_stats.clicks)}
              change="0.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Conversions"
              value={safeFormat(metrics.message_stats.conversions)}
              change="-1.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Responses"
              value={safeFormat(metrics.message_stats.responses)}
              change="0.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Engagement rate"
              value={safeFormatPercent(engagementRate)}
              change="0.5"
              suffix="%"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Messaging Activity section */}
        <div className="w-full mb-8">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-foreground">Messaging Activity Summary</h3>
                            <Button variant="default">
              <Link href="/logs">View Activity Logs</Link>
            </Button>
          </div>

          <div className="w-full mb-6">
            <Card className="glass-card enhanced-shadow border-border/50">
              <CardContent className="p-6">
                <div className="w-full h-[300px]">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <LoadingInline message="Loading chart data..." />
                    </div>
                  ) : chartData.length > 0 ? (
                    <SimpleBarChart data={chartData} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No message data available for the selected period</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard
              title="Messages sent"
              value={safeFormat(metrics.message_stats.total_messages)}
              change="0.5"
              isLoading={isLoading}
            />
            <MetricCard
              title="Avg. open rate"
              value={safeFormatPercent(openRate)}
              change="0.5"
              suffix="%"
              isLoading={isLoading}
            />
            <MetricCard
              title="Avg. response rate"
              value={safeFormatPercent(responseRate)}
              change="-1.2"
              suffix="%"
              isLoading={isLoading}
            />
            <MetricCard title="Opt outs" value="3.44" change="-1.8" suffix="%" isLoading={isLoading} />
            <MetricCard
              title="Conversion rate"
              value={safeFormatPercent(conversionRate)}
              change="0.7"
              suffix="%"
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
