"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

function AutoThemeScheduler() {
  const { setTheme, theme } = useTheme()
  const [hasManualOverride, setHasManualOverride] = useState(false)

  useEffect(() => {
    // Check if user has manually set a theme preference
    const manualTheme = localStorage.getItem("manual-theme-override")
    if (manualTheme) {
      setHasManualOverride(true)
      return // Don't auto-schedule if user has manual override
    }

    const checkTimeAndSetTheme = () => {
      // Only auto-schedule if no manual override exists
      if (hasManualOverride) return

      const now = new Date()
      const hour = now.getHours()

      // Dark mode from 6 PM (18:00) to 7 AM (07:00)
      // Light mode from 7 AM (07:00) to 6 PM (18:00)
      const shouldBeDark = hour >= 18 || hour < 7
      const targetTheme = shouldBeDark ? "dark" : "light"

      // Only change if current theme is different
      if (theme !== targetTheme) {
        setTheme(targetTheme)
      }
    }

    // Check immediately
    checkTimeAndSetTheme()

    // Set up interval to check every minute
    const interval = setInterval(checkTimeAndSetTheme, 60000)

    return () => clearInterval(interval)
  }, [setTheme, theme, hasManualOverride])

  // Listen for manual theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const manualTheme = localStorage.getItem("manual-theme-override")
      setHasManualOverride(!!manualTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <AutoThemeScheduler />
      {children}
    </NextThemesProvider>
  )
}
