"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import TouchpointMessage from "@/components/TouchpointMessage"
import { EditPageHeader } from "@/components/EditPageHeader"

export default function CreateTouchpointPage() {
  const router = useRouter()
  const formRef = useRef<{ save: () => Promise<void> }>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (formRef.current) {
      setIsSaving(true)
      try {
        await formRef.current.save()
        // Optionally navigate after successful save
        // router.push("/touchpoints")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleCancel = () => {
    router.push("/touchpoints")
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <EditPageHeader title="New Touchpoint" onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />
        <TouchpointMessage ref={formRef} />
      </div>
    </MainLayout>
  )
}
