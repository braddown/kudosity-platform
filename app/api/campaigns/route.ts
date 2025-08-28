import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/auth/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Log the status being used
    console.log('Campaign status:', body.status || 'Draft')
    
    // Prepare campaign data
    const campaignData = {
      name: body.name,
      type: body.type || 'broadcast',
      status: body.status || 'Draft',  // Capital D for Draft - matches DB constraint
      channel: body.channel || 'sms',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      performance_metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        // Store additional broadcast data here
        audience_ids: body.audience_ids,
        message_content: body.message_content,
        sender_id: body.sender_id,
        track_links: body.track_links,
        schedule_type: body.schedule_type,
        scheduled_at: body.scheduled_at,
        scheduled_time: body.scheduled_time,
        estimated_recipients: body.estimated_recipients
      },
      budget: 0,
      description: body.message_content ? body.message_content.substring(0, 200) : '', // Store message preview
      start_date: body.scheduled_at || null,
      segment_id: null, // Will be set when we have proper segment IDs
      list_id: null // Will be set when we have proper list IDs
    }
    
    // Insert into campaigns table
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single()
    
    if (error) {
      console.error('Error saving campaign draft:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, campaign: data })
  } catch (error) {
    console.error('Error in campaign creation:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save campaign' 
    }, { status: 500 })
  }
}
