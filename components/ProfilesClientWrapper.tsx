"use client"
import { useSearchParams } from "next/navigation"
import Contacts from "@/components/Contacts"

interface ProfilesClientWrapperProps {
  onProfileSelect?: (id: string) => void
}

export default function ProfilesClientWrapper({ onProfileSelect }: ProfilesClientWrapperProps) {
  const searchParams = useSearchParams()
  const segmentId = searchParams.get("segmentId")
  const segmentName = searchParams.get("segmentName")
  const segmentFilter = searchParams.get("segmentFilter")

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="overflow-x-auto w-full">
          <Contacts
            segmentId={segmentId}
            segmentName={segmentName}
            segmentFilter={segmentFilter}
            onProfileSelect={onProfileSelect || (() => {})}
          />
        </div>
      </div>
    </div>
  )
}
