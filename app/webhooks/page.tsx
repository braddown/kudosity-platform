"use client"

import { useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import Webhooks from "@/components/Webhooks"
import { usePageHeader } from "@/components/PageHeaderContext"
import { Plus } from "lucide-react"

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
            console.log("Create new webhook clicked")
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
