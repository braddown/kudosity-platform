"use client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logger } from "@/lib/utils/logger"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Copy, Trash, Pause, Play, BarChart2, Edit, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

// Sample data for journeys
const sampleJourneys = [
  {
    id: 1,
    name: "Welcome Series",
    createdAt: "2023-05-15",
    activeContacts: 1200,
    completedContacts: 3500,
    audience: "New Subscribers",
    status: "Active",
    steps: 3,
    channel: "SMS",
  },
  {
    id: 2,
    name: "Product Launch",
    createdAt: "2023-06-01",
    activeContacts: 850,
    completedContacts: 2100,
    audience: "Existing Customers",
    status: "Active",
    steps: 5,
    channel: "Email",
  },
  {
    id: 3,
    name: "Re-engagement Campaign",
    createdAt: "2023-06-10",
    activeContacts: 600,
    completedContacts: 1800,
    audience: "Inactive Users",
    status: "Paused",
    steps: 2,
    channel: "SMS",
  },
  {
    id: 4,
    name: "Holiday Promotion",
    createdAt: "2023-07-01",
    activeContacts: 2000,
    completedContacts: 500,
    audience: "All Subscribers",
    status: "Active",
    steps: 4,
    channel: "Multi-channel",
  },
  {
    id: 5,
    name: "Customer Feedback",
    createdAt: "2023-07-15",
    activeContacts: 300,
    completedContacts: 1200,
    audience: "Recent Purchasers",
    status: "Draft",
    steps: 1,
    channel: "Email",
  },
]

export default function Journeys() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredJourneys = sampleJourneys.filter(
    (journey) =>
      journey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.audience.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      Paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      Draft: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
      Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    }
    return <Badge className={`${statusConfig[status as keyof typeof statusConfig]} px-2 py-1 text-xs`}>{status}</Badge>
  }

  const getChannelBadge = (channel: string) => {
    const channelConfig = {
      SMS: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
      Email:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50",
      "Multi-channel":
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50",
    }
    return (
      <Badge
        variant="outline"
        className={
          channelConfig[channel as keyof typeof channelConfig] ||
          "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50"
        }
      >
        {channel}
      </Badge>
    )
  }

  const handleAction = (action: string, journeyId: number) => {
    logger.debug(`${action} journey ${journeyId}`)
    // Implement actual actions here
  }

  return (
    <div className="w-full bg-card rounded-lg shadow-sm border border-border">
      {/* Header with Search */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h3 className="text-lg font-medium text-card-foreground">All Journeys</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Search journeys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-[250px] h-10 bg-background border-border"
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-muted/50">
              <TableHead className="bg-muted/50 font-medium text-foreground">Name</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground">Audience</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground">Steps</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground">Channel</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground">Active Contacts</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground">Completed</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground">Status</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground">Created</TableHead>
              <TableHead className="bg-muted/50 font-medium text-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJourneys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No journeys found. Try adjusting your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredJourneys.map((journey, index) => (
                <TableRow
                  key={journey.id}
                  className={`border-b border-border hover:bg-muted/50 ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <TableCell>
                    <button
                      onClick={() => router.push(`/journeys/${journey.id}`)}
                      className="text-primary hover:underline hover:text-primary/80 font-medium text-left transition-colors"
                    >
                      {journey.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-card-foreground">{journey.audience}</TableCell>
                  <TableCell className="text-card-foreground">{journey.steps}</TableCell>
                  <TableCell>{getChannelBadge(journey.channel)}</TableCell>
                  <TableCell className="text-card-foreground">{journey.activeContacts.toLocaleString()}</TableCell>
                  <TableCell className="text-card-foreground">{journey.completedContacts.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(journey.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{journey.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem
                          onClick={() => router.push(`/journeys/${journey.id}`)}
                          className="hover:bg-accent text-foreground"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("duplicate", journey.id)}
                          className="hover:bg-accent text-foreground"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("analytics", journey.id)}
                          className="hover:bg-accent text-foreground"
                        >
                          <BarChart2 className="mr-2 h-4 w-4" />
                          <span>Analytics</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {journey.status === "Active" ? (
                          <DropdownMenuItem
                            onClick={() => handleAction("pause", journey.id)}
                            className="hover:bg-accent text-foreground"
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            <span>Pause</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleAction("start", journey.id)}
                            className="hover:bg-accent text-foreground"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            <span>Start</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleAction("delete", journey.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
