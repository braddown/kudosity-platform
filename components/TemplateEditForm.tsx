"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { logger } from "@/lib/utils/logger"

interface Template {
  id: string
  name: string
  content: string
  author: string
  createdAt: string
  usageCount: number
  engagement: number
  category: string
}

interface TemplateEditFormProps {
  template?: Template
}

export default function TemplateEditForm({ template }: TemplateEditFormProps) {
  const router = useRouter()
  const isEditing = !!template

  const [formData, setFormData] = useState({
    name: template?.name || "",
    content: template?.content || "",
    category: template?.category || "General",
  })

  const handleSave = () => {
    // TODO: Implement save logic
    logger.debug("Saving template:", formData)
    router.push("/templates")
  }

  const handleClose = () => {
    router.push("/templates")
  }

  const calculateSMSCount = (text: string) => {
    return Math.ceil(text.length / 160)
  }

  const insertPersonalization = (variable: string) => {
    setFormData({
      ...formData,
      content: formData.content + variable,
    })
  }

  const categories = ["Promotional", "Support", "General", "Appointment", "Feedback"]

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-16 left-0 right-0 lg:left-64 w-full lg:w-auto border-b border-border py-4 px-6 flex justify-between items-center bg-background z-[75]">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-foreground">{isEditing ? template.name : "New Template"}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleSave} variant="default">
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content with proper spacing */}
      <div className="pt-[88px] p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Template Properties */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-medium text-card-foreground mb-6">Template Properties</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                  Template Name
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-card-foreground">Message Content</h2>
              <div className="text-sm text-muted-foreground">
                {formData.content.length} chars / {calculateSMSCount(formData.content)} SMS
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-muted-foreground mb-2">
                  Message Text
                </label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your message content..."
                  className="min-h-[200px] w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Personalization Variables
                </label>
                <div className="flex flex-wrap gap-2">
                  {["[Firstname]", "[Lastname]", "[Mobile]", "[Business Name]", "[Date]", "[Time]", "[Phone]"].map(
                    (variable) => (
                      <Button
                        key={variable}
                        variant="outline"
                        size="sm"
                        onClick={() => insertPersonalization(variable)}
                        className="text-xs"
                      >
                        {variable}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics - only show when editing */}
          {isEditing && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-medium text-card-foreground mb-6">Performance Metrics</h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{template.usageCount}</div>
                  <div className="text-sm text-muted-foreground">Total Uses</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{template.engagement}%</div>
                  <div className="text-sm text-muted-foreground">Engagement Rate</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Author:</span> {template.author}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">Created:</span> {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
