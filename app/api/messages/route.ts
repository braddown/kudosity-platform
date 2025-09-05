import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/utils/logger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "24h"
    const type = searchParams.get("type") // "sent" or "received"

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "1h":
        startDate.setHours(now.getHours() - 1)
        break
      case "24h":
        startDate.setDate(now.getDate() - 1)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 1)
    }

    if (type === "sent") {
      const { data, error } = await supabase
        .from("messages_sent")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })

      if (error) {
        logger.error("Error fetching sent messages:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data: data || [] })
    } else if (type === "received") {
      const { data, error } = await supabase
        .from("messages_received")
        .select("*")
        .gte("received_at", startDate.toISOString())
        .order("received_at", { ascending: false })

      if (error) {
        logger.error("Error fetching received messages:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data: data || [] })
    } else {
      // Get both sent and received messages
      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from("messages_sent")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("messages_received")
          .select("*")
          .gte("received_at", startDate.toISOString())
          .order("received_at", { ascending: false }),
      ])

      if (sentResult.error) {
        logger.error("Error fetching sent messages:", sentResult.error)
        return NextResponse.json({ error: sentResult.error.message }, { status: 500 })
      }

      if (receivedResult.error) {
        logger.error("Error fetching received messages:", receivedResult.error)
        return NextResponse.json({ error: receivedResult.error.message }, { status: 500 })
      }

      // Combine and sort all messages
      const allMessages = [
        ...(sentResult.data || []).map((msg) => ({ ...msg, type: "sent", timestamp: msg.created_at })),
        ...(receivedResult.data || []).map((msg) => ({ ...msg, type: "received", timestamp: msg.received_at })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      return NextResponse.json({ data: allMessages })
    }
  } catch (error) {
    logger.error("Error in messages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
