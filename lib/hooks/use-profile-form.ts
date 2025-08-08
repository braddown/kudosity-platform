import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface UseProfileFormOptions {
  profile: any
  onSave?: () => void
  onSaveError?: () => void
  triggerSave?: boolean
  refetch?: () => void
  onProfileUpdate?: (updatedProfile: any) => void
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
  refetch,
  onProfileUpdate
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
    // Store as direct profile property (these are all contact properties now)
    setEditedProfile((prev: any) => ({ ...(prev || profile), [name]: value }))
  }

  // Function to log consent/activation activity
  const logConsentActivity = async (channel: string, channelType: 'marketing' | 'transactional', action: 'given' | 'revoked') => {
    try {
      let activityType: string
      let description: string
      
      if (channelType === 'marketing') {
        // Marketing channels use consent language
        activityType = action === 'given' ? 'consent_given' : 'consent_revoked'
        description = `Marketing ${channel} consent ${action}`
      } else {
        // Transactional channels use activation language
        activityType = action === 'given' ? 'transactional_activated' : 'transactional_deactivated'
        const actionText = action === 'given' ? 'activated' : 'deactivated'
        description = `Transactional ${channel} ${actionText}`
      }
      
      await supabase
        .from('profile_activity_log')
        .insert({
          profile_id: profile.id,
          activity_type: activityType,
          channel: channel,
          channel_type: channelType,
          description: description,
          metadata: {
            previous_state: action === 'revoked',
            new_state: action === 'given',
            timestamp: new Date().toISOString()
          },
          source: 'Brad Down: Manual' // Placeholder until user system is built
        })
      
      console.log(`Logged activity: ${description}`)
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  // Function to log property updates
  const logPropertyUpdate = async (propertyName: string, oldValue: any, newValue: any, propertyType: 'contact' | 'custom' | 'system' = 'contact') => {
    try {
      // Format property name for display
      const formatPropertyName = (name: string) => {
        const specialNames: Record<string, string> = {
          'first_name': 'First Name',
          'last_name': 'Last Name',
          'email': 'Email',
          'mobile': 'Mobile',
          'notes': 'Notes',
          'address_line_1': 'Address Line 1',
          'address_line_2': 'Address Line 2',
          'postal_code': 'Postcode/ZIP',
          'city': 'City',
          'state': 'State',
          'country': 'Country',
          'timezone': 'Timezone',
          'language_preferences': 'Language Preferences',
          'os': 'Operating System',
          'device': 'Device',
          'source': 'Source',
          'location': 'Location',
          'tags': 'Tags',
          'is_duplicate': 'Is Duplicate',
          'merge_status': 'Merge Status',
          'data_retention_date': 'Data Retention Date',
          // Custom field examples - these will use the proper title case
          'company_name': 'Company Name',
          'company_size': 'Company Size',
          'industry': 'Industry',
          'job_title': 'Job Title',
          'lead_score': 'Lead Score',
          'lifecycle_stage': 'Lifecycle Stage',
          'lifetime_value': 'Lifetime Value',
          'last_contact_date': 'Last Contact Date',
          'next_follow_up': 'Next Follow Up',
          'annual_revenue': 'Annual Revenue',
          'employee_count': 'Employee Count'
        }
        
        // If we have a special name mapping, use it
        if (specialNames[name]) {
          return specialNames[name]
        }
        
        // Otherwise, convert snake_case to Title Case
        return name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      }

      // Format values for display
      const formatValue = (value: any) => {
        if (value === null || value === undefined || value === '') return 'Empty'
        if (typeof value === 'boolean') return value ? 'Yes' : 'No'
        if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'Empty'
        if (typeof value === 'object') return 'Updated'
        return String(value)
      }

      const formattedName = formatPropertyName(propertyName)
      const formattedOldValue = formatValue(oldValue)
      const formattedNewValue = formatValue(newValue)
      
      const description = `Updated ${formattedName} from "${formattedOldValue}" to "${formattedNewValue}"`
      
      await supabase
        .from('profile_activity_log')
        .insert({
          profile_id: profile.id,
          activity_type: 'property_updated',
          channel: null,
          channel_type: null,
          description: description,
          metadata: {
            property_name: propertyName,
            property_type: propertyType,
            previous_value: oldValue,
            new_value: newValue,
            timestamp: new Date().toISOString()
          },
          source: 'Brad Down: Manual' // Placeholder until user system is built
        })
      
      console.log(`Logged property update: ${description}`)
    } catch (error) {
      console.error('Failed to log property update:', error)
    }
  }

  // Function to compare profiles and log all changes
  const logPropertyChanges = async (originalProfile: any, updatedProfile: any) => {
    try {
      // Define field categories
      const contactFields = [
        'first_name', 'last_name', 'email', 'mobile', 'notes',
        'address_line_1', 'address_line_2', 'postal_code', 'city', 'state', 'country',
        'timezone', 'language_preferences', 'os', 'device', 'source', 'location'
      ]
      
      const systemFields = [
        'is_duplicate', 'merge_status', 'data_retention_date'
      ]

      // Check contact fields
      for (const field of contactFields) {
        const oldValue = originalProfile[field]
        const newValue = updatedProfile[field]
        
        if (newValue !== undefined && oldValue !== newValue) {
          await logPropertyUpdate(field, oldValue, newValue, 'contact')
        }
      }

      // Check system fields
      for (const field of systemFields) {
        const oldValue = originalProfile[field]
        const newValue = updatedProfile[field]
        
        if (newValue !== undefined && oldValue !== newValue) {
          await logPropertyUpdate(field, oldValue, newValue, 'system')
        }
      }

      // Check custom fields
      const oldCustomFields = originalProfile.custom_fields || {}
      const newCustomFields = updatedProfile.custom_fields || {}
      
      // Get all custom field keys from both old and new
      const allCustomFieldKeys = new Set([
        ...Object.keys(oldCustomFields),
        ...Object.keys(newCustomFields)
      ])

      for (const fieldKey of allCustomFieldKeys) {
        const oldValue = oldCustomFields[fieldKey]
        const newValue = newCustomFields[fieldKey]
        
        if (oldValue !== newValue) {
          await logPropertyUpdate(fieldKey, oldValue, newValue, 'custom')
        }
      }

      // Check tags separately (array comparison)
      const oldTags = originalProfile.tags || []
      const newTags = updatedProfile.tags || []
      
      if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
        await logPropertyUpdate('tags', oldTags, newTags, 'contact')
      }

      console.log('Property change logging completed')
    } catch (error) {
      console.error('Failed to log property changes:', error)
    }
  }

  const handleToggleChange = (name: string, checked: boolean) => {
    console.log(`🔄 Toggle change: ${name} = ${checked}`)
    
    setEditedProfile((prev: any) => {
      const newProfile = { ...(prev || profile) }

      // Handle notification preferences from the database column
      if (name.startsWith("marketing_") || name.startsWith("transactional_")) {
        const currentPrefs = newProfile.notification_preferences || {}
        const previousValue = currentPrefs[name]
        
        console.log(`📊 Previous value for ${name}: ${previousValue}`)
        console.log(`📊 New value for ${name}: ${checked}`)
        
        // Only proceed if the value actually changed to prevent duplicate logs
        if (previousValue !== checked) {
          currentPrefs[name] = checked
          
          console.log(`✅ Updated notification preferences:`, currentPrefs)
          
          // Log consent activity for legal compliance
          const isMarketing = name.startsWith("marketing_")
          const channel = name.replace(/^(marketing_|transactional_)/, '')
          const channelType = isMarketing ? 'marketing' : 'transactional'
          
          // Log the activity change
          const action = checked ? 'given' : 'revoked'
          console.log(`📝 Logging activity: ${channelType} ${channel} consent ${action}`)
          logConsentActivity(channel, channelType, action)
          
          // When enabling a channel, always update consent/activation record with new timestamp
          if (checked) {
            const infoKey = `${name}_${isMarketing ? 'consent' : 'activation'}`
            
            // Always update the record with new timestamp when reactivating
            currentPrefs[infoKey] = {
              [isMarketing ? 'consent_date' : 'activation_date']: new Date().toISOString(),
              [isMarketing ? 'consent_source' : 'activation_source']: 'Brad Down: Manual'
            }
            console.log(`📅 Updated ${infoKey} with new timestamp:`, currentPrefs[infoKey])
          }
          
          newProfile.notification_preferences = currentPrefs
          
          // Auto-save notification preferences for legal compliance immediately
          console.log(`🚀 Auto-saving notification preference change for ${name}`)
          // Save immediately using the updated profile data
          setTimeout(async () => {
            console.log(`🚀 Executing auto-save for ${name}`)
            console.log(`🚀 Current editedProfile state:`, editedProfile)
            
            // Force save with the updated profile data
            const currentProfile = { ...(editedProfile || profile), notification_preferences: currentPrefs }
            await handleSaveWithProfile(currentProfile)
          }, 100) // Shorter delay
        } else {
          console.log(`⚠️ No change detected for ${name}, skipping update`)
        }
      } else {
        newProfile[name] = checked
      }

      console.log(`🎯 Final profile state for ${name}:`, newProfile.notification_preferences?.[name])
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

  // Internal save function that bypasses change detection (for auto-save)
  const handleSaveWithProfile = async (profileToSave: any) => {
    if (!profile || saving) return // Prevent multiple simultaneous saves

    console.log("🚀 handleSaveWithProfile called with:", profileToSave)
    
    setSaving(true)
    try {
      await performSave(profileToSave)
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

  const handleSave = async () => {
    if (!profile || saving) return // Prevent multiple simultaneous saves

    // Use editedProfile if changes were made, otherwise use the original profile
    const profileToSave = editedProfile || profile

    // Check if there are actually any changes to save
    if (!editedProfile) {
      console.log("No changes to save")
      toast({
        title: "No changes",
        description: "No changes have been made to save.",
      })
      return
    }

    await handleSaveWithProfile(profileToSave)
  }

  // Extract the core save logic into a separate function
  const performSave = async (profileToSave: any) => {
    // Ensure notification_preferences is properly structured
    const finalProfileToSave = {
      ...profileToSave,
      notification_preferences: profileToSave.notification_preferences || {},
    }

    // Map form data to CDP profile format - include all editable fields
    // Only include fields that have actual values to avoid database constraint issues
    const cdpProfileUpdate: any = {
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    }

    // Add core contact fields (always include these)
    if (finalProfileToSave.first_name !== undefined) cdpProfileUpdate.first_name = finalProfileToSave.first_name
    if (finalProfileToSave.last_name !== undefined) cdpProfileUpdate.last_name = finalProfileToSave.last_name
    if (finalProfileToSave.email !== undefined) cdpProfileUpdate.email = finalProfileToSave.email
    if (finalProfileToSave.mobile !== undefined) cdpProfileUpdate.mobile = finalProfileToSave.mobile
    if (finalProfileToSave.notes !== undefined) cdpProfileUpdate.notes = finalProfileToSave.notes

    // Add address fields
    if (finalProfileToSave.address_line_1 !== undefined) cdpProfileUpdate.address_line_1 = finalProfileToSave.address_line_1
    if (finalProfileToSave.address_line_2 !== undefined) cdpProfileUpdate.address_line_2 = finalProfileToSave.address_line_2
    if (finalProfileToSave.postal_code !== undefined) cdpProfileUpdate.postal_code = finalProfileToSave.postal_code
    if (finalProfileToSave.city !== undefined) cdpProfileUpdate.city = finalProfileToSave.city
    if (finalProfileToSave.state !== undefined) cdpProfileUpdate.state = finalProfileToSave.state
    if (finalProfileToSave.country !== undefined) cdpProfileUpdate.country = finalProfileToSave.country

    // Add contact property fields
    if (finalProfileToSave.timezone !== undefined) cdpProfileUpdate.timezone = finalProfileToSave.timezone
    if (finalProfileToSave.language_preferences !== undefined) cdpProfileUpdate.language_preferences = finalProfileToSave.language_preferences
    if (finalProfileToSave.os !== undefined) cdpProfileUpdate.os = finalProfileToSave.os
    if (finalProfileToSave.device !== undefined) cdpProfileUpdate.device = finalProfileToSave.device
    if (finalProfileToSave.source !== undefined) cdpProfileUpdate.source = finalProfileToSave.source
    if (finalProfileToSave.location !== undefined) cdpProfileUpdate.location = finalProfileToSave.location

    // Add complex fields
    if (finalProfileToSave.custom_fields !== undefined) cdpProfileUpdate.custom_fields = finalProfileToSave.custom_fields
    if (finalProfileToSave.notification_preferences !== undefined) {
      cdpProfileUpdate.notification_preferences = finalProfileToSave.notification_preferences
      console.log(`💾 Saving notification preferences:`, finalProfileToSave.notification_preferences)
      console.log(`💾 Full cdpProfileUpdate object:`, cdpProfileUpdate)
    }
    if (finalProfileToSave.tags !== undefined) cdpProfileUpdate.tags = finalProfileToSave.tags

    // Add system fields only if they exist
    if (finalProfileToSave.is_duplicate !== undefined) cdpProfileUpdate.is_duplicate = finalProfileToSave.is_duplicate
    if (finalProfileToSave.merge_status !== undefined) cdpProfileUpdate.merge_status = finalProfileToSave.merge_status
    if (finalProfileToSave.data_retention_date !== undefined) cdpProfileUpdate.data_retention_date = finalProfileToSave.data_retention_date

    console.log("Saving profile changes...")
    
    const { data, error } = await supabase
      .from("cdp_profiles")
      .update(cdpProfileUpdate)
      .eq("id", profile.id)
      .select()

    if (data && data.length > 0) {
      console.log("Profile saved successfully")
      console.log("🔍 Saved data notification_preferences:", data[0].notification_preferences)
      
      // Log property changes after successful save
      await logPropertyChanges(profile, finalProfileToSave)
    }

    if (error) {
      console.error("Database update error:", error)
      toast({
        title: "Error saving profile",
        description: `Database error: ${error.message || "Failed to save profile"}`,
        variant: "destructive",
      })
      if (onSaveError) onSaveError()
      return
    }

    if (!data || data.length === 0) {
      console.error("No data returned from update")
      toast({
        title: "Error saving profile",
        description: "Profile not found or no changes made",
        variant: "destructive",
      })
      if (onSaveError) onSaveError()
      return
    }

    // Reset the edited state first
    setEditedProfile(null)

    // Update the original profile data with the saved values
    if (onProfileUpdate && data && data.length > 0) {
      console.log("🔄 Calling onProfileUpdate with:", data[0])
      console.log("🔄 Updated notification_preferences:", data[0].notification_preferences)
      // Use setTimeout to ensure state update happens in next tick
      setTimeout(() => {
        onProfileUpdate(data[0])
      }, 0)
    }

    toast({
      title: "Profile updated",
      description: "The profile has been successfully updated.",
    })

    // Call the onSave callback if provided
    if (onSave) onSave()
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