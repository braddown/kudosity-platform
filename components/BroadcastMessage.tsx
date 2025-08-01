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
import { segmentsApi, type Segment } from "@/lib/segments-api"
import PhonePreview from "./PhonePreview"
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

const BroadcastMessage = forwardRef<{ save: () => Promise<void> }>((props, ref) => {
  const [message, setMessage] = useState(`Type your message here...

Opt-out reply STOP`)
  const [senderID, setSenderID] = useState("447312263456")
  const [trackLinks, setTrackLinks] = useState(false)
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([])
  const [templates, setTemplates] = useState(initialTemplates)
  const [isContentChanged, setIsContentChanged] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [senderIDs] = useState([
    { id: "447312263456", label: "447312263456" },
    { id: "447312263457", label: "447312263457" },
    { id: "ALPHANUMERIC", label: "ALPHANUMERIC" },
  ])
  const [splitMessages, setSplitMessages] = useState<SplitMessage[]>([
    { id: 1, content: "Type your message here...", delay: 0 },
  ])
  const [templateType, setTemplateType] = useState<TemplateType>("standard")
  const [templateName, setTemplateName] = useState("")

  const [audiences, setAudiences] = useState<Segment[]>([])
  const [isLoadingAudiences, setIsLoadingAudiences] = useState(true)

  const [scheduleType, setScheduleType] = useState<"immediate" | "scheduled">("immediate")
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [scheduledTime, setScheduledTime] = useState("09:00")

  useEffect(() => {
    const loadSegments = async () => {
      setIsLoadingAudiences(true)
      try {
        const { data, error } = await segmentsApi.getSegments()
        if (error) {
          console.error("Error loading segments:", error)
          setAudiences(segmentsApi.getSystemSegments())
        } else {
          const allSegments = [...data, ...segmentsApi.getSystemSegments()]
          setAudiences(allSegments)
        }
      } catch (error) {
        console.error("Error loading segments:", error)
        setAudiences(segmentsApi.getSystemSegments())
      } finally {
        setIsLoadingAudiences(false)
      }
    }

    loadSegments()
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

  const handleSend = () => {
    console.log("Sending message...")
    setIsConfirmationModalOpen(false)
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

  const totalContacts = audiences
    .filter((audience) => selectedAudiences.includes(audience.name))
    .reduce((sum, audience) => sum + (audience.estimated_size || 0), 0)

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
                            {audience.name} ({(audience.estimated_size || 0).toLocaleString()})
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
                  <Select value={senderID} onValueChange={setSenderID}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sender ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {senderIDs.map((sender) => (
                        <SelectItem key={sender.id} value={sender.id}>
                          {sender.label}
                        </SelectItem>
                      ))}
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
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleNext}
                    disabled={selectedAudiences.length === 0}
                  >
                    Send Message
                  </Button>
                </div>
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
