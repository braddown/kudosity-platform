"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/utils/logger"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ProfileEditErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ProfileEdit error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the profile editor.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()}
              variant="default"
            >
              Refresh Page
            </Button>
            <Button 
              onClick={() => window.location.href = "/profiles"}
              variant="outline"
            >
              Back to Profiles
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
