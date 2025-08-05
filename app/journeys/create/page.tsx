"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import { EditPageHeader } from "@/components/EditPageHeader"
import { JourneyEditor } from "@/features/journeys"

export default function CreateJourneyPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const journeyEditorRef = useRef<{ save: () => Promise<void> } | null>(null)

  const handleSave = async () => {
    if (journeyEditorRef.current) {
      setIsSaving(true)
      try {
        await journeyEditorRef.current.save()
        router.push("/journeys")
      } catch (error) {
        console.error("Failed to create journey:", error)
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
        <EditPageHeader title="Create Journey" onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />
        <div className="flex-1 overflow-hidden">
          <JourneyEditor ref={journeyEditorRef} />
        </div>
      </div>
    </MainLayout>
  )
}
