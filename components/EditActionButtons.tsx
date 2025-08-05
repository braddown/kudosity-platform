"use client"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface EditActionButtonsProps {
  onSave: () => void
  onCancel: () => void
  isSaving?: boolean
  saveText?: string
}

export function EditActionButtons({ onSave, onCancel, isSaving = false, saveText = "Save" }: EditActionButtonsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="default"
        className="px-8"
      >
        {isSaving ? "Saving..." : saveText}
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        size="icon"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
