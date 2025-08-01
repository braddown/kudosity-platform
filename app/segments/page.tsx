"use client"

import { PlusCircle } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import SegmentList from "@/components/SegmentList"
import PageLayout from "@/components/layouts/PageLayout"
import { useRouter } from "next/navigation"

export default function SegmentsPage() {
  const router = useRouter()

  const handleCreateSegment = () => {
    router.push("/profiles?filterActive=true&createSegment=true")
  }

  const pageActions = [
    {
      label: "Create Segment",
      icon: <PlusCircle className="h-4 w-4" />,
      onClick: handleCreateSegment,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Segments" actions={pageActions}>
        <div className="w-full overflow-auto">
          <SegmentList />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
