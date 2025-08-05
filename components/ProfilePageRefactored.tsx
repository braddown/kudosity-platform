"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Save, RefreshCw, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EnhancedPageLayout } from "@/components/layouts/EnhancedPageLayout"
import { useProfiles, type Profile } from "@/hooks/useProfiles"

interface ProfilePageRefactoredProps {
  profileId: string
  onBack: () => void
  onSave?: () => void
  onSaveError?: () => void
}

/**
 * ProfilePageRefactored - Simplified profile editing using useProfiles hook and EnhancedPageLayout
 * 
 * This refactored version leverages our comprehensive useProfiles hook and EnhancedPageLayout
 * to provide a clean, consistent profile editing experience with minimal boilerplate.
 * 
 * Key improvements:
 * - Uses useProfiles hook for all data operations
 * - Uses EnhancedPageLayout for consistent UI and state management
 * - Significantly reduced code complexity
 * - Built-in error handling and loading states
 * - Optimistic updates for better UX
 */
export default function ProfilePageRefactored({
  profileId,
  onBack,
  onSave,
  onSaveError
}: ProfilePageRefactoredProps) {
  const [editedProfile, setEditedProfile] = useState<Partial<Profile> | null>(null)
  const [saving, setSaving] = useState(false)

  // Use the comprehensive useProfiles hook
  const {
    loading,
    error,
    getProfile,
    updateProfile,
    refresh,
  } = useProfiles({
    immediate: false, // We'll fetch the specific profile manually
  })

  // Fetch the specific profile
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true)
      setProfileError(null)
      
      try {
        const fetchedProfile = await getProfile(profileId)
        if (fetchedProfile) {
          setProfile(fetchedProfile)
          setEditedProfile(fetchedProfile)
        } else {
          setProfileError("Profile not found")
        }
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setProfileLoading(false)
      }
    }

    if (profileId) {
      fetchProfile()
    }
  }, [profileId, getProfile])

  // Handle input changes
  const handleInputChange = (field: keyof Profile, value: any) => {
    setEditedProfile(prev => prev ? { ...prev, [field]: value } : { [field]: value })
  }

  // Handle save
  const handleSave = async () => {
    if (!editedProfile || !profile) return

    setSaving(true)
    try {
      const updated = await updateProfile(profile.id, editedProfile)
      if (updated) {
        setProfile(updated)
        setEditedProfile(updated)
        onSave?.()
      } else {
        onSaveError?.()
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
      onSaveError?.()
    } finally {
      setSaving(false)
    }
  }

  // Check if there are unsaved changes
  const hasChanges = editedProfile && profile && 
    JSON.stringify(editedProfile) !== JSON.stringify(profile)

  // Page actions
  const pageActions = [
    {
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: refresh,
      variant: "outline" as const,
    },
    {
      label: saving ? "Saving..." : "Save Changes",
      icon: <Save className="h-4 w-4" />,
      onClick: handleSave,
      variant: "default" as const,
      disabled: !hasChanges || saving,
      loading: saving,
    },
  ]

  return (
    <EnhancedPageLayout
      title={profile ? `${profile.first_name} ${profile.last_name}` : "Profile"}
      description="Edit profile information and preferences"
      showBackButton
      onBack={onBack}
      actions={pageActions}
      
      loading={{
        loading: profileLoading,
        showSkeleton: true,
        skeletonCount: 3,
        message: "Loading profile..."
      }}
      
      error={{
        error: profileError || error,
        recoverable: true,
        onRetry: () => window.location.reload(),
        errorTitle: "Failed to load profile",
        errorDetails: profileError || "Please try again or contact support if the problem persists"
      }}
      
      empty={{
        isEmpty: !profile && !profileLoading && !profileError,
        emptyTitle: "Profile not found",
        emptyDescription: "The requested profile could not be found",
        emptyActions: [
          { label: "Go Back", onClick: onBack, variant: "outline" }
        ]
      }}
      
      breadcrumbs={{ 
        showBreadcrumbs: true,
        customBreadcrumbs: [
          { label: "Home", path: "/" },
          { label: "Profiles", path: "/profiles" },
          { label: profile ? `${profile.first_name} ${profile.last_name}` : "Profile" }
        ]
      }}
      
      badge={hasChanges ? { text: "Unsaved Changes", variant: "outline" } : undefined}
    >
      {profile && editedProfile && (
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editedProfile.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editedProfile.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedProfile.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={editedProfile.mobile || ''}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedProfile.status || 'active'}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {editedProfile.custom_fields && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(editedProfile.custom_fields).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <Input
                        id={key}
                        value={String(value || '')}
                        onChange={(e) => handleInputChange('custom_fields', {
                          ...editedProfile.custom_fields,
                          [key]: e.target.value
                        })}
                        placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {editedProfile.tags && editedProfile.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {editedProfile.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                <strong>Created:</strong> {new Date(profile.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Last Updated:</strong> {new Date(profile.updated_at).toLocaleString()}
              </div>
              <div>
                <strong>Profile ID:</strong> <code>{profile.id}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </EnhancedPageLayout>
  )
}