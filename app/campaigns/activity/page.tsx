"use client"

import MainLayout from "@/components/MainLayout"
import { useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { CampaignActivityTable } from "@/components/CampaignActivityTable"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApiState } from "@/hooks/use-async-state"

export default function CampaignActivityPage() {
  const router = useRouter()
  const [filter, setFilter] = useState("all") // all, broadcasts, journeys

  // Use the new async state pattern
  const { data: campaigns, loading, error, refetch, render } = useApiState<any[]>('/api/campaigns/activity', {
    loadingMessage: 'Loading campaign activity...',
    emptyState: {
      title: 'No campaigns found',
      description: 'Create your first campaign to get started with reaching your audience.',
      action: {
        label: 'Create Campaign',
        onClick: () => router.push('/broadcast')
      }
    },
    // Transform error to provide fallback data in development
    transformError: (error) => {
      console.error("Failed to load campaign activity:", error)
      // In development, we could return fallback data instead of showing error
      if (process.env.NODE_ENV === 'development') {
        console.warn("Using fallback sample data for development")
      }
      return { message: error.message || 'Failed to load campaigns' }
    },
    retry: {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential'
    }
  })



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

  return (
    <MainLayout>
      <PageLayout
        title="Campaign Activity"
        description="Monitor and manage all your broadcasts and customer journeys"
        actions={actions}
      >
        {render((campaignData) => {
          const filteredCampaigns = campaignData.filter((campaign: any) => {
            if (filter === "all") return true
            return campaign.type === filter
          })
          
          return (
            <CampaignActivityTable 
              campaigns={filteredCampaigns} 
              loading={false} // Loading is handled by render function
              onRefresh={refetch} 
            />
          )
        })}
      </PageLayout>
    </MainLayout>
  )
}
