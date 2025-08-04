"use client"

import { useState } from "react"
import MainLayout from "@/components/MainLayout"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Save, Bot, Brain, MessageSquare } from "lucide-react"
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

export default function CreateAgentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    llm_provider: "openai" as keyof typeof LLM_PROVIDERS,
    llm_model: "",
    system_prompt: "",
    usage_context: "both" as keyof typeof USAGE_CONTEXTS,
  })

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
        description: "Agent created successfully",
      })

      router.push("/agents")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const pageActions = [
    {
      onClick: handleSave,
      label: saving ? "Saving..." : "Save",
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

  return (
    <MainLayout>
      <PageLayout
        title="Create Agent"
        description="Configure a new AI agent to handle messages in your inbox or reply automation"
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
                      placeholder="e.g., Customer Support Agent"
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
                    placeholder="Brief description of what this agent does"
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
                        <SelectValue placeholder="Select a model" />
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
                    placeholder="You are a helpful customer support agent. Be polite, professional, and provide accurate information about our services..."
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
                <CardTitle className="text-lg">Agent Preview</CardTitle>
                <CardDescription>How your agent will appear in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
                  <Bot className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-medium">{formData.name || "New Agent"}</div>
                    <div className="text-sm text-muted-foreground">
                      {formData.description || "Agent description will appear here"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Status</div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Usage Context</div>
                  <div className="text-sm text-muted-foreground">
                    {USAGE_CONTEXTS[formData.usage_context].description}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">LLM Provider</div>
                  <div className="text-sm text-muted-foreground">
                    {LLM_PROVIDERS[formData.llm_provider].name}
                    {formData.llm_model && ` - ${formData.llm_model}`}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">System Prompt Best Practices:</div>
                  <ul className="mt-1 space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Be specific about the agent's role and expertise</li>
                    <li>Define the tone and communication style</li>
                    <li>Include any constraints or limitations</li>
                    <li>Specify how to handle unknown questions</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Model Selection:</div>
                  <ul className="mt-1 space-y-1 text-muted-foreground list-disc list-inside">
                    <li>GPT-4 for complex reasoning and accuracy</li>
                    <li>Claude for nuanced conversations</li>
                    <li>Groq for fast response times</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    </MainLayout>
  )
}
