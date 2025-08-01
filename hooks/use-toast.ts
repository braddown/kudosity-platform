"use client"

import { useState } from "react"

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([])

  const toast = (props: any) => {
    console.log("Toast:", props)
    return {
      id: Math.random().toString(),
      dismiss: () => {},
    }
  }

  return {
    toasts,
    toast,
    dismiss: () => {},
  }
}
