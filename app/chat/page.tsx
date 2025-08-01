"use client"

import MainLayout from "@/components/MainLayout"
import ChatApp from "@/components/ChatApp"
import PageLayout from "@/components/layouts/PageLayout"
import { Settings, Archive, Users, MessageSquare } from "lucide-react"

export default function ChatPage() {
  const handleChatSettings = () => {
    console.log("Opening chat settings")
  }

  const handleArchiveChats = () => {
    console.log("Archiving old chats")
  }

  const handleManageContacts = () => {
    console.log("Managing contacts")
  }

  const handleNewChat = () => {
    console.log("Starting new chat")
  }

  const pageActions = [
    {
      label: "Archive",
      icon: <Archive className="h-4 w-4" />,
      onClick: handleArchiveChats,
      variant: "outline" as const,
    },
    {
      label: "Contacts",
      icon: <Users className="h-4 w-4" />,
      onClick: handleManageContacts,
      variant: "outline" as const,
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: handleChatSettings,
      variant: "outline" as const,
    },
    {
      label: "New Chat",
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: handleNewChat,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Inbox" actions={pageActions}>
        <div className="h-full w-full overflow-hidden">
          <ChatApp />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
