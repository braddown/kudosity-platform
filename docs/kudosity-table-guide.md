# KudosityTable Component Guide

The KudosityTable component is a standardized table component for the Kudosity application. It provides a consistent look and feel across all tables in the application.

## Features

- **Consistent Styling**: Border, header styling, and row styling
- **Sortable Columns**: Click on column headers to sort data
- **Pagination**: Navigate through large datasets with pagination controls
- **Responsive Design**: Horizontal scrolling on smaller screens with scroll indicator
- **Custom Cell Rendering**: Customize how cells are displayed
- **Row Click Handling**: Handle clicks on table rows

## Basic Usage

\`\`\`tsx
import { KudosityTable, type Column } from "@/components/KudosityTable"

// Define your data type
interface MyData {
  id: number
  name: string
  // other properties...
}

// Define your columns
const columns: Column<MyData>[] = [
  { 
    Header: "ID", 
    accessorKey: "id",
    sortable: true 
  },
  { 
    Header: "Name", 
    accessorKey: "name",
    sortable: true 
  },
  // other columns...
]

// In your component
return (
  <KudosityTable
    data={myData}
    columns={columns}
    pageSize={10}
    initialSortField="name"
    initialSortDirection="asc"
  />
)
\`\`\`

## Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of data items to display |
| `columns` | `Column<T>[]` | Column definitions |
| `onRowClick` | `(row: T) => void` | Optional callback when a row is clicked |
| `emptyMessage` | `string` | Message to display when there's no data |
| `pageSize` | `number` | Number of items per page (default: 10) |
| `initialSortField` | `keyof T` | Initial field to sort by |
| `initialSortDirection` | `"asc" \| "desc"` | Initial sort direction |

## Column Definition

| Property | Type | Description |
|----------|------|-------------|
| `Header` | `string` | Column header text |
| `accessorKey` | `keyof T` | Property of the data object to display |
| `cell` | `(row: T) => ReactNode` | Custom cell renderer |
| `width` | `string` | Fixed width for the column |
| `minWidth` | `string` | Minimum width for the column |
| `maxWidth` | `string` | Maximum width for the column |
| `sortable` | `boolean` | Whether the column is sortable |

## Custom Cell Rendering

You can customize how cells are rendered using the `cell` property:

\`\`\`tsx
const columns: Column<User>[] = [
  {
    Header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (row) => (
      <span className={`px-2 py-1 rounded-full ${
        row.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>
        {row.status}
      </span>
    ),
  },
]
