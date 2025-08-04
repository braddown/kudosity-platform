"use client"

import MainLayout from "@/components/MainLayout"
import { useState, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { CampaignActivityTable } from "@/components/CampaignActivityTable"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CampaignActivityPage() {
  const router = useRouter()
  const [filter, setFilter] = useState("all") // all, broadcasts, journeys
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simple, direct fetch approach
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Fetching campaigns from /api/campaigns/activity...')
      
      const response = await fetch('/api/campaigns/activity')
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Campaigns loaded:', data.length, 'campaigns')
      
      setCampaigns(data)
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Failed to load campaigns:', err)
      setError(err.message || 'Failed to load campaigns')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])



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
        description="Monitor and manage all your broadcasts and customer journeys"
        actions={actions}
      >
        <CampaignActivityTable 
          campaigns={filteredCampaigns} 
          loading={false}
          onRefresh={fetchCampaigns} 
        />
      </PageLayout>
    </MainLayout>
  )
}
