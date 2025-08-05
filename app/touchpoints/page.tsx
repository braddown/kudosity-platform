"use client"

import MainLayout from "@/components/MainLayout"
import { TouchpointsList } from "@/features/touchpoints"
import PageLayout from "@/components/layouts/PageLayout"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TouchpointsPage() {
  const router = useRouter()

  const handleCreateTouchpoint = () => {
    router.push("/touchpoints/create")
  }

  const pageActions = [
    {
      label: "Create Touchpoint",
      icon: <Plus className="h-4 w-4" />,
      onClick: handleCreateTouchpoint,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Touchpoints" actions={pageActions}>
        <div className="w-full overflow-auto bg-transparent">
          <TouchpointsList />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
