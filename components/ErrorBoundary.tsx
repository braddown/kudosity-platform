"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/utils/logger"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error("Error boundary caught error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        An unexpected error occurred. Our team has been notified and is working to fix the issue.
      </p>
      <div className="space-x-4">
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
        <Button onClick={reset} variant="default">
          Try Again
        </Button>
      </div>
    </div>
  )
}
