"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface ProfileHeaderProps {
  profileName: string
  profileStatus?: string
  onBack: () => void
  onSave?: () => void
  onStatusChange?: (status: string) => void
  isHeaderless?: boolean
  saving?: boolean
  hasChanges?: boolean
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
  profileStatus = 'active',
  onBack,
  onSave,
  onStatusChange,
  isHeaderless = false,
  saving = false,
  hasChanges = false
}: ProfileHeaderProps) {
  // Return null if headerless mode
  if (isHeaderless) {
    return null
  }

  // Get status badge color
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'deleted':
        return 'destructive'
      case 'destroyed':
        return 'destructive'
      default:
        return 'outline'
    }
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {profileName}
          </h1>
          <Badge variant={getStatusBadgeVariant(profileStatus)}>
            {profileStatus}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {onStatusChange && (
          <Select value={profileStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Active
                </div>
              </SelectItem>
              <SelectItem value="inactive">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Inactive
                </div>
              </SelectItem>
              <SelectItem value="deleted">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Deleted
                </div>
              </SelectItem>
              <SelectItem value="destroyed" disabled>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  Destroyed (Irreversible)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        {onSave && (
          <Button
            onClick={onSave}
            disabled={saving || !hasChanges}
            variant="default"
            className="px-4"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
    </div>
  )
}