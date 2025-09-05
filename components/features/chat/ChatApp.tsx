"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Search, Phone, Mail, MapPin, Clock, Building, Globe } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { logger } from "@/lib/utils/logger"

interface Contact {
  id: string
  firstName: string
  lastName: string
  avatar: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  status: "Transitioned" | "Active" | "Pending" | "Resolved"
  email?: string
  phone?: string
  location?: {
    country: string
    state: string
    city: string
    zipCode: string
  }
  company?: string
  jobTitle?: string
  timezone?: string
  createdAt?: string
  lastLogin?: string
  tags?: string[]
}

interface Message {
  id: string
  contactId: string
  content: string
  direction: "inbound" | "outbound"
  time: string
  status?: string
}

// Sample data with multiple contacts
const sampleChats: Contact[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    avatar: "JD",
    status: "Transitioned",
    lastMessage: "Thank you for your help!",
    timestamp: "10:17 AM",
    unreadCount: 0,
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: {
      country: "United States",
      state: "California",
      city: "San Francisco",
      zipCode: "94102",
    },
    company: "Acme Corp",
    jobTitle: "Senior Developer",
    timezone: "UTC-8 (Pacific Time)",
    createdAt: "Jan 15, 2024",
    lastLogin: "Today, 9:30 AM",
    tags: ["High Value", "Tech Savvy", "Repeat Customer"],
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    avatar: "SJ",
    status: "Active",
    lastMessage: "I need help with my account settings",
    timestamp: "9:45 AM",
    unreadCount: 2,
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 987-6543",
    location: {
      country: "United States",
      state: "New York",
      city: "New York",
      zipCode: "10001",
    },
    company: "Tech Solutions Inc",
    jobTitle: "Product Manager",
    timezone: "UTC-5 (Eastern Time)",
    createdAt: "Feb 3, 2024",
    lastLogin: "Today, 8:15 AM",
    tags: ["Premium", "Quick Response"],
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Chen",
    avatar: "MC",
    status: "Pending",
    lastMessage: "Can we schedule a call?",
    timestamp: "Yesterday",
    unreadCount: 1,
    email: "m.chen@startup.io",
    phone: "+1 (555) 456-7890",
    location: {
      country: "United States",
      state: "Texas",
      city: "Austin",
      zipCode: "73301",
    },
    company: "StartupCo",
    jobTitle: "CTO",
    timezone: "UTC-6 (Central Time)",
    createdAt: "Jan 28, 2024",
    lastLogin: "Yesterday, 3:22 PM",
    tags: ["Startup", "Technical"],
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Rodriguez",
    avatar: "ER",
    status: "Resolved",
    lastMessage: "Perfect, thanks for the solution!",
    timestamp: "2 days ago",
    unreadCount: 0,
    email: "emily.r@design.com",
    phone: "+1 (555) 321-0987",
    location: {
      country: "United States",
      state: "Florida",
      city: "Miami",
      zipCode: "33101",
    },
    company: "Design Studio",
    jobTitle: "Creative Director",
    timezone: "UTC-5 (Eastern Time)",
    createdAt: "Dec 12, 2023",
    lastLogin: "2 days ago, 11:45 AM",
    tags: ["Creative", "Long-term Client"],
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Thompson",
    avatar: "DT",
    status: "Active",
    lastMessage: "Looking forward to the demo",
    timestamp: "3 days ago",
    unreadCount: 3,
    email: "david.thompson@enterprise.com",
    phone: "+1 (555) 654-3210",
    location: {
      country: "United States",
      state: "Washington",
      city: "Seattle",
      zipCode: "98101",
    },
    company: "Enterprise Solutions",
    jobTitle: "VP of Operations",
    timezone: "UTC-8 (Pacific Time)",
    createdAt: "Nov 5, 2023",
    lastLogin: "3 days ago, 4:30 PM",
    tags: ["Enterprise", "Decision Maker", "High Priority"],
  },
]

const sampleMessages: { [key: string]: Message[] } = {
  "1": [
    {
      id: "1",
      contactId: "1",
      content: "Hi, I'm having trouble with my recent order.",
      direction: "inbound",
      time: "10:02 AM",
      status: "delivered",
    },
    {
      id: "2",
      contactId: "1",
      content: "I'm sorry to hear that. Can you please provide me with your order number?",
      direction: "outbound",
      time: "10:03 AM",
    },
    {
      id: "3",
      contactId: "1",
      content: "Sure, it's ORDER123456.",
      direction: "inbound",
      time: "10:05 AM",
      status: "delivered",
    },
    {
      id: "4",
      contactId: "1",
      content: "Thank you. I've located your order. What seems to be the issue?",
      direction: "outbound",
      time: "10:06 AM",
    },
    {
      id: "5",
      contactId: "1",
      content: "I received the wrong item in my package.",
      direction: "inbound",
      time: "10:08 AM",
      status: "delivered",
    },
    {
      id: "6",
      contactId: "1",
      content:
        "I apologize for the inconvenience. I'll arrange for a replacement to be sent out right away. Can you confirm your shipping address?",
      direction: "outbound",
      time: "10:10 AM",
    },
    {
      id: "7",
      contactId: "1",
      content: "Yes, it's 123 Main St, Anytown, AN 12345.",
      direction: "inbound",
      time: "10:12 AM",
      status: "delivered",
    },
    {
      id: "8",
      contactId: "1",
      content:
        "Perfect, thank you. I've initiated the replacement order. You should receive the correct item within 3-5 business days. Is there anything else I can help you with?",
      direction: "outbound",
      time: "10:14 AM",
    },
    {
      id: "9",
      contactId: "1",
      content: "No, that's all. Thank you for your help!",
      direction: "inbound",
      time: "10:16 AM",
      status: "delivered",
    },
    {
      id: "10",
      contactId: "1",
      content:
        "You're welcome! If you need any further assistance, please don't hesitate to reach out. Have a great day!",
      direction: "outbound",
      time: "10:17 AM",
    },
  ],
  "2": [
    {
      id: "1",
      contactId: "2",
      content: "Hi, I need help with my account settings. I can't seem to update my profile information.",
      direction: "inbound",
      time: "9:30 AM",
      status: "delivered",
    },
    {
      id: "2",
      contactId: "2",
      content:
        "I'd be happy to help you with that! Can you tell me which specific information you're trying to update?",
      direction: "outbound",
      time: "9:32 AM",
    },
    {
      id: "3",
      contactId: "2",
      content: "I'm trying to change my email address and phone number, but the save button seems to be grayed out.",
      direction: "inbound",
      time: "9:35 AM",
      status: "delivered",
    },
    {
      id: "4",
      contactId: "2",
      content:
        "I see the issue. You'll need to verify your current email first before making changes. I'll send you a verification link right now.",
      direction: "outbound",
      time: "9:37 AM",
    },
  ],
  "3": [
    {
      id: "1",
      contactId: "3",
      content: "Hello! I'm interested in scheduling a demo call to discuss your enterprise features.",
      direction: "inbound",
      time: "Yesterday, 2:15 PM",
      status: "delivered",
    },
    {
      id: "2",
      contactId: "3",
      content: "I'd be happy to set up a demo for you. What's your availability like this week?",
      direction: "outbound",
      time: "Yesterday, 2:18 PM",
    },
  ],
  "4": [
    {
      id: "1",
      contactId: "4",
      content: "Hi! I wanted to follow up on the design project we discussed last week.",
      direction: "inbound",
      time: "11:30 AM",
      status: "delivered",
    },
    {
      id: "2",
      contactId: "4",
      content: "I have the initial concepts ready. Would you like me to send them over?",
      direction: "outbound",
      time: "11:32 AM",
    },
    {
      id: "3",
      contactId: "4",
      content: "Yes, please! I'm excited to see what you've come up with.",
      direction: "inbound",
      time: "11:35 AM",
      status: "delivered",
    },
    {
      id: "4",
      contactId: "4",
      content: "Perfect, thanks for the solution! The designs look amazing.",
      direction: "inbound",
      time: "2 days ago",
      status: "delivered",
    },
  ],
  "5": [
    {
      id: "1",
      contactId: "5",
      content: "Hello! I'm interested in scheduling a demo of your enterprise features for our team.",
      direction: "inbound",
      time: "Monday, 2:15 PM",
      status: "delivered",
    },
    {
      id: "2",
      contactId: "5",
      content: "I'd be happy to set up a comprehensive demo for you. What's your team size and primary use case?",
      direction: "outbound",
      time: "Monday, 2:18 PM",
    },
    {
      id: "3",
      contactId: "5",
      content: "We have about 50 users and need advanced analytics and custom integrations.",
      direction: "inbound",
      time: "Monday, 2:25 PM",
      status: "delivered",
    },
    {
      id: "4",
      contactId: "5",
      content:
        "Perfect! I'll prepare a demo focused on enterprise analytics and our API capabilities. Are you available this Thursday at 3 PM?",
      direction: "outbound",
      time: "Monday, 2:30 PM",
    },
    {
      id: "5",
      contactId: "5",
      content: "Thursday at 3 PM works perfectly. Looking forward to the demo!",
      direction: "inbound",
      time: "Monday, 2:35 PM",
      status: "delivered",
    },
  ],
}

export default function ChatApp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const [activeTab, setActiveTab] = useState<"responses" | "actions" | "ai">("responses")

  // Initialize selected chat from URL params or default to first chat
  useEffect(() => {
    if (initializedRef.current) return

    const contactId = searchParams.get("contactId")
    let chatToSelect: Contact | null = null

    if (contactId) {
      chatToSelect = sampleChats.find((chat) => chat.id === contactId) || null
    }

    // If no valid contact from URL, default to first contact
    if (!chatToSelect && sampleChats.length > 0) {
      chatToSelect = sampleChats[0]
    }

    if (chatToSelect) {
      setSelectedChat(chatToSelect)
      setMessages(sampleMessages[chatToSelect.id] || [])

      // Only update URL if we're using the default contact (no contactId in URL)
      if (!contactId) {
        const params = new URLSearchParams()
        params.set("contactId", chatToSelect.id)
        params.set("firstName", chatToSelect.firstName)
        params.set("lastName", chatToSelect.lastName)
        router.replace(`/chat?${params.toString()}`)
      }
    }

    initializedRef.current = true
  }, [searchParams, router])

  // Scroll to show messages above operator controls
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest(".overflow-y-auto")
      if (container) {
        // Calculate the height of operator controls (200px) plus some buffer
        const operatorControlsHeight = 200
        const targetScrollTop = container.scrollHeight - container.clientHeight + operatorControlsHeight
        container.scrollTop = Math.max(0, targetScrollTop)
      }
    }
  }, [messages, selectedChat])

  // Add this new useEffect after the existing scroll effect:
  useEffect(() => {
    // Ensure proper initial scroll position when chat is first loaded
    if (selectedChat && messages.length > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          const container = messagesEndRef.current.closest(".overflow-y-auto")
          if (container) {
            const operatorControlsHeight = 200
            const targetScrollTop = container.scrollHeight - container.clientHeight + operatorControlsHeight
            container.scrollTop = Math.max(0, targetScrollTop)
          }
        }
      }, 100) // Small delay to ensure DOM is ready
    }
  }, [selectedChat])

  const handleChatSelect = useCallback(
    (chat: Contact) => {
      if (selectedChat?.id === chat.id) return // Don't update if same chat

      setSelectedChat(chat)
      setMessages(sampleMessages[chat.id] || [])

      // Update URL with contact information for the header
      const params = new URLSearchParams()
      params.set("contactId", chat.id)
      params.set("firstName", chat.firstName)
      params.set("lastName", chat.lastName)
      router.push(`/chat?${params.toString()}`)
    },
    [selectedChat?.id, router],
  )

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedChat) return

    const message: Message = {
      id: Date.now().toString(),
      contactId: selectedChat.id,
      content: newMessage,
      direction: "outbound",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }, [newMessage, selectedChat])

  const handleSuggestedResponse = useCallback((response: string) => {
    setNewMessage(response)
  }, [])

  const handleAction = useCallback((action: string) => {
    logger.debug(`Action: ${action}`)
  }, [])

  const filteredChats = sampleChats.filter((chat) =>
    `${chat.firstName} ${chat.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex" style={{ height: "calc(100vh - 200px)" }}>
      {/* Conversations List - Column 1: Independent scrolling */}
      <div className="w-80 flex flex-col">
        <div className="flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            {filteredChats.map((chat) => (
              <Card
                key={chat.id}
                className={`mb-2 cursor-pointer transition-colors bg-card/50 dark:bg-card/30 border-border/50 ${
                  selectedChat?.id === chat.id
                    ? "bg-primary/10 dark:bg-primary/20"
                    : "hover:bg-muted/50 dark:hover:bg-muted/30"
                }`}
                onClick={() => handleChatSelect(chat)}
              >
                <CardContent className="p-4 bg-transparent">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm backdrop-blur-sm">
                        {chat.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">
                          {chat.firstName} {chat.lastName}
                        </p>
                        <span className="text-xs text-gray-500">{chat.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 truncate">{chat.lastMessage}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {chat.status}
                        </Badge>
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="bg-blue-600 text-white text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface - Column 2: Messages with operator controls */}
      <div className="flex-1 flex flex-col relative">
        {/* Messages Area - Scrollable */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col bg-transparent"
          style={{
            paddingBottom: "200px",
            scrollBehavior: "smooth",
          }}
        >
          <div className="flex-1"></div>
          <div className="space-y-4 flex-shrink-0 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start gap-2 max-w-md">
                  {message.direction === "inbound" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-500/20 text-gray-400 text-xs backdrop-blur-sm">
                        {selectedChat?.avatar}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.direction === "outbound"
                        ? "bg-primary/20 dark:bg-primary/30 text-white border border-primary/30"
                        : "bg-muted/30 dark:bg-muted/40 text-foreground border border-border/50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        message.direction === "outbound"
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-900 dark:text-foreground"
                      }`}
                    >
                      {message.content}
                    </p>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        message.direction === "outbound" ? "text-gray-600 dark:text-white/70" : "text-gray-500"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {message.time}
                      {message.status && <span className="ml-1">• {message.status}</span>}
                    </div>
                  </div>
                  {message.direction === "outbound" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs backdrop-blur-sm">
                        AG
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Operator Controls - Fixed to bottom of message column */}
        <div className="absolute bottom-0 left-4 right-4 bg-card/90 dark:bg-card/80 backdrop-blur-sm border border-border rounded-t-lg shadow-lg">
          {/* Tabbed Interface */}
          <div className="border-b border-border">
            <div className="flex">
              <button
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === "responses"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("responses")}
              >
                Responses
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === "actions"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("actions")}
              >
                Actions
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === "ai"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("ai")}
              >
                AI Generate
              </button>
            </div>

            <div className="p-2">
              {/* Suggested Responses Tab Content */}
              {activeTab === "responses" && (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleSuggestedResponse("Thanks")}>
                    Thanks
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSuggestedResponse("Wrong Number")}>
                    Wrong Number
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSuggestedResponse("Yes")}>
                    Yes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSuggestedResponse("No")}>
                    No
                  </Button>
                </div>
              )}

              {/* Actions Tab Content */}
              {activeTab === "actions" && (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleAction("escalate")}>
                    Escalate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction("suppress")}>
                    Suppress
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction("transfer")}>
                    Transfer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction("complete")}>
                    Mark Complete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction("optout")}>
                    Opt Out
                  </Button>
                </div>
              )}

              {/* AI Generate Tab Content */}
              {activeTab === "ai" && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default">
                    Generate Response
                  </Button>
                  <Select defaultValue="default">
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Agent</SelectItem>
                      <SelectItem value="support">Support Agent</SelectItem>
                      <SelectItem value="sales">Sales Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4 text-white dark:text-gray-300" />
                </Button>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{newMessage.length} chars</span>
                <span>0 SMS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Panel - Column 3: Independent scrolling */}
      {selectedChat && (
        <div className="w-80 flex flex-col">
          <Card className="bg-card/50 dark:bg-card/30 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Profile Details</h2>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600">
                  Edit
                </Button>
              </div>

              {/* Profile Header */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-500/20 text-blue-400 backdrop-blur-sm">
                    {selectedChat.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedChat.firstName} {selectedChat.lastName}
                  </h3>
                  <p className="text-sm text-gray-800 dark:text-gray-600">{selectedChat.status}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-500 uppercase tracking-wide">
                    Contact Information
                  </label>
                  <div className="mt-2 space-y-3">
                    {selectedChat.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.email}</span>
                      </div>
                    )}
                    {selectedChat.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedChat.location && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-500 uppercase tracking-wide">
                      Location
                    </label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.location.country}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.location.state}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.location.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.location.zipCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-500 uppercase tracking-wide">
                    System Information
                  </label>
                  <div className="mt-2 space-y-3">
                    {selectedChat.timezone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.timezone}</span>
                      </div>
                    )}
                    {selectedChat.createdAt && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">Created: {selectedChat.createdAt}</span>
                      </div>
                    )}
                    {selectedChat.lastLogin && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">Last Login: {selectedChat.lastLogin}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-500 uppercase tracking-wide">
                    Custom Fields
                  </label>
                  <div className="mt-2 space-y-3">
                    {selectedChat.company && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.company}</span>
                      </div>
                    )}
                    {selectedChat.jobTitle && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-300">{selectedChat.jobTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedChat.tags && selectedChat.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-500 uppercase tracking-wide">
                      Tags
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedChat.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
