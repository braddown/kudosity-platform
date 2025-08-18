'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function SetupAccountAltPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountName, setAccountName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!accountName.trim()) {
      setError('Account name is required')
      setLoading(false)
      return
    }

    try {
      console.log('Submitting account creation for:', accountName)
      
      const response = await fetch('/api/create-account-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: accountName }),
      })

      const data = await response.json()
      console.log('Response from server:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }
      
      toast({
        title: 'Account created!',
        description: `Welcome to ${data.account.name}`,
      })

      // Redirect to overview
      router.push('/overview')
    } catch (err: any) {
      console.error('Account setup error:', err)
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Set up your account (Alternative)
          </CardTitle>
          <CardDescription className="text-center">
            Create your first workspace to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950/50">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="accountName"
                  type="text"
                  placeholder="Acme Inc."
                  className="pl-10"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You can change this later in your account settings
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !accountName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>This is using the direct API approach</p>
            <p>Check the browser console for debug logs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
