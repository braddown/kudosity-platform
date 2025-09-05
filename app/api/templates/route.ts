import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/auth/server"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch templates for the user
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .or(`creator_id.eq.${user.id},creator_id.is.null`)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    logger.error('Error in templates GET:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const templateData = {
      name: body.name,
      content: body.content,
      channel: body.channel || 'SMS',
      split_messages: body.split_messages || null,
      variables: body.variables || [],
      creator_id: user.id,
      status: 'Active'
    }

    const { data: template, error } = await supabase
      .from('templates')
      .insert([templateData])
      .select()
      .single()

    if (error) {
      logger.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json(template)
  } catch (error) {
    logger.error('Error in templates POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    )
  }
}
