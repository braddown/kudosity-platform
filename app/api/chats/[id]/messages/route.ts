import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/utils/logger"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const chatId = params.id
    logger.debug(`🔍 API: Fetching messages for chat ${chatId}...`)

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      logger.error("❌ API: Error fetching messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.debug(`✅ API: Successfully fetched ${messages?.length || 0} messages for chat ${chatId}`)
    return NextResponse.json({ data: messages || [] })
  } catch (error) {
    logger.error("❌ API: Unexpected error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const chatId = params.id
    const body = await request.json()
    const { content, direction = "outbound" } = body

    logger.debug(`📤 API: Sending message to chat ${chatId}...`)

    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        content,
        direction,
        status: "Sent",
        message_type: "text",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      logger.error("❌ API: Error sending message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update chat's updated_at timestamp
    await supabase
      .from("chats")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId)

    logger.debug("✅ API: Message sent successfully:", data?.id)
    return NextResponse.json({ data })
  } catch (error) {
    logger.error("❌ API: Unexpected error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
