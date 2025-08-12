'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  useEffect(() => {
    // Check if we have a code parameter (OAuth callback)
    const code = searchParams.get('code')
    if (code && !error) {
      // Redirect to our callback handler
      router.push(`/auth/callback?code=${code}`)
    }
  }, [searchParams, router, error])

  const getErrorMessage = () => {
    if (errorDescription) return errorDescription
    
    switch (error) {
      case 'access_denied':
        return 'Access was denied. Please try again or contact support.'
      case 'unauthorized_client':
        return 'This application is not authorized. Please contact support.'
      case 'invalid_request':
        return 'Invalid request. Please try again.'
      default:
        return 'An error occurred during authentication. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              If you continue to experience issues, please try:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Clearing your browser cookies</li>
              <li>• Using a different browser</li>
              <li>• Contacting support if the problem persists</li>
            </ul>
          </div>

          <div className="pt-4 space-y-2">
            <Button className="w-full" asChild>
              <Link href="/auth/login">
                Try Again
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

