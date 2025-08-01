"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  MessageSquare,
  LinkIcon,
  Bot,
  Reply,
  DollarSign,
  Users,
  Percent,
} from "lucide-react"
import { format } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Sample data for the most recent campaign
const recentCampaignData = {
  name: "Summer Sale 2023",
  date: new Date(2023, 6, 15), // July 15, 2023
  recipients: 250000,
  delivered: 248750,
  opened: 198750,
  clicked: 87500,
  responded: 35000,
  conversions: 12500,
  revenue: 437500, // $35 average order value
  cost: 12500, // $0.05 per message
  aiConversations: 28750,
  linkHits: 92500,
  engagementRate: 39.2, // (opened + clicked + responded) / delivered * 100
}

// Sample data for campaign comparison
const campaignComparisonData = [
  {
    name: "Summer Sale 2023",
    recipients: 250000,
    conversions: 12500,
    revenue: 437500,
    cost: 12500,
    roi: 35, // (revenue - cost) / cost
  },
  {
    name: "Spring Collection",
    recipients: 180000,
    conversions: 9000,
    revenue: 315000,
    cost: 9000,
    roi: 34,
  },
  {
    name: "Easter Special",
    recipients: 120000,
    conversions: 7200,
    revenue: 252000,
    cost: 6000,
    roi: 41,
  },
  {
    name: "Valentine's Day",
    recipients: 200000,
    conversions: 10000,
    revenue: 350000,
    cost: 10000,
    roi: 34,
  },
  {
    name: "New Year Sale",
    recipients: 300000,
    conversions: 15000,
    revenue: 525000,
    cost: 15000,
    roi: 34,
  },
]

// Sample data for monthly performance
const monthlyPerformanceData = [
  { month: "Jan", revenue: 325000, cost: 10000, conversions: 9500 },
  { month: "Feb", revenue: 350000, cost: 10000, conversions: 10000 },
  { month: "Mar", revenue: 275000, cost: 8000, conversions: 8000 },
  { month: "Apr", revenue: 290000, cost: 8500, conversions: 8500 },
  { month: "May", revenue: 310000, cost: 9000, conversions: 9000 },
  { month: "Jun", revenue: 380000, cost: 11000, conversions: 11000 },
  { month: "Jul", revenue: 437500, cost: 12500, conversions: 12500 },
  { month: "Aug", revenue: 400000, cost: 11500, conversions: 11500 },
  { month: "Sep", revenue: 360000, cost: 10500, conversions: 10500 },
  { month: "Oct", revenue: 390000, cost: 11000, conversions: 11000 },
  { month: "Nov", revenue: 420000, cost: 12000, conversions: 12000 },
  { month: "Dec", revenue: 500000, cost: 14000, conversions: 14000 },
]

// Sample data for engagement metrics
const engagementData = [
  { name: "Opened", value: 198750 },
  { name: "Clicked", value: 87500 },
  { name: "Responded", value: 35000 },
  { name: "Converted", value: 12500 },
  { name: "No Action", value: 50000 },
]

// Sample data for AI conversation topics
const aiConversationData = [
  { name: "Product Questions", value: 12000 },
  { name: "Pricing Inquiries", value: 8500 },
  { name: "Shipping Info", value: 5000 },
  { name: "Returns/Refunds", value: 2000 },
  { name: "Other", value: 1250 },
]

// Chart colors
const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // green
  "#f59e0b", // yellow
  "#ec4899", // pink
  "#6366f1", // indigo
  "#64748b", // gray
]

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Format percentage
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

// Format large numbers
const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value)
}

// Metric card component
interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  description?: string
  trend?: "up" | "down" | "neutral"
}

const MetricCard = ({ title, value, change, icon, description, trend = "neutral" }: MetricCardProps) => {
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500"
  const trendIcon =
    trend === "up" ? <TrendingUp className="h-4 w-4" /> : trend === "down" ? <TrendingDown className="h-4 w-4" /> : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-blue-100 p-1.5 text-blue-700">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${trendColor} flex items-center mt-1`}>
            {trendIcon}
            <span className="ml-1">
              {change > 0 ? "+" : ""}
              {change}% from previous
            </span>
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export default function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState("30days")
  const [tab, setTab] = useState("overview")

  // Calculate derived metrics
  const costPerMessage = recentCampaignData.cost / recentCampaignData.recipients
  const costPerConversion = recentCampaignData.cost / recentCampaignData.conversions
  const revenuePerRecipient = recentCampaignData.revenue / recentCampaignData.recipients
  const roi = ((recentCampaignData.revenue - recentCampaignData.cost) / recentCampaignData.cost) * 100

  // Filter data based on time range
  const filteredCampaignData = useMemo(() => {
    // In a real app, this would filter based on actual dates
    // For this demo, we'll just return a subset of the data
    if (timeRange === "7days") {
      return campaignComparisonData.slice(0, 1)
    } else if (timeRange === "30days") {
      return campaignComparisonData.slice(0, 3)
    } else if (timeRange === "90days") {
      return campaignComparisonData.slice(0, 4)
    } else {
      return campaignComparisonData
    }
  }, [timeRange])

  const filteredMonthlyData = useMemo(() => {
    // In a real app, this would filter based on actual dates
    // For this demo, we'll just return a subset of the data
    if (timeRange === "7days") {
      return monthlyPerformanceData.slice(-1)
    } else if (timeRange === "30days") {
      return monthlyPerformanceData.slice(-3)
    } else if (timeRange === "90days") {
      return monthlyPerformanceData.slice(-6)
    } else {
      return monthlyPerformanceData
    }
  }, [timeRange])

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
        <p className="text-muted-foreground">Track and analyze your broadcast campaign performance metrics</p>
      </div>

      <Tabs defaultValue="overview" value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="12months">Last 12 months</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Most Recent Campaign Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Most Recent Campaign</CardTitle>
                    <CardDescription>
                      {recentCampaignData.name} • {format(recentCampaignData.date, "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Financial Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Financial Performance</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <MetricCard
                      title="Campaign Cost"
                      value={formatCurrency(recentCampaignData.cost)}
                      icon={<DollarSign className="h-4 w-4" />}
                      description={`$${costPerMessage.toFixed(3)} per message`}
                    />
                    <MetricCard
                      title="Total Revenue"
                      value={formatCurrency(recentCampaignData.revenue)}
                      change={8.2}
                      trend="up"
                      icon={<DollarSign className="h-4 w-4" />}
                    />
                    <MetricCard
                      title="Cost per Conversion"
                      value={formatCurrency(costPerConversion)}
                      change={-2.5}
                      trend="down"
                      icon={<DollarSign className="h-4 w-4" />}
                      description="Lower is better"
                    />
                    <MetricCard
                      title="Revenue per Recipient"
                      value={`$${revenuePerRecipient.toFixed(2)}`}
                      change={5.1}
                      trend="up"
                      icon={<DollarSign className="h-4 w-4" />}
                    />
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Engagement</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <MetricCard
                      title="Link Hits"
                      value={formatNumber(recentCampaignData.linkHits)}
                      change={12.3}
                      trend="up"
                      icon={<LinkIcon className="h-4 w-4" />}
                      description={`${((recentCampaignData.linkHits / recentCampaignData.delivered) * 100).toFixed(1)}% of delivered`}
                    />
                    <MetricCard
                      title="AI Managed Conversations"
                      value={formatNumber(recentCampaignData.aiConversations)}
                      change={18.7}
                      trend="up"
                      icon={<Bot className="h-4 w-4" />}
                      description={`${((recentCampaignData.aiConversations / recentCampaignData.delivered) * 100).toFixed(1)}% of delivered`}
                    />
                    <MetricCard
                      title="Responses"
                      value={formatNumber(recentCampaignData.responded)}
                      change={7.5}
                      trend="up"
                      icon={<Reply className="h-4 w-4" />}
                      description={`${((recentCampaignData.responded / recentCampaignData.delivered) * 100).toFixed(1)}% of delivered`}
                    />
                    <MetricCard
                      title="Engagement Rate"
                      value={`${recentCampaignData.engagementRate.toFixed(1)}%`}
                      change={4.2}
                      trend="up"
                      icon={<Percent className="h-4 w-4" />}
                      description="Opened, clicked, or responded"
                    />
                  </div>
                </div>

                {/* Campaign Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Campaign Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <MetricCard
                      title="Recipients"
                      value={formatNumber(recentCampaignData.recipients)}
                      icon={<Users className="h-4 w-4" />}
                    />
                    <MetricCard
                      title="Delivered"
                      value={formatNumber(recentCampaignData.delivered)}
                      icon={<MessageSquare className="h-4 w-4" />}
                      description={`${((recentCampaignData.delivered / recentCampaignData.recipients) * 100).toFixed(1)}% delivery rate`}
                    />
                    <MetricCard
                      title="Conversions"
                      value={formatNumber(recentCampaignData.conversions)}
                      change={9.8}
                      trend="up"
                      icon={<ArrowUpRight className="h-4 w-4" />}
                      description={`${((recentCampaignData.conversions / recentCampaignData.delivered) * 100).toFixed(1)}% conversion rate`}
                    />
                    <MetricCard
                      title="ROI"
                      value={`${roi.toFixed(0)}%`}
                      change={6.3}
                      trend="up"
                      icon={<TrendingUp className="h-4 w-4" />}
                      description="Return on investment"
                    />
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Engagement Breakdown</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={engagementData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {engagementData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatNumber(Number(value))} />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">AI Conversation Topics</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={aiConversationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {aiConversationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatNumber(Number(value))} />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View Full Report</Button>
                <Button variant="outline">Export Data</Button>
              </CardFooter>
            </Card>

            {/* All Campaigns Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">All Broadcast Campaigns Performance</CardTitle>
                <CardDescription>Comparing performance across {filteredCampaignData.length} campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Comparison Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Campaign Comparison</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredCampaignData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#8884d8" />
                        <Bar yAxisId="left" dataKey="cost" name="Cost" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Performance Trend */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Monthly Performance Trend</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={filteredMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="cost" name="Cost" stroke="#82ca9d" />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="conversions"
                          name="Conversions"
                          stroke="#ffc658"
                        />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                  <MetricCard
                    title="Total Recipients"
                    value={formatNumber(filteredCampaignData.reduce((sum, campaign) => sum + campaign.recipients, 0))}
                    icon={<Users className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(filteredCampaignData.reduce((sum, campaign) => sum + campaign.revenue, 0))}
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Total Cost"
                    value={formatCurrency(filteredCampaignData.reduce((sum, campaign) => sum + campaign.cost, 0))}
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Average ROI"
                    value={`${(filteredCampaignData.reduce((sum, campaign) => sum + campaign.roi, 0) / filteredCampaignData.length).toFixed(0)}%`}
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View All Campaigns</Button>
                <Button variant="outline">Export Data</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Detailed metrics for individual campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">Campaign Details</h3>
                <p className="text-muted-foreground mt-2">Select the Campaigns tab to view detailed metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Detailed engagement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">Engagement Details</h3>
                <p className="text-muted-foreground mt-2">Select the Engagement tab to view detailed metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed revenue and ROI metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">Revenue Details</h3>
                <p className="text-muted-foreground mt-2">Select the Revenue tab to view detailed metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
