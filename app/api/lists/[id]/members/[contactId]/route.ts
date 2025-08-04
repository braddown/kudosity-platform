import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * DELETE /api/lists/[id]/members/[contactId]
 * Remove a specific contact from a list
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const { id: listId, contactId } = params

    // Check if the membership exists
    const { data: membership, error: membershipError } = await supabase
      .from('list_memberships')
      .select(`
        id,
        status,
        lists (
          id,
          name
        )
      `)
      .eq('list_id', listId)
      .eq('contact_id', contactId)
      .single()

    if (membershipError) {
      if (membershipError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
      }
      console.error('Error checking membership:', membershipError)
      return NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 })
    }

    // Update membership status to 'Removed' instead of deleting
    const { error: updateError } = await supabase
      .from('list_memberships')
      .update({
        status: 'Removed',
        date_removed: new Date().toISOString()
      })
      .eq('list_id', listId)
      .eq('contact_id', contactId)

    if (updateError) {
      console.error('Error removing member from list:', updateError)
      return NextResponse.json({ error: 'Failed to remove member from list' }, { status: 500 })
    }

    // Remove the list tag from the contact
    // TODO: Fix type issue with membership.lists
    if (membership.lists && typeof membership.lists === 'object' && 'name' in membership.lists) {
      const listTag = `list:${(membership.lists as any).name.toLowerCase().replace(/\s+/g, '-')}`
      
      // Get current tags
      const { data: contact, error: getTagsError } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', contactId)
        .single()

      if (!getTagsError && contact) {
        const currentTags = contact.tags || []
        const updatedTags = currentTags.filter(tag => tag !== listTag)
        
        await supabase
          .from('contacts')
          .update({ tags: updatedTags })
          .eq('id', contactId)
      }
    }

    return NextResponse.json({ message: 'Contact removed from list successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/lists/[id]/members/[contactId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/lists/[id]/members/[contactId]
 * Re-add a specific contact to a list (reactivate membership)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const { id: listId, contactId } = params
    const body = await request.json()
    const { added_by } = body

    // Check if membership exists
    const { data: existingMembership, error: checkError } = await supabase
      .from('list_memberships')
      .select(`
        id,
        status,
        lists (
          id,
          name
        )
      `)
      .eq('list_id', listId)
      .eq('contact_id', contactId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking membership:', checkError)
      return NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 })
    }

    if (existingMembership) {
      // Reactivate existing membership
      const { error: updateError } = await supabase
        .from('list_memberships')
        .update({
          status: 'Active',
          date_added: new Date().toISOString(),
          date_removed: null,
          added_by
        })
        .eq('list_id', listId)
        .eq('contact_id', contactId)

      if (updateError) {
        console.error('Error reactivating membership:', updateError)
        return NextResponse.json({ error: 'Failed to reactivate membership' }, { status: 500 })
      }

      // Re-add the list tag to the contact
      // TODO: Fix type issue with existingMembership.lists
      if (existingMembership.lists && typeof existingMembership.lists === 'object' && 'name' in existingMembership.lists) {
        const listTag = `list:${(existingMembership.lists as any).name.toLowerCase().replace(/\s+/g, '-')}`
        
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

      return NextResponse.json({ message: 'Contact re-added to list successfully' })
    } else {
      // Create new membership
      const { error: insertError } = await supabase
        .from('list_memberships')
        .insert({
          list_id: listId,
          contact_id: contactId,
          added_by,
          status: 'Active',
          date_added: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error creating membership:', insertError)
        return NextResponse.json({ error: 'Failed to add contact to list' }, { status: 500 })
      }

      // Add the list tag to the contact
      const { data: list, error: listError } = await supabase
        .from('lists')
        .select('name')
        .eq('id', listId)
        .single()

      if (!listError && list?.name) {
        const listTag = `list:${list.name.toLowerCase().replace(/\s+/g, '-')}`
        
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

      return NextResponse.json({ message: 'Contact added to list successfully' }, { status: 201 })
    }
  } catch (error) {
    console.error('Error in POST /api/lists/[id]/members/[contactId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}