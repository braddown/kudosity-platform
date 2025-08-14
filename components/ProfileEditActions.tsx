"use client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface ProfileEditActionsProps {
  onSave: () => void
  onCancel: () => void
  isSaving?: boolean
  hasChanges?: boolean
  saveText?: string
  status: string
  onStatusChange: (status: string) => void
}

export function ProfileEditActions({ 
  onSave, 
  onCancel, 
  isSaving = false,
  hasChanges = false,
  saveText = "Save",
  status,
  onStatusChange
}: ProfileEditActionsProps) {
  const handleStatusChange = (value: string) => {
    onStatusChange(value)
    // Don't force blur as it might interfere with navigation
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">Status:</span>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[110px] sm:w-[140px] data-[state=open]:outline-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent 
            className="z-[200]" 
            align="start"
            sideOffset={5}
            alignOffset={0}
          >
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Inactive
              </div>
            </SelectItem>
            <SelectItem value="deleted">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Deleted
              </div>
            </SelectItem>
            <SelectItem value="destroyed" disabled>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                Destroyed (Irreversible)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
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
