import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-3", 
  lg: "w-8 h-8 border-4"
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div 
      className={cn(
        "border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
    />
  )
}

export function LoadingSpinnerWithText({ 
  size = "md", 
  text = "Loading...", 
  className 
}: LoadingSpinnerProps & { text?: string }) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <LoadingSpinner size={size} />
      <p className="mt-4 text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  )
}

export function InlineLoadingSpinner({ 
  size = "sm", 
  className 
}: LoadingSpinnerProps) {
  return (
    <LoadingSpinner 
      size={size} 
      className={cn("mr-2", className)} 
    />
  )
}