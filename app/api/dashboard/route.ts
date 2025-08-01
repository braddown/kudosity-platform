import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get basic dashboard statistics
    const [profilesResult, campaignsResult, logsResult] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("campaigns").select("*", { count: "exact", head: true }),
      supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(5),
    ])

    return NextResponse.json({
      totalProfiles: profilesResult.count || 0,
      totalCampaigns: campaignsResult.count || 0,
      recentActivity: logsResult.data || [],
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
