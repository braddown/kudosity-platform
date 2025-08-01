"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import { validateSupabaseConnection } from "@/lib/supabase"

export function DatabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnection = async () => {
    setStatus("checking")
    setError(null)

    try {
      const result = await validateSupabaseConnection()
      setStatus(result.success ? "connected" : "error")
      if (!result.success) {
        setError(result.error?.message || "Unknown connection error")
      }
      setLastChecked(new Date())
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unknown error")
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Database Connection
          {status === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "connected" && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <Badge variant={status === "connected" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "checking" ? "Checking..." : status === "connected" ? "Connected" : "Error"}
          </Badge>
        </div>

        {lastChecked && (
          <div className="flex items-center justify-between">
            <span>Last Checked:</span>
            <span className="text-sm text-muted-foreground">{lastChecked.toLocaleTimeString()}</span>
          </div>
        )}

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">{error}</div>}

        <Button onClick={checkConnection} variant="outline" className="w-full" disabled={status === "checking"}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recheck Connection
        </Button>
      </CardContent>
    </Card>
  )
}
