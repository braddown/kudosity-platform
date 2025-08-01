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
        className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 h-10 rounded-md"
      >
        {isSaving ? "Saving..." : saveText}
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        className="bg-gray-100 hover:bg-gray-200 text-black p-2 h-10 w-10 rounded-md flex items-center justify-center"
      >
        <X className="h-5 w-5 text-slate-300 text-slate-400" />
      </Button>
    </div>
  )
}
