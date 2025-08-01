"use client"

import MainLayout from "@/components/MainLayout"
import ReplyAutomation from "@/components/ReplyAutomation"
import PageLayout from "@/components/layouts/PageLayout"
import { Plus, Settings } from "lucide-react"

export default function ReplyAutomationPage() {
  const handleCreateRule = () => {
    console.log("Creating new automation rule")
    // Add create rule logic here
  }

  const handleSettings = () => {
    console.log("Opening automation settings")
    // Add settings logic here
  }

  const handleSaveChanges = () => {
    console.log("Saving automation changes")
    // Add save logic here - this will need to be connected to the ReplyAutomation component
  }

  const pageActions = [
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: handleSettings,
      variant: "outline" as const,
    },
    {
      label: "Save Changes",
      onClick: handleSaveChanges,
      variant: "outline" as const,
    },
    {
      label: "Create Rule",
      icon: <Plus className="h-4 w-4" />,
      onClick: handleCreateRule,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Reply Automation" actions={pageActions}>
        <div className="w-full overflow-auto">
          <ReplyAutomation />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
