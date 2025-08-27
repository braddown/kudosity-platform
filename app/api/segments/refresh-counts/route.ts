import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/auth/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the database function to refresh all segment counts
    const { data, error } = await supabase.rpc('update_segment_profile_counts')
    
    if (error) {
      console.error("Error refreshing segment counts:", error)
      return NextResponse.json({ error: "Failed to refresh counts" }, { status: 500 })
    }

    // Get updated segments with new counts
    const { data: segments, error: segmentsError } = await supabase
      .from("segments")
      .select("id, name, profile_count")
      .order("name")

    if (segmentsError) {
      console.error("Error fetching updated segments:", segmentsError)
      return NextResponse.json({ error: "Failed to fetch updated segments" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Segment counts refreshed successfully",
      segments 
    })
  } catch (error) {
    console.error("Error in refresh-counts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
