import { useState, useEffect } from 'react'
import { profilesApi } from '@/lib/api/profiles-api'

interface UseProfileDataOptions {
  profileId: string
  onError?: (error: string) => void
}

interface UseProfileDataResult {
  profile: any
  loading: boolean
  error: string | null
  customFieldsSchema: Record<string, any>
  loadingSchema: boolean
  refetch: () => void
  updateProfile: (updatedProfile: any) => void
}

/**
 * useProfileData - Custom hook for managing profile data fetching and state
 * 
 * @param options - Configuration options for the hook
 * @returns Profile data, loading states, and refetch function
 * 
 * @example
 * ```tsx
 * const { profile, loading, error, customFieldsSchema, refetch } = useProfileData({
 *   profileId: '123',
 *   onError: (error) => console.error('Profile error:', error)
 * })
 * ```
 */
export function useProfileData({
  profileId,
  onError
}: UseProfileDataOptions): UseProfileDataResult {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customFieldsSchema, setCustomFieldsSchema] = useState<Record<string, any>>({})
  const [loadingSchema, setLoadingSchema] = useState(true)

  // Fetch custom fields schema using the same API as properties page
  const fetchCustomFieldsSchema = async () => {
    try {
      setLoadingSchema(true)
      
      // Use the same API that properties page uses for consistency
      const { data: schema, error } = await profilesApi.getCustomFieldsSchema()

      if (error) {
        console.error("Error fetching custom fields schema:", error)
        if (onError) onError(`Failed to load custom fields schema: ${error}`)
        setCustomFieldsSchema({})
        return
      }

      console.log("Custom fields schema loaded from API:", schema)
      setCustomFieldsSchema(schema || {})
    } catch (err) {
      console.error("Exception fetching custom fields schema:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (onError) onError(`Exception loading custom fields schema: ${errorMessage}`)
      setCustomFieldsSchema({})
    } finally {
      setLoadingSchema(false)
    }
  }

  // Fetch profile data from CDP system
  const fetchProfileData = async () => {
    if (!profileId) return

    setLoading(true)
    setError(null)

    try {
      console.log(`Fetching CDP profile with ID: ${profileId}`)
      
      const { data, error } = await profilesApi.getProfile(profileId)

      if (error) {
        console.error("Error fetching CDP profile:", error)
        const errorMessage = `Failed to load profile: ${error}`
        setError(errorMessage)
        if (onError) onError(errorMessage)
        return
      }

      if (!data) {
        console.error("No profile data returned")
        const errorMessage = "Profile not found"
        setError(errorMessage)
        if (onError) onError(errorMessage)
        return
      }

      console.log("CDP profile data loaded:", data)
      console.log("Contact fields from DB:", {
        notes: data.notes,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        postal_code: data.postal_code,
        city: data.city,
        state: data.state,
        country: data.country,
        timezone: data.timezone,
        language_preferences: data.language_preferences,
        os: data.os,
        device: data.device,
        source: data.source,
        location: data.location
      })

      // Map CDP profile to expected format for compatibility
      const mappedProfile = {
        id: data.id,
        status: data.status, // CRITICAL: Include status field!
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        mobile: data.mobile?.startsWith('unknown_') ? '' : data.mobile,
        notes: data.notes, // Added missing notes field
        // Address fields - these were missing!
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        postal_code: data.postal_code,
        city: data.city,
        state: data.state,
        country: data.country,
        // Contact property fields
        timezone: data.timezone,
        language_preferences: data.language_preferences,
        os: data.os,
        device: data.device,
        source: data.source,
        location: data.location,
        // Custom fields and preferences
        custom_fields: data.custom_fields || {},
        notification_preferences: data.notification_preferences || {},
        tags: data.tags || [],
        // System fields
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_activity_at: data.last_activity_at,
        is_duplicate: data.is_duplicate,
        duplicate_of_profile_id: data.duplicate_of_profile_id,
        merge_status: data.merge_status,
        data_retention_date: data.data_retention_date
      }

      // Ensure all custom fields from schema are present in the profile
      const completeCustomFields = { ...mappedProfile.custom_fields }

      // Add any missing custom fields from the schema with default values
      Object.keys(customFieldsSchema).forEach((fieldKey) => {
        if (!(fieldKey in completeCustomFields)) {
          const fieldSchema = customFieldsSchema[fieldKey]
          completeCustomFields[fieldKey] =
            fieldSchema.defaultValue ||
            (fieldSchema.type === "number" ? 0 : fieldSchema.type === "boolean" ? false : "")
        }
      })

      // Update the profile with complete custom fields
      const completeProfile = {
        ...mappedProfile,
        custom_fields: completeCustomFields,
      }

      setProfile(completeProfile)
    } catch (err) {
      console.error("Exception fetching CDP profile:", err)
      const errorMessage = `An error occurred: ${err instanceof Error ? err.message : String(err)}`
      setError(errorMessage)
      if (onError) onError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Refetch both schema and profile data
  const refetch = () => {
    fetchCustomFieldsSchema()
    // Profile data will be fetched after schema loads due to useEffect dependency
  }

  // Update profile data directly
  const updateProfile = (updatedProfile: any) => {
    console.log("🔄 updateProfile called with:", updatedProfile)
    console.log("🔄 New notification_preferences:", updatedProfile.notification_preferences)
    setProfile(updatedProfile)
    console.log("✅ Profile state updated")
  }

  // Load custom fields schema on mount
  useEffect(() => {
    fetchCustomFieldsSchema()
  }, [])

  // Load profile data after schema is loaded
  useEffect(() => {
    if (!loadingSchema && profileId) {
      fetchProfileData()
    }
  }, [profileId, customFieldsSchema, loadingSchema])

  return {
    profile,
    loading,
    error,
    customFieldsSchema,
    loadingSchema,
    refetch,
    updateProfile
  }
}