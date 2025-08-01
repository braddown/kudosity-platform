"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  MessageSquare,
  MousePointer,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { KudosityTable, type KudosityTableColumn } from "@/components/KudosityTable"

interface Webhook {
  id: number
  name: string
  url: string
  events: string[]
  status: string
  created: string
  lastTriggered: string
  successRate: string
}

const ActionMenu = ({
  item,
  onEdit,
  onDelete,
}: {
  item: Webhook
  onEdit: (item: Webhook) => void
  onDelete: (item: Webhook) => void
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onEdit(item)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.url)}>
        <Copy className="mr-2 h-4 w-4" />
        Copy URL
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default function Webhooks() {
  const [showWebhookDialog, setShowWebhookDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Webhook | null>(null)

  const webhooks: Webhook[] = [
    {
      id: 1,
      name: "Customer Support Webhook",
      url: "https://api.example.com/webhooks/support",
      events: ["replies", "inbound_messages"],
      status: "active",
      created: "2024-01-15",
      lastTriggered: "2024-01-20 14:30:00",
      successRate: "98.5%",
    },
    {
      id: 2,
      name: "Analytics Webhook",
      url: "https://analytics.company.com/webhook",
      events: ["link_hits", "delivery_notifications"],
      status: "active",
      created: "2024-01-10",
      lastTriggered: "2024-01-20 15:45:00",
      successRate: "99.2%",
    },
    {
      id: 3,
      name: "CRM Integration",
      url: "https://crm.example.com/api/webhook",
      events: ["replies", "inbound_messages", "delivery_notifications"],
      status: "inactive",
      created: "2024-01-05",
      lastTriggered: "2024-01-18 09:15:00",
      successRate: "95.8%",
    },
  ]

  const eventTypes = [
    {
      id: "replies",
      name: "Replies",
      description: "Triggered when a contact replies to a message",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "inbound_messages",
      name: "Inbound Messages",
      description: "Triggered when any inbound message is received",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "link_hits",
      name: "Link Hits",
      description: "Triggered when a link in a message is clicked",
      icon: <MousePointer className="h-4 w-4" />,
    },
    {
      id: "delivery_notifications",
      name: "Delivery Notifications",
      description: "Triggered when message delivery status changes",
      icon: <Bell className="h-4 w-4" />,
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "translucent-green", icon: <CheckCircle className="h-3 w-3" /> },
      inactive: { variant: "translucent-gray", icon: <XCircle className="h-3 w-3" /> },
      pending: { variant: "translucent-orange", icon: <Clock className="h-3 w-3" /> },
      error: { variant: "translucent-gray", icon: <AlertTriangle className="h-3 w-3" /> },
    }

    const config = statusConfig[status] || statusConfig.inactive

    return (
      <Badge variant={config.variant} className="font-semibold flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingItem(webhook)
    setShowWebhookDialog(true)
  }

  const handleDeleteWebhook = (webhook: Webhook) => {
    console.log("Delete Webhook:", webhook)
  }

  const resetDialog = () => {
    setEditingItem(null)
    setShowWebhookDialog(false)
  }

  const columns: KudosityTableColumn<Webhook>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (webhook) => <span className="font-medium">{webhook.name}</span>,
    },
    {
      header: "URL",
      accessorKey: "url",
      cell: (webhook) => <span className="font-mono text-sm max-w-xs truncate block">{webhook.url}</span>,
    },
    {
      header: "Events",
      accessorKey: "events",
      cell: (webhook) => (
        <div className="flex flex-wrap gap-1">
          {webhook.events.map((event) => (
            <Badge key={event} variant="translucent-blue" className="text-xs">
              {event.replace("_", " ")}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (webhook) => getStatusBadge(webhook.status),
    },
    {
      header: "Success Rate",
      accessorKey: "successRate",
    },
    {
      header: "Last Triggered",
      accessorKey: "lastTriggered",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (webhook) => <ActionMenu item={webhook} onEdit={handleEditWebhook} onDelete={handleDeleteWebhook} />,
    },
  ]

  return (
    <div>
      <KudosityTable data={webhooks} columns={columns} />
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Webhook" : "Create New Webhook"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Name</Label>
                <Input id="webhook-name" placeholder="Enter webhook name" defaultValue={editingItem?.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-domain.com/webhook"
                  defaultValue={editingItem?.url || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="space-y-3">
                  {eventTypes.map((eventType) => (
                    <div key={eventType.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox id={eventType.id} defaultChecked={editingItem?.events?.includes(eventType.id)} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {eventType.icon}
                          <Label htmlFor={eventType.id} className="font-medium">
                            {eventType.name}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{eventType.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
                <Input id="webhook-secret" type="password" placeholder="Enter a secret for webhook verification" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="webhook-active" defaultChecked={editingItem?.status === "active"} />
                <Label htmlFor="webhook-active">Active</Label>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={resetDialog}>
              {editingItem ? "Update" : "Create"} Webhook
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
