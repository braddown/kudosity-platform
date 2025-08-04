import { NextResponse } from "next/server"

// Sample data until campaigns table is properly set up
const sampleCampaigns = [
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
  {
    id: "5",
    name: "Test Campaign with Missing Data",
    type: "broadcast",
    status: "draft",
    channel: "email",
    created_at: "2024-01-20T12:00:00Z",
    start_date: "2024-01-21T10:00:00Z",
    end_date: null,
    recipients: null, // Test undefined handling
    sent: undefined,
    delivered: null,
    opened: 0,
    clicked: null,
    conversions: undefined,
    revenue: null,
    creator: "Test User",
  },
]

export async function GET() {
  try {
    // TODO: Replace with actual database query once campaigns table is set up
    // const { data: campaigns, error } = await supabase
    //   .from("campaigns")
    //   .select("*")
    //   .order("created_at", { ascending: false })

    // For now, return sample data
    return NextResponse.json(sampleCampaigns)
  } catch (error) {
    console.error("Failed to fetch campaign activity:", error)
    return NextResponse.json({ error: "Failed to fetch campaign activity" }, { status: 500 })
  }
}
