"use client"

import { useState } from "react"
import MainLayout from "@/components/MainLayout"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { LoadingButton } from "@/components/ui/loading"

export default function TestSMSPage() {
  const [recipient, setRecipient] = useState("+447123456789")
  const [message, setMessage] = useState("Test message from Kudosity Platform. This is a test of the SMS integration.")
  const [sender, setSender] = useState("KUDOSITY")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handleSendTest = async () => {
    setSending(true)
    
    try {
      const response = await fetch('/api/kudosity/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient,
          message,
          sender,
          trackLinks: true,
        }),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Test SMS Sent!",
          description: `Message ID: ${result.messageId}`,
        })
        
        // Log to console for debugging
        console.log("SMS sent successfully:", result)
      } else {
        toast({
          title: "Failed to send SMS",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
        console.error("SMS send failed:", result)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send SMS",
        variant: "destructive",
      })
      console.error("SMS send error:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <MainLayout>
      <PageLayout
        title="Test SMS Integration"
        description="Send test messages to verify Kudosity integration"
        showBackButton={true}
        backHref="/"
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Send Test SMS</CardTitle>
              <CardDescription>
                Use this form to test the Kudosity SMS integration. Messages will be logged in the database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Phone Number</Label>
                <Input
                  id="recipient"
                  type="tel"
                  placeholder="+447123456789"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={sending}
                />
                <p className="text-sm text-muted-foreground">
                  Include country code (e.g., +44 for UK, +61 for Australia, +1 for US)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender">Sender ID</Label>
                <Input
                  id="sender"
                  type="text"
                  placeholder="KUDOSITY"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  disabled={sending}
                  maxLength={11}
                />
                <p className="text-sm text-muted-foreground">
                  Alphanumeric sender ID (max 11 characters) or phone number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your test message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  {message.length} characters ({Math.ceil(message.length / 160)} segment{Math.ceil(message.length / 160) !== 1 ? 's' : ''})
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/campaigns/activity'}
                  disabled={sending}
                >
                  View Message History
                </Button>
                <LoadingButton
                  onClick={handleSendTest}
                  loading={sending}
                  loadingText="Sending..."
                >
                  Send Test SMS
                </LoadingButton>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Testing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Webhook URL:</strong> https://kudosity.ngrok.app/api/kudosity/webhook</p>
              <p><strong>Environment:</strong> Development (Test Mode)</p>
              <p><strong>Database:</strong> Messages are logged to message_history table</p>
              <div className="mt-4">
                <p className="font-semibold mb-2">Quick Links:</p>
                <div className="space-x-2">
                  <Button variant="link" className="p-0" onClick={() => window.location.href = '/campaigns/activity'}>
                    Message History
                  </Button>
                  <Button variant="link" className="p-0" onClick={() => window.location.href = '/broadcast'}>
                    Broadcast Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </MainLayout>
  )
}
