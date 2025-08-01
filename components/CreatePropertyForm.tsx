"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormLayout, FormSection, FormField } from "@/components/ui/form-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CreatePropertyFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
}

export default function CreatePropertyForm({ onSubmit, onCancel }: CreatePropertyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    type: "text",
    category: "",
    description: "",
    defaultValue: "",
    required: false,
    validation: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="glass-card bg-card/50 dark:bg-card/30 border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Create New Property</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FormLayout columns={2}>
            <FormSection title="Basic Information">
              <FormField label="Property Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter property name"
                />
              </FormField>

              <FormField label="Property Key" required description="Unique identifier for this property">
                <Input
                  value={formData.key}
                  onChange={(e) => handleChange("key", e.target.value)}
                  placeholder="Enter property key"
                />
              </FormField>

              <FormField label="Data Type" required>
                <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Category">
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="Configuration">
              <FormField label="Default Value">
                <Input
                  value={formData.defaultValue}
                  onChange={(e) => handleChange("defaultValue", e.target.value)}
                  placeholder="Enter default value"
                />
              </FormField>

              <FormField label="Validation Rules">
                <Input
                  value={formData.validation}
                  onChange={(e) => handleChange("validation", e.target.value)}
                  placeholder="Enter validation pattern"
                />
              </FormField>
            </FormSection>

            <FormSection title="Description" fullWidth>
              <FormField label="Property Description" description="Describe what this property represents">
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter property description..."
                  rows={3}
                />
              </FormField>
            </FormSection>
          </FormLayout>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onCancel} className="perplexity-button">
              Cancel
            </Button>
            <Button type="submit" className="perplexity-button bg-primary hover:bg-primary/90">
              Create Property
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
