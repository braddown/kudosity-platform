"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { logger } from "@/lib/utils/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, List, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface List {
  id: string
  name: string
  description?: string
  contact_count?: number
  type?: string
}

interface ListSelectionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (listId: string, listName: string, isNewList: boolean) => Promise<void>
  profileCount: number
}

export function ListSelectionDialog({
  open,
  onClose,
  onConfirm,
  profileCount,
}: ListSelectionDialogProps) {
  const { toast } = useToast()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOption, setSelectedOption] = useState<"existing" | "new">("existing")
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (open) {
      fetchLists()
    }
  }, [open])

  const fetchLists = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/lists")
      if (response.ok) {
        const data = await response.json()
        setLists(Array.isArray(data) ? data : [])
      } else {
        logger.error("Failed to fetch lists")
        setLists([])
      }
    } catch (error) {
      logger.error("Error fetching lists:", error)
      setLists([])
      toast({
        title: "Error",
        description: "Failed to load lists",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleConfirm = async () => {
    if (selectedOption === "existing" && !selectedListId) {
      toast({
        title: "Error",
        description: "Please select a list",
        variant: "destructive",
      })
      return
    }

    if (selectedOption === "new" && !newListName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a list name",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      if (selectedOption === "new") {
        // Create new list first
        const createResponse = await fetch("/api/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Ensure cookies are sent
          body: JSON.stringify({
            name: newListName.trim(),
            description: newListDescription.trim(),
            type: "Manual",
            source: "Manual",
          }),
        })

        if (!createResponse.ok) {
          throw new Error("Failed to create list")
        }

        const newList = await createResponse.json()
        await onConfirm(newList.id, newList.name, true)
      } else {
        const selectedList = lists.find((l) => l.id === selectedListId)
        if (selectedList) {
          await onConfirm(selectedListId, selectedList.name, false)
        }
      }
      
      // Reset form
      setSelectedListId("")
      setNewListName("")
      setNewListDescription("")
      setSelectedOption("existing")
      onClose()
    } catch (error) {
      logger.error("Error processing list selection:", error)
      toast({
        title: "Error",
        description: "Failed to process list selection",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add {profileCount} Profile{profileCount !== 1 ? 's' : ''} to List</DialogTitle>
          <DialogDescription>
            Choose an existing list or create a new one to add the selected profiles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedOption} onValueChange={(value: "existing" | "new") => setSelectedOption(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="cursor-pointer">
                Add to existing list
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="cursor-pointer">
                Create new list
              </Label>
            </div>
          </RadioGroup>

          {selectedOption === "existing" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredLists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No lists found matching your search" : "No lists available"}
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <RadioGroup value={selectedListId} onValueChange={setSelectedListId}>
                    {filteredLists.map((list) => (
                      <div
                        key={list.id}
                        className="flex items-start space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                        onClick={() => setSelectedListId(list.id)}
                      >
                        <RadioGroupItem value={list.id} id={list.id} className="mt-1" />
                        <Label htmlFor={list.id} className="cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            <span className="font-medium">{list.name}</span>
                            {list.contact_count !== undefined && (
                              <span className="text-sm text-muted-foreground">
                                ({list.contact_count} profiles)
                              </span>
                            )}
                          </div>
                          {list.description && (
                            <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="list-name">List Name</Label>
                <Input
                  id="list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="list-description">Description (optional)</Label>
                <Input
                  id="list-description"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Enter list description"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : selectedOption === "new" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create & Add
              </>
            ) : (
              "Add to List"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
