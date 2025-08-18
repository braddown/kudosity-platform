"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePageHeader } from "@/components/PageHeaderContext"
import { createClient } from "@/lib/auth/client"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinnerWithText } from "@/components/ui/loading-spinner"
import { Building2, Globe, Clock, MapPin, Hash } from "lucide-react"

interface AccountInfo {
  id: string
  name: string
  slug: string
  logo_url?: string
  billing_email?: string
  support_email?: string
  company_name?: string
  country?: string
  timezone?: string
  company_address?: string
  company_number?: string
  plan?: string
  plan_status?: string
  created_at: string
  updated_at: string
}

// Common timezones list
const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "Mumbai" },
  { value: "Asia/Shanghai", label: "Beijing" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Australia/Brisbane", label: "Brisbane" },
  { value: "Australia/Perth", label: "Perth" },
  { value: "Pacific/Auckland", label: "Auckland" },
]

// Countries list (abbreviated for common ones)
const countries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "IE", label: "Ireland" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "TH", label: "Thailand" },
  { value: "ID", label: "Indonesia" },
  { value: "PH", label: "Philippines" },
  { value: "VN", label: "Vietnam" },
  { value: "KR", label: "South Korea" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "ZA", label: "South Africa" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "IL", label: "Israel" },
  { value: "RU", label: "Russia" },
]

export default function AccountSettingsPage() {
  const { setPageHeader } = usePageHeader()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    billing_email: "",
    support_email: "",
    country: "",
    timezone: "",
    company_address: "",
    company_number: "",
  })

  // Fetch account information
  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        // Get current account - first try from user's membership
        let accountId = null
        
        // Try to get from user's first active membership
        if (user) {
          const { data: membershipData } = await supabase
            .from('account_members')
            .select('account_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .single()
          
          if (membershipData) {
            accountId = membershipData.account_id
            console.log('Found account from membership:', accountId)
          }
        }
        
        // Fallback to cookie if available
        if (!accountId) {
          const cookies = document.cookie.split('; ')
          const accountCookie = cookies.find(c => c.startsWith('current_account='))
          accountId = accountCookie?.split('=')[1]
          console.log('Using account from cookie:', accountId)
        }
        
        if (!accountId) {
          toast({
            title: "No Account Found",
            description: "Unable to find your account. Please try logging in again.",
            variant: "destructive"
          })
          setLoading(false)
          return
        }
        
        // Fetch account details
        console.log('Fetching account with ID:', accountId)
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .single()
        
        console.log('Account data:', data)
        console.log('Account error:', error)
        
        if (error) {
          console.error('Error fetching account:', error)
          toast({
            title: "Error",
            description: "Failed to load account information.",
            variant: "destructive"
          })
        } else if (data) {
          setAccountInfo(data)
          setFormData({
            name: data.name || "",
            company_name: data.company_name || "",
            billing_email: data.billing_email || "",
            support_email: data.support_email || "",
            country: data.country || "",
            timezone: data.timezone || "",
            company_address: data.company_address || "",
            company_number: data.company_number || "",
          })
        }
      } catch (error) {
        console.error('Error:', error)
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchAccountInfo()
  }, [toast])

  // Set page header with save action
  useEffect(() => {
    setPageHeader({
      title: "Account Settings",
      actions: [
        {
          label: saving ? "Saving..." : "Save Changes",
          onClick: async () => {
            if (saving || !accountInfo) return
            
            setSaving(true)
            try {
              const supabase = createClient()
              
              const { data, error } = await supabase
                .from('accounts')
                .update({
                  name: formData.name,
                  company_name: formData.company_name,
                  billing_email: formData.billing_email,
                  support_email: formData.support_email,
                  country: formData.country,
                  timezone: formData.timezone,
                  company_address: formData.company_address,
                  company_number: formData.company_number,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', accountInfo.id)
                .select()
                .single()
              
              if (error) {
                console.error('Update error details:', error)
                throw error
              }
              
              toast({
                title: "Success",
                description: "Account settings have been updated.",
              })
              
              // Update local state with the returned data
              if (data) {
                setAccountInfo(data)
                setFormData({
                  name: data.name || "",
                  company_name: data.company_name || "",
                  billing_email: data.billing_email || "",
                  support_email: data.support_email || "",
                  country: data.country || "",
                  timezone: data.timezone || "",
                  company_address: data.company_address || "",
                  company_number: data.company_number || "",
                })
              }
            } catch (error: any) {
              console.error('Error saving:', error)
              toast({
                title: "Error",
                description: error.message || "Failed to save account settings. Please check your permissions.",
                variant: "destructive"
              })
            } finally {
              setSaving(false)
            }
          },
          className: `bg-blue-600 hover:bg-blue-700 text-white ${saving ? 'opacity-50 cursor-not-allowed' : ''}`,
        },
      ],
    })
    
    return () => {
      setPageHeader(null)
    }
  }, [setPageHeader, formData, accountInfo, saving, toast])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinnerWithText text="Loading account settings..." />
        </div>
      </MainLayout>
    )
  }

  if (!accountInfo) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No account information available.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="space-y-6">
        {/* Basic Account Information Card */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Account Information
                </h3>
                <p className="text-sm text-muted-foreground">Basic account details and settings</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    value={accountInfo.id}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="createdAt">Created</Label>
                  <Input
                    id="createdAt"
                    value={new Date(accountInfo.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter account name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                    placeholder="billing@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details and Location Settings in 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Details Card */}
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Company Details
                  </h3>
                  <p className="text-sm text-muted-foreground">Company registration and identification</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyNumber">Company Number</Label>
                    <Input
                      id="companyNumber"
                      value={formData.company_number}
                      onChange={(e) => setFormData({ ...formData, company_number: e.target.value })}
                      placeholder="ABN/ACN/Registration Number"
                    />
                    <p className="text-xs text-muted-foreground">Business registration or tax number</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Textarea
                      id="companyAddress"
                      value={formData.company_address}
                      onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                      placeholder="Enter company address"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Settings Card */}
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Location Settings
                  </h3>
                  <p className="text-sm text-muted-foreground">Primary location and timezone for the account</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </MainLayout>
  )
}