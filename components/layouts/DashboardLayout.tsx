"use client"

import type { ReactNode } from "react"
import MainLayout from "@/components/MainLayout"

interface ActionButton {
  label: string
  icon?: ReactNode
  onClick: () => void
  className?: string
}

interface DashboardLayoutProps {
  title: string
  children: ReactNode
  actions?: ActionButton[]
}

export default function DashboardLayout({ title, children, actions = [] }: DashboardLayoutProps) {
  return (
    <MainLayout>
      {/* Main content area */}
      <div className="w-full overflow-auto">{children}</div>
    </MainLayout>
  )
}
