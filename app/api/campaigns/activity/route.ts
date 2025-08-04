import { NextResponse } from "next/server"
import { campaignsRepository } from "@/lib/repositories"

export async function GET() {
  try {
    // Fetch campaigns using the new repository pattern
    const { data: campaigns, error } = await campaignsRepository.getCampaignsForActivity({
      orderBy: 'created_at',
      ascending: false,
      limit: 50 // Limit to 50 most recent campaigns
    })

    if (error) {
      console.error("Error fetching campaigns:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to match the frontend expectations
    const transformedCampaigns = campaigns?.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type || 'unknown',
      status: campaign.status || 'unknown',
      channel: campaign.channel || 'unknown',
      created_at: campaign.created_at,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      // Extract metrics from performance_metrics JSON field
      recipients: campaign.performance_metrics?.recipients || 0,
      sent: campaign.performance_metrics?.sent || 0,
      delivered: campaign.performance_metrics?.delivered || 0, 
      opened: campaign.performance_metrics?.opened || 0,
      clicked: campaign.performance_metrics?.clicked || 0,
      conversions: campaign.performance_metrics?.conversions || 0,
      revenue: campaign.performance_metrics?.revenue || 0,
      creator: "System", // TODO: Join with profiles table for creator name
    })) || []

    return NextResponse.json(transformedCampaigns)
  } catch (error) {
    console.error("Failed to fetch campaign activity:", error)
    return NextResponse.json({ error: "Failed to fetch campaign activity" }, { status: 500 })
  }
}
