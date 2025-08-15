"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContactPropertiesForm } from "./features/profiles/ContactPropertiesForm"
import { CustomFieldsSection } from "./features/profiles/CustomFieldsSection"
import { NotificationPreferences } from "./features/profiles/NotificationPreferences"
import { ProfileActivityTimeline } from "./features/profiles/ProfileActivityTimeline"
import type { CDPProfile } from "@/lib/types/cdp-types"

interface NewProfileFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
  onClose?: () => void
  onSave?: (data: any) => void
  onSaveError?: () => void
}

export default function NewProfileForm({ onSubmit, onCancel, onClose, onSave, onSaveError }: NewProfileFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Initialize with a new empty profile
  const [editedProfile, setEditedProfile] = useState<Partial<CDPProfile>>({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    company: "",
    job_title: "",
    address: "",
    city: "",
    state_province: "",
    zip_postal_code: "",
    country: "",
    notes: "",
    status: "active",
    source: "Manual Entry",
    notification_preferences: {
      email_marketing: true,
      email_transactional: true,
      sms_marketing: true,
      sms_transactional: true,
      whatsapp_marketing: true,
      whatsapp_transactional: true,
      rcs_marketing: true,
      rcs_transactional: true,
    },
    custom_fields: {},
  })

  const handleInputChange = useCallback((field: string, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
  }, [])

  const handleSelectChange = useCallback((field: string, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
  }, [])

  const handleToggleChange = useCallback((field: string, checked: boolean) => {
    setEditedProfile(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: checked
      }
    }))
    setHasChanges(true)
  }, [])

  const handleCustomFieldChange = useCallback((key: string, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [key]: value
      }
    }))
    setHasChanges(true)
  }, [])

  const handleStatusChange = useCallback((newStatus: string) => {
    setEditedProfile(prev => {
      const updated = {
        ...prev,
        status: newStatus
      }

      // If status is changed to deleted, ensure all notification preferences are turned off
      if (newStatus === 'deleted') {
        updated.notification_preferences = {
          email_marketing: false,
          email_transactional: false,
          sms_marketing: false,
          sms_transactional: false,
          whatsapp_marketing: false,
          whatsapp_transactional: false,
          rcs_marketing: false,
          rcs_transactional: false,
        }
      }

      return updated
    })
    setHasChanges(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Validate required fields
      if (!editedProfile.first_name && !editedProfile.last_name && !editedProfile.mobile) {
        toast.error("Please provide at least a name or mobile number")
        setSaving(false)
        return
      }

      const response = await fetch('/api/cdp-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create profile')
      }

      const newProfile = await response.json()
      
      toast.success("Profile created successfully!")
      
      // Navigate to the edit page for the new profile
      setTimeout(() => {
        router.push(`/profiles/edit/${newProfile.id}`)
      }, 500)
      
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error(error instanceof Error ? error.message : "Failed to create profile")
      if (onSaveError) onSaveError()
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    router.push('/profiles')
  }

  // Get display name for header
  const profileName = editedProfile.first_name || editedProfile.last_name 
    ? `${editedProfile.first_name || ''} ${editedProfile.last_name || ''}`.trim()
    : editedProfile.mobile || 'New Profile'

  return (
    <div className="relative h-full">
      {/* Fixed header with actions */}
      <div className="fixed top-16 left-64 right-0 z-50 bg-background px-6 py-4 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">New Profile: {profileName}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={editedProfile.status || 'active'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      <span>Inactive</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deleted">
                    <div className="flex items-center gap-2">
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
              onClick={handleBack}
              variant="ghost"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="pt-20 px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Profile details (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <ContactPropertiesForm
              profile={editedProfile as CDPProfile}
              editedProfile={editedProfile as CDPProfile}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
            />
            
            <CustomFieldsSection
              profile={editedProfile as CDPProfile}
              editedProfile={editedProfile as CDPProfile}
              customFieldsSchema={[]} // Empty for new profiles
              handleCustomFieldChange={handleCustomFieldChange}
            />
            
            <NotificationPreferences
              profile={editedProfile as CDPProfile}
              editedProfile={editedProfile as CDPProfile}
              handleToggleChange={handleToggleChange}
            />
          </div>

          {/* Right column - Activity timeline (1/3 width) */}
          <div className="lg:col-span-1">
            <ProfileActivityTimeline 
              profileId={null} // No ID yet for new profiles
              refreshTrigger={0}
              isNewProfile={true}
            />
          </div>
        </div>
      </div>

      {/* Hidden submit button for form submission */}
      <button
        id="save-profile-form"
        type="button"
        onClick={handleSave}
        className="hidden"
      />
    </div>
  )
}