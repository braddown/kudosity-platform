"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface ProfileHeaderProps {
  profileName: string
  onBack: () => void
  onSave?: () => void
  isHeaderless?: boolean
  saving?: boolean
}

/**
 * ProfileHeader - Header component for profile pages with navigation and save functionality
 * 
 * @param profileName - The full name of the profile to display
 * @param onBack - Callback function for the back button
 * @param onSave - Optional callback function for the save button
 * @param isHeaderless - Whether to hide the header completely
 * @param saving - Whether the save operation is in progress
 * 
 * @example
 * ```tsx
 * <ProfileHeader
 *   profileName="John Doe"
 *   onBack={() => router.back()}
 *   onSave={handleSave}
 *   saving={isSaving}
 * />
 * ```
 */
export function ProfileHeader({
  profileName,
  onBack,
  onSave,
  isHeaderless = false,
  saving = false
}: ProfileHeaderProps) {
  if (isHeaderless) {
    return null
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <button 
          onClick={onBack} 
          className="text-blue-600 hover:text-blue-800 mb-2 transition-colors"
        >
          ← Back to Profiles
        </button>
        <h1 className="text-2xl font-bold">
          {profileName}
        </h1>
      </div>
      {onSave && (
        <Button
          onClick={onSave}
          disabled={saving}
          variant="default"
          className="px-4"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      )}
    </div>
  )
}