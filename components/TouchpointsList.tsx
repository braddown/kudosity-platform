"use client"

import { TableHeader } from "@/components/ui/table"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"

interface Touchpoint {
  id: string
  name: string
  operator: string
  company: string
  audience: string
  senderID: string
  type: "SMS" | "WhatsApp" | "Email"
  status: "Active" | "Draft" | "Scheduled" | "Completed"
}

const sampleTouchpoints: Touchpoint[] = [
  {
    id: "tp-001",
    name: "Welcome Message",
    operator: "John Smith",
    company: "Acme Inc",
    audience: "New Customers",
    senderID: "ACMEINC",
    type: "SMS",
    status: "Active",
  },
  {
    id: "tp-002",
    name: "Order Confirmation",
    operator: "Sarah Johnson",
    company: "Acme Inc",
    audience: "Recent Purchasers",
    senderID: "447312263456",
    type: "SMS",
    status: "Active",
  },
  {
    id: "tp-003",
    name: "Appointment Reminder",
    operator: "Mike Davis",
    company: "Health Clinic",
    audience: "Appointment Holders",
    senderID: "HEALTH",
    type: "SMS",
    status: "Scheduled",
  },
  {
    id: "tp-004",
    name: "Feedback Request",
    operator: "Emma Wilson",
    company: "Retail Store",
    audience: "Recent Purchasers",
    senderID: "447312263457",
    type: "SMS",
    status: "Draft",
  },
  {
    id: "tp-005",
    name: "Loyalty Program Update",
    operator: "Alex Brown",
    company: "Coffee Shop",
    audience: "Loyalty Members",
    senderID: "COFFEE",
    type: "SMS",
    status: "Active",
  },
  {
    id: "tp-006",
    name: "Shipping Notification",
    operator: "Lisa Chen",
    company: "Online Store",
    audience: "Recent Purchasers",
    senderID: "447312263458",
    type: "SMS",
    status: "Active",
  },
  {
    id: "tp-007",
    name: "Event Reminder",
    operator: "Tom Jackson",
    company: "Event Company",
    audience: "Event Attendees",
    senderID: "EVENTS",
    type: "SMS",
    status: "Scheduled",
  },
  {
    id: "tp-008",
    name: "Product Launch",
    operator: "Rachel Green",
    company: "Tech Company",
    audience: "All Customers",
    senderID: "TECHCO",
    type: "SMS",
    status: "Draft",
  },
  {
    id: "tp-009",
    name: "Service Update",
    operator: "David Miller",
    company: "Service Provider",
    audience: "Active Subscribers",
    senderID: "447312263459",
    type: "SMS",
    status: "Completed",
  },
  {
    id: "tp-010",
    name: "Payment Reminder",
    operator: "Jennifer Lee",
    company: "Billing Dept",
    audience: "Overdue Accounts",
    senderID: "BILLING",
    type: "SMS",
    status: "Active",
  },
]

export default function TouchpointsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>(sampleTouchpoints)

  const filteredTouchpoints = touchpoints.filter(
    (touchpoint) =>
      touchpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      touchpoint.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      touchpoint.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      touchpoint.audience.toLowerCase().includes(searchTerm.toLowerCase()) ||
      touchpoint.senderID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      touchpoint.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    const statusConfig = {
      Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      Draft: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
      Scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      Completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    }
    return <Badge className={`${statusConfig[status as keyof typeof statusConfig]} px-2 py-1 text-xs`}>{status}</Badge>
  }

  const getTypeColor = (type: string) => {
    const typeConfig = {
      SMS: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
      WhatsApp:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50",
      Email:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50",
    }
    return (
      <Badge
        variant="outline"
        className={
          typeConfig[type as keyof typeof typeConfig] ||
          "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50"
        }
      >
        {type}
      </Badge>
    )
  }

  return (
    <div className="w-full bg-card rounded-lg shadow-sm border border-border">
      {/* Header with Search */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h3 className="text-lg font-medium text-card-foreground">All Touchpoints</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Search touchpoints..."
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
            <TableRow className="border-b border-border">
              <TableHead className="font-medium text-foreground">Name</TableHead>
              <TableHead className="font-medium text-foreground">Operator</TableHead>
              <TableHead className="font-medium text-foreground">Company</TableHead>
              <TableHead className="font-medium text-foreground">Audience</TableHead>
              <TableHead className="font-medium text-foreground">Sender ID</TableHead>
              <TableHead className="font-medium text-foreground">Type</TableHead>
              <TableHead className="font-medium text-foreground">Status</TableHead>
              <TableHead className="font-medium text-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTouchpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No touchpoints found. Try adjusting your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredTouchpoints.map((touchpoint, index) => (
                <TableRow
                  key={touchpoint.id}
                  className={`border-b border-border hover:bg-muted/50 ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <TableCell>
                    <Link
                      href={`/touchpoints/${touchpoint.id}`}
                      className="text-primary hover:underline hover:text-primary/80 font-medium text-left transition-colors"
                    >
                      {touchpoint.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-card-foreground">{touchpoint.operator}</TableCell>
                  <TableCell className="text-card-foreground">{touchpoint.company}</TableCell>
                  <TableCell className="text-card-foreground">{touchpoint.audience}</TableCell>
                  <TableCell className="text-card-foreground font-mono text-sm">{touchpoint.senderID}</TableCell>
                  <TableCell>{getTypeColor(touchpoint.type)}</TableCell>
                  <TableCell>{getStatusColor(touchpoint.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem className="hover:bg-accent text-foreground">
                          <Link href={`/touchpoints/${touchpoint.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-accent text-foreground">Edit</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-accent text-foreground">Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                          Delete
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
