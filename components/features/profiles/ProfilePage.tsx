"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { LoadingSection } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"
import { useProfileData } from "@/hooks/use-profile-data"
import { useProfileForm } from "@/hooks/use-profile-form"
import { ContactPropertiesForm } from "./ContactPropertiesForm"
import { CustomFieldsSection } from "./CustomFieldsSection"
import { NotificationPreferences } from "./NotificationPreferences"
import { ProfileActivityTimeline } from "./ProfileActivityTimeline"

interface ProfilePageProps {
  profileId: string
  onBack: () => void
  onSave?: () => void
  onSaveError?: () => void
  isHeaderless?: boolean
  onSaveRef?: (ref: () => Promise<void>) => void
  onHasChangesUpdate?: (hasChanges: boolean) => void
}

/**
 * ProfilePage - Refactored profile editing page using modular components
 * 
 * This component has been broken down from a monolithic 927-line component into
 * focused, reusable modules following our architecture guidelines.
 * 
 * @param profileId - ID of the profile to edit
 * @param onBack - Callback for back navigation
 * @param onSave - Callback for successful save
 * @param onSaveError - Callback for save errors
 * @param triggerSave - External trigger to save the form
 * @param isHeaderless - Whether to hide the header
 * 
 * @example
 * ```tsx
 * <ProfilePage
 *   profileId="123"
 *   onBack={() => router.back()}
 *   onSave={() => router.push('/profiles')}
 * />
 * ```
 */
export default function ProfilePage({
  profileId,
  onBack,
  onSave,
  onSaveError,
  isHeaderless = false,
  onSaveRef,
  onHasChangesUpdate
}: ProfilePageProps) {
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0)

  // Fetch profile data and custom fields schema
  const {
    profile,
    loading,
    error,
    customFieldsSchema,
    loadingSchema,
    refetch,
    updateProfile
  } = useProfileData({
    profileId,
    onError: (error) => console.error('Profile data error:', error)
  })

  // Handle form state and mutations
  const {
    editedProfile,
    saving,
    handleInputChange,
    handleSelectChange,
    handleToggleChange,
    handleCustomFieldChange,
    handleSave,
    hasChanges,
    setEditedProfile
  } = useProfileForm({
    profile,
    onSave: () => {
      // Refresh activity timeline after save
      setActivityRefreshTrigger(prev => prev + 1)
      if (onSave) onSave()
    },
    onSaveError,
    refetch,
    onProfileUpdate: updateProfile
  })
  
  // Debug logging - must be before any returns
  useEffect(() => {
    console.log('ProfilePage status debug:', {
      profileExists: !!profile,
      profileStatus: profile?.status,
      editedProfileExists: !!editedProfile,
      editedProfileStatus: editedProfile?.status,
      willUseStatus: editedProfile?.status || profile?.status || 'active'
    })
  }, [profile, editedProfile])



  // Handle status change
  const handleStatusChange = useCallback((newStatus: string) => {
    setEditedProfile(prev => {
      // Use the existing edited profile or fall back to the original profile
      const base = prev || profile
      const updated = {
        ...base,
        status: newStatus
      }
      
      // If status is changed to deleted, turn off all notification preferences
      if (newStatus === 'deleted') {
        updated.notification_preferences = {
          marketing_emails: false,
          transactional_emails: false,
          marketing_sms: false,
          transactional_sms: false,
          marketing_whatsapp: false,
          transactional_whatsapp: false,
          marketing_rcs: false,
          transactional_rcs: false
        }
      }
      
      return updated
    })
  }, [setEditedProfile, profile])




  // Show loading state while data is being fetched
  if (loading || loadingSchema) {
    return <LoadingSection message="Loading profile..." />
  }

  // Show error state if profile couldn't be loaded
  if (error || !profile) {
    return (
      <ProfilePageError
        error={error || "Profile not found"}
        onBack={onBack}
        isHeaderless={isHeaderless}
      />
    )
  }

  // Get profile name for header
  const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown Profile'
  
  // Get the current status to display (normalize to lowercase)
  // Use the edited status if available, otherwise use the profile status
  const statusToUse = editedProfile?.status || profile?.status || 'active'
  const currentStatus = statusToUse.toLowerCase()
  
  // Log the status resolution
  console.log('Status resolution:', {
    hasEditedProfile: !!editedProfile,
    editedProfileStatus: editedProfile?.status,
    profileStatus: profile?.status,
    statusToUse: statusToUse,
    currentStatus: currentStatus
  })

  return (
    <div className="space-y-6">
      {!isHeaderless && (
        <div className="fixed top-16 left-64 right-0 z-50 bg-background px-6 py-4 border-b shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Edit Profile: {profileName}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {profile ? (
                  <Select
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Active</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span>Inactive</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="deleted">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Deleted</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-[140px] h-8 bg-muted animate-pulse rounded" />
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={saving || !hasChanges ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={onBack}
                variant="ghost"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className={!isHeaderless ? "pt-12" : ""}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Profile details */}
          <div className="space-y-6">
            <ContactPropertiesForm
              profile={editedProfile || profile}
              onInputChange={handleInputChange}
              onSelectChange={handleSelectChange}
              onSave={handleSave}
            />

            <NotificationPreferences
              profile={editedProfile || profile}
              onToggleChange={handleToggleChange}
            />
          </div>

          {/* Right column - Custom fields and Activity timeline */}
          <div className="space-y-6">
            <CustomFieldsSection
              profile={editedProfile || profile}
              customFieldsSchema={customFieldsSchema}
              onCustomFieldChange={handleCustomFieldChange}
            />

            <ProfileActivityTimeline
              profile={profile} // Use original profile for timestamps
              profileId={profileId}
              refreshTrigger={activityRefreshTrigger}
              isNewProfile={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}



/**
 * ProfilePageError - Error state for the profile page
 */
interface ProfilePageErrorProps {
  error: string
  onBack: () => void
  isHeaderless: boolean
}

function ProfilePageError({ error, onBack, isHeaderless }: ProfilePageErrorProps) {
  return (
    <div className="space-y-6">
      {!isHeaderless && (
        <div className="flex items-center justify-between">
          <div>
            <button onClick={onBack} className="text-blue-600 hover:text-blue-800 mb-2">
              ← Back to Profiles
            </button>
            <h1 className="text-2xl font-bold">Profile Error</h1>
          </div>
        </div>
      )}

      <Alert variant="destructive">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    </div>
  )
}