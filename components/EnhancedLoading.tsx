interface EnhancedLoadingProps {
  message?: string
  fullScreen?: boolean
  showSkeleton?: boolean
}

export default function EnhancedLoading({
  message = "Loading...",
  fullScreen = false,
  showSkeleton = true,
}: EnhancedLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-background rounded-md p-6 space-y-4 ${fullScreen ? "h-screen" : "h-full min-h-[300px]"}`}
    >
      <div className="flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-b-primary border-l-muted border-r-muted animate-spin"></div>
      </div>
      <p className="text-lg font-medium text-foreground">{message}</p>
      {showSkeleton && (
        <div className="w-full max-w-md space-y-4">
          <div className="h-4 bg-muted rounded animate-pulse"></div>
          <div className="h-4 bg-muted rounded animate-pulse w-5/6 mx-auto"></div>
          <div className="h-4 bg-muted rounded animate-pulse w-4/6 mx-auto"></div>
        </div>
      )}
    </div>
  )
}
