"use client"

import React, { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCDPProfiles, useCDPContacts } from "@/lib/hooks"
import { ProfileHeader } from "./ProfileHeader"
import { ContactPropertiesForm } from "./ContactPropertiesForm"
import { CustomFieldsSection } from "./CustomFieldsSection"
import { NotificationPreferences } from "./NotificationPreferences"
import { ProfileActivityTimeline } from "./ProfileActivityTimeline"
import type { Profile, Contact, ContactReviewQueue } from "@/lib/types/cdp-types"

interface CDPProfilePageProps {
  profileId: string
  onBack: () => void
  onSave?: () => void
  onSaveError?: () => void
  isHeaderless?: boolean
}

/**
 * CDPProfilePage - Enhanced profile page using the new CDP architecture
 * 
 * This component leverages the new Customer Data Platform with:
 * - Intelligent profile matching and deduplication
 * - Contact processing and review queue
 * - Enhanced activity tracking
 * - Data quality scoring
 * 
 * @param profileId - ID of the CDP profile to edit
 * @param onBack - Callback for back navigation
 * @param onSave - Callback for successful save
 * @param onSaveError - Callback for save errors
 * @param isHeaderless - Whether to hide the header
 */
export default function CDPProfilePage({
  profileId,
  onBack,
  onSave,
  onSaveError,
  isHeaderless = false
}: CDPProfilePageProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({})
  const [saving, setSaving] = useState(false)

  // CDP Profile management
  const {
    profiles,
    loading: profilesLoading,
    error: profilesError,
    updateProfile,
    findPotentialDuplicates,
    mergeProfiles,
    processContact
  } = useCDPProfiles()

  // CDP Contacts management  
  const {
    contacts,
    loading: contactsLoading,
    getContact,
    getReviewQueue,
    resolveReview,
    getProcessingStats
  } = useCDPContacts({
    filters: { processing_status: 'needs_review' }
  })

  // Find current profile
  const profile = profiles.find(p => p.id === profileId)
  
  // State for additional data
  const [relatedContacts, setRelatedContacts] = useState<Contact[]>([])
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([])
  const [reviewQueue, setReviewQueue] = useState<ContactReviewQueue[]>([])
  const [processingStats, setProcessingStats] = useState<any>(null)

  // Load related data when profile is available
  useEffect(() => {
    if (!profile) return

    const loadRelatedData = async () => {
      try {
        // Find potential duplicates
        const duplicates = await findPotentialDuplicates(profile.id)
        setPotentialDuplicates(duplicates)

        // Get review queue items
        const queue = await getReviewQueue()
        setReviewQueue(queue)

        // Get processing statistics
        const stats = await getProcessingStats()
        setProcessingStats(stats)

        // Load contacts related to this profile (we'll need to create this query)
        // For now, we'll use the contacts from the hook
        const profileContacts = contacts.filter(c => c.profile_id === profile.id)
        setRelatedContacts(profileContacts)
      } catch (error) {
        console.error('Error loading related data:', error)
      }
    }

    loadRelatedData()
  }, [profile, findPotentialDuplicates, getReviewQueue, getProcessingStats])

  // Handle profile field changes
  const handleInputChange = (field: string, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle custom field changes
  const handleCustomFieldChange = (field: string, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [field]: value
      }
    }))
  }

  // Handle notification preference changes
  const handleNotificationChange = (field: string, value: boolean) => {
    setEditedProfile(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: value
      }
    }))
  }

  // Save profile changes
  const handleSave = async () => {
    if (!profile || Object.keys(editedProfile).length === 0) return

    try {
      setSaving(true)
      await updateProfile(profile.id, editedProfile)
      setEditedProfile({})
      onSave?.()
    } catch (error) {
      console.error('Error saving profile:', error)
      onSaveError?.()
    } finally {
      setSaving(false)
    }
  }

  // Handle profile merge
  const handleMergeProfile = async (sourceId: string, targetId: string) => {
    try {
      await mergeProfiles(sourceId, targetId)
      // Refresh duplicates list
      const duplicates = await findPotentialDuplicates(profile!.id)
      setPotentialDuplicates(duplicates)
    } catch (error) {
      console.error('Error merging profiles:', error)
    }
  }

  // Show loading state
  if (profilesLoading) {
    return <CDPProfilePageSkeleton isHeaderless={isHeaderless} />
  }

  // Show error state if profile couldn't be loaded
  if (profilesError || !profile) {
    return (
      <CDPProfilePageError
        error={profilesError || "Profile not found"}
        onBack={onBack}
        isHeaderless={isHeaderless}
      />
    )
  }

  // Merge edited changes with original profile
  const displayProfile = { ...profile, ...editedProfile }
  const hasChanges = Object.keys(editedProfile).length > 0

  // Get profile name for header
  const profileName = `${displayProfile.first_name || ''} ${displayProfile.last_name || ''}`.trim() || 'Unknown Profile'

  return (
    <div className="space-y-6">
      {/* Enhanced Header with CDP Info */}
      <div className="flex items-center justify-between">
        {!isHeaderless && (
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="text-blue-600 hover:text-blue-800">
              ← Back to Profiles
            </button>
            <div>
              <h1 className="text-2xl font-bold">{profileName}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={profile.merge_status === 'active' ? 'default' : 'secondary'}>
                  {profile.merge_status}
                </Badge>
                <Badge variant={profile.lifecycle_stage === 'customer' ? 'default' : 'outline'}>
                  {profile.lifecycle_stage}
                </Badge>
                {profile.data_quality_score && (
                  <Badge variant={profile.data_quality_score > 0.8 ? 'default' : 'outline'}>
                    Quality: {Math.round(profile.data_quality_score * 100)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {potentialDuplicates.length > 0 && (
            <Badge variant="destructive">
              {potentialDuplicates.length} Potential Duplicates
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Enhanced Tabs with CDP Features */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts ({relatedContacts.length})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="duplicates" disabled={potentialDuplicates.length === 0}>
            Duplicates ({potentialDuplicates.length})
          </TabsTrigger>
          <TabsTrigger value="review" disabled={reviewQueue.length === 0}>
            Review ({reviewQueue.length})
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab - Original functionality */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContactPropertiesForm
              profile={displayProfile}
              onInputChange={handleInputChange}
              onSelectChange={handleInputChange}
            />

            <CustomFieldsSection
              profile={displayProfile}
              customFieldsSchema={[]} // TODO: Load from CDP system
              onCustomFieldChange={handleCustomFieldChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <NotificationPreferences
              profile={displayProfile}
              onToggleChange={handleNotificationChange}  
            />

            <Card>
              <CardHeader>
                <CardTitle>Profile Insights</CardTitle>
                <CardDescription>Data quality and customer intelligence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Lead Score:</span>
                  <Badge>{profile.lead_score}/100</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Lifetime Value:</span>
                  <span>${profile.lifetime_value}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Quality:</span>
                  <Badge variant={profile.data_quality_score > 0.8 ? 'default' : 'outline'}>
                    {Math.round(profile.data_quality_score * 100)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Source:</span>
                  <Badge variant="outline">{profile.source}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab - New CDP feature */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Related Contacts</CardTitle>
              <CardDescription>Individual touchpoints that contributed to this profile</CardDescription>
            </CardHeader>
            <CardContent>
              {relatedContacts.length === 0 ? (
                <p className="text-muted-foreground">No contacts found for this profile.</p>
              ) : (
                <div className="space-y-4">
                  {relatedContacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                          <p className="text-sm text-muted-foreground">{contact.email} • {contact.mobile}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{contact.source}</Badge>
                          <Badge variant={contact.processing_status === 'matched' ? 'default' : 'secondary'}>
                            {contact.processing_status}
                          </Badge>
                        </div>
                      </div>
                      {contact.match_confidence && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Match Confidence: {Math.round(contact.match_confidence * 100)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab - Enhanced with CDP activities */}
        <TabsContent value="activity">
          <ProfileActivityTimeline profile={profile} />
        </TabsContent>

        {/* Duplicates Tab - New CDP feature */}
        <TabsContent value="duplicates">
          <Card>
            <CardHeader>
              <CardTitle>Potential Duplicates</CardTitle>
              <CardDescription>Profiles that might be the same person</CardDescription>
            </CardHeader>
            <CardContent>
              {potentialDuplicates.length === 0 ? (
                <p className="text-muted-foreground">No potential duplicates found.</p>
              ) : (
                <div className="space-y-4">
                  {potentialDuplicates.map((duplicate) => (
                    <div key={duplicate.profile_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Match Score: {Math.round(duplicate.score * 100)}%</p>
                          <p className="text-sm text-muted-foreground">
                            Reasons: {duplicate.reasons.join(', ')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMergeProfile(duplicate.profile_id, profile.id)}
                        >
                          Merge Profiles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab - New CDP feature */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>Items requiring manual review</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewQueue.length === 0 ? (
                <p className="text-muted-foreground">No items in review queue.</p>
              ) : (
                <div className="space-y-4">
                  {reviewQueue.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.review_type.replace('_', ' ')}</p>
                          <Badge variant={item.priority === 'high' ? 'destructive' : 'outline'}>
                            {item.priority}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveReview(item.id, { action: 'resolved' })}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Loading skeleton for CDP profile page
 */
function CDPProfilePageSkeleton({ isHeaderless }: { isHeaderless: boolean }) {
  return (
    <div className="space-y-6">
      {!isHeaderless && (
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-48" />
            <div className="flex space-x-2 mt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      <Skeleton className="h-12 w-full" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

/**
 * Error state for CDP profile page
 */
interface CDPProfilePageErrorProps {
  error: string
  onBack: () => void
  isHeaderless: boolean
}

function CDPProfilePageError({ error, onBack, isHeaderless }: CDPProfilePageErrorProps) {
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