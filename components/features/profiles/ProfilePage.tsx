"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
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



  // Handle status change
  const handleStatusChange = useCallback((newStatus: string) => {
    setEditedProfile(prev => {
      const updated = {
        ...prev,
        status: newStatus
      }
      
      // If status is changed to deleted, turn off all notification preferences
      if (newStatus === 'deleted') {
        updated.notification_preferences = {
          email_marketing: false,
          email_transactional: false,
          sms_marketing: false,
          sms_transactional: false,
          whatsapp_marketing: false,
          whatsapp_transactional: false,
          rcs_marketing: false,
          rcs_transactional: false
        }
      }
      
      return updated
    })
  }, [setEditedProfile])




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
      {!isHeaderless && (
        <div className="fixed top-16 left-64 right-0 z-50 bg-background px-6 py-4 border-b shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Edit Profile: {profileName}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={editedProfile?.status || profile.status || 'active'}
                  onValueChange={handleStatusChange}
                  disabled={saving}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
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
      
      <div className="pt-6">
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
          refreshTrigger={activityRefreshTrigger}
        />
      </div>
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