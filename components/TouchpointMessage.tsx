"use client"

import { forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FormLayout, FormSection, FormField } from "@/components/ui/form-layout"
import { Plus, Smile, Paperclip, Bot } from "lucide-react"
import PhonePreview from "@/components/PhonePreview"
import { Card, CardContent } from "@/components/ui/card"

interface TouchpointMessageProps {
  touchpointId?: string
}

interface TouchpointData {
  id?: string
  name: string
  description: string
  template: string
  templateName: string
  message: string
  trackLinks: boolean
  defaultReplyAgent: string
  autoReply: boolean
}

const TouchpointMessage = forwardRef<{ save: () => Promise<void> }, TouchpointMessageProps>(({ touchpointId }, ref) => {
  const [touchpointData, setTouchpointData] = useState<TouchpointData>({
    name: "Touchpoint tp-001",
    description: "Describe the function of this touchpoint",
    template: "",
    templateName: "",
    message: "Type your message here...",
    trackLinks: false,
    defaultReplyAgent: "Customer Support Assistant",
    autoReply: false,
  })

  const [messageLength, setMessageLength] = useState(25)
  const [smsCount, setSmsCount] = useState(1)

  useEffect(() => {
    if (touchpointId) {
      // Load existing touchpoint data
      setTouchpointData({
        id: touchpointId,
        name: "Touchpoint tp-001",
        description: "Describe the function of this touchpoint",
        template: "",
        templateName: "",
        message: "Type your message here...",
        trackLinks: false,
        defaultReplyAgent: "Customer Support Assistant",
        autoReply: false,
      })
    }
  }, [touchpointId])

  useEffect(() => {
    // Calculate message length and SMS count
    const length = touchpointData.message.length
    setMessageLength(length)
    setSmsCount(Math.ceil(length / 160) || 1)
  }, [touchpointData.message])

  const handleSave = async () => {
    try {
      console.log("Saving touchpoint:", touchpointData)
      // Here you would typically make an API call to save the data
    } catch (error) {
      console.error("Error saving touchpoint:", error)
    }
  }

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }))

  const handleInputChange = (field: keyof TouchpointData, value: any) => {
    setTouchpointData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const replaceWithTrackingLink = (text: string) => {
    if (!touchpointData.trackLinks) return text
    if (text === "Type your message here...") {
      return text
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, (url) => `tapth.is/${Math.random().toString(36).substr(2, 5)}`)
  }

  return (
    <div className="flex flex-col w-full min-h-screen overflow-x-auto py-4 sm:py-6">
      <div className="flex flex-col xl:flex-row w-full gap-6">
        {/* Left side - form content */}
        <div className="w-full xl:w-[70%]">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <FormLayout columns={1}>
              {/* Basic Information Section */}
              <FormSection
                title="Basic Information"
                description="Configure the basic details of your touchpoint"
                fullWidth
              >
                <FormField label="Touchpoint Name" required description="A unique name to identify this touchpoint">
                  <Input
                    value={touchpointData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter touchpoint name"
                  />
                </FormField>

                <FormField label="Description" description="Describe the purpose and function of this touchpoint">
                  <Textarea
                    value={touchpointData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the function of this touchpoint"
                    rows={3}
                    className="resize-none"
                  />
                </FormField>
              </FormSection>

              {/* Message Template Section */}
              <FormSection title="Message Template" description="Select or create a message template" fullWidth>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Template">
                    <Select
                      value={touchpointData.template}
                      onValueChange={(value) => handleInputChange("template", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome Message</SelectItem>
                        <SelectItem value="followup">Follow Up</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Template Name">
                    <Input
                      placeholder="Template name"
                      value={touchpointData.templateName}
                      onChange={(e) => handleInputChange("templateName", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Actions">
                    <Button variant="default" className="w-full">
                      Save Template
                    </Button>
                  </FormField>
                </div>
              </FormSection>

              {/* Message Content Section */}
              <FormSection title="Message Content" description="Compose your touchpoint message" fullWidth>
                <FormField label="Message" required description={`${messageLength}/612 characters • ${smsCount} SMS`}>
                  <div className="relative">
                    <Textarea
                      value={touchpointData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Type your message here..."
                      rows={8}
                      className="resize-none pr-20"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </FormField>

                <FormField label="Link Tracking" description="Automatically replace URLs with tracking links">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="track-links"
                      checked={touchpointData.trackLinks}
                      onCheckedChange={(checked) => handleInputChange("trackLinks", checked)}
                    />
                    <Label htmlFor="track-links" className="text-sm font-medium">
                      Enable link tracking
                    </Label>
                  </div>
                </FormField>
              </FormSection>

              {/* Message Actions Section */}
              <FormSection title="Message Actions" description="Add additional message components" fullWidth>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Split Message
                  </Button>
                  <Button variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Follow Up Message
                  </Button>
                </div>
              </FormSection>

              {/* Reply Automation Section */}
              <FormSection title="Reply Automation" description="Configure automatic reply handling" fullWidth>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      <Label className="text-sm font-medium">Auto Reply Settings</Label>
                    </div>
                    <FormField label="Enable Auto Reply">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-reply"
                          checked={touchpointData.autoReply}
                          onCheckedChange={(checked) => handleInputChange("autoReply", checked)}
                        />
                        <Label htmlFor="auto-reply" className="text-sm">
                          Auto Reply
                        </Label>
                      </div>
                    </FormField>
                  </div>

                  <FormField
                    label="Default Reply Agent"
                    description={
                      touchpointData.autoReply
                        ? "Agent will automatically respond to incoming messages"
                        : "You will need to manually respond to incoming messages"
                    }
                  >
                    <Select
                      value={touchpointData.defaultReplyAgent}
                      onValueChange={(value) => handleInputChange("defaultReplyAgent", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Customer Support Assistant">Customer Support Assistant</SelectItem>
                        <SelectItem value="Sales Agent">Sales Agent</SelectItem>
                        <SelectItem value="Technical Support">Technical Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </FormSection>
            </FormLayout>
          </div>
        </div>

        {/* Right side - phone preview (only visible on xl screens) */}
        <div className="hidden xl:block xl:w-1/3 min-h-full">
          <div className="w-full sticky top-0">
            <Card className="shadow-sm h-full bg-gray-100 overflow-hidden">
              <CardContent className="p-12 flex flex-col">
                <div className="flex-grow flex items-center justify-center">
                  <PhonePreview
                    message={
                      touchpointData.message === "Type your message here..."
                        ? "Your touchpoint message will appear here..."
                        : replaceWithTrackingLink(touchpointData.message)
                    }
                    senderID="Kudosity"
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
    </div>
  )
})

TouchpointMessage.displayName = "TouchpointMessage"

export default TouchpointMessage
