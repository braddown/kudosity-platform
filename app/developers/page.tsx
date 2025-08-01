"use client"

import { useState } from "react"
import MainLayout from "@/components/MainLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { KudosityTable } from "@/components/KudosityTable"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Key,
  Webhook,
  Globe,
  MessageSquare,
  MousePointer,
  Bell,
  TestTube,
  Play,
  Send,
  Link,
  Code,
  FileText,
  Zap,
  Database,
} from "lucide-react"

const ActionMenu = ({
  item,
  type,
  onEdit,
  onDelete,
}: {
  item: any
  type: string
  onEdit: (item: any) => void
  onDelete: (item: any) => void
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
      {type === "apiKey" && (
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.key)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Key
        </DropdownMenuItem>
      )}
      {type === "webhook" && (
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.url)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy URL
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState("documentation")
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [showWebhookDialog, setShowWebhookDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [sandboxMode, setSandboxMode] = useState(false)
  const [testingLogs, setTestingLogs] = useState([])

  const apiKeys = [
    {
      id: 1,
      key: "sk_live_1234567890abcdef",
      description: "Production API Key",
      created: "2024-01-15",
      lastUsed: "2024-01-20",
      permissions: ["read", "write"],
    },
    {
      id: 2,
      key: "sk_test_1234567890abcdef",
      description: "Test API Key",
      created: "2024-01-10",
      lastUsed: "2024-01-19",
      permissions: ["read"],
    },
    {
      id: 3,
      key: "sk_dev_1234567890abcdef",
      description: "Development API Key",
      created: "2024-01-05",
      lastUsed: "Never",
      permissions: ["read", "write"],
    },
  ]

  const webhooks = [
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

  const sampleTestingLogs = [
    {
      id: 1,
      timestamp: "2024-01-20 15:30:22",
      type: "Test Message",
      event: "message_sent",
      status: "success",
      details: "Test message sent to +1234567890",
    },
    {
      id: 2,
      timestamp: "2024-01-20 15:29:15",
      type: "Link Hit Test",
      event: "link_clicked",
      status: "success",
      details: "Test link clicked from campaign ID: test_001",
    },
    {
      id: 3,
      timestamp: "2024-01-20 15:28:45",
      type: "Webhook Test",
      event: "webhook_fired",
      status: "success",
      details: "Test webhook delivered to https://example.com/webhook",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="translucent-green">Active</Badge>
      case "inactive":
        return <Badge variant="translucent-gray">Inactive</Badge>
      case "pending":
        return <Badge variant="translucent-orange">Pending</Badge>
      case "success":
        return <Badge variant="translucent-green">Success</Badge>
      case "error":
        return <Badge variant="translucent-gray">Error</Badge>
      default:
        return <Badge variant="translucent-gray">{status}</Badge>
    }
  }

  const handleEditApiKey = (apiKey) => {
    setEditingItem(apiKey)
    setShowApiKeyDialog(true)
  }

  const handleEditWebhook = (webhook) => {
    setEditingItem(webhook)
    setShowWebhookDialog(true)
  }

  const handleDeleteApiKey = (apiKey) => {
    console.log("Delete API Key:", apiKey)
  }

  const handleDeleteWebhook = (webhook) => {
    console.log("Delete Webhook:", webhook)
  }

  const handleSendTestMessage = () => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      type: "Test Message",
      event: "message_sent",
      status: "success",
      details: `Test message sent to +1234567890`,
    }
    setTestingLogs((prev) => [newLog, ...prev])
  }

  const handleSimulateLinkHit = () => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      type: "Link Hit Test",
      event: "link_clicked",
      status: "success",
      details: `Test link clicked from campaign ID: test_${Date.now()}`,
    }
    setTestingLogs((prev) => [newLog, ...prev])
  }

  const handleTestWebhook = () => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      type: "Webhook Test",
      event: "webhook_fired",
      status: "success",
      details: `Test webhook delivered to https://example.com/webhook`,
    }
    setTestingLogs((prev) => [newLog, ...prev])
  }

  const resetDialog = () => {
    setEditingItem(null)
    setShowApiKeyDialog(false)
    setShowWebhookDialog(false)
  }

  const apiKeysColumns = [
    {
      header: "API Key",
      accessorKey: "key",
      cell: (row) => <span className="font-mono text-sm">{row.key}</span>,
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Created",
      accessorKey: "created",
    },
    {
      header: "Last Used",
      accessorKey: "lastUsed",
    },
    {
      header: "Permissions",
      accessorKey: "permissions",
      cell: (row) => (
        <div className="flex gap-1">
          {row.permissions.map((perm) => (
            <Badge key={perm} variant="translucent-blue" className="text-xs">
              {perm}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row) => <ActionMenu item={row} type="apiKey" onEdit={handleEditApiKey} onDelete={handleDeleteApiKey} />,
    },
  ]

  const webhooksColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: "URL",
      accessorKey: "url",
      cell: (row) => <span className="font-mono text-sm max-w-xs truncate block">{row.url}</span>,
    },
    {
      header: "Events",
      accessorKey: "events",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.events.map((event) => (
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
      cell: (row) => getStatusBadge(row.status),
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
      cell: (row) => <ActionMenu item={row} type="webhook" onEdit={handleEditWebhook} onDelete={handleDeleteWebhook} />,
    },
  ]

  const testingLogsColumns = [
    {
      header: "Timestamp",
      accessorKey: "timestamp",
      cell: (row) => <span className="font-mono text-sm">{row.timestamp}</span>,
    },
    {
      header: "Type",
      accessorKey: "type",
    },
    {
      header: "Event",
      accessorKey: "event",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: "Details",
      accessorKey: "details",
    },
  ]

  return (
    <MainLayout>
      <div className="flex flex-col w-full p-6 md:p-8">
        <div className="w-full max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-md">
              <TabsTrigger value="documentation" className="px-3 py-1.5 text-sm font-medium">
                <Globe className="mr-2 h-4 w-4" />
                Documentation
              </TabsTrigger>
              <TabsTrigger value="apiKeys" className="px-3 py-1.5 text-sm font-medium">
                <Key className="mr-2 h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="px-3 py-1.5 text-sm font-medium">
                <Webhook className="mr-2 h-4 w-4" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="testing" className="px-3 py-1.5 text-sm font-medium">
                <TestTube className="mr-2 h-4 w-4" />
                Testing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documentation">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
                      <p className="text-muted-foreground mb-4">Get up and running with our API in minutes</p>
                      <Button variant="outline" className="w-full">
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Code className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">API Reference</h3>
                      <p className="text-muted-foreground mb-4">Complete endpoint documentation with examples</p>
                      <Button variant="outline" className="w-full">
                        View Reference
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Webhook className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Webhooks Guide</h3>
                      <p className="text-muted-foreground mb-4">Real-time event notifications setup</p>
                      <Button variant="outline" className="w-full">
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Data Models</h3>
                      <p className="text-muted-foreground mb-4">Understanding our data structures</p>
                      <Button variant="outline" className="w-full">
                        View Models
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">SDKs & Libraries</h3>
                      <p className="text-muted-foreground mb-4">Official SDKs for popular languages</p>
                      <Button variant="outline" className="w-full">
                        Download SDKs
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <TestTube className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Testing Tools</h3>
                      <p className="text-muted-foreground mb-4">Sandbox environment and testing utilities</p>
                      <Button variant="outline" className="w-full">
                        Start Testing
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Quick Start Guide</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Authentication</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            All API requests require authentication using your API key in the Authorization header.
                          </p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              curl -H "Authorization: Bearer YOUR_API_KEY" https://api.kudosity.com/v1/messages
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Send Your First Message</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Use the messages endpoint to send your first message programmatically.
                          </p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              {`POST /v1/messages
{
  "to": "+1234567890",
  "message": "Hello from Kudosity!"
}`}
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Set Up Webhooks</h4>
                          <p className="text-sm text-muted-foreground">
                            Configure webhooks to receive real-time notifications about message status, replies, and
                            more.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="apiKeys">
              <KudosityTable data={apiKeys} columns={apiKeysColumns} />

              <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit API Key" : "Generate New API Key"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Enter a description for this API key"
                        defaultValue={editingItem?.description || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="read" defaultChecked={editingItem?.permissions?.includes("read")} />
                          <Label htmlFor="read">Read access</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="write" defaultChecked={editingItem?.permissions?.includes("write")} />
                          <Label htmlFor="write">Write access</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetDialog}>
                      Cancel
                    </Button>
                    <Button onClick={resetDialog}>{editingItem ? "Update" : "Generate"} API Key</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="webhooks">
              <KudosityTable data={webhooks} columns={webhooksColumns} />

              <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Webhook" : "Create New Webhook"}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[500px] pr-4">
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhook-name">Name</Label>
                        <Input
                          id="webhook-name"
                          placeholder="Enter webhook name"
                          defaultValue={editingItem?.name || ""}
                        />
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
                              <Checkbox
                                id={eventType.id}
                                defaultChecked={editingItem?.events?.includes(eventType.id)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {eventType.icon}
                                  <Label htmlFor={eventType.id} className="font-medium">
                                    {eventType.name}
                                  </Label>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{eventType.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
                        <Input
                          id="webhook-secret"
                          type="password"
                          placeholder="Enter a secret for webhook verification"
                        />
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
                    <Button onClick={resetDialog}>{editingItem ? "Update" : "Create"} Webhook</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="testing">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-6">
                      <div>
                        <h3 className="font-medium">Sandbox Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          Enable sandbox mode to test without affecting live data or sending real messages
                        </p>
                      </div>
                      <Switch checked={sandboxMode} onCheckedChange={setSandboxMode} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="border-2 border-dashed border-border">
                        <CardContent className="p-4 text-center">
                          <Send className="h-8 w-8 text-primary mx-auto mb-2" />
                          <h3 className="font-medium mb-2">Test Message</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Send a test message to validate your setup
                          </p>
                          <Button onClick={handleSendTestMessage} className="w-full">
                            <Play className="mr-2 h-4 w-4" />
                            Send Test
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-dashed border-border">
                        <CardContent className="p-4 text-center">
                          <Link className="h-8 w-8 text-primary mx-auto mb-2" />
                          <h3 className="font-medium mb-2">Simulate Link Hit</h3>
                          <p className="text-sm text-muted-foreground mb-4">Test link tracking and webhook triggers</p>
                          <Button onClick={handleSimulateLinkHit} className="w-full">
                            <MousePointer className="mr-2 h-4 w-4" />
                            Simulate Hit
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-dashed border-border">
                        <CardContent className="p-4 text-center">
                          <Webhook className="h-8 w-8 text-primary mx-auto mb-2" />
                          <h3 className="font-medium mb-2">Test Webhook</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Trigger webhook events to test your endpoints
                          </p>
                          <Button onClick={handleTestWebhook} className="w-full">
                            <Zap className="mr-2 h-4 w-4" />
                            Test Webhook
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Custom Test Message</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="test-phone">Phone Number</Label>
                          <Input id="test-phone" placeholder="+1234567890" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="test-campaign">Campaign ID</Label>
                          <Input id="test-campaign" placeholder="test_campaign_001" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="test-message">Message Content</Label>
                        <Textarea
                          id="test-message"
                          placeholder="Enter your test message here..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <Button className="w-full md:w-auto">
                        <Send className="mr-2 h-4 w-4" />
                        Send Custom Test Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <KudosityTable data={[...testingLogs, ...sampleTestingLogs]} columns={testingLogsColumns} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
