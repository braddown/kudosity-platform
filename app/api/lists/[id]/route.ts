import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/lists/[id]
 * Fetch a specific list by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: list, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      console.error('Error fetching list:', error)
      return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 })
    }

    // Format the response
    const formattedList = {
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
    }

    return NextResponse.json(formattedList)
  } catch (error) {
    console.error('Error in GET /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/lists/[id]
 * Update a specific list
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, type, source, tags, shared } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 })
    }

    // Update the list
    const { data: updatedList, error } = await supabase
      .from('lists')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        type,
        source,
        tags,
        shared,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      console.error('Error updating list:', error)
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
    }

    // Format response
    const formattedList = {
      id: updatedList.id,
      name: updatedList.name,
      description: updatedList.description,
      member_count: updatedList.contact_count || 0,
      created_at: updatedList.created_at,
      updated_at: updatedList.updated_at,
      type: updatedList.type,
      source: updatedList.source,
      tags: updatedList.tags || [],
      shared: updatedList.shared || false,
      creator_id: updatedList.creator_id
    }

    return NextResponse.json(formattedList)
  } catch (error) {
    console.error('Error in PUT /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/lists/[id]
 * Delete a specific list
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if list exists and get its type
    const { data: existingList, error: fetchError } = await supabase
      .from('lists')
      .select('id, name, type')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      console.error('Error fetching list for deletion:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 })
    }

    // Prevent deletion of system lists
    if (existingList.type === 'System') {
      return NextResponse.json({ error: 'Cannot delete system lists' }, { status: 403 })
    }

    // Delete the list (this will cascade delete list_memberships due to foreign key)
    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting list:', deleteError)
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
    }

    return NextResponse.json({ message: 'List deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}