"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreatePropertyButtonProps {
  onClick: () => void
}

export function CreatePropertyButton({ onClick }: CreatePropertyButtonProps) {
  return (
    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add Property
    </Button>
  )
}
