'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            We&apos;ve sent a verification email to your inbox. 
            Please click the link in the email to verify your account and get started.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Didn&apos;t receive the email?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email address</li>
              <li>• Wait a few minutes and check again</li>
            </ul>
          </div>

          <div className="pt-4 space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/auth/login">
                Back to login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

