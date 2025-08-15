"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Search, MoreHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface DataTableColumn<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  filterOptions?: { label: string; value: string }[]
  onFilterChange?: (value: string) => void
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }>
  bulkActions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (selectedRows: T[]) => void
  }>
  pagination?: {
    currentPage: number
    totalPages: number
    pageSize: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
  title?: string
  onRowEdit?: (row: T) => void
  onRowDelete?: (row: T) => void
  onRowRestore?: (row: T) => void
  onRowDestroy?: (row: T) => void
  selectedFilter?: string
}

export function DataTable<T extends { id: string | number; status?: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  selectable = false,
  onSelectionChange,
  filterOptions,
  onFilterChange,
  actions,
  bulkActions,
  pagination,
  title = "All Items",
  onRowEdit,
  onRowDelete,
  onRowRestore,
  onRowDestroy,
  selectedFilter: propsSelectedFilter,
  ...props
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<T[]>([])
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedFilter, setSelectedFilter] = React.useState(propsSelectedFilter || filterOptions?.[0]?.value || "all")

  // Create a ref for the indeterminate checkbox
  const checkboxRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (propsSelectedFilter) {
      setSelectedFilter(propsSelectedFilter)
    }
  }, [propsSelectedFilter])

  // Update the indeterminate state when selectedRows changes
  React.useEffect(() => {
    if (checkboxRef.current) {
      const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length
      // Access the DOM element and set the indeterminate property
      const checkboxElement = checkboxRef.current as unknown as HTMLInputElement
      if (checkboxElement) {
        checkboxElement.indeterminate = isIndeterminate
      }
    }
  }, [selectedRows, data])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(data)
      onSelectionChange?.(data)
    } else {
      setSelectedRows([])
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (row: T, checked: boolean) => {
    let newSelection: T[]
    if (checked) {
      newSelection = [...selectedRows, row]
    } else {
      newSelection = selectedRows.filter((r) => r.id !== row.id)
    }
    setSelectedRows(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value)
    onFilterChange?.(value)
  }

  const isAllSelected = data.length > 0 && selectedRows.length === data.length

  return (
    <div className="w-full bg-card rounded-lg shadow-sm border border-border">
      {/* Table Controls */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-card-foreground">{title}</h3>
          {filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 hover:bg-accent">
                  {filterOptions?.find((f) => f.value === selectedFilter)?.label || "All"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border w-64">
                {/* Data Operations at the top */}
                {actions && actions.length > 0 && (
                  <>
                    {actions.map((action, index) => (
                      <DropdownMenuItem 
                        key={`action-${index}`} 
                        onClick={action.onClick} 
                        className="hover:bg-accent text-foreground"
                      >
                        <span className="flex items-center gap-2">
                          {action.icon}
                          {action.label}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <div className="my-1 h-px bg-border" />
                  </>
                )}
                
                {/* Search for long lists */}
                {filterOptions.length > 10 && (
                  <>
                    <div className="px-2 py-2">
                      <Input
                        placeholder="Search lists & segments..."
                        className="h-8"
                        onChange={(e) => {
                          const searchValue = e.target.value.toLowerCase()
                          // Filter the dropdown items based on search
                          const items = document.querySelectorAll('[data-filter-option]')
                          items.forEach((item) => {
                            const label = item.getAttribute('data-filter-label')?.toLowerCase() || ''
                            if (label.includes(searchValue)) {
                              (item as HTMLElement).style.display = ''
                            } else {
                              (item as HTMLElement).style.display = 'none'
                            }
                          })
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="my-1 h-px bg-border" />
                  </>
                )}
                
                {/* Filter/List/Segment Options */}
                {filterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    data-filter-option
                    data-filter-label={option.label}
                    onClick={() => handleFilterChange(option.value)}
                    className="hover:bg-accent text-foreground"
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-[250px] h-10 bg-background border-border"
            />
          </div>
          
          {/* Bulk Actions - always visible, disabled when no selection */}
          {bulkActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-10 hover:bg-accent"
                  disabled={selectedRows.length === 0}
                >
                  Actions {selectedRows.length > 0 && `(${selectedRows.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border">
                {bulkActions.map((action, index) => (
                  <DropdownMenuItem 
                    key={index} 
                    onClick={() => action.onClick(selectedRows)} 
                    className="hover:bg-accent text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      {action.icon}
                      {action.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-muted/50">
              {selectable && (
                <TableHead className="w-[50px] bg-muted/50">
                  <Checkbox ref={checkboxRef} checked={isAllSelected} onCheckedChange={handleSelectAll} />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  style={{ width: column.width }}
                  className="bg-muted/50 font-medium text-foreground"
                >
                  {column.header}
                </TableHead>
              ))}
              <TableHead className="w-[50px] bg-muted/50"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 2 : 1)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const isDeleted = row.status === "deleted"

                return (
                  <TableRow
                    key={row.id}
                    className={`border-b border-border hover:bg-muted/50 ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                  >
                    {selectable && (
                      <TableCell className="bg-card">
                        <Checkbox
                          checked={selectedRows.some((r) => r.id === row.id)}
                          onCheckedChange={(checked) => handleSelectRow(row, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id} className="bg-card">
                        {column.cell
                          ? column.cell(row)
                          : column.accessorKey
                            ? String(row[column.accessorKey] || "")
                            : ""}
                      </TableCell>
                    ))}
                    <TableCell className="bg-card">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          {isDeleted ? (
                            // Actions for deleted profiles
                            <>
                              {onRowRestore && (
                                <DropdownMenuItem
                                  onClick={() => onRowRestore(row)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                >
                                  Restore
                                </DropdownMenuItem>
                              )}
                              {onRowDestroy && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const confirmMessage = 
                                      'first_name' in row && 'last_name' in row
                                        ? `⚠️ PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to permanently destroy the profile for ${(row as any).first_name} ${(row as any).last_name}?\n\nThis will:\n• Remove the profile completely from the database\n• Delete all associated activity logs\n• Remove from all lists and segments\n• Delete all related metadata\n\nThis action CANNOT be undone.`
                                        : "⚠️ PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to permanently destroy this item?\n\nThis will remove all data from the database and CANNOT be undone."
                                    
                                    if (window.confirm(confirmMessage)) {
                                      onRowDestroy(row)
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  Destroy
                                </DropdownMenuItem>
                              )}
                            </>
                          ) : (
                            // Actions for active profiles
                            <>
                              {onRowEdit && (
                                <DropdownMenuItem
                                  onClick={() => onRowEdit(row)}
                                  className="hover:bg-accent text-foreground"
                                >
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {onRowDelete && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const confirmMessage = 
                                      'first_name' in row && 'last_name' in row
                                        ? `Are you sure you want to delete the profile for ${(row as any).first_name} ${(row as any).last_name}?\n\nThis will mark the profile as deleted but preserve the data.`
                                        : "Are you sure you want to delete this item? This action will mark it as deleted but preserve the data."
                                    
                                    if (window.confirm(confirmMessage)) {
                                      onRowDelete(row)
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between space-x-2 p-6 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => {
                const newPageSize = Number(value)
                pagination.onPageSizeChange(newPageSize)
                // Reset to first page when changing page size
                pagination.onPageChange(1)
              }}
            >
              <SelectTrigger className="w-20 h-10 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-card-foreground">per page</span>
            <span className="text-sm text-muted-foreground ml-4">
              Showing {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems)} to{" "}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems}{" "}
              items
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="hover:bg-accent"
            >
              Previous
            </Button>

            {/* Show more intelligent pagination for large datasets */}
            {pagination.totalPages <= 7 ? (
              // Show all pages if 7 or fewer
              Array.from({ length: pagination.totalPages }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(page)}
                    className={pagination.currentPage === page ? "" : "hover:bg-accent"}
                  >
                    {page}
                  </Button>
                )
              })
            ) : (
              // Show smart pagination for large datasets
              <>
                {/* First page */}
                <Button
                  variant={pagination.currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => pagination.onPageChange(1)}
                  className={pagination.currentPage === 1 ? "" : "hover:bg-accent"}
                >
                  1
                </Button>

                {/* Show ellipsis if current page is far from start */}
                {pagination.currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}

                {/* Show pages around current page */}
                {Array.from({ length: 3 }, (_, i) => {
                  const page = pagination.currentPage - 1 + i
                  if (page > 1 && page < pagination.totalPages) {
                    return (
                      <Button
                        key={page}
                        variant={pagination.currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => pagination.onPageChange(page)}
                        className={pagination.currentPage === page ? "" : "hover:bg-accent"}
                      >
                        {page}
                      </Button>
                    )
                  }
                  return null
                }).filter(Boolean)}

                {/* Show ellipsis if current page is far from end */}
                {pagination.currentPage < pagination.totalPages - 3 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}

                {/* Last page */}
                {pagination.totalPages > 1 && (
                  <Button
                    variant={pagination.currentPage === pagination.totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(pagination.totalPages)}
                    className={pagination.currentPage === pagination.totalPages ? "" : "hover:bg-accent"}
                  >
                    {pagination.totalPages}
                  </Button>
                )}
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="hover:bg-accent"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
