import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get total profiles count
    const { count: profilesCount } = await supabase.from("cdp_profiles").select("*", { count: "exact", head: true })

    // Get total campaigns count
    const { count: campaignsCount } = await supabase.from("campaigns").select("*", { count: "exact", head: true })

    // Get recent activity logs
    const { data: recentLogs } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      profiles: profilesCount || 0,
      campaigns: campaignsCount || 0,
      recentActivity: recentLogs || [],
    })
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 })
  }
}
