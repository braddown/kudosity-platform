"use client"
import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormLayout, FormSection, FormField } from "@/components/ui/form-layout"
import { Plus, Minus } from "lucide-react"
import { SelectGroup, SelectLabel } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { segmentsApi, type Segment } from "@/lib/api/segments-api"
import { profilesApi } from "@/lib/api/profiles-api"
import PhonePreview from "../../PhonePreview"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type TemplateType = "standard" | "yes-no" | "multiple-choice" | "appointment" | "feedback"

interface Template {
  name: string
  content: string
  type: TemplateType
}

const initialTemplates: Template[] = [
  {
    name: "Winter Sale",
    content: "❄️ Winter Sale Alert! ❄️ Get 30% off all winter gear. Shop now at https://winterstore.com/sale",
    type: "standard",
  },
  {
    name: "My Biz Template VMN",
    content: "Thank you for choosing [Business Name]. For support, call our VMN: [VMN]. We're here to help!",
    type: "standard",
  },
  {
    name: "My Biz Custom Sender",
    content:
      "Hello [Firstname], this is a message from [Business Name]. Visit our website at https://www.mybusiness.com for the latest updates.",
    type: "standard",
  },
  {
    name: "My Biz Template",
    content:
      "Dear [Firstname], your appointment with [Business Name] is confirmed for [Date] at [Time]. Need to reschedule? Call us at [Phone].",
    type: "standard",
  },
  {
    name: "Product Launch",
    content: "🎉 Exciting news! Our new product is here. Be among the first to get it: https://newproduct.com/launch",
    type: "standard",
  },
  {
    name: "Customer Feedback",
    content:
      "Hi [Firstname], we value your opinion! Please take a moment to share your feedback: https://feedback.com/survey",
    type: "standard",
  },
  {
    name: "Event RSVP",
    content: "Hi [Firstname], can you attend our event on [Date] at [Time]? Please reply YES or NO to confirm.",
    type: "yes-no",
  },
  {
    name: "Appointment Confirmation",
    content:
      "Hi [Firstname], your appointment is scheduled for [Date] at [Time]. Can you make it? Reply YES to confirm or NO to reschedule.",
    type: "yes-no",
  },
]

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: () => void
  totalContacts: number
  selectedAudiences: string[]
  scheduleType: "immediate" | "scheduled"
  scheduledDate?: Date
  scheduledTime: string
}

function ConfirmationModal({
  isOpen,
  onClose,
  onSend,
  totalContacts,
  selectedAudiences,
  scheduleType,
  scheduledDate,
  scheduledTime,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Broadcast Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>You are about to send a broadcast message to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>{totalContacts.toLocaleString()} contacts</li>
            <li>
              Audiences:
              <ul className="list-disc list-inside ml-4">
                {selectedAudiences.map((audience) => (
                  <li key={audience}>{audience}</li>
                ))}
              </ul>
            </li>
            <li>
              {scheduleType === "immediate"
                ? "Send immediately"
                : `Scheduled for ${scheduledDate ? format(scheduledDate, "PPP") : "No date"} at ${scheduledTime}`}
            </li>
          </ul>
          <p>Are you sure you want to proceed?</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSend}>Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SplitMessage {
  id: number
  content: string
  delay: number
}

// Helper function to get nested values from an object
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Helper function to evaluate a single condition
const evaluateCondition = (profile: any, condition: any): boolean => {
  const { field, operator, value } = condition
  const fieldValue = getNestedValue(profile, field)
  
  // Handle null/undefined values
  if (fieldValue === null || fieldValue === undefined) {
    if (operator === 'is_empty' || operator === 'not_exists') return true
    if (operator === 'exists') return false
    if (operator === 'equals' && (value === '' || value === null)) return true
    return false
  }

  // Special handling for boolean fields
  if (typeof fieldValue === 'boolean') {
    // Convert the filter value to boolean for comparison
    let compareValue = value
    if (value === 'Yes' || value === 'yes' || value === 'true' || value === true || value === '1') {
      compareValue = true
    } else if (value === 'No' || value === 'no' || value === 'false' || value === false || value === '0') {
      compareValue = false
    }
    
    switch (operator) {
      case 'equals':
      case 'is':
        return fieldValue === compareValue
      case 'not_equals':
      case 'is not':
        return fieldValue !== compareValue
      default:
        return fieldValue === compareValue
    }
  }
  
  // Also handle when the field value is a string "true"/"false" but should be treated as boolean
  if (field.includes('is_') || field.includes('has_')) {
    const fieldStr = String(fieldValue).toLowerCase()
    const valueStr = String(value).toLowerCase()
    
    // Normalize boolean strings
    const normalizedField = (fieldStr === 'true' || fieldStr === 'yes' || fieldStr === '1') ? 'true' : 
                           (fieldStr === 'false' || fieldStr === 'no' || fieldStr === '0') ? 'false' : fieldStr
    const normalizedValue = (valueStr === 'true' || valueStr === 'yes' || valueStr === '1') ? 'true' : 
                           (valueStr === 'false' || valueStr === 'no' || valueStr === '0') ? 'false' : valueStr
    
    if (operator === 'equals' || operator === 'is') {
      return normalizedField === normalizedValue
    } else if (operator === 'not_equals' || operator === 'is not') {
      return normalizedField !== normalizedValue
    }
  }

  // Special handling for status field - always compare lowercase
  if (field === 'status') {
    const normalizedFieldValue = String(fieldValue).toLowerCase()
    const normalizedValue = String(value).toLowerCase()
    
    switch (operator) {
      case 'equals':
      case 'is':
        return normalizedFieldValue === normalizedValue
      case 'not_equals':
      case 'is not':
        return normalizedFieldValue !== normalizedValue
      case 'contains':
        return normalizedFieldValue.includes(normalizedValue)
      case 'not_contains':
        return !normalizedFieldValue.includes(normalizedValue)
      case 'starts_with':
        return normalizedFieldValue.startsWith(normalizedValue)
      case 'ends_with':
        return normalizedFieldValue.endsWith(normalizedValue)
      default:
        return false
    }
  }

  switch (operator) {
    case 'equals':
    case 'is':
      return String(fieldValue).toLowerCase() === String(value).toLowerCase()
    case 'not_equals':
    case 'is not':
      return String(fieldValue).toLowerCase() !== String(value).toLowerCase()
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
    case 'greater_than':
      return Number(fieldValue) > Number(value)
    case 'less_than':
      return Number(fieldValue) < Number(value)
    case 'exists':
      return true
    case 'not_exists':
    case 'is_empty':
      return false
    default:
      return false
  }
}

// Apply segment filter to profiles
const applySegmentFilter = (profiles: any[], filterCriteria: any): any[] => {
  if (!filterCriteria) return profiles
  
  // Check if there's an explicit status = 'Deleted' filter
  let hasDeletedFilter = false
  
  if (filterCriteria.filterGroups) {
    filterCriteria.filterGroups.forEach((group: any) => {
      group.conditions?.forEach((condition: any) => {
        if (condition.field === 'status' && 
            condition.operator === 'equals' && 
            condition.value?.toLowerCase() === 'deleted') {
          hasDeletedFilter = true
        }
      })
    })
  } else if (filterCriteria.conditions) {
    filterCriteria.conditions.forEach((condition: any) => {
      if (condition.field === 'status' && 
          condition.operator === 'equals' && 
          condition.value?.toLowerCase() === 'deleted') {
        hasDeletedFilter = true
      }
    })
  }
  
  // Start with profiles, excluding deleted unless explicitly filtered for
  // CDP profiles use status field
  let filtered = hasDeletedFilter 
    ? profiles 
    : profiles.filter(p => {
        const stage = (p.status || '').toLowerCase()
        return stage !== 'deleted'
      })
  
  // Apply filter groups or conditions
  if (filterCriteria.filterGroups && filterCriteria.filterGroups.length > 0) {
    filtered = filtered.filter(profile => {
      return filterCriteria.filterGroups.some((group: any) => {
        if (!group.conditions || group.conditions.length === 0) return true
        return group.conditions.every((condition: any) => 
          evaluateCondition(profile, condition)
        )
      })
    })
  } else if (filterCriteria.conditions && filterCriteria.conditions.length > 0) {
    filtered = filtered.filter(profile => {
      return filterCriteria.conditions.every((condition: any) => 
        evaluateCondition(profile, condition)
      )
    })
  }
  
  return filtered
}

const BroadcastMessage = forwardRef<{ save: () => Promise<void> }>((props, ref) => {
  const [message, setMessage] = useState(`Type your message here...

Opt-out reply STOP`)
  const [senderID, setSenderID] = useState("")
  const [trackLinks, setTrackLinks] = useState(false)
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([])
  const [templates, setTemplates] = useState(initialTemplates)
  const [isContentChanged, setIsContentChanged] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [senderIDs, setSenderIDs] = useState<Array<{ id: string; label: string; type: string }>>([])
  const [isLoadingSenders, setIsLoadingSenders] = useState(true)
  const [splitMessages, setSplitMessages] = useState<SplitMessage[]>([
    { id: 1, content: "Type your message here...", delay: 0 },
  ])
  const [templateType, setTemplateType] = useState<TemplateType>("standard")
  const [templateName, setTemplateName] = useState("")

  const [audiences, setAudiences] = useState<Segment[]>([])
  const [isLoadingAudiences, setIsLoadingAudiences] = useState(true)
  const [audienceCounts, setAudienceCounts] = useState<Record<string, number>>({})

  const [scheduleType, setScheduleType] = useState<"immediate" | "scheduled">("immediate")
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [scheduledTime, setScheduledTime] = useState("09:00")
  
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [campaignId, setCampaignId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      // Load segments
      setIsLoadingAudiences(true)
      try {
        const { data, error } = await segmentsApi.getSegments()
        if (error) {
          console.error("Error loading segments:", error)
          setAudiences([])
        } else {
          // Only use custom segments, no system segments (they return empty array now)
          setAudiences(data || [])
          
          // Calculate actual counts for each segment
          const counts: Record<string, number> = {}
          
          // Get all profiles once for filtering
          console.log('BroadcastMessage: Fetching all profiles for audience counts...')
          const { data: allProfiles } = await profilesApi.getProfiles()
          console.log(`BroadcastMessage: Received ${allProfiles?.length || 0} profiles from API`)
          
          for (const segment of data || []) {
            if (segment.filter_criteria && allProfiles) {
              // Apply the segment filter to get actual count
              const filteredProfiles = applySegmentFilter(allProfiles, segment.filter_criteria)
              // Only count profiles with mobile numbers
              const withMobile = filteredProfiles.filter(p => p.mobile || p.phone)
              counts[segment.name] = withMobile.length
              console.log(`Segment "${segment.name}": ${withMobile.length} profiles with mobile numbers`)
            } else {
              counts[segment.name] = 0
            }
          }
          setAudienceCounts(counts)
        }
      } catch (error) {
        console.error("Error loading segments:", error)
        setAudiences([])
      } finally {
        setIsLoadingAudiences(false)
      }

      // Load sender IDs from Kudosity
      setIsLoadingSenders(true)
      try {
        const response = await fetch('/api/kudosity/senders', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (response.ok && data.senders && data.senders.length > 0) {
          const formattedSenders = data.senders.map((sender: any) => ({
            id: sender.number,
            label: `${sender.number}${sender.type === 'ALPHANUMERIC' ? ' (Alphanumeric)' : ''}`,
            type: sender.type,
          }))
          setSenderIDs(formattedSenders)
          // Set default sender if available
          if (formattedSenders.length > 0) {
            setSenderID(formattedSenders[0].id)
          }
        } else if (data.error) {
          console.error("Sender ID error:", data.error)
          // Show the error to the user
          const { toast } = await import('@/components/ui/use-toast')
          toast({
            title: "Sender ID Configuration Error",
            description: data.error,
            variant: "destructive",
          })
        } else {
          console.error("Failed to fetch sender IDs:", response.status)
        }
      } catch (error) {
        console.error("Error loading sender IDs:", error)
      } finally {
        setIsLoadingSenders(false)
      }
    }

    loadData()
  }, [])

  useImperativeHandle(ref, () => ({
    save: async () => {
      console.log("Saving broadcast message...")
      return Promise.resolve()
    },
  }))

  const calculateSMSCount = (text: string) => {
    return Math.ceil(text.length / 160)
  }

  const insertPersonalization = (variable: string) => {
    const textarea = document.getElementById("message") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + variable + after
      setMessage(newText)
      setIsContentChanged(true)
      textarea.focus()
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length
      }, 0)
    }
  }

  const replaceWithTrackingLink = (text: string) => {
    if (!trackLinks) return text
    if (
      text ===
      `Type your message here...

Opt-out reply STOP`
    ) {
      return text
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, (url) => `tapth.is/${Math.random().toString(36).substr(2, 5)}`)
  }

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    const selectedTemplateObj = templates.find((template) => template.name === value)
    if (selectedTemplateObj) {
      setMessage(selectedTemplateObj.content)
      setTemplateType(selectedTemplateObj.type)
      setIsContentChanged(false)
    }
  }

  const handleSaveOrDelete = () => {
    if (selectedTemplate && !isContentChanged) {
      setTemplates(templates.filter((template) => template.name !== selectedTemplate))
      setSelectedTemplate("")
      setMessage("")
    } else if (templateName) {
      const newTemplate = { name: templateName, content: message, type: templateType }
      setTemplates([...templates, newTemplate])
      setSelectedTemplate(templateName)
      setIsContentChanged(false)
      setTemplateName("")
    } else {
      alert("Please enter a template name")
    }
  }

  const handleNext = () => {
    if (scheduleType === "scheduled" && (!scheduledDate || !scheduledTime)) {
      alert("Please select a date and time for scheduled message")
      return
    }
    setIsConfirmationModalOpen(true)
  }

  const handleSend = async () => {
    setIsConfirmationModalOpen(false)
    
    // Get recipients based on selected audiences from the database
    const recipients: string[] = []
    
    // Get all profiles once for filtering
    const { data: allProfiles } = await profilesApi.getProfiles()
    
    // Fetch contacts for each selected audience
    for (const audienceName of selectedAudiences) {
      // Find the segment by name
      const segment = audiences.find(s => s.name === audienceName)
      
      if (segment && segment.filter_criteria && allProfiles) {
        // Apply the segment filter to get the actual profiles
        const filteredProfiles = applySegmentFilter(allProfiles, segment.filter_criteria)
        console.log(`Filtered ${filteredProfiles.length} contacts for audience "${audienceName}"`)
        
        if (filteredProfiles.length > 0) {
          const mobileNumbers = filteredProfiles
            .map(profile => profile.mobile || profile.phone)
            .filter(Boolean)
          recipients.push(...mobileNumbers)
          console.log(`Found ${mobileNumbers.length} mobile numbers for audience "${audienceName}"`)
        }
      }
    }
    
    // Remove duplicates
    const uniqueRecipients = [...new Set(recipients)]
    
    if (uniqueRecipients.length === 0) {
      const { toast } = await import('@/components/ui/use-toast')
      toast({
        title: "No recipients",
        description: "No valid mobile numbers found in the selected audience",
        variant: "destructive",
      })
      return
    }
    
    // Clean up the message - remove placeholder text if it's still there
    const actualMessage = message === `Type your message here...

Opt-out reply STOP` ? 'Test message from Kudosity platform' : message
    
    // Show loading toast
    const { toast } = await import('@/components/ui/use-toast')
    
    toast({
      title: "Sending messages...",
      description: `Sending to ${uniqueRecipients.length} recipient(s)`,
    })
    
    console.log('Sending broadcast:', {
      recipients: uniqueRecipients,
      recipientCount: uniqueRecipients.length,
      message: actualMessage,
      sender: senderID,
      trackLinks,
      audiences: selectedAudiences
    })
    
    setIsSending(true)
    setSendProgress(0)
    
    try {
      // Use the new broadcast endpoint with retry logic and progress tracking
      const response = await fetch('/api/kudosity/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          campaignName: `Broadcast to ${selectedAudiences.join(', ')}`,
          recipients: uniqueRecipients,
          message: actualMessage,
          sender: senderID,
          trackLinks,
          audiences: selectedAudiences,
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        setCampaignId(result.campaignId)
        
        toast({
          title: "Broadcast started",
          description: `Sending ${uniqueRecipients.length} messages...`,
        })
        
        // Start polling for progress
        const pollProgress = setInterval(async () => {
          const progressResponse = await fetch(`/api/kudosity/broadcast?campaignId=${result.campaignId}`, {
            credentials: 'include',
          })
          
          if (progressResponse.ok) {
            const { campaign } = await progressResponse.json()
            setSendProgress(campaign.progress || 0)
            
            if (campaign.status === 'completed' || campaign.status === 'failed') {
              clearInterval(pollProgress)
              setIsSending(false)
              
              if (campaign.status === 'completed') {
                toast({
                  title: "Broadcast completed",
                  description: `Successfully sent ${campaign.sent_count} messages${campaign.failed_count > 0 ? `, ${campaign.failed_count} failed` : ''}. Duration: ${(campaign.duration_ms / 1000).toFixed(1)}s`,
                })
                
                // Navigate to campaign activity after success
                setTimeout(() => {
                  window.location.href = '/campaigns/activity'
                }, 2000)
              } else {
                toast({
                  title: "Broadcast had issues",
                  description: `Sent ${campaign.sent_count} messages, ${campaign.failed_count} failed`,
                  variant: "destructive",
                })
              }
            }
          }
        }, 2000) // Poll every 2 seconds
        
        // Clean up after 5 minutes max
        setTimeout(() => {
          clearInterval(pollProgress)
          setIsSending(false)
        }, 300000)
        
      } else {
        const error = await response.json()
        toast({
          title: "Broadcast failed",
          description: error.error || "Failed to send messages",
          variant: "destructive",
        })
        setIsSending(false)
      }
      
    } catch (error) {
      console.error("Failed to send broadcast:", error)
      toast({
        title: "Failed to send broadcast",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
      setIsSending(false)
    }
  }

  const handleAddMessage = () => {
    setSplitMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: "Type your message here...",
        delay: 5,
      },
    ])
  }

  const handleDelayChange = (id: number, newDelay: number) => {
    setSplitMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, delay: newDelay } : msg)))
  }

  const handleRemoveMessage = (id: number) => {
    setSplitMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  const handleSplitMessageChange = (id: number, newContent: string) => {
    setSplitMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, content: newContent } : msg)))
  }

  // Calculate total contacts from selected audiences
  const totalContacts = selectedAudiences.reduce((sum, audienceName) => {
    return sum + (audienceCounts[audienceName] || 0)
  }, 0)

  return (
    <div className="flex flex-col w-full min-h-screen overflow-x-auto">
      <div className="flex flex-col xl:flex-row w-full gap-6">
        {/* Left side - form content */}
        <div className="w-full xl:w-[70%]">
          <div className="w-full max-w-6xl mx-auto">
            <FormLayout columns={1}>
              {/* Audience Selection */}
              <FormSection
                title="Audience Selection"
                description="Choose who will receive your broadcast message"
                fullWidth
              >
                <FormField
                  label="Select Audience"
                  required
                  description={`Total contacts: ${totalContacts.toLocaleString()}`}
                >
                  <Select
                    value={selectedAudiences[0] || ""}
                    onValueChange={(value) => setSelectedAudiences([value])}
                    disabled={isLoadingAudiences}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isLoadingAudiences ? "Loading audiences..." : "Select an audience..."}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Segments</SelectLabel>
                        {audiences.map((audience) => (
                          <SelectItem key={audience.id} value={audience.name}>
                            {audience.name} ({((audience as any).profile_count || audienceCounts[audience.name] || 0).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
              </FormSection>

              {/* Sender Configuration */}
              <FormSection
                title="Sender Configuration"
                description="Configure your sender ID and message settings"
                fullWidth
              >
                <FormField label="Sender ID" required description="Choose your sender identification">
                  <Select value={senderID} onValueChange={setSenderID} disabled={isLoadingSenders}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingSenders ? "Loading senders..." : "Select sender ID"} />
                    </SelectTrigger>
                    <SelectContent>
                      {senderIDs.length === 0 ? (
                        <SelectItem value="no-senders" disabled>
                          No sender IDs available
                        </SelectItem>
                      ) : (
                        senderIDs.map((sender) => (
                          <SelectItem key={sender.id} value={sender.id}>
                            {sender.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormField>
              </FormSection>

              {/* Message Scheduling */}
              <FormSection
                title="Message Scheduling"
                description="Choose when to send your broadcast message"
                fullWidth
              >
                <FormField label="Send Options" required>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="immediate"
                        name="schedule"
                        value="immediate"
                        checked={scheduleType === "immediate"}
                        onChange={(e) => setScheduleType("immediate")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="immediate">Send immediately</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="scheduled"
                        name="schedule"
                        value="scheduled"
                        checked={scheduleType === "scheduled"}
                        onChange={(e) => setScheduleType("scheduled")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="scheduled">Schedule for later</Label>
                    </div>
                  </div>
                </FormField>

                {scheduleType === "scheduled" && (
                  <>
                    <FormField label="Date" required>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormField>

                    <FormField label="Time" required>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </FormField>
                  </>
                )}
              </FormSection>

              {/* Template Management */}
              <FormSection title="Message Template" description="Select or create a message template" fullWidth>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Template">
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Sort Options</SelectLabel>
                          <SelectItem value="sort-latest">Sort by Latest Added</SelectItem>
                          <SelectItem value="sort-az">Sort by A-Z</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Templates</SelectLabel>
                          {templates
                            .filter((template) => template.type === templateType)
                            .map((template) => (
                              <SelectItem key={template.name} value={template.name}>
                                {template.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormField>

                  {(!selectedTemplate || isContentChanged) && (
                    <FormField label="Template Name">
                      <Input
                        placeholder="Template name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                      />
                    </FormField>
                  )}

                  <FormField label="Actions">
                    <Button
                      className={`w-full ${
                        selectedTemplate && !isContentChanged
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                      onClick={handleSaveOrDelete}
                    >
                      {selectedTemplate && !isContentChanged ? "Delete" : "Save"}
                    </Button>
                  </FormField>
                </div>
              </FormSection>

              {/* Message Content */}
              <FormSection title="Message Content" description="Compose your broadcast message" fullWidth>
                {splitMessages.map((splitMessage, index) => (
                  <div key={splitMessage.id} className="space-y-4">
                    <FormField
                      label={index === 0 ? "Message" : `Split Message ${splitMessage.id}`}
                      required={index === 0}
                      description={`Character count: ${splitMessage.content.length}/612 | SMS count: ${calculateSMSCount(splitMessage.content)}`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <div>
                            Personalization:{" "}
                            <button
                              type="button"
                              className="text-blue-500 hover:underline"
                              onClick={() => insertPersonalization("[Firstname]")}
                            >
                              [Firstname]
                            </button>{" "}
                            <button
                              type="button"
                              className="text-blue-500 hover:underline"
                              onClick={() => insertPersonalization("[Lastname]")}
                            >
                              [Lastname]
                            </button>{" "}
                            <button
                              type="button"
                              className="text-blue-500 hover:underline"
                              onClick={() => insertPersonalization("[Mobile]")}
                            >
                              [Mobile]
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{calculateSMSCount(splitMessage.content)} SMS</Badge>
                          </div>
                        </div>
                        <div className="relative">
                          <Textarea
                            id={index === 0 ? "message" : `split-message-${splitMessage.id}`}
                            value={splitMessage.content}
                            onChange={(e) => {
                              if (index === 0) {
                                setMessage(e.target.value)
                                setIsContentChanged(true)
                              }
                              handleSplitMessageChange(splitMessage.id, e.target.value)
                            }}
                            placeholder={
                              index === 0
                                ? "Type your message here..."
                                : index === splitMessages.length - 1
                                  ? "Type your split message here...\n\nOpt-out reply STOP"
                                  : "Type your split message here..."
                            }
                            rows={6}
                            className={`resize-none ${trackLinks ? "url-highlight" : ""}`}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => handleRemoveMessage(splitMessage.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </FormField>

                    {/* Delay controls for split messages */}
                    {index > 0 && (
                      <FormField label="Delay" description="Time delay before sending this message">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            value={splitMessage.delay}
                            onChange={(e) => handleDelayChange(splitMessage.id, Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">seconds</span>
                        </div>
                      </FormField>
                    )}
                  </div>
                ))}

                <FormField label="Message Options" description="Configure additional message settings">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="track-links" checked={trackLinks} onCheckedChange={setTrackLinks} />
                      <Label htmlFor="track-links" className="text-sm font-medium">
                        Track Links
                      </Label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Button
                          onClick={handleAddMessage}
                          className="bg-blue-500 text-white hover:bg-blue-600 mr-2"
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">Add Split Message</span>
                      </div>

                      {splitMessages.length > 1 && (
                        <div className="flex items-center">
                          <span className="mr-2 text-sm text-muted-foreground">Remove Split Message</span>
                          <Button
                            onClick={() => handleRemoveMessage(splitMessages[splitMessages.length - 1].id)}
                            className="bg-red-500 text-white hover:bg-red-600"
                            size="icon"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </FormField>
              </FormSection>

              {/* Send Actions */}
              <FormSection title="Send Message" description="Review and send your broadcast" fullWidth>
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    onClick={handleNext}
                    disabled={selectedAudiences.length === 0 || isSending}
                  >
                    {isSending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
                
                {/* Progress bar for sending */}
                {isSending && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Sending messages...</span>
                      <span>{sendProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sendProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </FormSection>
            </FormLayout>
          </div>
        </div>

        {/* Right side - phone preview */}
        <div className="hidden xl:block xl:w-1/3 min-h-screen">
          <div className="w-full">
            <Card className="shadow-sm h-full bg-gray-100 overflow-hidden">
              <CardContent className="p-12 flex flex-col h-full">
                <div className="flex-grow flex items-center justify-center">
                  <PhonePreview
                    message={replaceWithTrackingLink(message)}
                    senderID={senderID}
                    showTestInput={false}
                    showPreviewInfo={true}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onSend={handleSend}
        totalContacts={totalContacts}
        selectedAudiences={selectedAudiences}
        scheduleType={scheduleType}
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
      />
    </div>
  )
})

BroadcastMessage.displayName = "BroadcastMessage"

export default BroadcastMessage
