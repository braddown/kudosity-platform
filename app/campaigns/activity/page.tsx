"use client"

import MainLayout from "@/components/MainLayout"
import { useState, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { CampaignActivityTable } from "@/components/CampaignActivityTable"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CampaignActivityPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, broadcasts, journeys

  useEffect(() => {
    loadCampaignActivity()
  }, [])

  const loadCampaignActivity = async () => {
    try {
      setLoading(true)
      // This would fetch both broadcasts and journeys
      const response = await fetch("/api/campaigns/activity")
      const data = await response.json()
      setCampaigns(data)
    } catch (error) {
      console.error("Failed to load campaign activity:", error)
      // Fallback to sample data for now
      setCampaigns(generateSampleCampaigns())
    } finally {
      setLoading(false)
    }
  }

  const generateSampleCampaigns = () => [
    {
      id: "1",
      name: "Welcome Series Broadcast",
      type: "broadcast",
      status: "active",
      channel: "email",
      created_at: "2024-01-15T10:00:00Z",
      start_date: "2024-01-16T09:00:00Z",
      end_date: null,
      recipients: 1250,
      sent: 1200,
      delivered: 1180,
      opened: 590,
      clicked: 118,
      conversions: 24,
      revenue: 2400,
      creator: "Sarah Johnson",
    },
    {
      id: "2",
      name: "Product Onboarding Journey",
      type: "journey",
      status: "active",
      channel: "multi",
      created_at: "2024-01-10T14:30:00Z",
      start_date: "2024-01-12T08:00:00Z",
      end_date: null,
      recipients: 850,
      sent: 2100, // Multiple touchpoints
      delivered: 2050,
      opened: 1230,
      clicked: 410,
      conversions: 85,
      revenue: 12750,
      creator: "Mike Chen",
    },
    {
      id: "3",
      name: "Flash Sale Announcement",
      type: "broadcast",
      status: "completed",
      channel: "sms",
      created_at: "2024-01-08T16:00:00Z",
      start_date: "2024-01-09T10:00:00Z",
      end_date: "2024-01-09T18:00:00Z",
      recipients: 3200,
      sent: 3200,
      delivered: 3150,
      opened: 2520,
      clicked: 630,
      conversions: 126,
      revenue: 15750,
      creator: "Alex Rivera",
    },
    {
      id: "4",
      name: "Re-engagement Campaign",
      type: "journey",
      status: "paused",
      channel: "multi",
      created_at: "2024-01-05T11:15:00Z",
      start_date: "2024-01-07T09:00:00Z",
      end_date: null,
      recipients: 2100,
      sent: 4200,
      delivered: 4100,
      opened: 1640,
      clicked: 328,
      conversions: 42,
      revenue: 5250,
      creator: "Emma Davis",
    },
  ]

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === "all") return true
    return campaign.type === filter
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
        <CampaignActivityTable campaigns={filteredCampaigns} loading={loading} onRefresh={loadCampaignActivity} />
      </PageLayout>
    </MainLayout>
  )
}
