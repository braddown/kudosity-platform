"use client"

import { Progress } from "@/components/ui/progress"

interface LoadingProgressProps {
  current: number
  total: number
  message?: string
}

export function LoadingProgress({ current, total, message }: LoadingProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <div className="text-center space-y-2">
        <p className="text-gray-600">{message || "Loading profiles..."}</p>
        <div className="w-64">
          <Progress value={percentage} className="h-2" />
        </div>
        <p className="text-sm text-gray-500">
          {current.toLocaleString()} of {total.toLocaleString()} records ({percentage}%)
        </p>
      </div>
    </div>
  )
}
