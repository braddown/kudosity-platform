import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/lists
 * Fetch all lists with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const creator_id = searchParams.get('creator_id')
    const search = searchParams.get('search')

    let query = supabase
      .from('lists')
      .select(`
        id,
        name,
        description,
        creator_id,
        type,
        source,
        contact_count,
        tags,
        shared,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    
    if (creator_id) {
      query = query.eq('creator_id', creator_id)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: lists, error } = await query

    if (error) {
      console.error('Error fetching lists:', error)
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
    }

    // Format the response to match the expected interface
    const formattedLists = lists?.map(list => ({
      id: list.id,
      name: list.name,
      description: list.description,
      member_count: list.contact_count || 0,
      created_at: list.created_at,
      updated_at: list.updated_at,
      type: list.type,
      source: list.source,
      tags: list.tags || [],
      shared: list.shared || false,
      creator_id: list.creator_id
    })) || []

    return NextResponse.json(formattedLists)
  } catch (error) {
    console.error('Error in GET /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/lists
 * Create a new list
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type = 'Manual', source = 'Manual', tags = [], shared = false, creator_id } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 })
    }

    // Insert new list
    const { data: newList, error } = await supabase
      .from('lists')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        type,
        source,
        tags,
        shared,
        creator_id,
        contact_count: 0
      })
      .select(`
        id,
        name,
        description,
        creator_id,
        type,
        source,
        contact_count,
        tags,
        shared,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Error creating list:', error)
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
    }

    // Format response
    const formattedList = {
      id: newList.id,
      name: newList.name,
      description: newList.description,
      member_count: newList.contact_count || 0,
      created_at: newList.created_at,
      updated_at: newList.updated_at,
      type: newList.type,
      source: newList.source,
      tags: newList.tags || [],
      shared: newList.shared || false,
      creator_id: newList.creator_id
    }

    return NextResponse.json(formattedList, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}