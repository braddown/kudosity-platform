import type React from "react"
import "./globals.css"
import { RootLayoutWrapper } from "@/components/RootLayoutWrapper"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RootLayoutWrapper>{children}</RootLayoutWrapper>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
