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
import { LoadingSpinner } from "@/components/ui/loading"
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
  const [countryCode, setCountryCode] = useState("AU") // Default to Australia as shown in account
  const [phoneError, setPhoneError] = useState("")
  const [accountLocation, setAccountLocation] = useState("")
  const [hasLoaded, setHasLoaded] = useState(false) // Prevent multiple loads
  const { toast } = useToast()

  useEffect(() => {
    // Prevent multiple loads
    if (hasLoaded) return
    
    let mounted = true
    
    const init = async () => {
      if (mounted && !hasLoaded) {
        setHasLoaded(true)
        await loadAccountSettings()
        await loadSenders()
      }
    }
    
    init()
    
    // Ensure loading state is cleared after mount
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoadingSenders(false)
      }
    }, 5000) // Fallback timeout after 5 seconds
    
    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [hasLoaded])

  const loadAccountSettings = async () => {
    try {
      console.log('Loading account settings...')
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        setCountryCode('AU')
        return
      }
      
      if (user) {
        // Try to get account_id from user metadata or user id
        const accountId = user.user_metadata?.account_id || user.id
        console.log('User found, fetching account with ID:', accountId)
        
        if (!accountId) {
          console.log('No account ID found, using defaults')
          setCountryCode('AU')
          return
        }
        
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('location')
          .eq('id', accountId)
          .single()
        
        if (accountError) {
          console.error('Error fetching account:', accountError)
          // Try with user_id instead
          const { data: accountByUserId, error: userIdError } = await supabase
            .from('accounts')
            .select('location')
            .eq('user_id', user.id)
            .single()
          
          if (userIdError) {
            console.error('Error fetching account by user_id:', userIdError)
            setCountryCode('AU')
            return
          }
          
          if (accountByUserId?.location) {
            setAccountLocation(accountByUserId.location)
            console.log('Account location set from user_id query:', accountByUserId.location)
          }
          return
        }
        
        // Set country code based on account location
        if (account?.location) {
          setAccountLocation(account.location)
          console.log('Account location set:', account.location)
          
          // Parse location - it shows "Australia" and "Sydney" in the settings
          const locationLower = account.location.toLowerCase()
          
          // Detect country from location string
          if (locationLower.includes('australia') || locationLower === 'sydney') {
            setCountryCode('AU')
          } else if (locationLower.includes('united kingdom') || locationLower.includes('uk')) {
            setCountryCode('GB')
          } else if (locationLower.includes('united states') || locationLower.includes('usa')) {
            setCountryCode('US')
          } else if (locationLower.includes('canada')) {
            setCountryCode('CA')
          } else if (locationLower.includes('new zealand')) {
            setCountryCode('NZ')
          } else if (locationLower.includes('singapore')) {
            setCountryCode('SG')
          } else if (locationLower.includes('india')) {
            setCountryCode('IN')
          } else if (locationLower.includes('south africa')) {
            setCountryCode('ZA')
          } else {
            // Default to Australia as shown in the screenshot
            setCountryCode('AU')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load account settings:', error)
      // Default to Australia
      setCountryCode('AU')
    }
  }

  const loadSenders = async () => {
    try {
      console.log('Starting to load senders...')
      setLoadingSenders(true)
      const response = await fetch('/api/kudosity/senders')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Senders API response:', data)
        
        if (data.error) {
          console.warn('Senders API error:', data.error)
          // Allow manual input if no senders available
          setSenders([])
          setSelectedSender('')
        } else if (data.senders && data.senders.length > 0) {
          setSenders(data.senders)
          setDefaultSender(data.defaultSender || data.senders[0].id)
          setSelectedSender(data.defaultSender || data.senders[0].id)
        } else {
          // No senders available - allow manual input
          setSenders([])
          setSelectedSender('')
        }
      } else {
        console.error('Failed to load senders - response not OK')
        setSenders([])
        setSelectedSender('')
      }
    } catch (error) {
      console.error('Failed to load senders:', error)
      setSenders([])
      setSelectedSender('')
    } finally {
      console.log('Setting loadingSenders to false')
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
      // Format phone to E.164 for sending - remove all spaces and + for API
      const validation = validatePhoneNumber(recipient, countryCode)
      const cleanedRecipient = validation.formatted.replace(/[\s+]/g, '')
      
      console.log('Sending to:', cleanedRecipient)
      
      const response = await fetch('/api/kudosity/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: cleanedRecipient,
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
              {/* Account Location Display */}
              <div className="space-y-2">
                <Label>Account Location</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {COUNTRY_FORMATS[countryCode]?.country || 'Australia'} 
                    {accountLocation && ` (${accountLocation})`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Phone numbers will be formatted for {COUNTRY_FORMATS[countryCode]?.country || 'Australia'}
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
                    <span className="text-sm text-muted-foreground">Loading senders from Kudosity...</span>
                  </div>
                ) : senders.length > 0 ? (
                  <Select value={selectedSender} onValueChange={setSelectedSender} disabled={sending}>
                    <SelectTrigger id="sender">
                      <SelectValue placeholder="Select a sender ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {senders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{sender.name || sender.id}</span>
                            {sender.id === defaultSender && (
                              <span className="text-xs text-muted-foreground ml-2">(default)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="sender"
                    type="text"
                    placeholder="Enter sender ID (e.g., KUDOSITY)"
                    value={selectedSender}
                    onChange={(e) => setSelectedSender(e.target.value.toUpperCase().slice(0, 11))}
                    disabled={sending}
                    maxLength={11}
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  {senders.length === 0 
                    ? "Enter alphanumeric sender ID (max 11 chars) or phone number"
                    : "Sender ID that will appear as the message sender"}
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
                <Button
                  onClick={handleSendTest}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Test SMS'
                  )}
                </Button>
              </div>
              
              {/* Debug: Check if any loading state is stuck */}
              {(loadingSenders || sending) && (
                <div className="mt-2 text-xs text-red-500">
                  Debug: loadingSenders={loadingSenders.toString()}, sending={sending.toString()}
                </div>
              )}
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
