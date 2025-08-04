import { useState, useEffect } from 'react'
import { profilesApi } from '@/lib/profiles-api'
import { toast } from '@/components/ui/use-toast'

interface UseProfileFormOptions {
  profile: any
  onSave?: () => void
  onSaveError?: () => void
  triggerSave?: boolean
  refetch?: () => void
}

interface UseProfileFormResult {
  editedProfile: any
  saving: boolean
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSelectChange: (name: string, value: string) => void
  handleToggleChange: (name: string, checked: boolean) => void
  handleCustomFieldChange: (fieldKey: string, value: any) => void
  handleSave: () => Promise<void>
  resetForm: () => void
  hasChanges: boolean
}

/**
 * useProfileForm - Custom hook for managing profile form state and interactions
 * 
 * @param options - Configuration options for the form hook
 * @returns Form state, handlers, and save functionality
 * 
 * @example
 * ```tsx
 * const {
 *   editedProfile,
 *   saving,
 *   handleInputChange,
 *   handleSelectChange,
 *   handleSave,
 *   hasChanges
 * } = useProfileForm({
 *   profile: currentProfile,
 *   onSave: () => router.back(),
 *   triggerSave: shouldSave
 * })
 * ```
 */
export function useProfileForm({
  profile,
  onSave,
  onSaveError,
  triggerSave = false,
  refetch
}: UseProfileFormOptions): UseProfileFormResult {
  const [editedProfile, setEditedProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Handle external trigger to save
  useEffect(() => {
    if (triggerSave && editedProfile) {
      handleSave()
    }
  }, [triggerSave])

  // Reset edited profile when the base profile changes
  useEffect(() => {
    if (profile) {
      setEditedProfile(null)
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Handle special field transformations
    let processedValue: any = value
    
    if (name === 'tags') {
      // Convert comma-separated string to array for tags
      processedValue = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
    
    setEditedProfile((prev: any) => ({ ...(prev || profile), [name]: processedValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    // Handle special field transformations
    let processedValue: any = value
    
    if (name === 'language_preferences') {
      // Convert single language selection to array format for database
      processedValue = [value]
    }
    
    setEditedProfile((prev: any) => ({ ...(prev || profile), [name]: processedValue }))
  }

  const handleToggleChange = (name: string, checked: boolean) => {
    setEditedProfile((prev: any) => {
      const newProfile = { ...(prev || profile) }

      // Handle notification preferences from the database column
      if (name.startsWith("marketing_") || name.startsWith("transactional_")) {
        const currentPrefs = newProfile.notification_preferences || {}
        currentPrefs[name] = checked
        newProfile.notification_preferences = currentPrefs
      } else {
        newProfile[name] = checked
      }

      return newProfile
    })
  }

  const handleCustomFieldChange = (fieldKey: string, value: any) => {
    setEditedProfile((prev: any) => {
      const newProfile = { ...(prev || profile) }
      const currentCustomFields = newProfile.custom_fields || {}

      newProfile.custom_fields = {
        ...currentCustomFields,
        [fieldKey]: value,
      }

      return newProfile
    })
  }

  const handleSave = async () => {
    if (!profile) return

    // Use editedProfile if changes were made, otherwise use the original profile
    const profileToSave = editedProfile || profile

    setSaving(true)
    try {
      // Ensure notification_preferences is properly structured
      const finalProfileToSave = {
        ...profileToSave,
        notification_preferences: profileToSave.notification_preferences || {},
      }

      const { error } = await profilesApi.updateProfile(profile.id, finalProfileToSave)

      if (error) {
        toast({
          title: "Error saving profile",
          description: error,
          variant: "destructive",
        })
        if (onSaveError) onSaveError()
        return
      }

      toast({
        title: "Profile updated",
        description: "The profile has been successfully updated.",
      })

      // Refetch profile data to get the latest saved values and update the UI
      if (refetch) {
        refetch()
      }

      // Reset the edited state after successful save
      setEditedProfile(null)

      // Call the onSave callback if provided
      if (onSave) onSave()
    } catch (err) {
      console.error("Exception saving profile:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      
      toast({
        title: "Error saving profile",
        description: errorMessage,
        variant: "destructive",
      })
      
      if (onSaveError) onSaveError()
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setEditedProfile(null)
  }

  // Check if there are any changes
  const hasChanges = editedProfile !== null

  // Get the current form data (edited or original)
  const currentProfile = editedProfile || profile

  return {
    editedProfile: currentProfile,
    saving,
    handleInputChange,
    handleSelectChange,
    handleToggleChange,
    handleCustomFieldChange,
    handleSave,
    resetForm,
    hasChanges
  }
}