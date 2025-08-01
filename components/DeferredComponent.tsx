"use client"

import { useState, useEffect, type ReactNode } from "react"

interface DeferredComponentProps {
  children: ReactNode
  delay?: number
}

export default function DeferredComponent({ children, delay = 200 }: DeferredComponentProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isClient) return null

  return <>{children}</>
}
