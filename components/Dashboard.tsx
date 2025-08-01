"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, MessageSquare } from "lucide-react"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, type TooltipProps } from "recharts"

// Generate 30 days of data
const generateDailyData = () => {
  const data = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i)
    data.push({
      date: format(date, "MMM dd, yyyy"),
      messages: Math.floor(Math.random() * (1000 - 100 + 1) + 100),
    })
  }
  return data
}

const data = generateDailyData()

const tableData = [
  { campaign: "Welcome Series", sent: 5000, opened: 4500, clicked: 3750, converted: 1500, revenue: 3200 },
  { campaign: "Product Launch", sent: 10000, opened: 8000, clicked: 6000, converted: 2000, revenue: 4800 },
  { campaign: "Abandoned Cart", sent: 2500, opened: 2000, clicked: 1500, converted: 750, revenue: 1800 },
  { campaign: "Re-engagement", sent: 7500, opened: 5000, clicked: 3000, converted: 1000, revenue: 2500 },
]

interface MetricCardProps {
  title: string
  value: string
  change: string
  suffix?: string
}

function MetricCard({ title, value, change, suffix = "" }: MetricCardProps) {
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
      </CardContent>
    </Card>
  )
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-4 rounded-lg shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-2">
          <MessageSquare className="w-5 h-5 mr-2 text-primary" />
          <span className="font-bold text-lg text-foreground">{payload[0].value} messages sent</span>
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    )
  }

  return null
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("last30days")
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })

  useEffect(() => {
    // Update date range when tab changes
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

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 md:space-y-8 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-muted/50">
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
                    "w-full sm:w-[300px] justify-start text-left font-normal bg-card/50 border-border/50",
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
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">Highest Performing Campaigns</h3>
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              View Campaigns
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Card className="glass-card enhanced-shadow border-border/50">
              <CardContent className="p-0 sm:p-6">
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
                    {tableData.map((row, index) => (
                      <TableRow key={index} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <Link
                            href={`/campaigns/${row.campaign.toLowerCase().replace(/\s+/g, "-")}`}
                            className="text-primary hover:text-primary/80 hover:underline"
                          >
                            {row.campaign}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-foreground">{row.sent.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{row.opened.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{row.clicked.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{row.converted.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">${row.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">Business Performance Summary</h3>
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              View Dashboard
            </Button>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
            <MetricCard title="Total revenue" value="$13,121" change="0.5" />
            <MetricCard title="Attributed revenue" value="$5,121" change="0.5" />
            <MetricCard title="Total spend" value="$1,078" change="-1.5" />
            <MetricCard title="Cost per conversion" value="$0.210" change="0.5" />
            <MetricCard title="Revenue per Recipient" value="$4.21" change="0.5" />
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">Customer Engagement Summary</h3>
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              View Dashboard
            </Button>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
            <MetricCard title="Profiles updated" value="21,560" change="0.5" />
            <MetricCard title="Link hits" value="2,567" change="0.5" />
            <MetricCard title="Conversions" value="43" change="-1.5" />
            <MetricCard title="Responses" value="237" change="0.5" />
            <MetricCard title="Engagement rate" value="12.98" change="0.5" suffix="%" />
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">Messaging Activity Summary</h3>
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              View Activity Logs
            </Button>
          </div>
          <Card className="glass-card enhanced-shadow border-border/50">
            <CardContent className="p-4 md:p-6 pt-4 md:pt-6 h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const parts = value.split(" ")
                      return parts.length > 1 ? parts[1].replace(",", "") : value
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="hsl(var(--primary))"
                        style={{
                          cursor: "pointer",
                          transition: "fill 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          ;(e.target as SVGElement).style.fill = "hsl(var(--primary)/0.8)"
                        }}
                        onMouseLeave={(e) => {
                          ;(e.target as SVGElement).style.fill = "hsl(var(--primary))"
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8">
            <MetricCard title="Messages sent" value="13,121" change="0.5" />
            <MetricCard title="Avg. open rate" value="87.23" change="0.5" suffix="%" />
            <MetricCard title="Avg. response rate" value="61.03" change="-1.2" suffix="%" />
            <MetricCard title="Opt outs" value="3.44" change="-1.8" suffix="%" />
            <MetricCard title="Conversion rate" value="33.57" change="0.7" suffix="%" />
          </div>
        </div>
      </div>
    </div>
  )
}
