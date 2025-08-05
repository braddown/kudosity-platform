import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

  // Fetch custom fields schema from CDP system
  const fetchCustomFieldsSchema = async () => {
    try {
      setLoadingSchema(true)
      
      // Get schema from any profile's custom_fields to understand structure
      const { data: sampleProfiles, error } = await supabase
        .from("cdp_profiles")
        .select("custom_fields")
        .not("custom_fields", "is", null)
        .limit(10)

      if (error) {
        console.error("Error fetching custom fields schema:", error)
        if (onError) onError(`Failed to load custom fields schema: ${error.message}`)
        setCustomFieldsSchema({})
        return
      }

      // Build schema from existing custom fields
      const schema: Record<string, any> = {}
      
      sampleProfiles?.forEach(profile => {
        if (profile.custom_fields && typeof profile.custom_fields === 'object') {
          Object.entries(profile.custom_fields).forEach(([key, value]) => {
            if (!key.startsWith('_') && !schema[key]) {
              schema[key] = {
                key: key,
                label: key.split('_').map((word: string) => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' '),
                type: typeof value === 'number' ? 'number' : 
                      typeof value === 'boolean' ? 'boolean' : 'string',
                required: false,
                description: `Custom field: ${key}`,
                defaultValue: ''
              }
            }
          })
        }
      })

      console.log("Custom fields schema loaded:", schema)
      setCustomFieldsSchema(schema)
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
      
      const { data, error } = await supabase
        .from("cdp_profiles")
        .select("*")
        .eq("id", profileId)
        .single()

      if (error) {
        console.error("Error fetching CDP profile:", error)
        const errorMessage = `Failed to load profile: ${error.message}`
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

      // Map CDP profile to expected format for compatibility
      const mappedProfile = {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        mobile: data.mobile?.startsWith('unknown_') ? '' : data.mobile,
        phone: data.phone,
        country: data.country,
        state: data.state,
        city: data.city,
        status: data.lifecycle_stage === 'customer' ? 'Active' : 
                data.lifecycle_stage === 'churned' ? 'Inactive' : 'Active',
        lifecycle_stage: data.lifecycle_stage,
        lead_score: data.lead_score,
        lifetime_value: data.lifetime_value,
        data_quality_score: data.data_quality_score,
        custom_fields: data.custom_fields || {},
        notification_preferences: data.notification_preferences || {},
        tags: data.tags || [],
        source: data.source,
        source_details: data.source_details,
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_activity_at: data.last_activity_at,
        // Additional CDP fields
        consent_date: data.consent_date,
        consent_source: data.consent_source
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
    refetch
  }
}