"use client"

import MainLayout from "@/components/MainLayout"
import { KudosityTable } from "@/components/KudosityTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import { usePageHeader } from "@/components/PageHeaderContext"
import { useEffect } from "react"

export default function SendersSettingsPage() {
  const { setPageHeader } = usePageHeader()

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Senders",
      actions: [
        {
          label: "Add New Sender",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => console.log("Add sender"),
        },
      ],
    })
  }, [setPageHeader])

  // Senders data from your original AccountSettings
  const senders = [
    {
      id: 1,
      country: "🇺🇸 USA",
      sender: "+1 555-0123",
      status: "Active",
      type: "Virtual Number",
      description: "US customer support line",
    },
    {
      id: 2,
      country: "🇬🇧 UK",
      sender: "ACME",
      status: "Pending",
      type: "Custom Sender ID",
      description: "UK marketing campaigns",
    },
    {
      id: 3,
      country: "🇨🇦 Canada",
      sender: "+1 555-0456",
      status: "Active",
      type: "Virtual Number",
      description: "Canadian sales team",
    },
    {
      id: 4,
      country: "🇦🇺 Australia",
      sender: "YourBrand",
      status: "Active",
      type: "Custom Sender ID",
      description: "Australian promotional messages",
    },
    {
      id: 5,
      country: "🇩🇪 Germany",
      sender: "+49 555-0789",
      status: "Inactive",
      type: "Virtual Number",
      description: "German customer service",
    },
    {
      id: 6,
      country: "🇫🇷 France",
      sender: "CompanyXYZ",
      status: "Active",
      type: "Custom Sender ID",
      description: "French marketing alerts",
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusVariants = {
      Active: "translucent-green",
      Inactive: "translucent-gray",
      Pending: "translucent-orange",
    }

    return <Badge variant={statusVariants[status] || "translucent-gray"}>{status}</Badge>
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
      header: "Country",
      accessorKey: "country" as keyof (typeof senders)[0],
    },
    {
      header: "Sender",
      accessorKey: "sender" as keyof (typeof senders)[0],
    },
    {
      header: "Status",
      accessorKey: "status" as keyof (typeof senders)[0],
      cell: (row: (typeof senders)[0]) => getStatusBadge(row.status),
    },
    {
      header: "Type",
      accessorKey: "type" as keyof (typeof senders)[0],
    },
    {
      header: "Description",
      accessorKey: "description" as keyof (typeof senders)[0],
    },
    {
      header: "Actions",
      accessorKey: "actions" as keyof (typeof senders)[0],
      cell: (row: (typeof senders)[0]) => <ActionMenu item={row} />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <KudosityTable data={senders} columns={columns} />
      </div>
    </MainLayout>
  )
}
