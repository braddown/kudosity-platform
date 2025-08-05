import { supabase } from "../supabase"

/**
 * Profiles API Bridge - Temporary compatibility layer
 * 
 * This bridges the old profiles API with the new CDP system to prevent 500 errors
 * during the transition period. It allows both systems to coexist.
 */

// Re-export the original API functions that still work with the legacy system
export {
  getProfiles,
  getProfile, 
  createProfile,
  updateProfile,
  softDeleteProfile,
  restoreProfile,
  deleteProfile,
  getProfilesCount,
  getTableSchema,
  getCustomFieldsSchema,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  profilesApi
} from './profiles-api'

// Add CDP-aware versions for new functionality
export const getProfileWithCDPFallback = async (id: string) => {
  try {
    console.log("Attempting to fetch profile with CDP fallback:", id)

    // First try the legacy profiles table
    const { data: legacyProfile, error: legacyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (!legacyError && legacyProfile) {
      console.log("Found profile in legacy system:", legacyProfile)
      return { data: legacyProfile, error: null }
    }

    // If not found in legacy, try CDP profiles
    const { data: cdpProfile, error: cdpError } = await supabase
      .from("cdp_profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (!cdpError && cdpProfile) {
      console.log("Found profile in CDP system, mapping to legacy format:", cdpProfile)
      
      // Map CDP profile to legacy format for compatibility
      const mappedProfile = {
        id: cdpProfile.id,
        first_name: cdpProfile.first_name,
        last_name: cdpProfile.last_name,
        email: cdpProfile.email,
        mobile: cdpProfile.mobile,
        country: cdpProfile.country,
        state: cdpProfile.state,
        status: cdpProfile.lifecycle_stage === 'customer' ? 'Active' : 'Lead',
        custom_fields: cdpProfile.custom_fields,
        notification_preferences: cdpProfile.notification_preferences,
        tags: cdpProfile.tags,
        lifetime_value: cdpProfile.lifetime_value,
        created_at: cdpProfile.created_at,
        updated_at: cdpProfile.updated_at,
        // Map CDP fields to legacy expectations
        location: cdpProfile.city ? `${cdpProfile.city}, ${cdpProfile.state}` : null,
        source: cdpProfile.source
      }
      
      return { data: mappedProfile, error: null }
    }

    // Not found in either system
    console.error("Profile not found in either legacy or CDP system:", id)
    return { data: null, error: "Profile not found" }

  } catch (error: any) {
    console.error("Profile bridge API error:", error)
    return { data: null, error: error.message || "Failed to fetch profile" }
  }
}

export const getProfilesWithCDPFallback = async (options?: {
  search?: string
  status?: string
  limit?: number
  offset?: number
}) => {
  try {
    console.log("Fetching profiles with CDP fallback, options:", options)

    // Get from legacy system first
    const { data: legacyProfiles, error: legacyError } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", "00000000-0000-0000-0000-000000000000") // Exclude metadata profile
      .order("created_at", { ascending: false })
      .limit(options?.limit || 1000)

    if (legacyError) {
      console.error("Error fetching legacy profiles:", legacyError)
      return { data: [], error: legacyError.message }
    }

    // Get from CDP system
    const { data: cdpProfiles, error: cdpError } = await supabase
      .from("cdp_profiles")
      .select("*")
      .eq("merge_status", "active")
      .order("created_at", { ascending: false })
      .limit(50) // Limit CDP profiles for now

    let allProfiles = legacyProfiles || []

    // Add CDP profiles mapped to legacy format
    if (!cdpError && cdpProfiles && cdpProfiles.length > 0) {
      const mappedCdpProfiles = cdpProfiles.map(cdpProfile => ({
        id: cdpProfile.id,
        first_name: cdpProfile.first_name,
        last_name: cdpProfile.last_name,
        email: cdpProfile.email,
        mobile: cdpProfile.mobile,
        country: cdpProfile.country,
        state: cdpProfile.state,
        status: cdpProfile.lifecycle_stage === 'customer' ? 'Active' : 'Lead',
        custom_fields: cdpProfile.custom_fields,
        notification_preferences: cdpProfile.notification_preferences,
        tags: cdpProfile.tags,
        lifetime_value: cdpProfile.lifetime_value,
        created_at: cdpProfile.created_at,
        updated_at: cdpProfile.updated_at,
        location: cdpProfile.city ? `${cdpProfile.city}, ${cdpProfile.state}` : null,
        source: cdpProfile.source
      }))

      // Merge arrays and deduplicate by ID (legacy takes precedence)
      const legacyIds = new Set(allProfiles.map(p => p.id))
      const uniqueCdpProfiles = mappedCdpProfiles.filter(p => !legacyIds.has(p.id))
      
      allProfiles = [...allProfiles, ...uniqueCdpProfiles]
    }

    // Apply search filter if provided
    if (options?.search) {
      const searchLower = options.search.toLowerCase()
      allProfiles = allProfiles.filter(profile => 
        profile.first_name?.toLowerCase().includes(searchLower) ||
        profile.last_name?.toLowerCase().includes(searchLower) ||
        profile.email?.toLowerCase().includes(searchLower) ||
        profile.mobile?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter if provided
    if (options?.status) {
      allProfiles = allProfiles.filter(profile => profile.status === options.status)
    }

    console.log(`Successfully fetched ${allProfiles.length} profiles (legacy + CDP)`)
    return { data: allProfiles, error: null }

  } catch (error: any) {
    console.error("Profiles bridge API error:", error)
    return { data: [], error: error.message || "Failed to fetch profiles" }
  }
}

// Enhanced profiles API that includes CDP functionality
export const profilesApiBridge = {
  ...getProfilesApi(),
  getProfile: getProfileWithCDPFallback,
  getProfiles: getProfilesWithCDPFallback
}

// Helper to get the original profiles API
function getProfilesApi() {
  const profilesApi = require('./profiles-api').profilesApi
  return profilesApi
}