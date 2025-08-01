import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const chatId = params.id
    console.log(`🔍 API: Fetching messages for chat ${chatId}...`)

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ API: Error fetching messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ API: Successfully fetched ${messages?.length || 0} messages for chat ${chatId}`)
    return NextResponse.json({ data: messages || [] })
  } catch (error) {
    console.error("❌ API: Unexpected error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const chatId = params.id
    const body = await request.json()
    const { content, direction = "outbound" } = body

    console.log(`📤 API: Sending message to chat ${chatId}...`)

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
      console.error("❌ API: Error sending message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update chat's updated_at timestamp
    await supabase
      .from("chats")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId)

    console.log("✅ API: Message sent successfully:", data?.id)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("❌ API: Unexpected error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
