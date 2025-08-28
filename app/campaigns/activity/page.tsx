"use client"

import MainLayout from "@/components/MainLayout"
import { useState, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { CampaignActivityTable } from "@/features/campaigns"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CampaignActivityPage() {
  const router = useRouter()
  const [filter, setFilter] = useState("all") // all, broadcasts, journeys
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCampaigns, setTotalCampaigns] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Fetch campaigns with pagination
  const fetchCampaigns = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      console.log(`🔄 Fetching campaigns page ${page}...`)
      
      const response = await fetch(`/api/campaigns/activity?page=${page}&limit=${pageSize}`)
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`✅ Page ${page} loaded:`, data.campaigns?.length || 0, 'campaigns')
      
      if (append) {
        setCampaigns(prev => [...prev, ...(data.campaigns || [])])
      } else {
        setCampaigns(data.campaigns || [])
      }
      
      setCurrentPage(data.pagination?.page || 1)
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCampaigns(data.pagination?.total || 0)
      setLoading(false)
      setIsLoadingMore(false)
    } catch (err: any) {
      console.error('❌ Failed to load campaigns:', err)
      setError(err.message || 'Failed to load campaigns')
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchCampaigns(1)
  }, [pageSize])

  const loadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchCampaigns(currentPage + 1, true)
    }
  }



  const handleCreateBroadcast = () => {
    router.push("/broadcast")
  }

  const handleCreateJourney = () => {
    router.push("/journeys")
  }

  const actions = [
    {
      label: "New Broadcast",
      icon: <Plus className="h-4 w-4" />,
      onClick: handleCreateBroadcast,
    },
    {
      label: "New Journey",
      icon: <Plus className="h-4 w-4" />,
      onClick: handleCreateJourney,
    },
  ]

  if (loading) {
    return (
      <MainLayout>
        <PageLayout
          title="Campaign Activity"
          description="Monitor and manage all your broadcasts and customer journeys"
          actions={actions}
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading campaign activity...</p>
            </div>
          </div>
        </PageLayout>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <PageLayout
          title="Campaign Activity"
          description="Monitor and manage all your broadcasts and customer journeys"
          actions={actions}
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600">Error: {error}</p>
              <button onClick={() => fetchCampaigns()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Retry
              </button>
            </div>
          </div>
        </PageLayout>
      </MainLayout>
    )
  }

  const filteredCampaigns = campaigns.filter((campaign: any) => {
    if (filter === "all") return true
    return campaign.type === filter
  })

  return (
    <MainLayout>
      <PageLayout
        title="Campaign Activity"
        description="View and manage all campaign activities and performance"
        actions={actions}
      >
        <div className="space-y-4">
          {/* Campaign count and pagination info */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {campaigns.length} of {totalCampaigns} campaigns
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm">Per page:</label>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border rounded"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <CampaignActivityTable 
            campaigns={filteredCampaigns} 
            loading={false}
            onRefresh={() => fetchCampaigns(1)} 
          />

          {/* Load more button */}
          {currentPage < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : `Load More (Page ${currentPage + 1} of ${totalPages})`}
              </button>
            </div>
          )}
        </div>
      </PageLayout>
    </MainLayout>
  )
}
