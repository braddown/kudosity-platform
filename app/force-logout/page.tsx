'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ForceLogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to the force logout endpoint
    window.location.href = '/api/force-logout'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg">Logging out...</p>
      </div>
    </div>
  )
}
