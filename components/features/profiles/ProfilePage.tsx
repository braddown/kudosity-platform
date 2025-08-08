"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfileData } from "@/hooks/use-profile-data"
import { useProfileForm } from "@/hooks/use-profile-form"
import { ProfileHeader } from "./ProfileHeader"
import { ContactPropertiesForm } from "./ContactPropertiesForm"
import { CustomFieldsSection } from "./CustomFieldsSection"
import { NotificationPreferences } from "./NotificationPreferences"
import { ProfileActivityTimeline } from "./ProfileActivityTimeline"

interface ProfilePageProps {
  profileId: string
  onBack: () => void
  onSave?: () => void
  saveCallback?: () => void
  onSaveError?: () => void
  triggerSave?: boolean
  isHeaderless?: boolean
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
  triggerSave = false,
  isHeaderless = false
}: ProfilePageProps) {
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
    hasChanges
  } = useProfileForm({
    profile,
    onSave,
    onSaveError,
    triggerSave,
    refetch,
    onProfileUpdate: updateProfile
  })

  // Show loading state while data is being fetched
  if (loading || loadingSchema) {
    return <ProfilePageSkeleton isHeaderless={isHeaderless} />
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
  const profileName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Profile'

  return (
    <div className="space-y-6">
      <ProfileHeader
        profileName={profileName}
        onBack={onBack}
        onSave={handleSave}
        isHeaderless={isHeaderless}
        saving={saving}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ContactPropertiesForm
          profile={editedProfile || profile}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
          onSave={handleSave}
        />

        <CustomFieldsSection
          profile={editedProfile || profile}
          customFieldsSchema={customFieldsSchema}
          onCustomFieldChange={handleCustomFieldChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NotificationPreferences
          profile={editedProfile || profile}
          onToggleChange={handleToggleChange}
        />

        <ProfileActivityTimeline
          profile={profile} // Use original profile for timestamps
        />
      </div>
    </div>
  )
}

/**
 * ProfilePageSkeleton - Loading skeleton for the profile page
 */
function ProfilePageSkeleton({ isHeaderless }: { isHeaderless: boolean }) {
  return (
    <div className="space-y-6">
      {!isHeaderless && (
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
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