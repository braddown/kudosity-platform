"use client"

import { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import { EditPageHeader } from "@/components/EditPageHeader"
import { JourneyEditor } from "@/features/journeys"
import { logger } from "@/lib/utils/logger"

export default function JourneyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const journeyEditorRef = useRef<{ save: () => Promise<void> } | null>(null)

  const journeyId = params.id as string

  const handleSave = async () => {
    if (journeyEditorRef.current) {
      setIsSaving(true)
      try {
        await journeyEditorRef.current.save()
        // Show success message or redirect
      } catch (error) {
        logger.error("Failed to save journey:", error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleCancel = () => {
    router.push("/journeys")
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <EditPageHeader title={`Edit Journey`} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />
        <div className="flex-1 overflow-hidden">
          <JourneyEditor ref={journeyEditorRef} journeyId={journeyId} />
        </div>
      </div>
    </MainLayout>
  )
}
