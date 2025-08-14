"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface ActionButton {
  label?: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null
  className?: string
}

interface PageHeaderInfo {
  title: string
  description?: string
  actions?: ActionButton[]
  customActions?: ReactNode
  showBackButton?: boolean
  backHref?: string
}

interface PageHeaderContextType {
  pageHeader: PageHeaderInfo | null
  setPageHeader: (header: PageHeaderInfo | null) => void
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [pageHeader, setPageHeader] = useState<PageHeaderInfo | null>(null)

  return <PageHeaderContext.Provider value={{ pageHeader, setPageHeader }}>{children}</PageHeaderContext.Provider>
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext)
  if (context === undefined) {
    // Return default values instead of throwing error
    return {
      pageHeader: null,
      setPageHeader: () => {},
    }
  }
  return context
}
