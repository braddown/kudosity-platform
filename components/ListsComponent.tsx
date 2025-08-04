"use client"

import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useApiState, useMutationState } from "@/hooks/use-async-state"
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MessageSquare,
  Edit,
  Trash2,
  Users,
  Search,
  Loader2,
  X
} from "lucide-react"

interface List {
  id: string
  name: string
  description?: string
  member_count: number
  created_at: string
  updated_at: string
  type?: string
  source?: string
  tags?: string[]
  shared?: boolean
  creator_id?: string
}

// Remove the custom useLists hook - we'll use useApiState instead

export default function ListsComponent() {
  const { toast } = useToast()
  
  // Temporary simple fetch for debugging
  const [lists, setLists] = useState<List[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/lists')
      .then(response => {
        console.log('🌐 Fetch response:', response.status, response.statusText)
        return response.json()
      })
      .then(data => {
        console.log('📦 Fetched data:', data, 'Type:', typeof data, 'Length:', data?.length)
        setLists(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('❌ Fetch error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Debug logging
  console.log('🚀 Component state:', { lists, loading, error, type: typeof lists, length: lists?.length })

  const [expandedList, setExpandedList] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedListIds, setSelectedListIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Create list dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [newListTag, setNewListTag] = useState("")
  const [newListTags, setNewListTags] = useState<string[]>([])

  const toggleExpand = (id: string) => {
    setExpandedList(expandedList === id ? null : id)
  }

  const addTag = () => {
    if (newListTag.trim() && !newListTags.includes(newListTag.trim())) {
      setNewListTags([...newListTags, newListTag.trim()])
      setNewListTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewListTags(newListTags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const createList = async () => {
    if (!newListName.trim()) return

    try {
      setCreating(true)
      
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          type: 'Manual',
          source: 'Manual',
          tags: newListTags
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create list: ${response.statusText}`)
      }

      const newList = await response.json()
      
      toast({
        title: "Success",
        description: "List created successfully",
      })

      // Reset form
      setNewListName("")
      setNewListDescription("")
      setNewListTag("")
      setNewListTags([])
      setCreateDialogOpen(false)
      
      // Refresh lists
      refetch()
      
    } catch (err) {
      console.error("Error creating list:", err)
      toast({
        title: "Error",
        description: "Failed to create list",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleAction = async (action: string, list: List) => {
    if (action === "edit") {
      // TODO: Implement edit functionality
      console.log("Edit list:", list.id)
    } else if (action === "delete") {
      if (list.type === 'System') {
        toast({
          title: "Cannot Delete",
          description: "System lists cannot be deleted",
          variant: "destructive",
        })
        return
      }

      if (confirm(`Are you sure you want to delete "${list.name}"?`)) {
        try {
          const response = await fetch(`/api/lists/${list.id}`, {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            throw new Error(`Failed to delete list: ${response.statusText}`)
          }

          toast({
            title: "Success",
            description: "List deleted successfully",
          })
          refetch()
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to delete list",
            variant: "destructive",
          })
        }
      }
    } else if (action === "send") {
      // TODO: Implement send message functionality
      console.log("Send message to list:", list.id)
    }
  }

  const handleCreateNewList = () => {
    setCreateDialogOpen(true)
  }

  const toggleSelectList = (id: string) => {
    setSelectedListIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((listId) => listId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const toggleSelectAll = (filteredLists: List[]) => {
    if (selectAll) {
      setSelectedListIds([])
    } else {
      setSelectedListIds(filteredLists.map((list) => list.id))
    }
    setSelectAll(!selectAll)
  }

  // Expose function to window object for the parent component
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).createNewList = handleCreateNewList
    }

    return () => {
      if (typeof window !== "undefined") {
        ;(window as any).createNewList = undefined
      }
    }
  }, [handleCreateNewList])

  const filteredLists = (lists || []).filter((list) => 
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-md p-8 text-center">
          <div className="text-muted-foreground">Loading lists...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-md p-8 text-center">
          <div className="text-destructive">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-md">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground">All Lists</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search lists..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/30 dark:bg-muted/40">
            <TableRow className="hover:bg-muted/40 dark:hover:bg-muted/50 border-border/50">
              <TableHead className="w-[40px]">
                <Checkbox checked={selectAll} onCheckedChange={() => toggleSelectAll(filteredLists)} aria-label="Select all lists" />
              </TableHead>
              <TableHead className="w-[300px] font-medium text-foreground">List Name</TableHead>
              <TableHead className="font-medium text-foreground">Members</TableHead>
              <TableHead className="font-medium text-foreground">Type</TableHead>
              <TableHead className="font-medium text-foreground">Created</TableHead>
              <TableHead className="font-medium text-foreground">Tags</TableHead>
              <TableHead className="text-right font-medium text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLists.map((list) => (
              <React.Fragment key={list.id}>
                <TableRow className="hover:bg-muted/20 dark:hover:bg-muted/30 border-border/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedListIds.includes(list.id)}
                      onCheckedChange={() => toggleSelectList(list.id)}
                      aria-label={`Select ${list.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center">
                      <Button variant="ghost" size="sm" className="mr-2 p-0" onClick={() => toggleExpand(list.id)}>
                        {expandedList === list.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {list.name}
                      {list.type === 'System' && (
                        <Badge variant="translucent-blue" className="ml-2 text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      {(list.member_count || 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{list.type || 'Manual'}</TableCell>
                  <TableCell className="text-foreground">
                    {new Date(list.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {list.tags && list.tags.length > 0 ? (
                        list.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="translucent-gray" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No tags</span>
                      )}
                      {list.tags && list.tags.length > 2 && (
                        <Badge variant="translucent-gray" className="text-xs">
                          +{list.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border-border/50">
                        <DropdownMenuItem onClick={() => handleAction("send", list)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Send Message</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("edit", list)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit List</span>
                        </DropdownMenuItem>
                        {list.type !== 'System' && (
                          <DropdownMenuItem onClick={() => handleAction("delete", list)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedList === list.id && (
                  <TableRow className="border-border/50">
                    <TableCell colSpan={7} className="bg-muted/20 dark:bg-muted/30">
                      <div className="p-4">
                        <h4 className="text-sm font-semibold mb-2 text-foreground">Description:</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {list.description || "No description provided"}
                        </p>
                        {list.tags && list.tags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-foreground">All Tags:</h4>
                            <div className="flex flex-wrap gap-1">
                              {list.tags.map((tag, index) => (
                                <Badge key={index} variant="translucent-blue" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        {filteredLists.length === 0 && !loading && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No lists found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? `No lists match "${searchTerm}"` : "Create your first list to start organizing your contacts"}
            </p>
          </div>
        )}
      </div>

      {/* Create List Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a new static contact list for organizing your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                placeholder="Enter list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-description">Description (Optional)</Label>
              <Textarea
                id="list-description"
                placeholder="Enter list description..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                disabled={creating}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-tag">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="list-tag"
                  placeholder="Add a tag..."
                  value={newListTag}
                  onChange={(e) => setNewListTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={creating}
                />
                <Button type="button" onClick={addTag} disabled={!newListTag.trim() || creating}>
                  Add
                </Button>
              </div>
              {newListTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newListTags.map((tag, index) => (
                    <Badge key={index} variant="translucent-blue" className="text-xs">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                        disabled={creating}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={createList}
                disabled={creating || !newListName.trim()}
              >
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}