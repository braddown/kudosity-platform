import { createClient } from "@/lib/auth/client"

export interface Segment {
  id: string
  name: string
  description?: string
  creator_id?: string
  filter_criteria?: {
    conditions?: Array<{
      field: string
      operator: string
      value: string
    }>
    filterGroups?: Array<{
      id: string
      conditions: Array<{
        field: string
        operator: string
        value: string
      }>
    }>
    profileType?: string
    searchTerm?: string
  }
  estimated_size?: number
  auto_update?: boolean
  type?: string
  shared?: boolean
  tags?: string[]
  tag?: string
  created_at: string
  updated_at?: string
}

export const segmentsApi = {
  // Get all segments
  getSegments: async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("segments").select("*").order("created_at", { ascending: false })

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error("Error fetching segments:", error)
      return {
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch segments",
      }
    }
  },

  // Get a single segment by ID
  getSegmentById: async (id: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("segments").select("*").eq("id", id).single()

      if (error) throw error

      return { data }
    } catch (error) {
      console.error("Error fetching segment:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to fetch segment",
      }
    }
  },

  // Create a new segment
  createSegment: async (segment: Omit<Segment, "id" | "created_at" | "updated_at">) => {
    try {
      const supabase = createClient()
      // Get the current account from cookies
      const currentAccountId = document.cookie
        .split('; ')
        .find(row => row.startsWith('current_account='))
        ?.split('=')[1];

      if (!currentAccountId) {
        throw new Error("No account selected. Please select an account first.");
      }

      // creator_id is optional - just use null if not provided
      // This avoids foreign key issues with profiles table

      const segmentData = {
        name: segment.name,
        description: segment.description || null,
        creator_id: segment.creator_id || null,
        filter_criteria: segment.filter_criteria || {},
        estimated_size: segment.estimated_size || 0,
        auto_update: segment.auto_update !== false,
        type: segment.type || "Custom",
        shared: segment.shared || false,
        tags: segment.tags || [],
        tag: segment.tag || null,
        account_id: currentAccountId, // Include account_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("segments").insert(segmentData).select().single()

      if (error) throw error

      return { data }
    } catch (error) {
      console.error("Error creating segment:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to create segment",
      }
    }
  },

  // Create a segment from uploaded list (tag-based)
  createSegmentFromUpload: async (listName: string, description: string, profileIds: string[], creatorId?: string) => {
    try {
      const supabase = createClient()
      // Normalize the list name to create a tag
      const tagName = listName.toLowerCase().replace(/[^a-z0-9]/g, "-")

      // creator_id is optional - just use null to avoid foreign key issues

      // Create the segment with tag-based filter criteria
      const segmentData = {
        name: listName,
        description,
        creator_id: null,
        filter_criteria: {
          conditions: [
            {
              field: "tags",
              operator: "contains",
              value: tagName,
            },
          ],
          profileType: "all",
          searchTerm: "",
        },
        estimated_size: profileIds.length,
        auto_update: true,
        type: "Custom", // Keep as "Custom" instead of "Import"
        shared: false,
        tags: [tagName],
        tag: tagName,
      }

      const { data, error } = await segmentsApi.createSegment(segmentData)

      if (error) throw new Error(error)

      // Tag all the profiles with the list tag
      if (profileIds.length > 0) {
        await segmentsApi.tagProfiles(profileIds, tagName)
      }

      return { data }
    } catch (error) {
      console.error("Error creating segment from upload:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to create segment from upload",
      }
    }
  },

  // Tag profiles with a specific tag
  tagProfiles: async (profileIds: string[], tag: string) => {
    try {
      const supabase = createClient()
      // Get current profiles to update their tags
      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("id, tags")
        .in("id", profileIds)

      if (fetchError) throw fetchError

      // Update each profile's tags
      const updates =
        profiles?.map((profile) => {
          const currentTags = Array.isArray(profile.tags) ? profile.tags : []
          const newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag]

          return {
            id: profile.id,
            tags: newTags,
            updated_at: new Date().toISOString(),
          }
        }) || []

      if (updates.length > 0) {
        const { error: updateError } = await supabase.from("profiles").upsert(updates)

        if (updateError) throw updateError
      }

      return { success: true }
    } catch (error) {
      console.error("Error tagging profiles:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to tag profiles",
      }
    }
  },

  // Update an existing segment
  updateSegment: async (id: string, updates: Partial<Segment>) => {
    try {
      const supabase = createClient()
      const updateData = {
        name: updates.name,
        description: updates.description,
        creator_id: updates.creator_id,
        filter_criteria: updates.filter_criteria,
        estimated_size: updates.estimated_size,
        auto_update: updates.auto_update,
        type: updates.type,
        shared: updates.shared,
        tags: updates.tags,
        tag: updates.tag,
        updated_at: new Date().toISOString(),
      }

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData]
        }
      })

      const { data, error } = await supabase.from("segments").update(updateData).eq("id", id).select().single()

      if (error) throw error

      return { data }
    } catch (error) {
      console.error("Error updating segment:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to update segment",
      }
    }
  },

  // Delete a segment
  deleteSegment: async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("segments").delete().eq("id", id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error("Error deleting segment:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete segment",
      }
    }
  },

  // Get system segments (predefined segments)
  getSystemSegments: (): Segment[] => {
    // Return empty array - system segments are now handled as built-in filters
    // in the profiles page (All, Active, Marketing, Unsubscribed, etc.)
    // Each account should only see their own custom segments
    return []
  },
  // Get list members (profiles associated with a list/segment)
  getListMembers: async (listId: string) => {
    try {
      const supabase = createClient()
      // For now, since we're using segments as lists, we'll get all profiles
      // and filter them based on the segment's filter criteria
      const segmentResult = await segmentsApi.getSegmentById(listId)

      if (segmentResult.error || !segmentResult.data) {
        throw new Error(segmentResult.error || "Segment not found")
      }

      const segment = segmentResult.data

      // Get all profiles
      const { data: profiles, error } = await supabase.from("profiles").select("*")

      if (error) throw error

      // If the segment has a tag, filter profiles by that tag
      if (segment.tag) {
        const filteredProfiles =
          profiles?.filter((profile) => {
            const tags = Array.isArray(profile.tags) ? profile.tags : []
            return tags.includes(segment.tag)
          }) || []

        return { data: filteredProfiles }
      }

      // Otherwise return all profiles (this could be enhanced with more sophisticated filtering)
      return { data: profiles || [] }
    } catch (error) {
      console.error("Error fetching list members:", error)
      return {
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch list members",
      }
    }
  },

  // Get all lists (alias for getSegments for backward compatibility)
  getLists: async () => {
    return segmentsApi.getSegments()
  },

  // Create a list (alias for createSegment)
  createList: async (list: Omit<Segment, "id" | "created_at" | "updated_at">) => {
    return segmentsApi.createSegment(list)
  },
}

// For backward compatibility, also export as listsApi
export const listsApi = segmentsApi
