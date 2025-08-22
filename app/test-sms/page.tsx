"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { LoadingButton, LoadingSection } from "@/components/ui/loading"
import { createClient } from "@/lib/auth/client"
import { 
  formatPhoneNumber, 
  validatePhoneNumber, 
  getPhonePlaceholder,
  COUNTRY_FORMATS 
} from "@/lib/utils/phone-formatter"
import { Phone, Globe } from "lucide-react"

export default function TestSMSPage() {
  const [recipient, setRecipient] = useState("")
  const [message, setMessage] = useState("Test message from Kudosity Platform. This is a test of the SMS integration.")
  const [selectedSender, setSelectedSender] = useState("")
  const [senders, setSenders] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [defaultSender, setDefaultSender] = useState("KUDOSITY")
  const [sending, setSending] = useState(false)
  const [loadingSenders, setLoadingSenders] = useState(true)
  const [countryCode, setCountryCode] = useState("US")
  const [phoneError, setPhoneError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadAccountSettings()
    loadSenders()
  }, [])

  const loadAccountSettings = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: account } = await supabase
          .from('accounts')
          .select('location')
          .eq('id', user.user_metadata?.account_id)
          .single()
        
        // Set country code based on account location
        if (account?.location) {
          // Parse location to get country code (assuming format like "Sydney, AU" or "US")
          const locationParts = account.location.split(',')
          const country = locationParts[locationParts.length - 1].trim().toUpperCase()
          
          // Check if it's a valid country code
          if (COUNTRY_FORMATS[country]) {
            setCountryCode(country)
          } else {
            // Try to detect country from location string
            const locationLower = account.location.toLowerCase()
            if (locationLower.includes('australia')) setCountryCode('AU')
            else if (locationLower.includes('united kingdom') || locationLower.includes('uk')) setCountryCode('GB')
            else if (locationLower.includes('united states') || locationLower.includes('usa')) setCountryCode('US')
            else if (locationLower.includes('canada')) setCountryCode('CA')
            else if (locationLower.includes('new zealand')) setCountryCode('NZ')
            else if (locationLower.includes('singapore')) setCountryCode('SG')
            else if (locationLower.includes('india')) setCountryCode('IN')
            else if (locationLower.includes('south africa')) setCountryCode('ZA')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load account settings:', error)
    }
  }

  const loadSenders = async () => {
    try {
      setLoadingSenders(true)
      const response = await fetch('/api/kudosity/senders')
      
      if (response.ok) {
        const data = await response.json()
        setSenders(data.senders || [])
        setDefaultSender(data.defaultSender || 'KUDOSITY')
        setSelectedSender(data.defaultSender || 'KUDOSITY')
      }
    } catch (error) {
      console.error('Failed to load senders:', error)
      // Use default senders as fallback
      setSenders([
        { id: 'KUDOSITY', name: 'KUDOSITY', type: 'alphanumeric' },
        { id: 'INFO', name: 'INFO', type: 'alphanumeric' },
      ])
    } finally {
      setLoadingSenders(false)
    }
  }

  const handlePhoneChange = (value: string) => {
    setRecipient(value)
    
    // Validate phone number
    if (value) {
      const validation = validatePhoneNumber(value, countryCode)
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number')
      } else {
        setPhoneError('')
        // Auto-format the number
        setRecipient(validation.formatted)
      }
    } else {
      setPhoneError('')
    }
  }

  const handleCountryChange = (value: string) => {
    setCountryCode(value)
    // Re-validate phone with new country
    if (recipient) {
      const validation = validatePhoneNumber(recipient, value)
      if (validation.isValid) {
        setRecipient(validation.formatted)
        setPhoneError('')
      } else {
        setPhoneError(validation.error || 'Invalid phone number for selected country')
      }
    }
  }

  const handleSendTest = async () => {
    // Validate phone first
    if (phoneError) {
      toast({
        title: "Invalid Phone Number",
        description: phoneError,
        variant: "destructive",
      })
      return
    }

    setSending(true)
    
    try {
      // Format phone to E.164 for sending
      const validation = validatePhoneNumber(recipient, countryCode)
      
      const response = await fetch('/api/kudosity/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: validation.formatted,
          message,
          sender: selectedSender,
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
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={countryCode} onValueChange={handleCountryChange} disabled={sending}>
                  <SelectTrigger id="country">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {COUNTRY_FORMATS[countryCode]?.country || countryCode}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRY_FORMATS).map(([code, format]) => (
                      <SelectItem key={code} value={code}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{format.phoneCode}</span>
                          <span>{format.country}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Phone numbers will be formatted according to the selected country
                </p>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipient"
                    type="tel"
                    placeholder={getPhonePlaceholder(countryCode)}
                    value={recipient}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    disabled={sending}
                    className={`pl-10 ${phoneError ? 'border-red-500' : ''}`}
                  />
                </div>
                {phoneError && (
                  <p className="text-sm text-red-500">{phoneError}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Enter number with or without country code - it will be auto-formatted
                </p>
              </div>

              {/* Sender ID Selection */}
              <div className="space-y-2">
                <Label htmlFor="sender">Sender ID</Label>
                {loadingSenders ? (
                  <div className="h-10 flex items-center">
                    <span className="text-sm text-muted-foreground">Loading senders...</span>
                  </div>
                ) : (
                  <Select value={selectedSender} onValueChange={setSelectedSender} disabled={sending}>
                    <SelectTrigger id="sender">
                      <SelectValue placeholder="Select a sender ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {senders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{sender.name}</span>
                            {sender.id === defaultSender && (
                              <span className="text-xs text-muted-foreground ml-2">(default)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-sm text-muted-foreground">
                  Sender ID that will appear as the message sender
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
