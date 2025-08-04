"use client"

import React from "react"

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
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}
    </div>
  )
}