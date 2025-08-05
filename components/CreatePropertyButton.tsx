"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreatePropertyButtonProps {
  onClick: () => void
}

export function CreatePropertyButton({ onClick }: CreatePropertyButtonProps) {
  return (
    <Button variant="default" onClick={onClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add Property
    </Button>
  )
}
