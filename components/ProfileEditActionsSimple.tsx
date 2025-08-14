"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ProfileEditActionsSimpleProps {
  onSave: () => void
  onCancel: () => void
  isSaving?: boolean
  hasChanges?: boolean
  saveText?: string
  status: string
  onStatusChange: (status: string) => void
}

export function ProfileEditActionsSimple({
  onSave,
  onCancel,
  isSaving = false,
  hasChanges = false,
  saveText = "Save",
  status,
  onStatusChange
}: ProfileEditActionsSimpleProps) {
  
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">Status:</span>
        <select 
          value={status} 
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-[110px] sm:w-[140px] h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
        >
          <option value="active">🟢 Active</option>
          <option value="inactive">🟡 Inactive</option>
          <option value="deleted">🔴 Deleted</option>
          <option value="destroyed" disabled>⚫ Destroyed</option>
        </select>
      </div>
      <div className="border-l pl-3 ml-3 flex items-center space-x-2">
        <Button
          onClick={onSave}
          disabled={isSaving || !hasChanges || saveText === "Saved!"}
          variant="default"
          type="button"
          className={`px-8 ${
            saveText === "Saved!"
              ? 'bg-green-600 hover:bg-green-600 text-white'
              : (!hasChanges && !isSaving)
                ? 'opacity-50 cursor-not-allowed'
                : ''
          }`}
        >
          {isSaving ? "Saving..." : saveText}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="icon"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
