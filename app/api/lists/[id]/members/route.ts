import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/utils/logger"

// Create Supabase client directly in the API route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Remove any line breaks from the key
const cleanKey = supabaseKey?.replace(/\s+/g, '') || ''

logger.debug('Creating Supabase client with URL:', supabaseUrl)
const supabase = createClient(supabaseUrl, cleanKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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

    // Build query to get list members with profile details
    let query = supabase
      .from('list_memberships')
      .select(`
        id,
        date_added,
        added_by,
        status,
        date_removed,
        profile_id,
        profiles!list_memberships_profile_id_fkey (
          id,
          first_name,
          last_name,
          email,
          mobile,
          status,
          tags,
          created_at
        )
      `, { count: 'exact' })
      .eq('list_id', id)
      .eq('status', status)
      .order('date_added', { ascending: false })
      .range(from, to)

    const { data: memberships, error, count } = await query

    if (error) {
      logger.error('Error fetching list members:', error)
      return NextResponse.json({ error: 'Failed to fetch list members' }, { status: 500 })
    }

    // Format the response
    const members = memberships?.map((membership: any) => ({
      id: membership.id,
      profile: membership.profiles,
      date_added: membership.date_added,
      added_by: membership.added_by,
      status: membership.status,
      date_removed: membership.date_removed
    })) || []

    // Filter by search term if provided
    const filteredMembers = search
      ? members.filter(member => {
          const profile = member.profile as any
          const searchLower = search.toLowerCase()
          return (
            profile?.first_name?.toLowerCase().includes(searchLower) ||
            profile?.last_name?.toLowerCase().includes(searchLower) ||
            profile?.email?.toLowerCase().includes(searchLower) ||
            profile?.mobile?.includes(search)
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
    logger.error('Error in GET /api/lists/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/lists/[id]/members
 * Add profiles to a list
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  logger.debug('=== POST /api/lists/[id]/members CALLED ===')
  
  if (!supabase) {
    logger.error('Supabase client not initialized')
    return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
  }
  
  try {
    const { id: listId } = params
    logger.debug('POST /api/lists/[id]/members - listId:', listId)
    
    let body;
    try {
      body = await request.json()
      logger.debug('Successfully parsed request body')
    } catch (parseError) {
      logger.error('Error parsing request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const { profile_ids, added_by } = body
    logger.debug('Request body:', { profile_ids, added_by })

    // Validate input
    if (!Array.isArray(profile_ids) || profile_ids.length === 0) {
      logger.error('Invalid profile_ids:', profile_ids)
      return NextResponse.json({ error: 'profile_ids must be a non-empty array' }, { status: 400 })
    }

    // Check if list exists
    logger.debug('Checking if list exists with ID:', listId)
    let listExists, listError;
    
    try {
      const result = await supabase
        .from('lists')
        .select('id, name')
        .eq('id', listId)
        .single()
      
      listExists = result.data;
      listError = result.error;
    } catch (dbError: any) {
      logger.error('Database operation failed:', dbError)
      logger.error('Error stack:', dbError.stack)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError.message || 'Unknown database error'
      }, { status: 500 })
    }

    if (listError) {
      logger.error('Error checking list existence:', listError)
      logger.error('List error details:', {
        code: listError.code,
        message: listError.message,
        details: listError.details,
        hint: listError.hint
      })
      if (listError.code === 'PGRST116') {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }
      return NextResponse.json({ 
        error: 'Failed to verify list',
        details: listError.message 
      }, { status: 500 })
    }
    
    logger.debug('List found:', listExists)

    // Check which CDP profiles exist
    logger.debug('Checking CDP profiles with IDs:', profile_ids)
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('cdp_profiles')
      .select('id')
      .in('id', profile_ids)

    if (profilesError) {
      logger.error('Error checking profiles:', profilesError)
      logger.error('Profile error details:', {
        code: profilesError.code,
        message: profilesError.message,
        details: profilesError.details,
        hint: profilesError.hint
      })
      return NextResponse.json({ error: 'Failed to verify profiles' }, { status: 500 })
    }

    logger.debug('Existing profiles found:', existingProfiles)
    const validProfileIds = existingProfiles?.map(p => p.id) || []
    const invalidProfileIds = profile_ids.filter(id => !validProfileIds.includes(id))

    logger.debug('Valid profile IDs:', validProfileIds)
    logger.debug('Invalid profile IDs:', invalidProfileIds)

    // Instead of failing, just warn about invalid profiles and continue with valid ones
    if (invalidProfileIds.length > 0) {
      logger.warn('Warning: Some profile IDs are invalid and will be skipped:', invalidProfileIds)
    }

    // If no valid profiles, return error
    if (validProfileIds.length === 0) {
      logger.error('No valid profiles to add')
      return NextResponse.json({
        error: 'No valid profiles found',
        invalid_profiles: invalidProfileIds
      }, { status: 400 })
    }

    // Check which profiles are already in the list
    const { data: existingMemberships, error: checkError } = await supabase
      .from('list_memberships')
      .select('profile_id')
      .eq('list_id', listId)
      .in('profile_id', validProfileIds)

    if (checkError) {
      logger.error('Error checking existing memberships:', checkError)
      return NextResponse.json({ error: 'Failed to check existing memberships' }, { status: 500 })
    }

    const existingProfileIds = existingMemberships?.map(m => m.profile_id) || []
    const newProfileIds = validProfileIds.filter(id => !existingProfileIds.includes(id))

    if (newProfileIds.length === 0) {
      return NextResponse.json({
        message: 'All profiles are already in the list',
        added_count: 0
      }, { status: 200 })
    }

    // Prepare memberships to insert (only new ones)
    const memberships = newProfileIds.map(profileId => ({
      list_id: listId,
      profile_id: profileId,
      added_by: added_by || null,
      status: 'Active',
      date_added: new Date().toISOString()
    }))

    // Insert new memberships
    logger.debug('Inserting memberships:', memberships)
    const { data: newMemberships, error: insertError } = await supabase
      .from('list_memberships')
      .insert(memberships)
      .select(`
        id,
        profile_id,
        date_added,
        status,
        profiles!list_memberships_profile_id_fkey (
          id,
          first_name,
          last_name,
          email,
          mobile
        )
      `)

    if (insertError) {
      logger.error('Error adding members to list:', insertError)
      logger.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json({ 
        error: 'Failed to add members to list',
        details: insertError.message 
      }, { status: 500 })
    }

    // Update the contact count for the list
    const { count } = await supabase
      .from('list_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)
      .eq('status', 'Active')

    if (count !== null) {
      await supabase
        .from('lists')
        .update({ contact_count: count })
        .eq('id', listId)
    }

    // Also update profile tags to include list membership
    // Add the list name as a tag to each profile
    if (listExists.name && newProfileIds.length > 0) {
      const listTag = `list:${listExists.name.toLowerCase().replace(/\s+/g, '-')}`
      
      for (const profileId of newProfileIds) {
        // Get current tags
        const { data: profile, error: getTagsError } = await supabase
          .from('cdp_profiles')
          .select('tags')
          .eq('id', profileId)
          .single()

        if (!getTagsError && profile) {
          const currentTags = profile.tags || []
          if (!currentTags.includes(listTag)) {
            const updatedTags = [...currentTags, listTag]
            
            await supabase
              .from('cdp_profiles')
              .update({ tags: updatedTags })
              .eq('id', profileId)
          }
        }
      }
    }

    return NextResponse.json({
      message: `Successfully added ${newProfileIds.length} profiles to the list`,
      added_count: newProfileIds.length,
      members: newMemberships,
      already_existed: existingProfileIds.length,
      skipped_invalid: invalidProfileIds.length,
      invalid_profiles: invalidProfileIds
    }, { status: 201 })
  } catch (error) {
    logger.error('Error in POST /api/lists/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/lists/[id]/members
 * Remove profiles from a list
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: listId } = params
    const body = await request.json()
    const { profile_ids } = body

    // Validate input
    if (!Array.isArray(profile_ids) || profile_ids.length === 0) {
      return NextResponse.json({ error: 'profile_ids must be a non-empty array' }, { status: 400 })
    }

    // Update memberships to mark as removed
    const { error: updateError } = await supabase
      .from('list_memberships')
      .update({
        status: 'Removed',
        date_removed: new Date().toISOString()
      })
      .eq('list_id', listId)
      .in('profile_id', profile_ids)

    if (updateError) {
      logger.error('Error removing members from list:', updateError)
      return NextResponse.json({ error: 'Failed to remove members from list' }, { status: 500 })
    }

    // Update the contact count for the list
    const { count } = await supabase
      .from('list_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)
      .eq('status', 'Active')

    if (count !== null) {
      await supabase
        .from('lists')
        .update({ contact_count: count })
        .eq('id', listId)
    }

    // Get list name to remove tag
    const { data: list } = await supabase
      .from('lists')
      .select('name')
      .eq('id', listId)
      .single()

    // Remove list tag from profiles
    if (list?.name) {
      const listTag = `list:${list.name.toLowerCase().replace(/\s+/g, '-')}`
      
      for (const profileId of profile_ids) {
        // Get current tags
        const { data: profile, error: getTagsError } = await supabase
          .from('cdp_profiles')
          .select('tags')
          .eq('id', profileId)
          .single()

        if (!getTagsError && profile && profile.tags) {
          const updatedTags = profile.tags.filter((tag: string) => tag !== listTag)
          
          await supabase
            .from('cdp_profiles')
            .update({ tags: updatedTags })
            .eq('id', profileId)
        }
      }
    }

    return NextResponse.json({
      message: `Successfully removed ${profile_ids.length} profiles from the list`
    })
  } catch (error) {
    logger.error('Error in DELETE /api/lists/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}