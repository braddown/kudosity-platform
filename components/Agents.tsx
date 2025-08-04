"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { KudosityTable, type KudosityTableColumn } from "@/components/KudosityTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Bot, MessageSquare, Settings, Zap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Agent {
  id: string
  name: string
  description: string
  llm_provider: "openai" | "anthropic" | "groq" | "xai"
  llm_model: string
  system_prompt: string
  status: "active" | "inactive"
  usage_context: "inbox" | "reply_automation" | "both"
  created_at: string
  updated_at: string
  message_count: number
  success_rate: number
}

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

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockAgents: Agent[] = [
        {
          id: "1",
          name: "Customer Support Agent",
          description: "Handles general customer inquiries and support requests",
          llm_provider: "openai",
          llm_model: "gpt-4",
          system_prompt:
            "You are a helpful customer support agent. Be polite, professional, and provide accurate information about our services.",
          status: "active",
          usage_context: "both",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T14:30:00Z",
          message_count: 1247,
          success_rate: 94.2,
        },
        {
          id: "2",
          name: "Sales Assistant",
          description: "Helps with product inquiries and sales processes",
          llm_provider: "anthropic",
          llm_model: "claude-3-sonnet",
          system_prompt:
            "You are a knowledgeable sales assistant. Help customers understand our products and guide them through the sales process.",
          status: "active",
          usage_context: "inbox",
          created_at: "2024-01-10T09:15:00Z",
          updated_at: "2024-01-18T16:45:00Z",
          message_count: 892,
          success_rate: 89.7,
        },
        {
          id: "3",
          name: "Technical Support",
          description: "Provides technical assistance and troubleshooting",
          llm_provider: "xai",
          llm_model: "grok-3",
          system_prompt:
            "You are a technical support specialist. Provide clear, step-by-step solutions to technical problems.",
          status: "inactive",
          usage_context: "reply_automation",
          created_at: "2024-01-05T11:30:00Z",
          updated_at: "2024-01-15T13:20:00Z",
          message_count: 456,
          success_rate: 91.8,
        },
      ]
      setAgents(mockAgents)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreateAgent = () => {
    console.log("Navigating to create agent page...")
    router.push("/agents/create")
  }

  const handleEditAgent = (agent: Agent) => {
    console.log("Navigating to edit agent page for:", agent.id)
    router.push(`/agents/edit/${agent.id}`)
  }

  const handleDeleteAgent = async (agent: Agent) => {
    if (confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setAgents(agents.filter((a) => a.id !== agent.id))
        toast({
          title: "Success",
          description: "Agent deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete agent",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.status === "active" ? "inactive" : "active"
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setAgents(agents.map((a) => (a.id === agent.id ? { ...a, status: newStatus } : a)))
      toast({
        title: "Success",
        description: `Agent ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      })
    }
  }

  const columns: KudosityTableColumn<Agent>[] = [
    {
      header: "Agent",
      accessorKey: "name",
      cell: (agent) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Bot className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <div className="font-medium text-foreground">{agent.name}</div>
            <div className="text-sm text-muted-foreground">{agent.description}</div>
          </div>
        </div>
      ),
      minWidth: "300px",
    },
    {
      header: "LLM Provider",
      accessorKey: "llm_provider",
      cell: (agent) => (
        <div>
          <div className="font-medium">{LLM_PROVIDERS[agent.llm_provider].name}</div>
          <div className="text-sm text-muted-foreground">{agent.llm_model}</div>
        </div>
      ),
    },
    {
      header: "Usage Context",
      accessorKey: "usage_context",
      cell: (agent) => (
        <Badge variant="outline" className="font-medium">
          {USAGE_CONTEXTS[agent.usage_context].name}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (agent) => (
        <Badge variant={agent.status === "active" ? "translucent-green" : "translucent-gray"}>
          {agent.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Performance",
      accessorKey: "success_rate",
      cell: (agent) => (
        <div className="text-right">
          <div className="font-medium">{agent.success_rate}%</div>
          <div className="text-sm text-muted-foreground">{agent.message_count} messages</div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (agent) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditAgent(agent)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleStatus(agent)
            }}
          >
            {agent.status === "active" ? (
              <Zap className="h-4 w-4 text-green-500" />
            ) : (
              <Settings className="h-4 w-4 text-gray-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteAgent(agent)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
      width: "120px",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter((a) => a.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, a) => sum + a.message_count, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0 ? (agents.reduce((sum, a) => sum + a.success_rate, 0) / agents.length).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <KudosityTable
        data={filteredAgents}
        columns={columns}
        onSearch={handleSearch}
        searchPlaceholder="Search agents..."
        onRowClick={handleEditAgent}
      />
    </div>
  )
}

export default Agents
