"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Clock, MessageSquare, Trash2, Edit, Eye, Play } from "lucide-react"
import { logger } from "@/lib/utils/logger"

interface Touchpoint {
  id: string
  name: string
  message: string
  channel: "sms" | "email"
  status: "active" | "draft" | "paused"
}

interface JourneyNode {
  id: string
  type: "touchpoint" | "delay" | "condition"
  touchpointId?: string
  touchpoint?: Touchpoint
  delay?: {
    value: number
    unit: "minutes" | "hours" | "days" | "weeks"
  }
  condition?: {
    type: "opened" | "clicked" | "replied" | "custom"
    value?: string
  }
  position: { x: number; y: number }
}

interface JourneyEditorProps {
  journeyId?: string
}

const JourneyEditor = forwardRef<{ save: () => Promise<void> }, JourneyEditorProps>(({ journeyId }, ref) => {
  const [activeTab, setActiveTab] = useState("builder")
  const [journeyName, setJourneyName] = useState("Welcome Journey")
  const [journeyDescription, setJourneyDescription] = useState("")
  const [selectedAudience, setSelectedAudience] = useState("")
  const [isSelectTouchpointOpen, setIsSelectTouchpointOpen] = useState(false)
  const [selectedNodeForTouchpoint, setSelectedNodeForTouchpoint] = useState<string | null>(null)

  // Sample touchpoints data
  const [availableTouchpoints] = useState<Touchpoint[]>([
    {
      id: "tp-001",
      name: "Welcome Message",
      message: "Welcome to our platform! We're excited to have you join us.",
      channel: "sms",
      status: "active",
    },
    {
      id: "tp-002",
      name: "Onboarding Tips",
      message: "Here are some quick tips to get you started with our platform...",
      channel: "email",
      status: "active",
    },
    {
      id: "tp-003",
      name: "Feature Highlight",
      message: "Did you know you can track your progress in real-time?",
      channel: "sms",
      status: "draft",
    },
  ])

  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>([
    {
      id: "start",
      type: "touchpoint",
      touchpointId: "tp-001",
      touchpoint: availableTouchpoints[0],
      position: { x: 100, y: 100 },
    },
    {
      id: "delay-1",
      type: "delay",
      delay: { value: 1, unit: "days" },
      position: { x: 100, y: 250 },
    },
    {
      id: "tp-2",
      type: "touchpoint",
      touchpointId: "tp-002",
      touchpoint: availableTouchpoints[1],
      position: { x: 100, y: 400 },
    },
  ])

  useImperativeHandle(ref, () => ({
    save: async () => {
      logger.debug("Saving journey:", {
        name: journeyName,
        description: journeyDescription,
        audience: selectedAudience,
        nodes: journeyNodes,
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
  }))

  const addNode = (type: JourneyNode["type"]) => {
    const newNode: JourneyNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 100, y: journeyNodes.length * 150 + 100 },
      ...(type === "delay" && { delay: { value: 1, unit: "hours" } }),
    }
    setJourneyNodes([...journeyNodes, newNode])
  }

  const addTouchpointNode = () => {
    const newNode: JourneyNode = {
      id: `touchpoint-${Date.now()}`,
      type: "touchpoint",
      position: { x: 100, y: journeyNodes.length * 150 + 100 },
    }
    setJourneyNodes([...journeyNodes, newNode])
    setSelectedNodeForTouchpoint(newNode.id)
    setIsSelectTouchpointOpen(true)
  }

  const selectTouchpoint = (touchpoint: Touchpoint) => {
    if (selectedNodeForTouchpoint) {
      setJourneyNodes(
        journeyNodes.map((node) =>
          node.id === selectedNodeForTouchpoint ? { ...node, touchpointId: touchpoint.id, touchpoint } : node,
        ),
      )
    }
    setIsSelectTouchpointOpen(false)
    setSelectedNodeForTouchpoint(null)
  }

  const updateNode = (nodeId: string, updates: Partial<JourneyNode>) => {
    setJourneyNodes(journeyNodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)))
  }

  const removeNode = (nodeId: string) => {
    setJourneyNodes(journeyNodes.filter((node) => node.id !== nodeId))
  }

  const getNodeIcon = (type: JourneyNode["type"]) => {
    switch (type) {
      case "touchpoint":
        return <MessageSquare className="h-4 w-4" />
      case "delay":
        return <Clock className="h-4 w-4" />
      case "condition":
        return <Play className="h-4 w-4" />
    }
  }

  const getChannelBadge = (channel: string) => {
    return (
      <Badge variant={channel === "sms" ? "default" : "secondary"} className="text-xs">
        {channel.toUpperCase()}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      draft: "secondary",
      paused: "outline",
    } as const
    return (
      <Badge variant={variants[status as keyof typeof variants]} className="text-xs">
        {status}
      </Badge>
    )
  }

  return (
    <div className="w-full h-full bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="builder">Journey Builder</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="flex-1 p-6 overflow-auto bg-background">
          <div className="w-full space-y-6">
            {/* Add Node Controls */}
            <div className="flex gap-3 flex-wrap p-4 bg-card/30 rounded-lg border border-border/50">
              <Button onClick={addTouchpointNode} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Add Touchpoint
              </Button>
              <Button variant="outline" onClick={() => addNode("delay")}>
                <Clock className="h-4 w-4 mr-2" />
                Add Delay
              </Button>
              <Button variant="outline" onClick={() => addNode("condition")}>
                <Play className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>

            {/* Journey Flow */}
            <div className="space-y-4">
              {journeyNodes.map((node, index) => (
                <Card
                  key={node.id}
                  className="w-full bg-card/80 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                            {getNodeIcon(node.type)}
                            {index + 1}
                          </Badge>
                        </div>

                        <div className="flex-1 min-w-0">
                          {node.type === "touchpoint" && (
                            <div className="space-y-3">
                              {node.touchpoint ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium">{node.touchpoint.name}</h4>
                                    {getChannelBadge(node.touchpoint.channel)}
                                    {getStatusBadge(node.touchpoint.status)}
                                  </div>
                                  <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-3 border border-border/30">
                                    <p className="text-sm text-gray-700 line-clamp-2">{node.touchpoint.message}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedNodeForTouchpoint(node.id)
                                        setIsSelectTouchpointOpen(true)
                                      }}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Change
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-3 w-3 mr-1" />
                                      Preview
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-gray-500 mb-2">No touchpoint selected</p>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedNodeForTouchpoint(node.id)
                                      setIsSelectTouchpointOpen(true)
                                    }}
                                  >
                                    Select Touchpoint
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {node.type === "delay" && (
                            <div className="space-y-3">
                              <h4 className="font-medium">Wait Period</h4>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="number"
                                  value={node.delay?.value || 1}
                                  onChange={(e) =>
                                    updateNode(node.id, {
                                      delay: { ...node.delay!, value: Number.parseInt(e.target.value) },
                                    })
                                  }
                                  className="w-20"
                                />
                                <Select
                                  value={node.delay?.unit || "hours"}
                                  onValueChange={(value) =>
                                    updateNode(node.id, {
                                      delay: { ...node.delay!, unit: value as any },
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="weeks">Weeks</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNode(node.id)}
                        className="text-red-600 hover:text-red-700 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-6 overflow-auto bg-background">
          <div className="w-full max-w-2xl space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Journey Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="journey-name">Journey Name</Label>
                  <Input
                    id="journey-name"
                    value={journeyName}
                    onChange={(e) => setJourneyName(e.target.value)}
                    placeholder="Enter journey name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={journeyDescription}
                    onChange={(e) => setJourneyDescription(e.target.value)}
                    placeholder="Describe the purpose of this journey"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-subscribers">New Subscribers</SelectItem>
                      <SelectItem value="existing-customers">Existing Customers</SelectItem>
                      <SelectItem value="inactive-users">Inactive Users</SelectItem>
                      <SelectItem value="all-subscribers">All Subscribers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Touchpoint Selection Dialog */}
      <Dialog open={isSelectTouchpointOpen} onOpenChange={setIsSelectTouchpointOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Select Touchpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availableTouchpoints.map((touchpoint) => (
              <Card
                key={touchpoint.id}
                className="cursor-pointer hover:bg-accent/50 transition-all duration-200 bg-card/60 backdrop-blur-sm border-border/50 hover:border-border hover:shadow-md"
                onClick={() => selectTouchpoint(touchpoint)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{touchpoint.name}</h4>
                        {getChannelBadge(touchpoint.channel)}
                        {getStatusBadge(touchpoint.status)}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{touchpoint.message}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})

JourneyEditor.displayName = "JourneyEditor"

export default JourneyEditor
