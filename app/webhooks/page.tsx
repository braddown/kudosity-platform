"use client"

import { useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import { Webhooks } from "@/features/settings"
import { usePageHeader } from "@/components/PageHeaderContext"
import { Plus } from "lucide-react"
import { logger } from "@/lib/utils/logger"

export default function WebhooksPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader({
      title: "Webhooks",
      actions: [
        {
          label: "Create New Webhook",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => {
            logger.debug("Create new webhook clicked")
          },
          variant: "default",
        },
      ],
    })

    return () => setPageHeader(null)
  }, [setPageHeader])

  return (
    <MainLayout>
      <div className="w-full">
        <Webhooks />
      </div>
    </MainLayout>
  )
}
