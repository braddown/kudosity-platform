"use client"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import SegmentList from "./SegmentList"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function SegmentsClientWrapper() {
  const router = useRouter()

  const handleCreateSegment = () => {
    router.push("/profiles?newSegment=true")
  }

  return (
    <MainLayout>
      {/* Header - Full width with title and actions */}
      <div className="w-full border-b border-gray-200 py-4 px-4 flex justify-between items-center max-w-full">
        <h2 className="text-2xl font-semibold pl-4">Segments</h2>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={handleCreateSegment}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="w-full overflow-x-auto px-6 pt-3 pb-4 md:px-6 md:pt-3 md:pb-5">
        <div className="w-full">
          <SegmentList />
        </div>
      </div>
    </MainLayout>
  )
}
