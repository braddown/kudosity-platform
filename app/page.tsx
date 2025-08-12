'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/client'
import { LoadingSpinnerWithText } from '@/components/ui/loading-spinner'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is authenticated, redirect to overview
        router.push('/overview')
      } else {
        // User is not authenticated, redirect to login
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  // Show loading while checking authentication
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
      <LoadingSpinnerWithText size="lg" text="Loading..." />
    </div>
  )
}