"use client"

import { useParams } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import { TouchpointMessage } from "@/features/touchpoints"
import PageLayout from "@/components/layouts/PageLayout"
import { Save, Send } from "lucide-react"
import { logger } from "@/lib/utils/logger"

export default function TouchpointDetailPage() {
  const params = useParams()
  const touchpointId = params.id as string

  return (
    <MainLayout>
      <PageLayout
        title="Touchpoint tp-001"
        description="Configure your touchpoint message and settings"
        showBackButton={true}
        backHref="/touchpoints"
        actions={[
          {
            label: "Save Draft",
            icon: <Save className="h-4 w-4" />,
            variant: "outline",
            onClick: () => logger.debug("Save draft"),
          },
          {
            label: "Activate",
            icon: <Send className="h-4 w-4" />,
            variant: "default",
            onClick: () => logger.debug("Activate touchpoint"),
          },
        ]}
      >
        <TouchpointMessage touchpointId={touchpointId} />
      </PageLayout>
    </MainLayout>
  )
}
