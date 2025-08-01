"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Mail, MessageSquare, Link, FileEdit, ShoppingCart, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { profilesApi } from "@/lib/profiles-api"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface ProfileEvent {
  id: number
  type:
    | "message_sent"
    | "message_received"
    | "link_hit"
    | "data_updated"
    | "conversion_tracked"
    | "order_placed"
    | "subscription"
    | "appointment_confirmed"
  timestamp: Date
  details: string
}

interface ProfilePageProps {
  profileId: string
  onBack: () => void
  onSave?: () => void
  saveCallback?: () => void
  onSaveError?: () => void
  triggerSave?: boolean
  isHeaderless?: boolean
}

const getEventIcon = (type: ProfileEvent["type"]) => {
  switch (type) {
    case "message_sent":
    case "message_received":
      return <MessageSquare className="h-4 w-4" />
    case "link_hit":
      return <Link className="h-4 w-4" />
    case "data_updated":
      return <FileEdit className="h-4 w-4" />
    case "conversion_tracked":
    case "order_placed":
      return <ShoppingCart className="h-4 w-4" />
    case "subscription":
      return <Mail className="h-4 w-4" />
    case "appointment_confirmed":
      return <Calendar className="h-4 w-4" />
    default:
      return null
  }
}

export default function ProfilePage({
  profileId,
  onBack,
  onSave,
  saveCallback,
  onSaveError,
  triggerSave = false,
  isHeaderless = false,
}: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null)
  const [editedProfile, setEditedProfile] = useState<any>(null)
  const [expandedEvents, setExpandedEvents] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<ProfileEvent[]>([])
  const [saving, setSaving] = useState(false)
  const [customFieldsSchema, setCustomFieldsSchema] = useState<Record<string, any>>({})
  const [loadingSchema, setLoadingSchema] = useState(true)

  // Fetch custom fields schema
  useEffect(() => {
    async function fetchCustomFieldsSchema() {
      try {
        setLoadingSchema(true)
        const { data: schema, error } = await profilesApi.getCustomFieldsSchema()

        if (error) {
          console.error("Error fetching custom fields schema:", error)
        } else {
          console.log("Custom fields schema loaded:", schema)
          setCustomFieldsSchema(schema || {})
        }
      } catch (err) {
        console.error("Exception fetching custom fields schema:", err)
      } finally {
        setLoadingSchema(false)
      }
    }

    fetchCustomFieldsSchema()
  }, [])

  // Fetch profile data from the database
  useEffect(() => {
    async function fetchProfileData() {
      if (!profileId) return

      setLoading(true)
      setError(null)

      try {
        console.log(`Fetching profile with ID: ${profileId}`)
        const { data, error } = await profilesApi.getProfile(profileId)

        if (error) {
          console.error("Error fetching profile:", error)
          setError(`Failed to load profile: ${error}`)
          return
        }

        if (!data) {
          console.error("No profile data returned")
          setError("Profile not found")
          return
        }

        console.log("Profile data loaded:", data)

        // Ensure all custom fields from schema are present in the profile
        const completeCustomFields = { ...data.custom_fields }

        // Add any missing custom fields from the schema with default values
        Object.keys(customFieldsSchema).forEach((fieldKey) => {
          if (!(fieldKey in completeCustomFields)) {
            const fieldSchema = customFieldsSchema[fieldKey]
            completeCustomFields[fieldKey] =
              fieldSchema.defaultValue ||
              (fieldSchema.type === "number" ? 0 : fieldSchema.type === "boolean" ? false : "")
          }
        })

        // Update the profile with complete custom fields
        const completeProfile = {
          ...data,
          custom_fields: completeCustomFields,
        }

        setProfile(completeProfile)
      } catch (err) {
        console.error("Exception fetching profile:", err)
        setError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch profile data after schema is loaded
    if (!loadingSchema) {
      fetchProfileData()
    }
  }, [profileId, customFieldsSchema, loadingSchema])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    if (triggerSave && editedProfile) {
      handleSave()
    }
  }, [triggerSave])

  const toggleEventExpansion = (eventId: number) => {
    setExpandedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedProfile((prev: any) => ({ ...(prev || profile), [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setEditedProfile((prev: any) => ({ ...(prev || profile), [name]: value }))
  }

  const handleToggleChange = (name: string, checked: boolean) => {
    setEditedProfile((prev: any) => {
      const newProfile = { ...(prev || profile) }

      // Handle notification preferences from the database column
      if (name.startsWith("marketing_") || name.startsWith("transactional_")) {
        const currentPrefs = newProfile.notification_preferences || {}
        currentPrefs[name] = checked
        newProfile.notification_preferences = currentPrefs
      } else {
        newProfile[name] = checked
      }

      return newProfile
    })
  }

  const handleCustomFieldChange = (fieldKey: string, value: any) => {
    setEditedProfile((prev: any) => {
      const newProfile = { ...(prev || profile) }
      const currentCustomFields = newProfile.custom_fields || {}

      newProfile.custom_fields = {
        ...currentCustomFields,
        [fieldKey]: value,
      }

      return newProfile
    })
  }

  const handleSave = async () => {
    if (!profile || !editedProfile) return

    setSaving(true)
    try {
      // Ensure notification_preferences is properly structured
      const profileToSave = {
        ...editedProfile,
        notification_preferences: editedProfile.notification_preferences || {},
      }

      const { error } = await profilesApi.updateProfile(profile.id, profileToSave)

      if (error) {
        toast({
          title: "Error saving profile",
          description: error,
          variant: "destructive",
        })
        if (onSaveError) onSaveError()
        return
      }

      toast({
        title: "Profile updated",
        description: "The profile has been successfully updated.",
      })

      // Update the current profile with the edited values
      setProfile(profileToSave)
      setEditedProfile(null)

      // Call the onSave callback if provided
      if (onSave) onSave()

      // Call the saveCallback if provided
      if (saveCallback) saveCallback()
    } catch (err) {
      toast({
        title: "Error saving profile",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
      if (onSaveError) onSaveError()
    } finally {
      setSaving(false)
    }
  }

  // Show loading state
  if (loading || loadingSchema) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Back to Profiles
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show not found state
  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
              <p className="text-gray-600 mb-4">The profile with ID "{profileId}" could not be found.</p>
              <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Back to Profiles
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentProfile = editedProfile || profile

  return (
    <div className="space-y-6">
      {!isHeaderless && (
        <div className="flex items-center justify-between">
          <div>
            <button onClick={onBack} className="text-blue-600 hover:text-blue-800 mb-2">
              ← Back to Profiles
            </button>
            <h1 className="text-2xl font-bold">
              {currentProfile.first_name} {currentProfile.last_name}
            </h1>
          </div>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium text-foreground">Contact Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={currentProfile.first_name || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={currentProfile.last_name || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={currentProfile.email || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={currentProfile.phone || ""} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" name="mobile" value={currentProfile.mobile || ""} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={typeof currentProfile.country === "string" ? currentProfile.country : ""}
                  onValueChange={(value) => handleSelectChange("country", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="New Zealand">New Zealand</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={typeof currentProfile.timezone === "string" ? currentProfile.timezone : ""}
                  onValueChange={(value) => handleSelectChange("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                    <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                    <SelectItem value="America/Denver">America/Denver (MST/MDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                    <SelectItem value="America/Toronto">America/Toronto</SelectItem>
                    <SelectItem value="America/Vancouver">America/Vancouver</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Berlin">Europe/Berlin (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Rome">Europe/Rome (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Asia/Shanghai (CST)</SelectItem>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                    <SelectItem value="Australia/Melbourne">Australia/Melbourne (AEST/AEDT)</SelectItem>
                    <SelectItem value="Australia/Brisbane">Australia/Brisbane (AEST)</SelectItem>
                    <SelectItem value="Australia/Perth">Australia/Perth (AWST)</SelectItem>
                    <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language_preferences">Language Preferences</Label>
                <Select
                  value={
                    typeof currentProfile.language_preferences === "string" ? currentProfile.language_preferences : ""
                  }
                  onValueChange={(value) => handleSelectChange("language_preferences", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="en-AU">English (Australia)</SelectItem>
                    <SelectItem value="en-CA">English (Canada)</SelectItem>
                    <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                    <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                    <SelectItem value="fr-FR">French (France)</SelectItem>
                    <SelectItem value="fr-CA">French (Canada)</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                    <SelectItem value="it-IT">Italian</SelectItem>
                    <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                    <SelectItem value="pt-PT">Portuguese (Portugal)</SelectItem>
                    <SelectItem value="nl-NL">Dutch</SelectItem>
                    <SelectItem value="sv-SE">Swedish</SelectItem>
                    <SelectItem value="da-DK">Danish</SelectItem>
                    <SelectItem value="no-NO">Norwegian</SelectItem>
                    <SelectItem value="fi-FI">Finnish</SelectItem>
                    <SelectItem value="ru-RU">Russian</SelectItem>
                    <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                    <SelectItem value="zh-TW">Chinese (Traditional)</SelectItem>
                    <SelectItem value="ja-JP">Japanese</SelectItem>
                    <SelectItem value="ko-KR">Korean</SelectItem>
                    <SelectItem value="ar-SA">Arabic</SelectItem>
                    <SelectItem value="hi-IN">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device">Device</Label>
                <Input
                  id="device"
                  name="device"
                  value={currentProfile.device || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. iPhone, Desktop"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="os">Operating System</Label>
                <Select
                  value={typeof currentProfile.os === "string" ? currentProfile.os : ""}
                  onValueChange={(value) => handleSelectChange("os", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operating system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Windows 11">Windows 11</SelectItem>
                    <SelectItem value="Windows 10">Windows 10</SelectItem>
                    <SelectItem value="Windows 8.1">Windows 8.1</SelectItem>
                    <SelectItem value="macOS Sonoma">macOS Sonoma</SelectItem>
                    <SelectItem value="macOS Ventura">macOS Ventura</SelectItem>
                    <SelectItem value="macOS Monterey">macOS Monterey</SelectItem>
                    <SelectItem value="macOS Big Sur">macOS Big Sur</SelectItem>
                    <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                    <SelectItem value="Linux">Linux</SelectItem>
                    <SelectItem value="CentOS">CentOS</SelectItem>
                    <SelectItem value="Debian">Debian</SelectItem>
                    <SelectItem value="iOS 17">iOS 17</SelectItem>
                    <SelectItem value="iOS 16">iOS 16</SelectItem>
                    <SelectItem value="iOS 15">iOS 15</SelectItem>
                    <SelectItem value="Android 14">Android 14</SelectItem>
                    <SelectItem value="Android 13">Android 13</SelectItem>
                    <SelectItem value="Android 12">Android 12</SelectItem>
                    <SelectItem value="Android 11">Android 11</SelectItem>
                    <SelectItem value="Chrome OS">Chrome OS</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={currentProfile.location || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. Melbourne, VIC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={typeof currentProfile.source === "string" ? currentProfile.source : ""}
                  onValueChange={(value) => handleSelectChange("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Landing Page">Landing Page</SelectItem>
                    <SelectItem value="Contact Form">Contact Form</SelectItem>
                    <SelectItem value="Newsletter Signup">Newsletter Signup</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
                    <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                    <SelectItem value="Instagram Ads">Instagram Ads</SelectItem>
                    <SelectItem value="LinkedIn Ads">LinkedIn Ads</SelectItem>
                    <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                    <SelectItem value="SMS Campaign">SMS Campaign</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Word of Mouth">Word of Mouth</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                    <SelectItem value="Trade Show">Trade Show</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Print Ad">Print Ad</SelectItem>
                    <SelectItem value="Radio">Radio</SelectItem>
                    <SelectItem value="TV">TV</SelectItem>
                    <SelectItem value="Podcast">Podcast</SelectItem>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="SEO">SEO</SelectItem>
                    <SelectItem value="Direct Mail">Direct Mail</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Cold Email">Cold Email</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Affiliate">Affiliate</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Textarea
                  id="tags"
                  name="tags"
                  value={
                    Array.isArray(currentProfile.tags)
                      ? currentProfile.tags.join(", ")
                      : typeof currentProfile.tags === "string"
                        ? currentProfile.tags
                        : ""
                  }
                  onChange={handleInputChange}
                  placeholder="e.g. VIP, High Value, New Customer"
                />
                <p className="text-xs text-gray-500">Separate tags with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifetime_value">Lifetime Value</Label>
                <Input
                  id="lifetime_value"
                  name="lifetime_value"
                  type="number"
                  value={currentProfile.lifetime_value || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. 1250.00"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="status">Status</Label>
                <div className="w-[180px]">
                  <Select
                    value={typeof currentProfile.status === "string" ? currentProfile.status : "Active"}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium text-foreground">Custom Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(customFieldsSchema).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(customFieldsSchema).map(([key, fieldSchema]) => {
                  const currentValue = currentProfile.custom_fields?.[key] ?? fieldSchema.defaultValue ?? ""

                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`custom_${key}`}>
                        {fieldSchema.label || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Label>

                      {fieldSchema.type === "number" ? (
                        <Input
                          id={`custom_${key}`}
                          type="number"
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(key, Number.parseFloat(e.target.value) || 0)}
                          placeholder={fieldSchema.description || `Enter ${fieldSchema.label || key}`}
                        />
                      ) : fieldSchema.type === "boolean" ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`custom_${key}`}
                            checked={Boolean(currentValue)}
                            onCheckedChange={(checked) => handleCustomFieldChange(key, checked)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <Label htmlFor={`custom_${key}`} className="text-sm text-gray-600">
                            {fieldSchema.description || `Enable ${fieldSchema.label || key}`}
                          </Label>
                        </div>
                      ) : fieldSchema.type === "textarea" ? (
                        <Textarea
                          id={`custom_${key}`}
                          value={String(currentValue)}
                          onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                          placeholder={fieldSchema.description || `Enter ${fieldSchema.label || key}`}
                          rows={4}
                        />
                      ) : (
                        <Input
                          id={`custom_${key}`}
                          value={String(currentValue)}
                          onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                          placeholder={fieldSchema.description || `Enter ${fieldSchema.label || key}`}
                        />
                      )}

                      {fieldSchema.description && <p className="text-xs text-gray-500">{fieldSchema.description}</p>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No custom fields have been created yet.</p>
                <p className="text-sm mt-2">Go to Properties to create custom fields that will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium text-foreground">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-foreground uppercase tracking-wider border-b pb-2">
                  Marketing Communications
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing_emails">Marketing Emails</Label>
                      <p className="text-xs text-gray-500">Promotional emails, newsletters, and offers</p>
                    </div>
                    <Switch
                      id="marketing_emails"
                      checked={currentProfile.notification_preferences?.marketing_emails || false}
                      onCheckedChange={(checked) => handleToggleChange("marketing_emails", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing_sms">Marketing SMS</Label>
                      <p className="text-xs text-gray-500">Promotional text messages and alerts</p>
                    </div>
                    <Switch
                      id="marketing_sms"
                      checked={currentProfile.notification_preferences?.marketing_sms || false}
                      onCheckedChange={(checked) => handleToggleChange("marketing_sms", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing_whatsapp">Marketing WhatsApp</Label>
                      <p className="text-xs text-gray-500">Promotional messages via WhatsApp</p>
                    </div>
                    <Switch
                      id="marketing_whatsapp"
                      checked={currentProfile.notification_preferences?.marketing_whatsapp || false}
                      onCheckedChange={(checked) => handleToggleChange("marketing_whatsapp", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing_rcs">Marketing RCS</Label>
                      <p className="text-xs text-gray-500">Rich messaging with media and interactive elements</p>
                    </div>
                    <Switch
                      id="marketing_rcs"
                      checked={currentProfile.notification_preferences?.marketing_rcs || false}
                      onCheckedChange={(checked) => handleToggleChange("marketing_rcs", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-foreground uppercase tracking-wider border-b pb-2">
                  Transactional Communications
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transactional_emails">Transactional Emails</Label>
                      <p className="text-xs text-gray-500">Order confirmations, receipts, and account updates</p>
                    </div>
                    <Switch
                      id="transactional_emails"
                      checked={currentProfile.notification_preferences?.transactional_emails !== false}
                      onCheckedChange={(checked) => handleToggleChange("transactional_emails", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transactional_sms">Transactional SMS</Label>
                      <p className="text-xs text-gray-500">Order updates and important account notifications</p>
                    </div>
                    <Switch
                      id="transactional_sms"
                      checked={currentProfile.notification_preferences?.transactional_sms !== false}
                      onCheckedChange={(checked) => handleToggleChange("transactional_sms", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transactional_whatsapp">Transactional WhatsApp</Label>
                      <p className="text-xs text-gray-500">Order and service updates via WhatsApp</p>
                    </div>
                    <Switch
                      id="transactional_whatsapp"
                      checked={currentProfile.notification_preferences?.transactional_whatsapp !== false}
                      onCheckedChange={(checked) => handleToggleChange("transactional_whatsapp", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transactional_rcs">Transactional RCS</Label>
                      <p className="text-xs text-gray-500">Rich transactional messages with interactive elements</p>
                    </div>
                    <Switch
                      id="transactional_rcs"
                      checked={currentProfile.notification_preferences?.transactional_rcs !== false}
                      onCheckedChange={(checked) => handleToggleChange("transactional_rcs", checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium text-foreground">Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Profile Timeline */}
              <div className="space-y-3">
                {currentProfile.updated_at && (
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
                    <FileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile Updated</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(parseISO(currentProfile.updated_at), "PPp")}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Contact information was modified</p>
                    </div>
                  </div>
                )}

                {currentProfile.created_at && (
                  <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400 dark:border-green-500">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile Created</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(parseISO(currentProfile.created_at), "PPp")}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Contact was added to the system</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Placeholder for future activity events */}
              <div className="border-t pt-4">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm">Additional activity events will appear here</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Messages, interactions, and other events will be tracked
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
