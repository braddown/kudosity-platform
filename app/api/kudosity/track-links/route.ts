import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/auth/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Extract URLs from the message
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = message.match(urlRegex)

    if (!urls || urls.length === 0) {
      return NextResponse.json({ trackedMessage: message })
    }

    // Get Kudosity API credentials
    const apiKey = process.env.KUDOSITY_API_KEY
    const apiSecret = process.env.KUDOSITY_API_SECRET

    if (!apiKey || !apiSecret) {
      console.error("Kudosity API credentials not configured")
      return NextResponse.json({ trackedMessage: message })
    }

    // Process each URL with Kudosity link tracking API
    let trackedMessage = message
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    for (const url of urls) {
      try {
        // Call Kudosity API to create a tracking link
        const response = await fetch('https://api.kudosity.com/api/v2/link/shorten', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url,
            campaign_id: user.id, // Use user ID as a temporary campaign identifier
            track_clicks: true
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.short_url) {
            trackedMessage = trackedMessage.replace(url, data.short_url)
          }
        } else {
          console.error(`Failed to shorten URL ${url}:`, await response.text())
        }
      } catch (error) {
        console.error(`Error shortening URL ${url}:`, error)
      }
    }

    return NextResponse.json({ trackedMessage })
  } catch (error) {
    console.error('Error in track-links:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track links' },
      { status: 500 }
    )
  }
}
