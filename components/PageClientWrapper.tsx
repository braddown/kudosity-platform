"use client"

import type { ReactNode } from "react"
import { RootLayoutWrapper } from "./RootLayoutWrapper"

interface PageClientWrapperProps {
  children: ReactNode
}

export default function PageClientWrapper({ children }: PageClientWrapperProps) {
  return <RootLayoutWrapper>{children}</RootLayoutWrapper>
}
