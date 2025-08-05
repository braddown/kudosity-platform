import { NextRequest, NextResponse } from "next/server"
import { listsRepository } from "@/api/repositories"

/**
 * GET /api/lists/[id]
 * Fetch a specific list by ID
 * 
 * Refactored to use Repository Pattern - cleaner and more maintainable.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Use repository findById method
    const result = await listsRepository.findById(id)

    if (!result.success) {
      if (result.error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch list' }, 
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Format the response to match expected interface
    const formattedList = {
      id: result.data.id,
      name: result.data.name,
      description: result.data.description,
      member_count: result.data.contact_count || 0,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at,
      type: result.data.type,
      source: result.data.source,
      tags: result.data.tags || [],
      shared: result.data.shared || false,
      creator_id: result.data.creator_id
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
 * 
 * Refactored to use Repository Pattern with standardized error handling.
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

    // Use repository update method
    const result = await listsRepository.update(id, {
      name: name.trim(),
      description: description?.trim() || null,
      type,
      source,
      tags,
      shared,
      updated_at: new Date().toISOString()
    })

    if (!result.success) {
      if (result.error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update list' }, 
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Format response to match expected interface
    const formattedList = {
      id: result.data.id,
      name: result.data.name,
      description: result.data.description,
      member_count: result.data.contact_count || 0,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at,
      type: result.data.type,
      source: result.data.source,
      tags: result.data.tags || [],
      shared: result.data.shared || false,
      creator_id: result.data.creator_id
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
 * 
 * Refactored to use Repository Pattern with built-in system list protection.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Use repository deleteWithMemberships method (includes system list protection)
    const result = await listsRepository.deleteWithMemberships(id)

    if (!result.success) {
      if (result.error?.message?.includes('system lists')) {
        return NextResponse.json({ error: 'Cannot delete system lists' }, { status: 403 })
      }
      if (result.error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete list' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'List deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/lists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}