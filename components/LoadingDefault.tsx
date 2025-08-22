import { LoadingPage } from "@/components/ui/loading"

interface LoadingDefaultProps {
  message?: string
}

/**
 * Default loading component for Next.js loading.tsx files
 * Provides consistent loading state across all routes
 */
export default function LoadingDefault({ message }: LoadingDefaultProps) {
  return <LoadingPage message={message} />
}
