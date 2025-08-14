"use client"

import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import ProfilePage from "@/components/features/profiles/ProfilePage"
import MainLayout from "@/components/MainLayout"

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string

  return (
    <MainLayout>
      <div className="p-6">
        <ProfilePage
          profileId={profileId}
          onBack={() => router.push("/profiles")}
          isHeaderless={false}
        />
      </div>
    </MainLayout>
  )
}