"use client"

import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import Agents from "@/components/Agents"
import PageLayout from "@/components/layouts/PageLayout"
import { Plus, Settings } from "lucide-react"
import { logger } from "@/lib/utils/logger"

export default function AgentsPage() {
  const router = useRouter()

  const handleCreateAgent = () => {
    logger.debug("Creating new agent - navigating to create page")
    router.push("/agents/create")
  }

  const handleAgentSettings = () => {
    logger.debug("Opening agent settings")
    // Add settings logic here
  }

  const pageActions = [
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: handleAgentSettings,
      variant: "outline" as const,
    },
    {
      label: "Create Agent",
      icon: <Plus className="h-4 w-4" />,
      onClick: handleCreateAgent,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Agents" actions={pageActions}>
        <div className="p-6 w-full overflow-auto">
          <Agents />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
