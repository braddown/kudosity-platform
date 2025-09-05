"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { PageHeaderProvider } from "@/components/PageHeaderContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { logger } from "@/lib/utils/logger"

interface RootLayoutWrapperProps {
  children: ReactNode
}

// Performance monitoring component
function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring only in production
    if (process.env.NODE_ENV === 'production') {
      // Import and initialize the performance monitor
      import('@/lib/performance/web-vitals').then(({ performanceMonitor }) => {
        logger.debug('📊 Performance monitoring initialized')
      })
    }
    
    // Report Web Vitals to analytics
    const reportWebVitals = (metric: any) => {
      if (process.env.NODE_ENV === 'production') {
        // Send to your analytics service
        logger.debug('Web Vital:', metric)
      }
    }

    // Import and setup web vitals reporting
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(reportWebVitals)
      onINP(reportWebVitals)
      onFCP(reportWebVitals)
      onLCP(reportWebVitals)
      onTTFB(reportWebVitals)
    })
  }, [])

  return null
}

export function RootLayoutWrapper({ children }: RootLayoutWrapperProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PageHeaderProvider>
        <PerformanceMonitor />
        {children}
        <Toaster />
      </PageHeaderProvider>
    </ThemeProvider>
  )
}
