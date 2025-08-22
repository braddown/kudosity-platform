"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, List, Clock } from "lucide-react"

interface Segment {
  id: string
  name: string
  filter?: string
  criteria?: any
  filterGroups?: any
  conditions?: any
  updated_at?: string
  profile_count?: number
}

interface ListItem {
  id: string
  name: string
  member_count?: number
  contact_count?: number
  updated_at?: string
}

interface SegmentListDropdownProps {
  segments: Segment[]
  lists: ListItem[]
  selectedId: string | null
  onSelect: (type: 'segment' | 'list', id: string, name: string) => void
  placeholder?: string
}

export function SegmentListDropdown({
  segments,
  lists,
  selectedId,
  onSelect,
  placeholder = "Select a segment or list..."
}: SegmentListDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)

  // Get 5 most recent segments and lists (excluding test lists only)
  const recentSegments = useMemo(() => {
    // Only exclude test lists
    const excludedNames = ['test lists', 'test list']
    return [...segments]
      .filter(segment => !excludedNames.includes(segment.name.toLowerCase()))
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || 0).getTime()
        const dateB = new Date(b.updated_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [segments])

  const recentLists = useMemo(() => {
    // Only exclude test lists
    const excludedNames = ['test lists', 'test list']
    return [...lists]
      .filter(list => !excludedNames.includes(list.name.toLowerCase()))
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || 0).getTime()
        const dateB = new Date(b.updated_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [lists])

  // Filter segments and lists based on search
  const filteredSegments = useMemo(() => {
    const excludedNames = ['test lists', 'test list']
    if (!searchTerm) return recentSegments
    return segments
      .filter(segment => !excludedNames.includes(segment.name.toLowerCase()))
      .filter(segment =>
        segment.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  }, [segments, recentSegments, searchTerm])

  const filteredLists = useMemo(() => {
    const excludedNames = ['test lists', 'test list']
    if (!searchTerm) return recentLists
    return lists
      .filter(list => !excludedNames.includes(list.name.toLowerCase()))
      .filter(list =>
        list.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  }, [lists, recentLists, searchTerm])

  // Find the currently selected item
  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    
    const segment = segments.find(s => s.id === selectedId)
    if (segment) return { type: 'segment', ...segment }
    
    const list = lists.find(l => l.id === selectedId)
    if (list) return { ...list, type: 'list' as const, listType: (list as any).type }
    
    return null
  }, [selectedId, segments, lists])

  const handleSelect = (value: string) => {
    const [type, id] = value.split(':')
    
    if (type === 'segment') {
      const segment = segments.find(s => s.id === id)
      if (segment) {
        onSelect('segment', segment.id, segment.name)
      }
    } else if (type === 'list') {
      const list = lists.find(l => l.id === id)
      if (list) {
        onSelect('list', list.id, list.name)
      }
    }
    
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <Select
      value={selectedId ? `${selectedItem?.type}:${selectedId}` : undefined}
      onValueChange={handleSelect}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder={placeholder}>
          {selectedItem && (
            <div className="flex items-center gap-2">
              {selectedItem.type === 'segment' ? (
                <Users className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
              <span>{selectedItem.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {selectedItem.type === 'list' && (selectedItem as any).listType === 'Manual' ? 'User' : 
                 selectedItem.type === 'list' ? (selectedItem as any).listType : 
                 selectedItem.type}
              </Badge>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-[320px]">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search segments and lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        
        <SelectSeparator />
        
        {/* Segments Section */}
        {filteredSegments.length > 0 && (
          <>
            <SelectGroup>
              <SelectLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {searchTerm ? "Segments" : "Recent Segments"}
                {!searchTerm && (
                  <Clock className="h-3 w-3 text-muted-foreground ml-auto" />
                )}
              </SelectLabel>
              {filteredSegments.map((segment) => (
                <SelectItem
                  key={segment.id}
                  value={`segment:${segment.id}`}
                  className="pl-8"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{segment.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {segment.profile_count || 0} profiles
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
            
            {filteredLists.length > 0 && <SelectSeparator />}
          </>
        )}
        
        {/* Lists Section */}
        {filteredLists.length > 0 && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2">
              <List className="h-4 w-4" />
              {searchTerm ? "Lists" : "Recent Lists"}
              {!searchTerm && (
                <Clock className="h-3 w-3 text-muted-foreground ml-auto" />
              )}
            </SelectLabel>
            {filteredLists.map((list) => (
              <SelectItem
                key={list.id}
                value={`list:${list.id}`}
                className="pl-8"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{list.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {list.contact_count || list.member_count || 0} profiles
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        
        {/* No results */}
        {filteredSegments.length === 0 && filteredLists.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchTerm ? `No results found for "${searchTerm}"` : "No segments or lists available"}
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
