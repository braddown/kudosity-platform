"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface NewPropertyButtonProps {
  onClick: () => void
}

export function NewPropertyButton({ onClick }: NewPropertyButtonProps) {
  return (
    <Button variant="default" onClick={onClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add Property
    </Button>
  )
}
