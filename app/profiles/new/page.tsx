"use client"

import MainLayout from "@/components/MainLayout"
import NewProfileForm from "@/components/NewProfileForm"
import PageLayout from "@/components/layouts/PageLayout"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Save, X } from "lucide-react"

export default function NewProfilePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const handleClose = () => {
    router.push("/profiles")
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Trigger the hidden save button in the form
    document.getElementById("save-profile-form")?.click()
  }

  return (
    <MainLayout>
      <PageLayout
        title="New Profile"
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
            className:
              "ml-2 hover:bg-muted/50 dark:hover:bg-white/10 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors",
          },
        ]}
      >
        <div className="w-full">
          <NewProfileForm
            onSubmit={(data) => {
              setIsSaving(false)
              router.push("/profiles")
            }}
            onCancel={handleClose}
          />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
