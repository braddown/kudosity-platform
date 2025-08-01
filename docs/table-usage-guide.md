# Kudosity Table Usage Guide

This guide explains how to use the standardized `KudosityTable` component across your application.

## Basic Usage

\`\`\`tsx
import { KudosityTable, Column } from '@/components/KudosityTable'

// Define your data type
interface MyDataType {
  id: number
  name: string
  // other properties...
}

// Sample data
const myData: MyDataType[] = [
  // your data here
]

// Define columns
const columns: Column<MyDataType>[] = [
  { Header: 'ID', accessor: 'id' },
  { Header: 'Name', accessor: 'name' },
  // other columns...
]

// In your component
return (
  <KudosityTable 
    data={myData} 
    columns={columns} 
  />
)
\`\`\`

## Props

The `KudosityTable` component accepts the following props:

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of data items to display in the table |
| `columns` | `Column<T>[]` | Array of column definitions |
| `onRowClick` | `(row: T) => void` | Optional callback when a row is clicked |
| `isLoading` | `boolean` | Optional flag to show loading state |
| `emptyMessage` | `string` | Optional message to show when there's no data |
| `className` | `string` | Optional additional CSS classes |

## Column Definition

Each column is defined with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `Header` | `string` | Column header text |
| `accessor` | `keyof T` | Property of the data object to display |
| `Cell` | `(value: any, row: T) => ReactNode` | Optional custom cell renderer |
| `width` | `string` | Optional fixed width for the column |
| `minWidth` | `string` | Optional minimum width for the column |

## Custom Cell Rendering

You can customize how cells are rendered using the `Cell` property:

\`\`\`tsx
const columns: Column<User>[] = [
  { 
    Header: 'Status', 
    accessor: 'status',
    Cell: (value, row) => (
      <span className={`px-2 py-1 rounded-full ${value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {value}
      </span>
    )
  },
]
\`\`\`

## Responsive Behavior

The table automatically handles horizontal scrolling when the content is wider than the container. No additional configuration is needed for this behavior.
\`\`\`

Now, let's update the existing Table component to use our new standardized table:

\`\`\`typescriptreact file="components/Table.tsx"
[v0-no-op-code-block-prefix]import { KudosityTable } from './KudosityTable'

interface TableProps<T> {
  data: T[]
  columns: {
    Header: string
    accessor: keyof T
  }[]
}

function Table<T extends Record<string, any>>({ data, columns }: TableProps<T>) {
  // This is now just a wrapper around KudosityTable for backward compatibility
  return (
    <KudosityTable
      data={data}
      columns={columns}
    />
  )
}

export default Table
