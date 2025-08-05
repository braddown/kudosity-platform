"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCDPContacts, useCDPProfiles } from '@/lib/hooks'
import type { Contact, ContactReviewQueue, BatchProcessingResult } from '@/lib/types/cdp-types'

interface CDPContactProcessorProps {
  onContactProcessed?: (result: any) => void
  onError?: (error: string) => void
}

/**
 * CDPContactProcessor - Manages contact ingestion and processing
 * 
 * This component provides interfaces for:
 * - Manual contact entry
 * - Batch processing of pending contacts
 * - Review queue management
 * - Processing statistics and monitoring
 */
export default function CDPContactProcessor({
  onContactProcessed,
  onError
}: CDPContactProcessorProps) {
  const [activeTab, setActiveTab] = useState('create')
  const [processing, setProcessing] = useState(false)
  const [processingStats, setProcessingStats] = useState<any>(null)
  const [reviewQueue, setReviewQueue] = useState<ContactReviewQueue[]>([])

  // CDP Hooks
  const { 
    contacts,
    loading: contactsLoading,
    createContact,
    processContact,
    processBatch,
    getReviewQueue,
    getProcessingStats,
    resolveReview,
    refetch: refetchContacts
  } = useCDPContacts({
    filters: { processing_status: 'pending' }
  })

  const {
    profiles,
    processContact: processContactViaCDP
  } = useCDPProfiles()

  // Form state for manual contact creation
  const [newContact, setNewContact] = useState({
    mobile: '',
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    job_title: '',
    source: 'manual_entry' as const,
    source_details: {},
    raw_data: {}
  })

  // Load processing stats and review queue
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stats, queue] = await Promise.all([
          getProcessingStats(),
          getReviewQueue()
        ])
        setProcessingStats(stats)
        setReviewQueue(queue)
      } catch (error) {
        console.error('Error loading processor data:', error)
      }
    }
    
    loadData()
  }, [getProcessingStats, getReviewQueue])

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setNewContact(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Create and process new contact
  const handleCreateContact = async () => {
    if (!newContact.mobile) {
      onError?.('Mobile number is required')
      return
    }

    try {
      setProcessing(true)
      
      // Create the contact record
      const contact = await createContact(newContact)
      
      // Process it through the CDP system
      const result = await processContact(contact.id)
      
      // Reset form
      setNewContact({
        mobile: '',
        email: '',
        first_name: '',
        last_name: '',
        company: '',
        job_title: '',
        source: 'manual_entry',
        source_details: {},
        raw_data: {}
      })

      onContactProcessed?.(result)
      
      // Refresh data
      await refetchContacts()
      const newStats = await getProcessingStats()
      setProcessingStats(newStats)
      
    } catch (error) {
      console.error('Error creating contact:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to create contact')
    } finally {
      setProcessing(false)
    }
  }

  // Process batch of pending contacts
  const handleProcessBatch = async (batchSize: number = 50) => {
    try {
      setProcessing(true)
      const result = await processBatch(batchSize)
      
      onContactProcessed?.(result)
      
      // Refresh data
      await refetchContacts()
      const newStats = await getProcessingStats()
      setProcessingStats(newStats)
      
    } catch (error) {
      console.error('Error processing batch:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to process batch')
    } finally {
      setProcessing(false)
    }
  }

  // Resolve review queue item
  const handleResolveReview = async (reviewId: string, action: string, profileId?: string) => {
    try {
      await resolveReview(reviewId, {
        action,
        profile_id: profileId,
        resolved_by: 'current_user', // TODO: Get from auth context
        resolved_at: new Date().toISOString()
      })
      
      // Refresh review queue
      const newQueue = await getReviewQueue()
      setReviewQueue(newQueue)
      
    } catch (error) {
      console.error('Error resolving review:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to resolve review')
    }
  }

  return (
    <div className="space-y-6">
      {/* Processing Statistics Dashboard */}
      {processingStats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{processingStats.total}</div>
              <p className="text-xs text-muted-foreground">Total Contacts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{processingStats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{processingStats.processing}</div>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{processingStats.matched}</div>
              <p className="text-xs text-muted-foreground">Matched</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{processingStats.needs_review}</div>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{processingStats.failed}</div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Interface Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Contact</TabsTrigger>
          <TabsTrigger value="batch">Batch Process</TabsTrigger>
          <TabsTrigger value="review">
            Review Queue ({reviewQueue.length})
          </TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        {/* Create Contact Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Contact</CardTitle>
              <CardDescription>
                Add a new contact that will be automatically processed through the CDP system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    value={newContact.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="+61412345678"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={newContact.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={newContact.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newContact.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={newContact.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="Marketing Manager"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateContact} 
                disabled={processing || !newContact.mobile}
                className="w-full"
              >
                {processing ? 'Creating & Processing...' : 'Create Contact'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Processing Tab */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Processing</CardTitle>
              <CardDescription>
                Process multiple pending contacts at once through the CDP matching system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {processingStats && processingStats.pending > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      There are {processingStats.pending} contacts pending processing.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={() => handleProcessBatch(25)}
                      disabled={processing}
                      variant="outline"
                    >
                      Process 25
                    </Button>
                    <Button 
                      onClick={() => handleProcessBatch(50)}
                      disabled={processing}
                    >
                      Process 50
                    </Button>
                    <Button 
                      onClick={() => handleProcessBatch(100)}
                      disabled={processing}
                      variant="outline"
                    >
                      Process 100
                    </Button>
                  </div>
                  
                  {processing && (
                    <div className="space-y-2">
                      <p className="text-sm">Processing contacts...</p>
                      <Progress value={undefined} />
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No pending contacts to process.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Queue Tab */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>
                Contacts requiring manual review due to low confidence matches or conflicts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewQueue.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No items in the review queue. All contacts have been processed automatically.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {reviewQueue.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.review_type.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'outline'}>
                          {item.priority}
                        </Badge>
                      </div>
                      
                      {item.potential_matches && item.potential_matches.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Potential Matches:</p>
                          {item.potential_matches.map((match: any, index: number) => (
                            <div key={index} className="bg-muted p-2 rounded text-sm">
                              <p>Profile ID: {match.profile_id}</p>
                              <p>Score: {Math.round(match.score * 100)}%</p>
                              <p>Reasons: {match.reasons?.join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveReview(item.id, 'create_new_profile')}
                        >
                          Create New Profile
                        </Button>
                        {item.potential_matches && item.potential_matches.length > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleResolveReview(
                              item.id, 
                              'assign_profile', 
                              item.potential_matches[0].profile_id
                            )}
                          >
                            Assign to Best Match
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleResolveReview(item.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle>Processing Monitor</CardTitle>
              <CardDescription>
                Real-time view of contact processing pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <p>Loading contacts...</p>
              ) : (
                <div className="space-y-4">
                  {contacts.slice(0, 10).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {contact.mobile} • {contact.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{contact.source}</Badge>
                        <Badge variant={contact.processing_status === 'matched' ? 'default' : 'secondary'}>
                          {contact.processing_status}
                        </Badge>
                        {contact.match_confidence && (
                          <Badge variant="outline">
                            {Math.round(contact.match_confidence * 100)}%
                          </Badge>
                        )}
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