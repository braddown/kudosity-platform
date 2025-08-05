"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import ProfilePage from "@/components/ProfilePage"
import PageLayout from "@/components/layouts/PageLayout"
import { profilesApi } from "@/api/profiles-api"
import { toast } from "@/components/ui/use-toast"
import { Save, X } from "lucide-react"

interface EditProfilePageProps {
  params: {
    id: string
  }
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const profileId = params.id

  console.log("EditProfilePage - Profile ID:", profileId) // Debug log

  // Fetch profile to get the name for the title
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const { data, error } = await profilesApi.getProfile(profileId)

        if (error) {
          toast({
            title: "Error loading profile",
            description: error,
            variant: "destructive",
          })
          router.push("/profiles")
          return
        }

        if (!data) {
          toast({
            title: "Profile not found",
            description: "The requested profile could not be found.",
            variant: "destructive",
          })
          router.push("/profiles")
          return
        }

        setProfile(data)
      } catch (err) {
        toast({
          title: "Error loading profile",
          description: err instanceof Error ? err.message : "An unknown error occurred",
          variant: "destructive",
        })
        router.push("/profiles")
      } finally {
        setLoading(false)
      }
    }

    if (profileId) {
      fetchProfile()
    }
  }, [profileId, router])

  const handleClose = () => {
    router.push("/profiles")
  }

  const handleSave = async () => {
    setIsSaving(true)
    // This will trigger the save in the ProfilePage component
  }

  const profileName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Loading..."

  if (loading) {
    return (
      <MainLayout>
        <PageLayout title="Loading..." actions={[]}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </PageLayout>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <PageLayout title="Profile Not Found" actions={[]}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Profile not found</p>
            </div>
          </div>
        </PageLayout>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageLayout
        title={profileName}
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
