"use client"

import React, { useState, useCallback, useEffect } from "react"
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
import { profilesApi } from "@/lib/api/profiles-api"
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
  const [customFieldsSchema, setCustomFieldsSchema] = useState<Record<string, any>>({})
  const [loadingSchema, setLoadingSchema] = useState(true)
  
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
    status: "pending",
    source: "Manual Entry",
    notification_preferences: {
      marketing_emails: false,
      transactional_emails: false,
      marketing_sms: false,
      transactional_sms: false,
      marketing_whatsapp: false,
      transactional_whatsapp: false,
      marketing_rcs: false,
      transactional_rcs: false,
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

  // Fetch custom fields schema
  useEffect(() => {
    const fetchCustomFieldsSchema = async () => {
      try {
        setLoadingSchema(true)
        const { data: schema, error } = await profilesApi.getCustomFieldsSchema()
        
        if (error) {
          console.error('Error fetching custom fields schema:', error)
          toast.error('Failed to load custom fields')
        } else {
          setCustomFieldsSchema(schema || {})
          
          // Initialize custom fields with defaults
          const defaultCustomFields: Record<string, any> = {}
          Object.entries(schema || {}).forEach(([key, fieldSchema]: [string, any]) => {
            defaultCustomFields[key] = fieldSchema.defaultValue || 
              (fieldSchema.type === 'number' ? 0 : 
               fieldSchema.type === 'boolean' ? false : '')
          })
          
          setEditedProfile(prev => ({
            ...prev,
            custom_fields: defaultCustomFields
          }))
        }
      } catch (error) {
        console.error('Error fetching custom fields schema:', error)
        toast.error('Failed to load custom fields')
      } finally {
        setLoadingSchema(false)
      }
    }
    
    fetchCustomFieldsSchema()
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
          marketing_emails: false,
          transactional_emails: false,
          marketing_sms: false,
          transactional_sms: false,
          marketing_whatsapp: false,
          transactional_whatsapp: false,
          marketing_rcs: false,
          transactional_rcs: false,
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

      const result = await response.json()
      const newProfile = result.data
      
      // Log the profile creation activity
      try {
        await fetch('/api/user-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activity_type: 'profile_created',
            description: `Created profile: ${newProfile.first_name || ''} ${newProfile.last_name || ''} ${newProfile.mobile || ''}`.trim(),
            entity_type: 'profile',
            entity_id: newProfile.id,
            metadata: {
              profile_id: newProfile.id,
              profile_name: `${newProfile.first_name || ''} ${newProfile.last_name || ''}`.trim() || newProfile.mobile
            }
          }),
        })
      } catch (activityError) {
        console.error('Failed to log activity:', activityError)
        // Don't fail the whole operation if activity logging fails
      }
      
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Profile details */}
          <div className="space-y-6">
            <ContactPropertiesForm
              profile={editedProfile as CDPProfile}
              editedProfile={editedProfile as CDPProfile}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
            />
            
            <NotificationPreferences
              profile={editedProfile as CDPProfile}
              onToggleChange={handleToggleChange}
            />
          </div>

          {/* Right column - Custom fields and Activity timeline */}
          <div className="space-y-6">
            <CustomFieldsSection
              profile={editedProfile as CDPProfile}
              editedProfile={editedProfile as CDPProfile}
              customFieldsSchema={customFieldsSchema}
              handleCustomFieldChange={handleCustomFieldChange}
            />
            
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