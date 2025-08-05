import { useState, useEffect } from 'react'
import { profilesApi } from '@/api/profiles-api'

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

  // Fetch custom fields schema
  const fetchCustomFieldsSchema = async () => {
    try {
      setLoadingSchema(true)
      const { data: schema, error } = await profilesApi.getCustomFieldsSchema()

      if (error) {
        console.error("Error fetching custom fields schema:", error)
        if (onError) onError(`Failed to load custom fields schema: ${error}`)
      } else {
        console.log("Custom fields schema loaded:", schema)
        setCustomFieldsSchema(schema || {})
      }
    } catch (err) {
      console.error("Exception fetching custom fields schema:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (onError) onError(`Exception loading custom fields schema: ${errorMessage}`)
    } finally {
      setLoadingSchema(false)
    }
  }

  // Fetch profile data from the database
  const fetchProfileData = async () => {
    if (!profileId) return

    setLoading(true)
    setError(null)

    try {
      console.log(`Fetching profile with ID: ${profileId}`)
      const { data, error } = await profilesApi.getProfile(profileId)

      if (error) {
        console.error("Error fetching profile:", error)
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

      console.log("Profile data loaded:", data)

      // Ensure all custom fields from schema are present in the profile
      const completeCustomFields = { ...data.custom_fields }

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
        ...data,
        custom_fields: completeCustomFields,
      }

      setProfile(completeProfile)
    } catch (err) {
      console.error("Exception fetching profile:", err)
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