"use client"

import { type ReactNode, useEffect } from "react"
import { usePageHeader } from "../PageHeaderContext"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

interface ActionButton {
  label?: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null
  className?: string
  disabled?: boolean
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
  fixedHeader?: boolean // New prop to control fixed header
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
  sidebar,
  fixedHeader = true // Default to true for better UX
}: PageLayoutProps) {
  const { setPageHeader } = usePageHeader()

  // For compatibility with MainLayout's header - only use if not fixed
  useEffect(() => {
    if (!fixedHeader) {
      setPageHeader({
        title,
        description,
        actions,
        customActions,
        showBackButton,
        backHref,
      })

      return () => {
        setPageHeader(null)
      }
    }
  }, [title, description, actions, customActions, showBackButton, backHref, setPageHeader, fixedHeader])

  const renderActions = () => {
    if (customActions) {
      return customActions
    }

    return (
      <div className="flex items-center space-x-3">
        {actions.map((action, index) => {
          if (action.href) {
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant={action.variant || "default"}
                  className={action.className}
                  disabled={action.disabled}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              </Link>
            )
          }

          return (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || "default"}
              className={action.className}
              disabled={action.disabled}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {/* Fixed header when enabled */}
      {fixedHeader && (
        <div className="fixed top-16 left-0 lg:left-64 right-0 z-40 bg-background px-6 py-4 border-b shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link href={backHref}>
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </Link>
              )}
              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            </div>
            {(actions.length > 0 || customActions) && renderActions()}
          </div>
        </div>
      )}

      {/* Content area with padding when fixed header is enabled */}
      <div className={`w-full bg-background ${fixedHeader ? 'pt-20' : ''}`}>
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
    </>
  )
}