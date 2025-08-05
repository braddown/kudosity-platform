"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { X } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import { BroadcastMessage } from "@/features/campaigns"
import PageLayout from "@/components/layouts/PageLayout"

export default function BroadcastPage() {
  const router = useRouter()
  const formRef = useRef<{ save: () => Promise<void> }>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (formRef.current) {
      setIsSaving(true)
      try {
        await formRef.current.save()
        // Optionally show success message or navigate
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleCancel = () => {
    router.push("/")
  }

  return (
    <MainLayout>
      <PageLayout
        title="Broadcast Message"
        showBackButton={true}
        backHref="/"
        actions={[
          {
            label: isSaving ? "Saving..." : "Save",
            onClick: handleSave,
          },
          {
            icon: <X className="h-4 w-4" />,
            onClick: handleCancel,
            variant: "ghost",
          },
        ]}
      >
        <BroadcastMessage ref={formRef} />
      </PageLayout>
    </MainLayout>
  )
}
