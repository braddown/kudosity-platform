"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Edit, Trash2, Copy } from "lucide-react"
import { KudosityTable, type KudosityTableColumn } from "@/components/KudosityTable"
import { logger } from "@/lib/utils/logger"

interface ApiKey {
  id: number
  key: string
  description: string
  created: string
  lastUsed: string
  permissions: string[]
}

const ActionMenu = ({
  item,
  onEdit,
  onDelete,
}: {
  item: ApiKey
  onEdit: (item: ApiKey) => void
  onDelete: (item: ApiKey) => void
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onEdit(item)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.key)}>
        <Copy className="mr-2 h-4 w-4" />
        Copy Key
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default function ApiKeys() {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ApiKey | null>(null)

  const apiKeys: ApiKey[] = [
    {
      id: 1,
      key: "sk_live_1234567890abcdef",
      description: "Production API Key",
      created: "2024-01-15",
      lastUsed: "2024-01-20",
      permissions: ["read", "write"],
    },
    {
      id: 2,
      key: "sk_test_1234567890abcdef",
      description: "Test API Key",
      created: "2024-01-10",
      lastUsed: "2024-01-19",
      permissions: ["read"],
    },
    {
      id: 3,
      key: "sk_dev_1234567890abcdef",
      description: "Development API Key",
      created: "2024-01-05",
      lastUsed: "Never",
      permissions: ["read", "write"],
    },
  ]

  const columns: KudosityTableColumn<ApiKey>[] = [
    {
      header: "API Key",
      accessorKey: "key",
      cell: (row) => <span className="font-mono">{row.key}</span>,
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Created",
      accessorKey: "created",
    },
    {
      header: "Last Used",
      accessorKey: "lastUsed",
    },
    {
      header: "Permissions",
      accessorKey: "permissions",
      cell: (row) => (
        <div className="flex gap-1">
          {row.permissions.map((perm) => (
            <Badge key={perm} variant="translucent-blue" className="text-xs">
              {perm}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row) => <ActionMenu item={row} onEdit={handleEditApiKey} onDelete={handleDeleteApiKey} />,
    },
  ]

  const handleEditApiKey = (apiKey: ApiKey) => {
    setEditingItem(apiKey)
    setShowApiKeyDialog(true)
  }

  const handleDeleteApiKey = (apiKey: ApiKey) => {
    logger.debug("Delete API Key:", apiKey)
  }

  const resetDialog = () => {
    setEditingItem(null)
    setShowApiKeyDialog(false)
  }

  return (
    <div className="space-y-4">
      <KudosityTable data={apiKeys} columns={columns} />

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit API Key" : "Generate New API Key"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter a description for this API key"
                defaultValue={editingItem?.description || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="read" defaultChecked={editingItem?.permissions?.includes("read")} />
                  <Label htmlFor="read">Read access</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="write" defaultChecked={editingItem?.permissions?.includes("write")} />
                  <Label htmlFor="write">Write access</Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button variant="default" onClick={resetDialog}>
              {editingItem ? "Update" : "Generate"} API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
