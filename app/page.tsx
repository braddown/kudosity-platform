'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/client'
import { LoadingPage } from '@/components/ui/loading'

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
  return <LoadingPage message="Loading..." />
}