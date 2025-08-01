"use client"

import MainLayout from "@/components/MainLayout"
import { KudosityTable } from "@/components/KudosityTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import { usePageHeader } from "@/components/PageHeaderContext"
import { useEffect } from "react"

export default function DomainsSettingsPage() {
  const { setPageHeader } = usePageHeader()

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Domains",
      actions: [
        {
          label: "Add New Domain",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => console.log("Add domain"),
        },
      ],
    })
  }, [setPageHeader])

  // Domains data from your original AccountSettings
  const domains = [
    {
      id: 1,
      domain: "short.link",
      status: "Connected",
      description: "Main marketing domain",
      customData: "Yes",
    },
    {
      id: 2,
      domain: "click.here",
      status: "Pending",
      description: "Secondary promotion domain",
      customData: "No",
    },
    {
      id: 3,
      domain: "tap.now",
      status: "Connected",
      description: "Special campaign domain",
      customData: "Yes",
    },
    {
      id: 4,
      domain: "go.to",
      status: "Connected",
      description: "General purpose domain",
      customData: "No",
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusVariants = {
      Connected: "translucent-green",
      Pending: "translucent-orange",
      Inactive: "translucent-gray",
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
      header: "Domain",
      accessorKey: "domain" as keyof (typeof domains)[0],
    },
    {
      header: "Status",
      accessorKey: "status" as keyof (typeof domains)[0],
      cell: (row: (typeof domains)[0]) => getStatusBadge(row.status),
    },
    {
      header: "Description",
      accessorKey: "description" as keyof (typeof domains)[0],
    },
    {
      header: "Custom Data",
      accessorKey: "customData" as keyof (typeof domains)[0],
    },
    {
      header: "Actions",
      accessorKey: "actions" as keyof (typeof domains)[0],
      cell: (row: (typeof domains)[0]) => <ActionMenu item={row} />,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <KudosityTable data={domains} columns={columns} />
      </div>
    </MainLayout>
  )
}
