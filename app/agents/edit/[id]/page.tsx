"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Save, Bot, Brain, MessageSquare, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

const LLM_PROVIDERS = {
  openai: { name: "OpenAI", models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] },
  anthropic: { name: "Anthropic", models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"] },
  groq: { name: "Groq", models: ["llama-3-70b", "llama-3-8b", "mixtral-8x7b"] },
  xai: { name: "xAI", models: ["grok-3", "grok-2"] },
}

const USAGE_CONTEXTS = {
  inbox: { name: "Inbox Only", description: "Handle incoming messages in chat inbox" },
  reply_automation: { name: "Reply Automation", description: "Automated responses to messages" },
  both: { name: "Both", description: "Handle both inbox and automated replies" },
}

export default function EditAgentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    llm_provider: "openai" as keyof typeof LLM_PROVIDERS,
    llm_model: "",
    system_prompt: "",
    usage_context: "both" as keyof typeof USAGE_CONTEXTS,
  })
  const [agentStats, setAgentStats] = useState({
    status: "active",
    created_at: "",
    updated_at: "",
    message_count: 0,
    success_rate: 0,
  })

  useEffect(() => {
    fetchAgent()
  }, [params.id])

  const fetchAgent = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data based on agent ID
      const mockAgent = {
        id: params.id,
        name: "Customer Support Agent",
        description: "Handles general customer inquiries and support requests",
        llm_provider: "openai" as keyof typeof LLM_PROVIDERS,
        llm_model: "gpt-4",
        system_prompt:
          "You are a helpful customer support agent. Be polite, professional, and provide accurate information about our services.",
        usage_context: "both" as keyof typeof USAGE_CONTEXTS,
        status: "active",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T14:30:00Z",
        message_count: 1247,
        success_rate: 94.2,
      }

      setFormData({
        name: mockAgent.name,
        description: mockAgent.description,
        llm_provider: mockAgent.llm_provider,
        llm_model: mockAgent.llm_model,
        system_prompt: mockAgent.system_prompt,
        usage_context: mockAgent.usage_context,
      })

      setAgentStats({
        status: mockAgent.status,
        created_at: mockAgent.created_at,
        updated_at: mockAgent.updated_at,
        message_count: mockAgent.message_count,
        success_rate: mockAgent.success_rate,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agent details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/agents")
  }

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.llm_model || !formData.system_prompt) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "Agent updated successfully",
      })

      router.push("/agents")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const pageActions = [
    {
      onClick: handleSave,
      label: saving ? "Saving..." : "Save Changes",
      icon: <Save className="h-4 w-4" />,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      onClick: handleCancel,
      variant: "ghost" as const,
      icon: <X className="h-4 w-4" />,
    },
  ]

  if (loading) {
    return (
      <MainLayout>
        <PageLayout title="Loading..." description="Loading agent details...">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </PageLayout>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageLayout
        title="Edit Agent"
        description="Modify the configuration of your AI agent"
        actions={pageActions}
        showBackButton
        backHref="/agents"
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>Configure the basic details for your AI agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      className="bg-background"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usage_context">Usage Context</Label>
                    <Select
                      value={formData.usage_context}
                      onValueChange={(value: keyof typeof USAGE_CONTEXTS) =>
                        setFormData({ ...formData, usage_context: value })
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(USAGE_CONTEXTS).map(([key, context]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{context.name}</div>
                              <div className="text-sm text-muted-foreground">{context.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    className="bg-background"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <CardTitle>LLM Configuration</CardTitle>
                </div>
                <CardDescription>Choose the AI model and provider for your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="llm_provider">LLM Provider</Label>
                    <Select
                      value={formData.llm_provider}
                      onValueChange={(value: keyof typeof LLM_PROVIDERS) =>
                        setFormData({ ...formData, llm_provider: value, llm_model: "" })
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LLM_PROVIDERS).map(([key, provider]) => (
                          <SelectItem key={key} value={key}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="llm_model">Model *</Label>
                    <Select
                      value={formData.llm_model}
                      onValueChange={(value) => setFormData({ ...formData, llm_model: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LLM_PROVIDERS[formData.llm_provider].models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <CardTitle>System Prompt</CardTitle>
                </div>
                <CardDescription>Define how the agent should behave and respond to messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="system_prompt">Prompt *</Label>
                  <Textarea
                    id="system_prompt"
                    rows={8}
                    className="resize-none bg-background"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    This prompt defines the agent's personality, knowledge, and how it should respond to messages. Be
                    specific about the tone, style, and any constraints.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Status</CardTitle>
                <CardDescription>Current agent information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
                  <Bot className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-medium">{formData.name}</div>
                    <div className="text-sm text-muted-foreground">{formData.description}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Status</div>
                  <Badge variant={agentStats.status === "active" ? "translucent-green" : "translucent-gray"}>
                    {agentStats.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(agentStats.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(agentStats.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium">{agentStats.success_rate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${agentStats.success_rate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Messages</span>
                    <span className="font-medium">{agentStats.message_count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Response Time</span>
                    <span className="font-medium">1.2s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last message handled</span>
                  <span>2 minutes ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages today</span>
                  <span>23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages this week</span>
                  <span>156</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    </MainLayout>
  )
}
