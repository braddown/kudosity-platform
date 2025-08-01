"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type KudosityTableColumn<T> = {
  header: React.ReactNode
  accessorKey: keyof T | string
  cell?: (row: T) => React.ReactNode
  width?: string
  minWidth?: string
  maxWidth?: string
}

export interface KudosityTableProps<T> {
  title?: string
  data: T[]
  columns: KudosityTableColumn<T>[]
  selectable?: boolean
  onRowClick?: (row: T) => void
  onSelectionChange?: (selectedRows: T[]) => void
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }>
  filterOptions?: { label: string; value: string }[]
  onSearch?: (term: string) => void
  searchPlaceholder?: string
  className?: string
  defaultSortField?: string
  defaultSortDirection?: "asc" | "desc"
  renderPagination?: (
    currentPage: number,
    setCurrentPage: (page: number) => void,
    itemsPerPage: number,
    setItemsPerPage: (count: number) => void,
    pageCount: number,
    data: T[],
  ) => React.ReactNode
}

export function KudosityTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  onRowClick,
  selectable = false,
  onSelectionChange,
  actions,
  filterOptions,
  onSearch,
  searchPlaceholder = "Search...",
  className = "",
  defaultSortField = "category",
  defaultSortDirection = "asc",
  renderPagination,
}: KudosityTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    onSearch?.(e.target.value)
  }

  const pageCount = Math.ceil(data.length / itemsPerPage)

  // Use the same styling patterns as Profiles and Properties tables
  return (
    <div className="w-full space-y-4">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

      <div className="flex items-center justify-between">
        {onSearch && (
          <div className="relative max-w-sm">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
        )}
        {actions && actions.length > 0 && (
          <div className="flex items-center space-x-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                variant="outline"
                className="bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
              {selectable && <TableHead className="w-[40px] px-4 py-3"></TableHead>}
              {columns.map((column, index) => (
                <TableHead
                  key={column.accessorKey.toString()}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  style={{ width: column.width, minWidth: column.minWidth, maxWidth: column.maxWidth }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground py-8"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && <TableCell className="px-4 py-3"></TableCell>}
                  {columns.map((column, colIndex) => {
                    const accessorKey = column.accessorKey as keyof T
                    return (
                      <TableCell
                        key={colIndex}
                        className="px-4 py-3 text-sm text-foreground"
                        style={{ width: column.width, minWidth: column.minWidth, maxWidth: column.maxWidth }}
                      >
                        {column.cell ? column.cell(row) : row[accessorKey]?.toString() || "—"}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {renderPagination &&
        renderPagination(currentPage, setCurrentPage, itemsPerPage, setItemsPerPage, pageCount, data)}
    </div>
  )
}

export type Column<T> = {
  Header: string
  accessorKey: keyof T
  cell?: (row: T) => React.ReactNode
  width?: string
  minWidth?: string
  maxWidth?: string
  sortable?: boolean
}
