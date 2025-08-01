"use client"

import type { ReactNode } from "react"
import { MainNav } from "./MainNav"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
