"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface NewPropertyButtonProps {
  onClick: () => void
}

export function NewPropertyButton({ onClick }: NewPropertyButtonProps) {
  return (
    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add Property
    </Button>
  )
}
