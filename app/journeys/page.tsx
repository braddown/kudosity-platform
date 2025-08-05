"use client"

import MainLayout from "@/components/MainLayout"
import { Journeys } from "@/features/journeys"
import PageLayout from "@/components/layouts/PageLayout"
import { Plus } from "lucide-react"

export default function JourneysPage() {
  const pageActions = [
    {
      label: "New Journey",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => (window.location.href = "/journeys/create"),
      variant: "default" as const,
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Journeys" actions={pageActions}>
        <Journeys />
      </PageLayout>
    </MainLayout>
  )
}
