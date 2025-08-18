'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DebugAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug-account')
      const result = await response.json()
      setData(result)
      
      // Check if there's an error in the result
      if (result.error && !result.authenticated) {
        setError(null) // Don't show as error, show in UI
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fixAccount = async () => {
    setFixing(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/debug-account', {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setSuccess(result.message)
      
      // Refresh the debug info
      await fetchDebugInfo()
      
      // Redirect to overview after 2 seconds
      setTimeout(() => {
        router.push('/overview')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFixing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Account Debug Information</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/50">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {data && !data.authenticated && (
        <Card className="mb-6 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600 dark:text-yellow-400">Not Authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  {data.debugInfo?.message || 'You are not logged in'}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p><strong>Session Error:</strong> {data.sessionError || 'None'}</p>
                <p><strong>User Error:</strong> {data.userError || 'None'}</p>
                <p><strong>Has Session:</strong> {data.hasSession ? 'Yes' : 'No'}</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push('/auth/login')}
                  className="flex-1"
                >
                  Go to Login
                </Button>
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  variant="outline"
                  className="flex-1"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.authenticated !== false && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>User ID:</strong> {data.user?.id || 'Not authenticated'}</p>
                <p><strong>Email:</strong> {data.user?.email || 'N/A'}</p>
                <p><strong>Current Account Cookie:</strong> {data.currentAccountId || 'None'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Total Memberships:</strong> {data.membershipCount}</p>
                <p><strong>Middleware Would Redirect:</strong> {data.middlewareWouldRedirect ? 'Yes (to setup)' : 'No'}</p>
                
                {data.allMemberships && data.allMemberships.length > 0 ? (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Active Memberships:</p>
                    <div className="space-y-2">
                      {data.allMemberships.map((membership: any) => (
                        <div key={membership.id} className="p-3 border rounded-lg">
                          <p><strong>Account:</strong> {membership.account?.name}</p>
                          <p><strong>Role:</strong> {membership.role}</p>
                          <p><strong>Status:</strong> {membership.status}</p>
                          <p className="text-xs text-muted-foreground">ID: {membership.account_id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No account memberships found. This is why you're being redirected to setup.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {data.middlewareWouldRedirect && (
            <Card className="mb-6 border-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-600 dark:text-orange-400">Action Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Your user account has no active memberships. Click the button below to fix this issue:
                </p>
                <Button 
                  onClick={fixAccount} 
                  disabled={fixing}
                  className="w-full"
                >
                  {fixing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing Account...
                    </>
                  ) : (
                    'Fix Account Membership'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Debug Query</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {data.debug?.query}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
