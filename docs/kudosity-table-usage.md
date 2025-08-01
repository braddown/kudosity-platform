# KudosityTable Component

The KudosityTable component provides a standardized table style for the Kudosity application, matching the design of the Contacts table.

## Basic Usage

\`\`\`tsx
import { KudosityTable, type KudosityTableColumn } from "@/components/KudosityTable"

// Define your data type
interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
}

// Define your columns
const columns: KudosityTableColumn<User>[] = [
  {
    key: "id",
    header: "ID",
    width: "60px",
    sortable: true,
  },
  {
    key: "name",
    header: "Name",
    width: "150px",
    sortable: true,
  },
  {
    key: "email",
    header: "Email",
    width: "200px",
  },
  {
    key: "role",
    header: "Role",
    width: "120px",
  },
  {
    key: "status",
    header: "Status",
    cell: (value, row) => (
      <Badge className={value === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
        {value}
      </Badge>
    ),
    width: "100px",
  },
]

// In your component
return (
  <KudosityTable
    title="Users"
    data={users}
    columns={columns}
    selectable={true}
    onRowClick={(user) => handleUserClick(user)}
    onSearch={handleSearch}
    searchPlaceholder="Search users..."
  />
)
\`\`\`

## Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Optional title for the table |
| `data` | `T[]` | Array of data items to display |
| `columns` | `KudosityTableColumn<T>[]` | Column definitions |
| `selectable` | `boolean` | Whether rows can be selected with checkboxes |
| `onRowClick` | `(row: T) => void` | Callback when a row is clicked |
| `onSelectionChange` | `(selectedRows: T[]) => void` | Callback when selection changes |
| `rowActions` | `(row: T) => React.ReactNode[]` | Function that returns row action menu items |
| `tableActions` | `React.ReactNode[]` | Array of action menu items for the table |
| `searchPlaceholder` | `string` | Placeholder text for the search input |
| `onSearch` | `(term: string) => void` | Callback when search term changes |
| `filterOptions` | `{ label: string; value: string }[]` | Options for the filter dropdown |
| `onFilterChange` | `(value: string) => void` | Callback when filter changes |
| `initialPageSize` | `number` | Initial number of items per page (default: 10) |
| `pageSizeOptions` | `number[]` | Options for page size dropdown (default: [10, 25, 50, 100]) |
| `minTableWidth` | `string` | Minimum width for the table (default: "1200px") |
| `className` | `string` | Additional CSS classes |

## Column Definition

| Property | Type | Description |
|----------|------|-------------|
| `key` | `keyof T` | Property key of the data object |
| `header` | `string` | Column header text |
| `width` | `string` | Width for the column (e.g., "200px") |
| `minWidth` | `string` | Minimum width for the column |
| `maxWidth` | `string` | Maximum width for the column |
| `cell` | `(value: any, row: T) => React.ReactNode` | Custom cell renderer |
| `sortable` | `boolean` | Whether the column is sortable |

## How to Apply to Existing Tables

To apply this table style to an existing table, you can prompt:

"Please update the [Component Name] to use the KudosityTable component."

For example:
- "Please update the PropertiesComponent to use the KudosityTable component."
- "Convert the Logs table to use the KudosityTable component."
