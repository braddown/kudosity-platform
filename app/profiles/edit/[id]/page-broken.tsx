"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import ProfilePage from "@/components/features/profiles/ProfilePage"
import PageLayout from "@/components/layouts/PageLayout"
import { ProfileEditActionsSimple } from "@/components/ProfileEditActionsSimple"

interface EditProfilePageProps {
  params: {
    id: string
  }
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveText, setSaveText] = useState("Save")
  const [profileStatus, setProfileStatus] = useState<string>('active')
  const [originalStatus, setOriginalStatus] = useState<string>('active')
  const [hasChanges, setHasChanges] = useState(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const profileId = params.id

  const handleClose = () => {
    // Clear any pending redirect timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
    router.push("/profiles")
  }

  const handleSave = async () => {
    // Don't allow saving if already saved, saving, or no changes
    if (saveText === "Saved!" || isSaving || !hasChanges) return
    
    setIsSaving(true)
    // This will trigger the save in the ProfilePage component
  }

  const handleStatusChange = (newStatus: string) => {
    setProfileStatus(newStatus)
    // Check if status is different from original
    setHasChanges(newStatus !== originalStatus)
    // Reset save text if we're in "Saved!" state and user makes a change
    if (saveText === "Saved!") {
      setSaveText("Save")
      // Cancel redirect if user changes status after save
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }
  }

  const handleStatusUpdate = (status: string) => {
    setProfileStatus(status)
    setOriginalStatus(status)
  }

  return (
    <MainLayout>
      <PageLayout
        title="Edit Profile"
        customActions={
          <ProfileEditActionsSimple
            onSave={handleSave}
            onCancel={handleClose}
            isSaving={isSaving}
            hasChanges={hasChanges}
            saveText={saveText}
            status={profileStatus}
            onStatusChange={handleStatusChange}
          />
        }
      >
        <ProfilePage
          profileId={profileId}
          onBack={handleClose}
          onSave={() => {
            setIsSaving(false)
            setSaveText("Saved!")
            setHasChanges(false)
            setOriginalStatus(profileStatus)
            
            // Clear any existing redirect timeout
            if (redirectTimeoutRef.current) {
              clearTimeout(redirectTimeoutRef.current)
            }
            
            // Show "Saved" feedback for 1.5 seconds before redirecting
            const timeout = setTimeout(() => {
              router.push("/profiles")
            }, 1500)
            redirectTimeoutRef.current = timeout
          }}
          triggerSave={isSaving}
          onSaveError={() => {
            setIsSaving(false)
            setSaveText("Save")
          }}
          isHeaderless={true}
          onStatusUpdate={handleStatusUpdate}
          onStatusChange={handleStatusChange}
          pendingStatusChange={null}
          onHasChangesUpdate={(changes) => {
            // Combine field changes with status changes
            const statusChanged = profileStatus !== originalStatus
            const hasAnyChanges = changes || statusChanged
            setHasChanges(hasAnyChanges)
            
            // Reset save text if we're in "Saved!" state and user makes a change
            if (saveText === "Saved!" && hasAnyChanges) {
              setSaveText("Save")
              // Cancel redirect if user starts editing again
              if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current)
                redirectTimeoutRef.current = null
              }
            }
          }}
        />
      </PageLayout>
    </MainLayout>
  )
}