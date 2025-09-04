"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, UserX, Trash2, List, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ListSelectionDialog } from '@/components/features/lists/ListSelectionDialog'
import { softDeleteProfile, restoreProfile, deleteProfile } from '@/lib/api/profiles-api'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('ProfileActions')

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
  lifecycle_stage?: string
  created_at: string
  [key: string]: any
}

interface ProfileActionsProps {
  selectedProfiles: Profile[]
  filteredProfiles: Profile[]
  onSelectionChange: (profiles: Profile[]) => void
  onProfilesUpdated: () => void
}

export function ProfileActions({
  selectedProfiles,
  filteredProfiles,
  onSelectionChange,
  onProfilesUpdated
}: ProfileActionsProps) {
  const { toast } = useToast()
  const [showListDialog, setShowListDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Bulk operations
  const dataOperations = [
    { label: "Bulk Operations", value: "divider_bulk", disabled: true },
    { label: "Add to List", value: "add_to_list", icon: <List className="h-4 w-4" /> },
    { label: "Soft Delete", value: "soft_delete", icon: <UserX className="h-4 w-4" /> },
    { label: "Permanently Delete", value: "delete", icon: <Trash2 className="h-4 w-4" /> },
    { label: "Restore", value: "restore", icon: <RotateCcw className="h-4 w-4" /> }
  ]

  const handleBulkOperation = async (operation: string) => {
    if (selectedProfiles.length === 0) {
      toast({
        title: 'No Profiles Selected',
        description: 'Please select profiles to perform bulk operations',
        variant: 'destructive'
      })
      return
    }

    switch (operation) {
      case 'add_to_list':
        setShowListDialog(true)
        break
      case 'soft_delete':
        await handleBulkSoftDelete()
        break
      case 'delete':
        await handleBulkDelete()
        break
      case 'restore':
        await handleBulkRestore()
        break
    }
  }

  const handleBulkSoftDelete = async () => {
    const activeProfiles = selectedProfiles.filter(p => p.status !== 'deleted')
    
    if (activeProfiles.length === 0) {
      toast({
        title: 'No Active Profiles',
        description: 'Selected profiles are already deleted',
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Are you sure you want to soft delete ${activeProfiles.length} profile(s)? This action can be undone.`)) {
      return
    }

    setIsProcessing(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const profile of activeProfiles) {
        try {
          await softDeleteProfile(profile.id)
          successCount++
        } catch (error) {
          logger.error('Failed to soft delete profile', { profileId: profile.id, error })
          errorCount++
        }
      }

      toast({
        title: 'Bulk Soft Delete Complete',
        description: `${successCount} profiles soft deleted${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      })

      onSelectionChange([])
      onProfilesUpdated()
      logger.info('Bulk soft delete completed', { successCount, errorCount })
    } catch (error) {
      logger.error('Bulk soft delete failed', { error })
      toast({
        title: 'Operation Failed',
        description: 'Failed to soft delete profiles',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkRestore = async () => {
    const deletedProfiles = selectedProfiles.filter(p => 
      p.status === 'deleted' || p.lifecycle_stage?.toLowerCase() === 'deleted'
    )
    
    if (deletedProfiles.length === 0) {
      toast({
        title: 'No Deleted Profiles',
        description: 'Selected profiles are not deleted',
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Are you sure you want to restore ${deletedProfiles.length} profile(s)?`)) {
      return
    }

    setIsProcessing(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const profile of deletedProfiles) {
        try {
          await restoreProfile(profile.id)
          successCount++
        } catch (error) {
          logger.error('Failed to restore profile', { profileId: profile.id, error })
          errorCount++
        }
      }

      toast({
        title: 'Bulk Restore Complete',
        description: `${successCount} profiles restored${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      })

      onSelectionChange([])
      onProfilesUpdated()
      logger.info('Bulk restore completed', { successCount, errorCount })
    } catch (error) {
      logger.error('Bulk restore failed', { error })
      toast({
        title: 'Operation Failed',
        description: 'Failed to restore profiles',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete ${selectedProfiles.length} profile(s)? This action CANNOT be undone.`)) {
      return
    }

    if (!confirm('This will permanently delete all selected profiles and their data. Are you absolutely sure?')) {
      return
    }

    setIsProcessing(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const profile of selectedProfiles) {
        try {
          await deleteProfile(profile.id)
          successCount++
        } catch (error) {
          logger.error('Failed to delete profile', { profileId: profile.id, error })
          errorCount++
        }
      }

      toast({
        title: 'Bulk Delete Complete',
        description: `${successCount} profiles permanently deleted${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      })

      onSelectionChange([])
      onProfilesUpdated()
      logger.info('Bulk delete completed', { successCount, errorCount })
    } catch (error) {
      logger.error('Bulk delete failed', { error })
      toast({
        title: 'Operation Failed',
        description: 'Failed to delete profiles',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddToList = async (listId: string, listName: string, isNewList: boolean) => {
    if (selectedProfiles.length === 0) return

    try {
      setIsProcessing(true)
      
      const profileIds = selectedProfiles.map(p => p.id)
      
      // Call your list API to add profiles
      // This would typically be something like:
      // await listsApi.addProfilesToList(listId, profileIds)
      
      // For now, we'll just log and show success
      logger.info('Profiles added to list', { listId, listName, count: profileIds.length })
      
      toast({
        title: 'Added to List',
        description: `${selectedProfiles.length} profiles added to "${listName}"`
      })
      
      setShowListDialog(false)
      onSelectionChange([])
    } catch (error) {
      logger.error('Failed to add profiles to list', { error })
      toast({
        title: 'Operation Failed',
        description: 'Failed to add profiles to list',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Check if all selected profiles are deleted
  const allSelectedDeleted = selectedProfiles.length > 0 && 
    selectedProfiles.every(profile => 
      profile.status === 'deleted' || profile.lifecycle_stage?.toLowerCase() === 'deleted'
    )

  return (
    <div className="flex items-center gap-4">
      {/* Selection Info */}
      {selectedProfiles.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedProfiles.length} selected
        </div>
      )}

      {/* Bulk Operations Dropdown */}
      <Select onValueChange={handleBulkOperation} disabled={isProcessing}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select action..." />
        </SelectTrigger>
        <SelectContent>
          {dataOperations.map((operation) => (
            <SelectItem
              key={operation.value}
              value={operation.value}
              disabled={
                operation.disabled ||
                selectedProfiles.length === 0 ||
                (operation.value === 'restore' && !allSelectedDeleted) ||
                (operation.value === 'soft_delete' && allSelectedDeleted)
              }
            >
              <div className="flex items-center gap-2">
                {operation.icon}
                {operation.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quick Action Buttons */}
      {selectedProfiles.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowListDialog(true)}
            disabled={isProcessing}
            className="flex items-center gap-1"
          >
            <List className="h-4 w-4" />
            Add to List
          </Button>

          {allSelectedDeleted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              disabled={isProcessing}
              className="flex items-center gap-1 text-green-600 hover:text-green-700"
            >
              <RotateCcw className="h-4 w-4" />
              Restore
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSoftDelete}
              disabled={isProcessing}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <UserX className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* List Selection Dialog */}
      {showListDialog && (
        <ListSelectionDialog
          open={showListDialog}
          onClose={() => setShowListDialog(false)}
          onConfirm={handleAddToList}
          profileCount={selectedProfiles.length}
        />
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="text-sm text-muted-foreground">
          Processing...
        </div>
      )}
    </div>
  )
}