"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface EditProfilePageProps {
  params: {
    id: string
  }
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const router = useRouter()
  const profileId = params.id

  const handleClose = () => {
    router.push("/profiles")
  }

  return (
    <MainLayout>
      <PageLayout
        title="Edit Profile"
        customActions={
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleClose}
              variant="outline"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="p-4">
          <p>Profile ID: {profileId}</p>
          <p>Temporary simplified page to test navigation</p>
          <Button onClick={handleClose} className="mt-4">
            Back to Profiles
          </Button>
        </div>
      </PageLayout>
    </MainLayout>
  )
}
