"use client"

import React, { ReactNode } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface StatusOption {
  value: string
  label: string
  color: string // Color class like "bg-green-500"
}

interface EditPageLayoutProps {
  title: string
  children: ReactNode
  onSave: () => void | Promise<void>
  onCancel: () => void
  isSaving?: boolean
  hasChanges?: boolean
  saveText?: string
  // Optional status dropdown
  status?: string
  onStatusChange?: (status: string) => void
  statusOptions?: StatusOption[]
  // Optional to hide certain elements
  showStatus?: boolean
}

/**
 * EditPageLayout - A consistent layout for all edit pages with a fixed header
 * 
 * Features:
 * - Fixed header that stays visible when scrolling
 * - Save/Cancel buttons always accessible
 * - Optional status dropdown with colored indicators
 * - Consistent spacing and styling
 * 
 * @example
 * ```tsx
 * <EditPageLayout
 *   title={`Edit Profile: ${profileName}`}
 *   onSave={handleSave}
 *   onCancel={() => router.push('/profiles')}
 *   isSaving={isSaving}
 *   hasChanges={hasChanges}
 *   saveText={saveText}
 *   status={status}
 *   onStatusChange={handleStatusChange}
 *   statusOptions={[
 *     { value: 'active', label: 'Active', color: 'bg-green-500' },
 *     { value: 'inactive', label: 'Inactive', color: 'bg-yellow-500' },
 *     { value: 'deleted', label: 'Deleted', color: 'bg-red-500' }
 *   ]}
 * >
 *   <YourFormContent />
 * </EditPageLayout>
 * ```
 */
export default function EditPageLayout({
  title,
  children,
  onSave,
  onCancel,
  isSaving = false,
  hasChanges = true,
  saveText = "Save",
  status,
  onStatusChange,
  statusOptions = [],
  showStatus = false
}: EditPageLayoutProps) {
  const showStatusDropdown = showStatus && status && onStatusChange && statusOptions.length > 0

  return (
    <>
      {/* Fixed header - positioned to account for main header and sidebar */}
      <div className="fixed top-16 left-64 right-0 z-50 bg-background px-6 py-4 border-b shadow-sm">
        <div className="flex justify-between items-center">
          {/* Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Optional Status Dropdown */}
            {showStatusDropdown && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={status}
                  onValueChange={onStatusChange}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className="min-w-[80px]"
            >
              {isSaving ? "Saving..." : saveText}
            </Button>

            {/* Cancel/Close Button */}
            <Button
              onClick={onCancel}
              variant="outline"
              size="icon"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content with padding to account for fixed header */}
      <div className="pt-6">
        {children}
      </div>
    </>
  )
}
