import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    logger.debug("🔍 API: Fetching chats with profiles...")

    const { data: chats, error } = await supabase
      .from("chats")
      .select(`
        *,
        profile:profiles!chats_profile_id_fkey (
          id,
          first_name,
          last_name,
          email,
          mobile,
          status,
          location,
          source,
          avatar_url
        )
      `)
      .order("updated_at", { ascending: false })

    if (error) {
      logger.error("❌ API: Error fetching chats:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.debug(`✅ API: Successfully fetched ${chats?.length || 0} chats`)
    return NextResponse.json({ data: chats || [] })
  } catch (error) {
    logger.error("❌ API: Unexpected error in chats route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { profile_id, channel = "SMS", subject } = body

    logger.debug("🆕 API: Creating new chat:", { profile_id, channel, subject })

    const { data, error } = await supabase
      .from("chats")
      .insert({
        profile_id,
        status: "Active",
        channel,
        priority: "Medium",
        subject,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      logger.error("❌ API: Error creating chat:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.debug("✅ API: Chat created successfully:", data?.id)
    return NextResponse.json({ data })
  } catch (error) {
    logger.error("❌ API: Unexpected error creating chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
