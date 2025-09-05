import { NextRequest, NextResponse } from "next/server"
import { campaignsRepository } from "@/api/repositories"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Fetch total count first
    const { count: totalCount } = await campaignsRepository.getCampaignsCount()

    // Fetch campaigns with pagination
    const { data: campaigns, error } = await campaignsRepository.getCampaignsForActivity({
      orderBy: 'created_at',
      ascending: false,
      limit: limit,
      offset: offset
    })

    if (error) {
      logger.error("Error fetching campaigns:", error)
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
      recipients: campaign.performance_metrics?.total_recipients || campaign.performance_metrics?.recipients || 0,
      sent: campaign.performance_metrics?.sent || 0,
      delivered: campaign.performance_metrics?.delivered || 0, 
      opened: campaign.performance_metrics?.opened || 0,
      clicked: campaign.performance_metrics?.clicked || 0,
      conversions: campaign.performance_metrics?.conversions || 0,
      revenue: campaign.performance_metrics?.revenue || 0,
      creator: "System", // TODO: Join with profiles table for creator name
    })) || []

    // Return campaigns with pagination metadata
    return NextResponse.json({
      campaigns: transformedCampaigns,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasMore: page < Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    logger.error("Failed to fetch campaign activity:", error)
    return NextResponse.json({ error: "Failed to fetch campaign activity" }, { status: 500 })
  }
}
