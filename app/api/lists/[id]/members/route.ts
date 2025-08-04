import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/lists/[id]/members
 * Fetch all members of a specific list
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'Active'

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query to get list members with contact details
    let query = supabase
      .from('list_memberships')
      .select(`
        id,
        date_added,
        added_by,
        status,
        date_removed,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone,
          status,
          tags,
          created_at
        )
      `)
      .eq('list_id', id)
      .eq('status', status)
      .order('date_added', { ascending: false })
      .range(from, to)

    const { data: memberships, error, count } = await query

    if (error) {
      console.error('Error fetching list members:', error)
      return NextResponse.json({ error: 'Failed to fetch list members' }, { status: 500 })
    }

    // Format the response
    const members = memberships?.map(membership => ({
      id: membership.id,
      contact: membership.contacts,
      date_added: membership.date_added,
      added_by: membership.added_by,
      status: membership.status,
      date_removed: membership.date_removed
    })) || []

    // Filter by search term if provided
    const filteredMembers = search
      ? members.filter(member => {
          const contact = member.contact
          const searchLower = search.toLowerCase()
          return (
            contact.first_name?.toLowerCase().includes(searchLower) ||
            contact.last_name?.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower) ||
            contact.phone?.includes(search)
          )
        })
      : members

    return NextResponse.json({
      members: filteredMembers,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/lists/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/lists/[id]/members
 * Add contacts to a list
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: listId } = params
    const body = await request.json()
    const { contact_ids, added_by } = body

    // Validate input
    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json({ error: 'contact_ids must be a non-empty array' }, { status: 400 })
    }

    // Check if list exists
    const { data: listExists, error: listError } = await supabase
      .from('lists')
      .select('id, name')
      .eq('id', listId)
      .single()

    if (listError) {
      if (listError.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      console.error('Error checking list existence:', listError)
      return NextResponse.json({ error: 'Failed to verify list' }, { status: 500 })
    }

    // Check which contacts exist
    const { data: existingContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .in('id', contact_ids)

    if (contactsError) {
      console.error('Error checking contacts:', contactsError)
      return NextResponse.json({ error: 'Failed to verify contacts' }, { status: 500 })
    }

    const validContactIds = existingContacts?.map(c => c.id) || []
    const invalidContactIds = contact_ids.filter(id => !validContactIds.includes(id))

    if (invalidContactIds.length > 0) {
      return NextResponse.json({
        error: 'Some contact IDs are invalid',
        invalid_contacts: invalidContactIds
      }, { status: 400 })
    }

    // Prepare memberships to insert (handle duplicates by using upsert)
    const memberships = validContactIds.map(contactId => ({
      list_id: listId,
      contact_id: contactId,
      added_by,
      status: 'Active',
      date_added: new Date().toISOString()
    }))

    // Insert memberships with conflict resolution
    const { data: newMemberships, error: insertError } = await supabase
      .from('list_memberships')
      .upsert(memberships, {
        onConflict: 'list_id,contact_id',
        ignoreDuplicates: false
      })
      .select(`
        id,
        contact_id,
        date_added,
        status,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)

    if (insertError) {
      console.error('Error adding members to list:', insertError)
      return NextResponse.json({ error: 'Failed to add members to list' }, { status: 500 })
    }

    // Also update contact tags to include list membership
    // Add the list name as a tag to each contact
    if (listExists.name) {
      const listTag = `list:${listExists.name.toLowerCase().replace(/\s+/g, '-')}`
      
      for (const contactId of validContactIds) {
        // Get current tags
        const { data: contact, error: getTagsError } = await supabase
          .from('contacts')
          .select('tags')
          .eq('id', contactId)
          .single()

        if (!getTagsError && contact) {
          const currentTags = contact.tags || []
          if (!currentTags.includes(listTag)) {
            const updatedTags = [...currentTags, listTag]
            
            await supabase
              .from('contacts')
              .update({ tags: updatedTags })
              .eq('id', contactId)
          }
        }
      }
    }

    return NextResponse.json({
      message: `Successfully added ${validContactIds.length} contacts to the list`,
      added_count: validContactIds.length,
      members: newMemberships
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/lists/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}