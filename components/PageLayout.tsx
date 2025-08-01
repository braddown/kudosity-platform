"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
  showBackButton = false,
  backHref = "/",
  contentClassName = "",
  fullWidth = false,
  withSidebar = false,
  sidebar,
}: PageLayoutProps) {
  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* Header - Full width with title and actions */}
      <div className="w-full border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="rounded-full mr-2" aria-label="Back">
                <X className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {actions.map((action, index) => {
            if (action.href) {
              return (
                <Link key={index} href={action.href}>
                  <Button variant={action.variant || "default"} className={action.className}>
                    {action.icon}
                    {action.label && <span className={action.icon ? "ml-2" : ""}>{action.label}</span>}
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
              >
                {action.icon}
                {action.label && <span className={action.icon ? "ml-2" : ""}>{action.label}</span>}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-6">
        <div className={`${fullWidth ? "w-full" : "w-full max-w-6xl mx-auto"}`}>
          {description && <p className="text-muted-foreground mb-6">{description}</p>}

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
      </div>
    </div>
  )
}
