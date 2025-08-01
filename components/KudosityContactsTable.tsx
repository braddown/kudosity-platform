"use client"
import { useState, useMemo } from "react"
import { KudosityTable, type KudosityTableColumn } from "@/components/KudosityTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon, MoreHorizontal, Eye, Tag, ListIcon, X, Trash2, Settings2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

interface Contact {
  id: string | number
  [key: string]: any
}

interface KudosityContactsTableProps {
  contacts?: Contact[] // Make contacts optional to handle loading states gracefully
  isLoading?: boolean
  onEditContact: (contact: Contact) => void
  onTagContact?: (contactId: number | string) => void
  onAddToList?: (contactId: number | string) => void
  onUnsubscribeContact: (contactId: number | string) => void
  onDeleteContact: (contactId: number | string) => void
  // Removed other props that were part of the old monolithic component for clarity
  // Parent component should manage pagination, search, sort, column visibility state if needed globally
}

const formatColumnHeader = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim()
}

const getCountryFlag = (country?: string): string => {
  if (!country) return "🏳️"
  const lowerCountry = country.toLowerCase()
  if (lowerCountry.includes("new zealand") || lowerCountry === "nz") return "🇳🇿"
  if (lowerCountry.includes("australia") || lowerCountry === "au") return "🇦🇺"
  if (lowerCountry.includes("united states") || lowerCountry === "us") return "🇺🇸"
  if (lowerCountry.includes("united kingdom") || lowerCountry === "gb") return "🇬🇧"
  return "🏳️"
}

const getStatusColor = (
  status?: string,
): "translucent-green" | "translucent-gray" | "translucent-orange" | "translucent-blue" | "default" => {
  if (!status) return "default"
  const lowerStatus = status.toLowerCase()
  if (lowerStatus === "active") return "translucent-green"
  if (lowerStatus === "inactive") return "translucent-gray"
  if (lowerStatus === "suppressed" || lowerStatus === "unsubscribed") return "translucent-orange"
  if (lowerStatus === "deleted" || lowerStatus === "bounced") return "translucent-orange"
  return "translucent-blue"
}

export function KudosityContactsTable({
  contacts = [], // Default to empty array if undefined
  isLoading = false,
  onEditContact,
  onTagContact,
  onAddToList,
  onUnsubscribeContact,
  onDeleteContact,
}: KudosityContactsTableProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string | number>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: "asc" | "desc" } | null>(null)

  const ALL_AVAILABLE_FIELDS: (keyof Contact)[] = useMemo(() => {
    if (!contacts || contacts.length === 0) {
      // Guard against undefined or empty contacts
      return ["id", "first_name", "last_name", "email", "mobile", "status", "created_at"]
    }
    // Ensure contacts[0] exists before trying to get its keys
    return contacts[0]
      ? (Object.keys(contacts[0]) as (keyof Contact)[])
      : ["id", "first_name", "last_name", "email", "mobile", "status", "created_at"]
  }, [contacts])

  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Contact>>(() => {
    // Initialize visibleColumns based on ALL_AVAILABLE_FIELDS or a default set
    const defaultVisible = new Set(["first_name", "last_name", "email", "mobile", "status", "created_at"])
    // Ensure default visible columns are part of available fields if possible
    if (contacts && contacts.length > 0 && contacts[0]) {
      const available = Object.keys(contacts[0])
      return new Set(Array.from(defaultVisible).filter((col) => available.includes(String(col))))
    }
    return defaultVisible
  })

  const toggleColumnVisibility = (column: keyof Contact) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(column)) {
        newSet.delete(column)
      } else {
        newSet.add(column)
      }
      return newSet
    })
  }

  const resetColumnVisibility = () => {
    const defaultVisible = new Set(["first_name", "last_name", "email", "mobile", "status", "created_at"])
    if (contacts && contacts.length > 0 && contacts[0]) {
      const available = Object.keys(contacts[0])
      setVisibleColumns(new Set(Array.from(defaultVisible).filter((col) => available.includes(String(col)))))
    } else {
      setVisibleColumns(defaultVisible)
    }
  }

  const handleSort = (key: keyof Contact) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return [] // Guard: return empty array
    const currentContacts = [...contacts] // Create a mutable copy
    if (!sortConfig) return currentContacts

    return currentContacts.sort((a, b) => {
      const valA = a[sortConfig.key]
      const valB = b[sortConfig.key]

      if (valA === null || valA === undefined) return sortConfig.direction === "asc" ? -1 : 1
      if (valB === null || valB === undefined) return sortConfig.direction === "asc" ? 1 : -1

      if (valA < valB) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (valA > valB) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [contacts, sortConfig])

  const onSelectionChange = (selectedItems: Contact[]) => {
    setSelectedContactIds(new Set(selectedItems.map((item) => item.id)))
  }

  const columns = useMemo((): KudosityTableColumn<Contact>[] => {
    const dynamicColumns: KudosityTableColumn<Contact>[] = Array.from(visibleColumns)
      .filter((key) => ALL_AVAILABLE_FIELDS.includes(key))
      .map((key) => ({
        accessorKey: key,
        header: (
          <div onClick={() => handleSort(key)} className="flex items-center gap-1 cursor-pointer">
            {formatColumnHeader(String(key))}
            {sortConfig?.key === key &&
              (sortConfig.direction === "asc" ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              ))}
          </div>
        ),
        cell: (contact: Contact) => {
          const value = contact[key]
          if (key === "mobile") {
            return (
              <span>
                {getCountryFlag(contact.country as string)} {value as string}
              </span>
            )
          }
          if (key === "created_at" || key === "updated_at" || key === "last_login") {
            try {
              return value ? format(new Date(value as string | number | Date), "PPpp") : "N/A"
            } catch {
              return String(value ?? "N/A")
            }
          }
          if (key === "status") {
            return <Badge variant={getStatusColor(value as string)}>{value as string}</Badge>
          }
          return String(value ?? "N/A")
        },
        width: key === "email" ? "250px" : key === "id" ? "100px" : "150px",
      }))

    dynamicColumns.push({
      accessorKey: "actions",
      header: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <Settings2 className="h-4 w-4" />
              <span className="sr-only">Column options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
            <DropdownMenuItem disabled className="font-semibold">
              Column Visibility
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {ALL_AVAILABLE_FIELDS.map((field) => (
              <DropdownMenuCheckboxItem
                key={String(field)}
                checked={visibleColumns.has(field)}
                onCheckedChange={() => toggleColumnVisibility(field)}
              >
                {formatColumnHeader(String(field))}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetColumnVisibility}>Reset to Default</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cell: (contact: Contact) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditContact(contact)}>
              <Eye className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            {onTagContact && (
              <DropdownMenuItem onClick={() => onTagContact(contact.id)}>
                <Tag className="mr-2 h-4 w-4" /> Tag
              </DropdownMenuItem>
            )}
            {onAddToList && (
              <DropdownMenuItem onClick={() => onAddToList(contact.id)}>
                <ListIcon className="mr-2 h-4 w-4" /> Add to List
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUnsubscribeContact(contact.id)} className="text-yellow-600">
              <X className="mr-2 h-4 w-4" /> Unsubscribe
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteContact(contact.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: "80px",
    })
    return dynamicColumns
  }, [
    visibleColumns,
    sortConfig,
    // contacts, // Removed 'contacts' from here as ALL_AVAILABLE_FIELDS depends on it
    ALL_AVAILABLE_FIELDS, // Depend on ALL_AVAILABLE_FIELDS instead
    onEditContact,
    onTagContact,
    onAddToList,
    onUnsubscribeContact,
    onDeleteContact,
  ])

  if (isLoading && sortedContacts.length === 0) {
    // Show loading only if there's no data yet
    return <div className="text-center p-8">Loading contacts...</div>
  }

  return (
    <KudosityTable
      data={sortedContacts} // This will be an empty array if contacts is undefined/empty or during loading
      columns={columns}
      selectable={true}
      onSelectionChange={onSelectionChange}
      onRowClick={onEditContact}
      className="w-full"
    />
  )
}
