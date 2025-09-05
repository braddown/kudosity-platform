"use client"

import { useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import { ApiKeys } from "@/features/settings"
import { usePageHeader } from "@/components/PageHeaderContext"
import { Plus } from "lucide-react"
import { logger } from "@/lib/utils/logger"

export default function ApiKeysPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader({
      title: "API Keys",
      actions: [
        {
          label: "Generate New API Key",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => {
            logger.debug("Generate new API key clicked")
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
        <ApiKeys />
      </div>
    </MainLayout>
  )
}
