"use client"

import React from "react"
import { ProfilePage as RefactoredProfilePage } from "./features/profiles"

interface ProfilePageProps {
  profileId: string
  onBack: () => void
  onSave?: () => void
  saveCallback?: () => void
  onSaveError?: () => void
  triggerSave?: boolean
  isHeaderless?: boolean
  onStatusUpdate?: (status: string) => void
  onStatusChange?: (status: string) => void
  pendingStatusChange?: string | null
}

/**
 * ProfilePage - Compatibility wrapper for the refactored ProfilePage
 * 
 * This component maintains the original interface while using the new
 * modular ProfilePage architecture underneath. The original 927-line
 * component has been broken down into focused, reusable modules:
 * 
 * - ProfileHeader (20 lines) - Navigation and save functionality
 * - ContactPropertiesForm (220 lines) - Basic profile fields
 * - CustomFieldsSection (140 lines) - Dynamic custom fields
 * - NotificationPreferences (128 lines) - Communication preferences  
 * - ProfileActivityTimeline (52 lines) - Activity history
 * - useProfileData hook - Data fetching logic
 * - useProfileForm hook - Form state management
 * 
 * Total reduction: 927 lines → ~75 lines across 7 focused modules
 * 
 * @deprecated - Use ProfilePage from @/components/features/profiles instead
 * This wrapper exists for backward compatibility during the migration period.
 */
export default function ProfilePage(props: ProfilePageProps) {
  return <RefactoredProfilePage {...props} />
}