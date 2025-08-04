"use client"

import type { ReactNode } from "react"
import { PageHeaderProvider } from "@/components/PageHeaderContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

interface RootLayoutWrapperProps {
  children: ReactNode
}

export function RootLayoutWrapper({ children }: RootLayoutWrapperProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PageHeaderProvider>
        {children}
        <Toaster />
      </PageHeaderProvider>
    </ThemeProvider>
  )
}
