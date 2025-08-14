"use client"

import { type ReactNode, useEffect } from "react"
import { usePageHeader } from "../PageHeaderContext"

interface ActionButton {
  label?: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null
  className?: string
}

interface PageLayoutProps {
  title: string
  description?: string
  children: ReactNode
  actions?: ActionButton[]
  customActions?: ReactNode
  showBackButton?: boolean
  backHref?: string
  contentClassName?: string
  fullWidth?: boolean
  withSidebar?: boolean
  sidebar?: ReactNode
}

export default function PageLayout({
  title,
  description,
  children,
  actions = [],
  customActions,
  showBackButton = false,
  backHref = "/",
  contentClassName = "",
  fullWidth = false,
  withSidebar = false,
  sidebar
}: PageLayoutProps) {
  const { setPageHeader } = usePageHeader()

  // Set the page header when component mounts
  useEffect(() => {
    setPageHeader({
      title,
      description,
      actions,
      customActions,
      showBackButton,
      backHref,
    })

    // Clear the header when component unmounts
    return () => {
      setPageHeader(null)
    }
  }, [title, description, actions, customActions, showBackButton, backHref, setPageHeader])

  return (
    <div className="w-full bg-background">
      {withSidebar ? (
        <div className="flex flex-col xl:flex-row gap-8">
          <div className="w-full xl:w-2/3">
            <div className={contentClassName}>{children}</div>
          </div>
          <div className="hidden xl:block xl:w-1/3">{sidebar}</div>
        </div>
      ) : (
        <div className={contentClassName}>{children}</div>
      )}
    </div>
  )
}
