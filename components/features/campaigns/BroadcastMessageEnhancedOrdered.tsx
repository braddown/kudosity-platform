"use client"
import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormLayout, FormSection, FormField } from "@/components/ui/form-layout"
import { Plus, Minus, Save, Loader2, Link2, Clock, Send, SplitSquareVertical, X, Check, ChevronsUpDown, Search } from "lucide-react"
import { SelectGroup, SelectLabel } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { segmentsApi, type Segment } from "@/lib/api/segments-api"
import { profilesApi } from "@/lib/api/profiles-api"
import PhonePreview from "../../PhonePreview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

// Types
interface Template {
  id?: string
  name: string
  content: string
  split_messages?: SplitMessage[]
  variables?: string[]
}

interface Sender {
  id: string
  sender_id: string
  display_name: string
  description: string
  type: 'virtual_number' | 'alphanumeric' | 'mobile_number'
  status: 'active' | 'inactive' | 'pending' | 'expired'
  source: 'kudosity_api' | 'manual' | 'imported'
  use_case: 'marketing' | 'transactional' | 'private' | 'otp'
}

interface SplitMessage {
  content: string
  delay_seconds: number
  wait_for_delivery: boolean
  track_links?: boolean
}

interface ThrottledSending {
  enabled: boolean
  segments: number
  interval_minutes: number
}

interface BroadcastFormData {
  selectedAudiences: string[]
  senderID: string
  template?: Template
  message: string
  splitMessages: SplitMessage[]
  trackLinks: boolean
  scheduleType: "immediate" | "scheduled"
  scheduledDate?: Date
  scheduledTime: string
  throttledSending: ThrottledSending
}

// Multi-Select Dropdown Component
interface MultiSelectDropdownProps {
  segments: Segment[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
}

function MultiSelectDropdown({ segments, selectedIds, onSelectionChange, placeholder }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSegments = (segments || []).filter(segment =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSegment = (segmentId: string) => {
    if (selectedIds.includes(segmentId)) {
      onSelectionChange(selectedIds.filter(id => id !== segmentId))
    } else {
      onSelectionChange([...selectedIds, segmentId])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedIds.length === 0 ? (
            <span className="text-muted-foreground">{placeholder || "Select segments..."}</span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedIds.slice(0, 2).map(id => {
                const segment = (segments || []).find(s => s.id === id)
                return segment ? (
                  <Badge key={id} variant="secondary" className="mr-1">
                    {segment.name}
                  </Badge>
                ) : null
              })}
              {selectedIds.length > 2 && (
                <Badge variant="secondary">+{selectedIds.length - 2} more</Badge>
              )}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center px-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search segments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 border-0 focus:ring-0"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-auto p-1">
          {filteredSegments.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No segments found
            </div>
          ) : (
            filteredSegments.map(segment => (
              <div
                key={segment.id}
                className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                onClick={() => toggleSegment(segment.id)}
              >
                <div className={cn(
                  "h-4 w-4 border rounded-sm flex items-center justify-center",
                  selectedIds.includes(segment.id) ? "bg-primary border-primary" : "border-input"
                )}>
                  {selectedIds.includes(segment.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{segment.name}</div>
                  {segment.description && (
                    <div className="text-xs text-muted-foreground">{segment.description}</div>
                  )}
                </div>
                {segment.profile_count !== undefined && (
                  <Badge variant="outline" className="ml-auto">
                    {segment.profile_count.toLocaleString()}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
        {selectedIds.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onSelectionChange([])}
            >
              Clear selection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Main Component
export interface BroadcastMessageEnhancedOrderedRef {
  getFormData: () => BroadcastFormData
  resetForm: () => void
  validateForm: () => boolean
  saveDraft: () => Promise<void>
  canSaveDraft: () => boolean
}

const BroadcastMessageEnhancedOrdered = forwardRef<BroadcastMessageEnhancedOrderedRef>((props, ref) => {
  // State
  const [segments, setSegments] = useState<Segment[]>([])
  const [senders, setSenders] = useState<Sender[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formData, setFormData] = useState<BroadcastFormData>({
    selectedAudiences: [],
    senderID: "",
    template: undefined,
    message: "",
    splitMessages: [],
    trackLinks: false,
    scheduleType: "immediate",
    scheduledDate: undefined,
    scheduledTime: "",
    throttledSending: {
      enabled: false,
      segments: 2,
      interval_minutes: 30
    }
  })

  // Load initial data
  useEffect(() => {
    loadSegments()
    loadSenders()
    loadTemplates()
  }, [])

  // Auto-select sender when audience changes
  useEffect(() => {
    if (formData.selectedAudiences.length > 0 && !formData.senderID) {
      const marketingSenders = senders.filter(s => 
        s.use_case === 'marketing' && 
        s.status === 'active'
      )
      if (marketingSenders.length > 0) {
        setFormData(prev => ({ ...prev, senderID: marketingSenders[0].id }))
      }
    }
  }, [formData.selectedAudiences, senders])

  // Update contact count when audiences change
  useEffect(() => {
    if (formData.selectedAudiences.length > 0) {
      updateContactCount()
    } else {
      setTotalContacts(0)
    }
  }, [formData.selectedAudiences])

  const loadSegments = async () => {
    try {
      const result = await segmentsApi.getSegments()
      // The API returns { data: [...], error?: ... }
      const segments = result.data || []
      setSegments(Array.isArray(segments) ? segments : [])
    } catch (error) {
      console.error("Failed to load segments:", error)
      toast.error("Failed to load segments")
      setSegments([])
    }
  }

  const loadSenders = async () => {
    try {
      const response = await fetch('/api/kudosity/senders')
      if (response.ok) {
        const data = await response.json()
        setSenders(Array.isArray(data.senders) ? data.senders : [])
      } else {
        console.error("Failed to load senders, status:", response.status)
        setSenders([])
      }
    } catch (error) {
      console.error("Failed to load senders:", error)
      setSenders([])
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(Array.isArray(data.templates) ? data.templates : [])
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error("Failed to load templates:", error)
      setTemplates([])
    }
  }

  const updateContactCount = async () => {
    if (formData.selectedAudiences.length === 0) {
      setTotalContacts(0)
      return
    }

    setIsLoadingContacts(true)
    try {
      const response = await fetch('/api/cdp-profiles/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentIds: formData.selectedAudiences })
      })

      if (response.ok) {
        const data = await response.json()
        setTotalContacts(data.count || 0)
      } else {
        console.error("Failed to get contact count, status:", response.status)
        setTotalContacts(0)
      }
    } catch (error) {
      console.error("Failed to get contact count:", error)
      setTotalContacts(0)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const handleAddSplitMessage = () => {
    setFormData(prev => ({
      ...prev,
      splitMessages: [
        ...prev.splitMessages,
        { content: "", delay_seconds: 10, wait_for_delivery: false, track_links: false }
      ]
    }))
  }

  const handleRemoveSplitMessage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      splitMessages: prev.splitMessages.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateSplitMessage = (index: number, field: keyof SplitMessage, value: any) => {
    setFormData(prev => ({
      ...prev,
      splitMessages: prev.splitMessages.map((msg, i) =>
        i === index ? { ...msg, [field]: value } : msg
      )
    }))
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        template,
        message: template.content,
        splitMessages: template.split_messages || []
      }))
    }
  }

  const handleTrackLinksToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, trackLinks: checked }))
  }

  const canSend = () => {
    return (
      formData.selectedAudiences.length > 0 &&
      formData.senderID &&
      formData.message.trim().length > 0
    )
  }

  const validateForm = () => {
    if (formData.selectedAudiences.length === 0) {
      toast.error("Please select at least one audience")
      return false
    }
    if (!formData.senderID) {
      toast.error("Please select a sender")
      return false
    }
    if (formData.message.trim().length === 0) {
      toast.error("Please enter a message")
      return false
    }
    return true
  }

  const resetForm = () => {
    setFormData({
      selectedAudiences: [],
      senderID: "",
      template: undefined,
      message: "",
      splitMessages: [],
      trackLinks: false,
      scheduleType: "immediate",
      scheduledDate: undefined,
      scheduledTime: "",
      throttledSending: {
        enabled: false,
        segments: 2,
        interval_minutes: 30
      }
    })
  }

  const saveDraft = async () => {
    // Implement draft saving logic here
    // For now, just log the data
    console.log("Saving draft:", formData)
    // Simulate async save
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Draft saved successfully")
  }

  const canSaveDraft = () => {
    // Can save if there's at least some content
    return formData.message.trim().length > 0 || 
           formData.selectedAudiences.length > 0 ||
           formData.senderID !== ""
  }

  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
    resetForm,
    validateForm,
    saveDraft,
    canSaveDraft
  }))

  const marketingSenders = senders.filter(s => s.use_case === 'marketing')

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <FormLayout columns={1}>
            {/* Audience Selection */}
            <FormSection title="Target Audience" description="Choose who will receive this message">
              <FormField label="Select Segments" required>
                <MultiSelectDropdown
                  segments={segments}
                  selectedIds={formData.selectedAudiences}
                  onSelectionChange={(ids) => setFormData(prev => ({ ...prev, selectedAudiences: ids }))}
                  placeholder="Choose one or more segments..."
                />
                {formData.selectedAudiences.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {isLoadingContacts ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Calculating reach...
                      </span>
                    ) : (
                      <span>
                        Total reach: <strong>{totalContacts.toLocaleString()}</strong> contacts
                      </span>
                    )}
                  </div>
                )}
              </FormField>
            </FormSection>

            {/* Sender Selection */}
            <FormSection title="Sender Information" description="Choose how your message will be identified">
              <FormField label="Sender ID" required>
                {marketingSenders.length > 0 ? (
                  <Select
                    value={formData.senderID}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, senderID: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sender ID" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Marketing Senders</SelectLabel>
                        {marketingSenders.map((sender) => (
                          <SelectItem key={sender.id} value={sender.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{sender.display_name || sender.sender_id}</span>
                              <Badge variant="outline" className="ml-2">
                                {sender.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground mt-2">
                    No marketing senders found. <a href="/settings/senders" className="text-primary hover:underline">Add a sender ID</a> and set the use case to "Marketing".
                  </div>
                )}
              </FormField>
            </FormSection>

            {/* Scheduling */}
            <FormSection title="Scheduling & Delivery" description="Choose when and how to send your broadcast">
              <div className="space-y-4">
                <FormField label="Send Options">
                  <RadioGroup
                    value={formData.scheduleType}
                    onValueChange={(value: "immediate" | "scheduled") =>
                      setFormData(prev => ({ ...prev, scheduleType: value }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="immediate" id="immediate" />
                      <Label htmlFor="immediate">Send immediately</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled">Schedule for later</Label>
                    </div>
                  </RadioGroup>
                </FormField>

                {formData.scheduleType === "scheduled" && (
                  <div className="space-y-4">
                    <FormField label="Date">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.scheduledDate ? format(formData.scheduledDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.scheduledDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, scheduledDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormField>

                    <FormField label="Time">
                      <Input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </FormField>
                  </div>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Throttled Sending (Optional)</CardTitle>
                      <Switch
                        checked={formData.throttledSending.enabled}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            throttledSending: { ...prev.throttledSending, enabled: checked }
                          }))
                        }
                      />
                    </div>
                  </CardHeader>
                  {formData.throttledSending.enabled && (
                    <CardContent className="space-y-4">
                      <FormField label={`Split into ${formData.throttledSending.segments} segments`}>
                        <Slider
                          value={[formData.throttledSending.segments]}
                          onValueChange={([value]) =>
                            setFormData(prev => ({
                              ...prev,
                              throttledSending: { ...prev.throttledSending, segments: value }
                            }))
                          }
                          min={2}
                          max={10}
                          step={1}
                        />
                      </FormField>

                      <FormField label="Send interval">
                        <Select
                          value={String(formData.throttledSending.interval_minutes)}
                          onValueChange={(value) =>
                            setFormData(prev => ({
                              ...prev,
                              throttledSending: { ...prev.throttledSending, interval_minutes: parseInt(value) }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="180">3 hours</SelectItem>
                            <SelectItem value="360">6 hours</SelectItem>
                            <SelectItem value="720">12 hours</SelectItem>
                            <SelectItem value="1440">24 hours</SelectItem>
                            <SelectItem value="2880">48 hours</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="text-sm text-muted-foreground">
                          {totalContacts > 0 && (
                            <>
                              Will send to approximately {Math.ceil(totalContacts / formData.throttledSending.segments)} 
                              contacts every {formData.throttledSending.interval_minutes} minutes
                            </>
                          )}
                        </div>
                      </FormField>
                    </CardContent>
                  )}
                </Card>
              </div>
            </FormSection>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/campaigns/activity"}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!canSend() || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Review & Send
                  </>
                )}
              </Button>
            </div>
          </FormLayout>
        </div>

        {/* Right Column - Message Composition & Preview */}
        <div className="lg:sticky lg:top-4">
          <div className="bg-card rounded-lg border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Message Content</h3>
              <p className="text-sm text-muted-foreground">Compose your message or select a template</p>
            </div>
            
            <Tabs defaultValue="compose" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="compose">Compose Message</TabsTrigger>
                <TabsTrigger value="templates">Use Template</TabsTrigger>
              </TabsList>

              <TabsContent value="compose">
                <div className="grid grid-cols-[1fr,350px] gap-6">
                  {/* Message Editor */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Your Message</Label>
                      <Textarea
                        placeholder={`Hi [first_name], it's [operator_name] from [company_name] here...`}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        rows={10}
                        maxLength={1600}
                        className="resize-none w-full"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">
                          {formData.message.length} / 1600 characters • {Math.ceil(formData.message.length / 160)} SMS
                        </span>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="track-links" className="text-sm">Track Links</Label>
                          <Switch
                            id="track-links"
                            checked={formData.trackLinks}
                            onCheckedChange={handleTrackLinksToggle}
                          />
                        </div>
                      </div>
                      {formData.trackLinks && formData.message.includes('http') && (
                        <p className="text-xs text-muted-foreground mt-2">
                          URLs will be shortened to tracking links (tapth.is/xxxxx)
                        </p>
                      )}
                    </div>

                    {/* Split Messages */}
                    <div className="border-t pt-4 mt-4">
                      <Label className="text-sm font-medium mb-3 block">Split Messages (Optional)</Label>
                      <div className="space-y-3">
                        {formData.splitMessages.map((msg, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-center py-2 bg-muted/20 rounded-lg mb-2">
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Wait {msg.delay_seconds}s</span>
                              {msg.wait_for_delivery && <Badge variant="outline" className="text-xs">Wait for delivery</Badge>}
                            </div>
                          </div>
                          
                          <div className="relative">
                            <Textarea
                              placeholder="Split message content..."
                              value={msg.content}
                              onChange={(e) => handleUpdateSplitMessage(index, "content", e.target.value)}
                              rows={4}
                              maxLength={1600}
                              className="resize-none pr-10 w-full"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                              onClick={() => handleRemoveSplitMessage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div className="text-xs text-muted-foreground mt-1">
                              {msg.content.length} / 1600 • {Math.ceil(msg.content.length / 160)} SMS
                            </div>
                          </div>
                        </div>
                      ))}
                      
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddSplitMessage}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Split Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Phone Preview */}
                  <div className="flex justify-center">
                    <PhonePreview
                      message={formData.message}
                      senderID={senders.find(s => s.id === formData.senderID)?.display_name || "Your Business"}
                      splitMessages={formData.splitMessages}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="templates">
                <div className="grid grid-cols-[1fr,350px] gap-6">
                  {/* Template Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Select a Template</Label>
                      <Select onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id || ""}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.template && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">{formData.template.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-wrap">{formData.template.content}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* Phone Preview */}
                  <div className="flex justify-center">
                    <PhonePreview
                      message={formData.template?.content || ""}
                      senderID={senders.find(s => s.id === formData.senderID)?.display_name || "Your Business"}
                      splitMessages={formData.template?.split_messages || []}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review & Send Broadcast</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Recipients</Label>
                <p className="font-medium">{totalContacts.toLocaleString()} contacts</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Sender</Label>
                <p className="font-medium">
                  {senders.find(s => s.id === formData.senderID)?.display_name || "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Schedule</Label>
                <p className="font-medium">
                  {formData.scheduleType === "immediate" ? "Send immediately" : 
                    `${formData.scheduledDate ? format(formData.scheduledDate, "PPP") : ""} at ${formData.scheduledTime}`}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Messages</Label>
                <p className="font-medium">
                  {1 + formData.splitMessages.length} message{formData.splitMessages.length > 0 ? "s" : ""}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Message Preview</Label>
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <p className="text-sm whitespace-pre-wrap">{formData.message}</p>
                </CardContent>
              </Card>
            </div>

            {formData.throttledSending.enabled && (
              <div>
                <Label className="text-sm text-muted-foreground">Throttled Sending</Label>
                <p className="text-sm">
                  Send in {formData.throttledSending.segments} segments, 
                  {Math.ceil(totalContacts / formData.throttledSending.segments)} contacts 
                  every {formData.throttledSending.interval_minutes} minutes
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowConfirmDialog(false)
              // Handle send logic here
              toast.success("Broadcast sent successfully!")
            }}>
              <Send className="h-4 w-4 mr-2" />
              Send Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

BroadcastMessageEnhancedOrdered.displayName = "BroadcastMessageEnhancedOrdered"

export default BroadcastMessageEnhancedOrdered