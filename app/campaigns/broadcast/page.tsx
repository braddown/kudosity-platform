"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { X } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import BroadcastMessageEnhancedOrdered, { BroadcastMessageEnhancedOrderedRef } from "@/components/features/campaigns/BroadcastMessageEnhancedOrdered"
import PageLayout from "@/components/layouts/PageLayout"
import { logger } from "@/lib/utils/logger"

export default function BroadcastPage() {
  const router = useRouter()
  const formRef = useRef<BroadcastMessageEnhancedOrderedRef>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [canSave, setCanSave] = useState(false)

  // Poll for form state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (formRef.current) {
        setCanSave(formRef.current.canSaveDraft())
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const handleSaveDraft = async () => {
    if (formRef.current && formRef.current.canSaveDraft()) {
      setIsSaving(true)
      try {
        await formRef.current.saveDraft()
        router.push("/campaigns/activity")
      } catch (error) {
        logger.error("Failed to save draft:", error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleClose = () => {
    router.push("/campaigns/activity")
  }
  
  return (
    <MainLayout>
      <PageLayout
        title="Broadcast Campaign"
        actions={[
          {
            label: isSaving ? "Saving..." : "Save Draft",
            onClick: handleSaveDraft,
            disabled: !canSave || isSaving,
          },
          {
            icon: <X className="h-4 w-4" />,
            onClick: handleClose,
            variant: "ghost",
          },
        ]}
      >
        <BroadcastMessageEnhancedOrdered ref={formRef} />
      </PageLayout>
    </MainLayout>
  )
}
