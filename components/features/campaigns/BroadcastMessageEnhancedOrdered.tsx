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

interface SplitMessage {
  content: string
  delay_seconds: number
  wait_for_delivery?: boolean
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

  const filteredSegments = segments.filter(segment =>
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
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedIds.length === 0
              ? placeholder || "Select segments..."
              : `${selectedIds.length} segment${selectedIds.length > 1 ? 's' : ''} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search segments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-none border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
          />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {filteredSegments.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No segments found
            </div>
          ) : (
            <div className="p-1">
              {filteredSegments.map((segment) => (
                <div
                  key={segment.id}
                  onClick={() => toggleSegment(segment.id)}
                  className={cn(
                    "flex items-center justify-between rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    selectedIds.includes(segment.id) && "bg-accent"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={cn(
                      "mr-2 h-4 w-4 border rounded-sm flex items-center justify-center",
                      selectedIds.includes(segment.id) 
                        ? "bg-primary border-primary" 
                        : "border-input"
                    )}>
                      {selectedIds.includes(segment.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="truncate">{segment.name}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {segment.profile_count || 0}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Component
export const BroadcastMessageEnhanced = forwardRef<
  { saveDraft: () => Promise<void>; canSaveDraft: () => boolean },
  {}
>((props, ref) => {
  // State Management
  const [formData, setFormData] = useState<BroadcastFormData>({
    selectedAudiences: [],
    senderID: "",
    message: "",
    splitMessages: [],
    trackLinks: false,
    scheduleType: "immediate",
    scheduledTime: "09:00",
    throttledSending: {
      enabled: false,
      segments: 10,
      interval_minutes: 5
    }
  })

  const [templates, setTemplates] = useState<Template[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [senderIDs, setSenderIDs] = useState<string[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [totalContacts, setTotalContacts] = useState(0)

  // Fetch initial data
  useEffect(() => {
    fetchSegments()
    fetchSenders()
    fetchTemplates()
  }, [])

  // Set default sender when senders are loaded
  useEffect(() => {
    if (senderIDs.length > 0 && !formData.senderID) {
      // Set the first sender as default
      // TODO: In the future, this should come from account settings
      setFormData(prev => ({ ...prev, senderID: senderIDs[0] }))
    }
  }, [senderIDs])

  // Calculate total contacts when audiences change
  useEffect(() => {
    calculateTotalContacts()
  }, [formData.selectedAudiences, segments])

  const fetchSegments = async () => {
    try {
      const result = await segmentsApi.getSegments()
      if (result.error) {
        throw new Error(result.error)
      }
      setSegments(result.data || [])
    } catch (error) {
      console.error("Error fetching segments:", error)
      toast.error("Failed to load segments")
    }
  }

  const fetchSenders = async () => {
    try {
      const response = await fetch("/api/kudosity/senders")
      if (response.ok) {
        const data = await response.json()
        setSenderIDs(data.senderIDs || [])
      }
    } catch (error) {
      console.error("Error fetching senders:", error)
      toast.error("Failed to load sender IDs")
    }
  }

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.filter((t: any) => t.channel === 'sms'))
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const calculateTotalContacts = async () => {
    let total = 0
    for (const audienceId of formData.selectedAudiences) {
      const segment = segments.find(s => s.id === audienceId)
      if (segment) {
        total += segment.profile_count || 0
      }
    }
    setTotalContacts(total)
  }

  // Template Management
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

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !formData.message.trim()) {
      toast.error("Template name and message are required")
      return
    }

    setIsSavingTemplate(true)
    try {
      const templateData = {
        name: newTemplateName,
        content: formData.message,
        channel: 'sms',
        split_messages: formData.splitMessages.length > 0 ? formData.splitMessages : null,
        variables: extractVariables(formData.message)
      }

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      })

      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates(prev => [...prev, newTemplate])
        setNewTemplateName("")
        setShowTemplateDialog(false)
        toast.success("Template saved successfully")
      } else {
        throw new Error("Failed to save template")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error("Failed to save template")
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const extractVariables = (text: string): string[] => {
    const regex = /\[([^\]]+)\]/g
    const matches = text.match(regex)
    return matches ? matches.map(m => m.slice(1, -1)) : []
  }

  // Split Messages Management
  const handleAddSplitMessage = () => {
    setFormData(prev => ({
      ...prev,
      splitMessages: [
        ...prev.splitMessages,
        { content: "", delay_seconds: 10, wait_for_delivery: false, track_links: formData.trackLinks }
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

  // Track Links - automatically convert URLs when toggled
  const processTrackLinks = (text: string, shouldTrack: boolean): string => {
    if (!shouldTrack) return text
    
    // Convert URLs to tracking format (preview only, actual conversion happens on send)
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, (url) => {
      // Generate a mock short URL for preview (actual shortening happens via API)
      const mockId = Math.random().toString(36).substring(2, 9)
      return `tapth.is/${mockId}`
    })
  }

  const handleTrackLinksToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, trackLinks: checked }))
  }

  // Validation
  const canSaveDraft = (): boolean => {
    return formData.selectedAudiences.length > 0 && formData.message.trim().length > 0
  }

  const canSend = (): boolean => {
    return (
      formData.selectedAudiences.length > 0 &&
      formData.senderID !== "" &&
      formData.message.trim().length > 0
    )
  }

  // Save Draft
  const saveDraft = async () => {
    if (!canSaveDraft()) {
      throw new Error("Missing required fields")
    }

    const draftData = {
      ...formData,
      status: "Draft",
      type: "SMS"
    }

    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftData)
    })

    if (!response.ok) {
      throw new Error("Failed to save draft")
    }

    toast.success("Draft saved successfully")
  }

  // Send Broadcast
  const handleSend = async () => {
    if (!canSend()) {
      toast.error("Please fill in all required fields")
      return
    }

    setShowConfirmDialog(false)
    setIsSending(true)

    try {
      const broadcastData = {
        ...formData,
        status: "Running",
        type: "SMS",
        total_recipients: totalContacts
      }

      const response = await fetch("/api/kudosity/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastData)
      })

      if (response.ok) {
        toast.success("Broadcast sent successfully")
      } else {
        throw new Error("Failed to send broadcast")
      }
    } catch (error) {
      console.error("Error sending broadcast:", error)
      toast.error("Failed to send broadcast")
    } finally {
      setIsSending(false)
    }
  }

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    saveDraft,
    canSaveDraft
  }))

  return (
    <>
      <div className="flex gap-6">
        <div className="flex-1">
          <FormLayout>
            {/* STEP 1: Audience Selection */}
            <FormSection title="1. Audience Selection" description="Choose which segments will receive your broadcast">
              <div className="space-y-4">
                <FormField label="Select Audiences" required>
                  <MultiSelectDropdown
                    segments={segments}
                    selectedIds={formData.selectedAudiences}
                    onSelectionChange={(ids) => setFormData(prev => ({ ...prev, selectedAudiences: ids }))}
                    placeholder="Search and select segments..."
                  />
                </FormField>

                {formData.selectedAudiences.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedAudiences.map(id => {
                      const segment = segments.find(s => s.id === id)
                      return segment ? (
                        <Badge 
                          key={id} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            selectedAudiences: prev.selectedAudiences.filter(sid => sid !== id)
                          }))}
                        >
                          {segment.name} ({segment.profile_count || 0})
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}

                {totalContacts > 0 && (
                  <div className="bg-accent rounded-lg p-4">
                    <div className="text-sm font-medium">Total Recipients</div>
                    <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </FormSection>

            {/* STEP 2: Sender Configuration */}
            <FormSection title="2. Sender Configuration" description="Select which number to send from">
              <div className="space-y-4">
                <FormField label="Sender ID" required>
                  <Select
                    value={formData.senderID}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, senderID: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sender ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {senderIDs.map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default sender from your account settings. Change if sending to a different region.
                  </p>
                </FormField>
              </div>
            </FormSection>

            {/* STEP 3: Message Content */}
            <FormSection title="3. Message Content" description="Compose your message or select a template">
              <Tabs defaultValue="compose" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="compose">Compose Message</TabsTrigger>
                  <TabsTrigger value="templates">Use Template</TabsTrigger>
                </TabsList>

                <TabsContent value="compose" className="space-y-4">
                  <FormField label="Compose Your Message Sequence" required>
                    <div className="space-y-1">
                      <Textarea
                        placeholder={`Start your conversation... e.g., "Hi [first_name], it's [operator_name] from [company_name] here..."`}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        maxLength={1600}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Message 1 • {formData.message.length} / 1600 characters • {Math.ceil(formData.message.length / 160)} SMS
                        </span>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="track-links-main" className="text-sm">Track Links</Label>
                          <Switch
                            id="track-links-main"
                            checked={formData.trackLinks}
                            onCheckedChange={handleTrackLinksToggle}
                          />
                        </div>
                      </div>
                      {formData.trackLinks && formData.message.includes('http') && (
                        <p className="text-xs text-muted-foreground">
                          URLs will be shortened to tracking links (tapth.is/xxxxx)
                        </p>
                      )}
                    </div>
                  </FormField>

                  {/* Split Messages - presented as a conversation flow */}
                  {formData.splitMessages.map((msg, index) => (
                    <div key={index} className="relative">
                      {/* Delay Configuration - moved between messages */}
                      <div className="flex items-center justify-center py-4 bg-muted/20 rounded-lg my-4">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="w-16 border-t border-dashed"></div>
                          <div className="flex items-center space-x-3 bg-background px-4 py-2 rounded-md border shadow-sm">
                            <span className="text-xs font-medium text-foreground">Wait</span>
                            <Select
                              value={String(msg.delay_seconds)}
                              onValueChange={(value) =>
                                handleUpdateSplitMessage(index, "delay_seconds", parseInt(value))
                              }
                            >
                              <SelectTrigger className="w-20 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5s</SelectItem>
                                <SelectItem value="10">10s</SelectItem>
                                <SelectItem value="15">15s</SelectItem>
                                <SelectItem value="20">20s</SelectItem>
                                <SelectItem value="30">30s</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`wait-${index}`}
                                checked={msg.wait_for_delivery}
                                onCheckedChange={(checked) =>
                                  handleUpdateSplitMessage(index, "wait_for_delivery", checked)
                                }
                                className="scale-75"
                              />
                              <Label htmlFor={`wait-${index}`} className="text-xs whitespace-nowrap">
                                after confirmed delivery
                              </Label>
                            </div>
                          </div>
                          <div className="w-16 border-t border-dashed"></div>
                        </div>
                      </div>

                      {/* Message content */}
                      <div className="relative">
                        <Textarea
                          placeholder={`Continue the conversation... e.g., "Here's a video about what to expect [link]"`}
                          value={msg.content}
                          onChange={(e) => handleUpdateSplitMessage(index, "content", e.target.value)}
                          rows={3}
                          className="pr-10"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveSplitMessage(index)}
                          className="absolute top-2 right-2 h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-muted-foreground">
                            Message {index + 2} • {msg.content.length} / 1600 characters
                          </span>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`track-links-${index}`} className="text-sm">Track Links</Label>
                            <Switch
                              id={`track-links-${index}`}
                              checked={msg.track_links || false}
                              onCheckedChange={(checked) =>
                                handleUpdateSplitMessage(index, "track_links", checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      Split messages create a natural conversation flow
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddSplitMessage}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Message
                    </Button>
                  </div>

                  {/* Opt-out notice */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> Recipients can opt-out at any time by replying STOP
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateDialog(true)}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Template
                  </Button>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                  {isLoadingTemplates ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No templates available. Create one in the Compose tab.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {templates.map((template) => (
                        <Card
                          key={template.id}
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleTemplateSelect(template.id!)}
                        >
                          <CardContent className="pt-4">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {template.content}
                            </div>
                            {template.split_messages && template.split_messages.length > 0 && (
                              <div className="flex items-center mt-2">
                                <SplitSquareVertical className="h-3 w-3 mr-1" />
                                <span className="text-xs text-muted-foreground">
                                  {template.split_messages.length + 1} messages
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </FormSection>

            {/* STEP 4: Scheduling */}
            <FormSection title="4. Scheduling & Delivery" description="Choose when and how to send your broadcast">
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
                  <div className="grid grid-cols-2 gap-4">
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

                {/* Throttled Sending */}
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
                          max={50}
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
                      </FormField>

                      {totalContacts > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Will send ~{Math.ceil(totalContacts / formData.throttledSending.segments)} contacts every{" "}
                          {formData.throttledSending.interval_minutes < 60
                            ? `${formData.throttledSending.interval_minutes} minutes`
                            : `${formData.throttledSending.interval_minutes / 60} hour${
                                formData.throttledSending.interval_minutes / 60 > 1 ? "s" : ""
                              }`}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            </FormSection>

            {/* Send Message Button */}
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

        {/* Phone Preview - Fixed on the right */}
        <div className="hidden lg:block w-80">
          <div className="sticky top-4">
            <PhonePreview 
              message={processTrackLinks(formData.message, formData.trackLinks)}
              senderID={formData.senderID}
              splitMessages={formData.splitMessages.map(msg => ({
                content: msg.track_links ? processTrackLinks(msg.content) : msg.content,
                delay_seconds: msg.delay_seconds,
                wait_for_delivery: msg.wait_for_delivery
              }))}
            />
          </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Template Name">
              <Input
                placeholder="Enter template name..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Recipients</div>
              <div className="text-lg font-semibold">{totalContacts.toLocaleString()} contacts</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Audiences</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.selectedAudiences.map(id => {
                  const segment = segments.find(s => s.id === id)
                  return segment ? (
                    <Badge key={id} variant="secondary">{segment.name}</Badge>
                  ) : null
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Sender ID</div>
              <div className="text-lg font-semibold">{formData.senderID}</div>
            </div>
            {formData.scheduleType === "scheduled" && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Scheduled for</div>
                <div className="text-lg font-semibold">
                  {formData.scheduledDate && format(formData.scheduledDate, "PPP")} at {formData.scheduledTime}
                </div>
              </div>
            )}
            {formData.throttledSending.enabled && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Throttled Sending</div>
                <div className="text-sm">
                  {formData.throttledSending.segments} segments, {formData.throttledSending.interval_minutes} minutes apart
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

BroadcastMessageEnhanced.displayName = "BroadcastMessageEnhanced"
