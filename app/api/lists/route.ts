import { NextRequest, NextResponse } from "next/server"
import { listsRepository } from "@/api/repositories"
import { logger } from "@/lib/utils/logger"

/**
 * GET /api/lists
 * Fetch all lists with optional filtering
 * 
 * Refactored to use Repository Pattern for cleaner, more maintainable code.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const creator_id = searchParams.get('creator_id')
    const search = searchParams.get('search')

    let result
    
    if (search) {
      // Use repository search method for text queries
      result = await listsRepository.search(search, {
        orderBy: 'created_at',
        ascending: false
      })
    } else {
      // Build filters object for standard queries
      const filters: any = {}
      if (type) filters.type = type
      if (creator_id) filters.creator_id = creator_id

      // Use repository findMany method
      result = await listsRepository.findMany(filters, {
        orderBy: 'created_at',
        ascending: false
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch lists' }, 
        { status: 500 }
      )
    }

    // Format the response to match the expected interface
    const formattedLists = result.data?.map(list => ({
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
    logger.error('Error in GET /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/lists
 * Create a new list
 * 
 * Refactored to use Repository Pattern with proper validation and error handling.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type = 'Manual', source = 'Manual', tags = [], shared = false, creator_id } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 })
    }

    // Use repository create method
    const result = await listsRepository.create({
      name: name.trim(),
      description: description?.trim() || null,
      type,
      source,
      tags,
      shared,
      creator_id
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to create list' }, 
        { status: 500 }
      )
    }

    // Format response to match expected interface
    const formattedList = {
      id: result.data!.id,
      name: result.data!.name,
      description: result.data!.description,
      member_count: result.data!.contact_count || 0,
      created_at: result.data!.created_at,
      updated_at: result.data!.updated_at,
      type: result.data!.type,
      source: result.data!.source,
      tags: result.data!.tags || [],
      shared: result.data!.shared || false,
      creator_id: result.data!.creator_id
    }

    return NextResponse.json(formattedList, { status: 201 })
  } catch (error) {
    logger.error('Error in POST /api/lists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}