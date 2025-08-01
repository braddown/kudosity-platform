"use client"

import MainLayout from "@/components/MainLayout"
import { KudosityTable } from "@/components/KudosityTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import { usePageHeader } from "@/components/PageHeaderContext"
import { useEffect } from "react"

export default function UsersSettingsPage() {
  const { setPageHeader } = usePageHeader()

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Users",
      actions: [
        {
          label: "Add New User",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => console.log("Add user"),
        },
      ],
    })
  }, [setPageHeader])

  // Users data from your original AccountSettings
  const users = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      mobile: "+1 (555) 111-2222",
      mfaEnabled: "Yes",
      lastAccess: "2023-05-15",
      status: "Active",
      role: "Owner",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      mobile: "+1 (555) 222-3333",
      mfaEnabled: "Yes",
      lastAccess: "2023-05-14",
      status: "Active",
      role: "Admin",
    },
    {
      id: 3,
      name: "Carol Williams",
      email: "carol@example.com",
      mobile: "+1 (555) 333-4444",
      mfaEnabled: "No",
      lastAccess: "2023-05-13",
      status: "Active",
      role: "Operator",
    },
    {
      id: 4,
      name: "David Brown",
      email: "david@example.com",
      mobile: "+1 (555) 444-5555",
      mfaEnabled: "No",
      lastAccess: "2023-05-12",
      status: "Inactive",
      role: "Viewer",
    },
  ]

  const getStatusBadge = (status: string) => {
    return <Badge variant={status === "Active" ? "translucent-green" : "translucent-gray"}>{status}</Badge>
  }

  const ActionMenu = ({ item }: { item: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof (typeof users)[0],
    },
    {
      header: "Email",
      accessorKey: "email" as keyof (typeof users)[0],
    },
    {
      header: "Mobile",
      accessorKey: "mobile" as keyof (typeof users)[0],
    },
    {
      header: "MFA Enabled",
      accessorKey: "mfaEnabled" as keyof (typeof users)[0],
    },
    {
      header: "Last Access",
      accessorKey: "lastAccess" as keyof (typeof users)[0],
    },
    {
      header: "Status",
      accessorKey: "status" as keyof (typeof users)[0],
      cell: (row: (typeof users)[0]) => getStatusBadge(row.status),
    },
    {
      header: "Role",
      accessorKey: "role" as keyof (typeof users)[0],
    },
    {
      header: "Actions",
      accessorKey: "actions" as keyof (typeof users)[0],
      cell: (row: (typeof users)[0]) => <ActionMenu item={row} />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <KudosityTable data={users} columns={columns} />
      </div>
    </MainLayout>
  )
}
