"use client"

import { logger } from "@/lib/utils/logger"
import type { ReactNode } from "react"

interface BaseLayoutProps {
  children: ReactNode
  className?: string
}

export function BaseLayout({ children, className = "" }: BaseLayoutProps) {
  return <div className={`flex flex-col w-full min-h-screen bg-background ${className}`}>{children}</div>
}

// DEPRECATED: This interface is kept to prevent breaking changes
// TODO: Find all usages and replace with the preferred Header component
interface HeaderProps {
  children: ReactNode
  className?: string
  sticky?: boolean
}

// DEPRECATED: This component is kept to prevent breaking changes
// TODO: Find all usages and replace with the preferred Header component
export function Header({ children, className = "", sticky = false }: HeaderProps) {
  logger.warn("Warning: Using deprecated Header component from BaseLayout.tsx. Please update your imports.")
  return (
    <header
      className={`w-full py-4 px-6 flex justify-between items-center border-b border-gray-200 bg-white
      ${sticky ? "sticky top-0 z-10" : ""} ${className}`}
    >
      {children}
    </header>
  )
}

interface HeaderTitleProps {
  children: ReactNode
  className?: string
}

export function HeaderTitle({ children, className = "" }: HeaderTitleProps) {
  return <h2 className={`text-xl font-semibold text-foreground ${className}`}>{children}</h2>
}

interface HeaderActionsProps {
  children: ReactNode
  className?: string
}

export function HeaderActions({ children, className = "" }: HeaderActionsProps) {
  return <div className={`flex items-center gap-2 ${className}`}>{children}</div>
}

interface ContentProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "6xl" | "7xl" | "none"
  padding?: "none" | "sm" | "md" | "lg"
}

const paddingClasses = {
  none: "",
  sm: "px-4",
  md: "px-6",
  lg: "px-8",
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  none: "",
}

export function Content({
  children,
  className = "",
  fullWidth = false,
  maxWidth = "6xl",
  padding = "md",
}: ContentProps) {
  return (
    <main className={`flex-1 ${paddingClasses[padding]} ${className}`}>
      <div className={`${fullWidth ? "w-full" : `w-full ${maxWidthClasses[maxWidth]} mx-auto`}`}>{children}</div>
    </main>
  )
}

interface SectionProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}

export function Section({ children, className = "", title, description }: SectionProps) {
  return (
    <section className={`mb-8 ${className}`}>
      {title && <h3 className="text-lg font-medium mb-2 text-foreground">{title}</h3>}
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      {children}
    </section>
  )
}

interface SidebarLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  sidebarWidth?: "1/3" | "1/4" | "1/5"
  sidebarPosition?: "left" | "right"
  className?: string
  breakpoint?: "sm" | "md" | "lg" | "xl"
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarWidth = "1/3",
  sidebarPosition = "right",
  className = "",
  breakpoint = "xl",
}: SidebarLayoutProps) {
  const widthClasses = {
    "1/3": `${breakpoint}:w-2/3`,
    "1/4": `${breakpoint}:w-3/4`,
    "1/5": `${breakpoint}:w-4/5`,
  }

  const sidebarWidthClasses = {
    "1/3": `${breakpoint}:w-1/3`,
    "1/4": `${breakpoint}:w-1/4`,
    "1/5": `${breakpoint}:w-1/5`,
  }

  return (
    <div className={`flex flex-col ${breakpoint}:flex-row gap-8 ${className}`}>
      {sidebarPosition === "left" && (
        <div className={`hidden ${breakpoint}:block ${sidebarWidthClasses[sidebarWidth]}`}>{sidebar}</div>
      )}
      <div className={`w-full ${widthClasses[sidebarWidth]}`}>{children}</div>
      {sidebarPosition === "right" && (
        <div className={`hidden ${breakpoint}:block ${sidebarWidthClasses[sidebarWidth]}`}>{sidebar}</div>
      )}
    </div>
  )
}
