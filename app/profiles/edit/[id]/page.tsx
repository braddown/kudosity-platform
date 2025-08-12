"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import ProfilePage from "@/components/ProfilePage"
import PageLayout from "@/components/layouts/PageLayout"
import { Save, X } from "lucide-react"

interface EditProfilePageProps {
  params: {
    id: string
  }
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const profileId = params.id

  console.log("EditProfilePage - Profile ID:", profileId) // Debug log

  const handleClose = () => {
    router.push("/profiles")
  }

  const handleSave = async () => {
    setIsSaving(true)
    // This will trigger the save in the ProfilePage component
  }



  return (
    <MainLayout>
      <PageLayout
        title="Edit Profile"
        actions={[
          {
            label: isSaving ? "Saving..." : "Save",
            onClick: handleSave,
            icon: <Save className="h-4 w-4" />,
            className: isSaving ? "opacity-50 cursor-not-allowed" : "",
          },
          {
            onClick: handleClose,
            variant: "ghost",
            icon: <X className="h-4 w-4" />,
            className: "ml-2",
          },
        ]}
      >
        <ProfilePage
          profileId={profileId}
          onBack={handleClose}
          saveCallback={() => {
            setIsSaving(false)
            router.push("/profiles")
          }}
          triggerSave={isSaving}
          onSaveError={() => {
            setIsSaving(false)
          }}
          isHeaderless={true}
        />
      </PageLayout>
    </MainLayout>
  )
}
