"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { usePageHeader } from "@/components/PageHeaderContext"
import { createClient } from "@/lib/auth/client"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinnerWithText } from "@/components/ui/loading-spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Calendar, Shield, Phone, Globe, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  mobile_number?: string
  country?: string
  timezone?: string
  created_at: string
  updated_at: string
}

interface AccountMembership {
  account_id: string
  role: string
  status: string
  joined_at: string
  accounts?: {
    name: string
  }
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

export default function ProfilePage() {
  const { setPageHeader } = usePageHeader()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [memberships, setMemberships] = useState<AccountMembership[]>([])
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    country: "",
    timezone: "",
  })

  // Fetch user profile and related data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: "Not Authenticated",
            description: "Please log in to view your profile.",
            variant: "destructive"
          })
          setLoading(false)
          return
        }
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else if (profileData) {
          setProfile({
            ...profileData,
            email: user.email || profileData.email
          })
          setFormData({
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            email: user.email || profileData.email || "",
            mobile_number: profileData.mobile_number || "",
            country: profileData.country || "",
            timezone: profileData.timezone || "",
          })
        }
        
        // Fetch account memberships
        console.log('Fetching memberships for user:', user.id)
        const { data: membershipData, error: membershipError } = await supabase
          .from('account_members')
          .select(`
            *,
            accounts (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
        
        if (membershipError) {
          console.error('Error fetching memberships:', membershipError)
        } else if (membershipData) {
          console.log('Memberships found:', membershipData)
          setMemberships(membershipData)
        } else {
          console.log('No memberships found')
        }
        

      } catch (error) {
        console.error('Error:', error)
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [toast])

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "User Profile",
      actions: [
        {
          label: saving ? "Saving..." : "Save Changes",
          onClick: async () => {
            if (saving || !profile) return
            
            setSaving(true)
            try {
              const supabase = createClient()
              
              const { data: { user } } = await supabase.auth.getUser()
              
              if (!user) {
                throw new Error('Not authenticated')
              }
              
              const { error } = await supabase
                .from('user_profiles')
                .update({
                  first_name: formData.first_name,
                  last_name: formData.last_name,
                  full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                  mobile_number: formData.mobile_number,
                  country: formData.country,
                  timezone: formData.timezone,
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
              
              if (error) {
                throw error
              }
              
              // Log the user activity with detailed changes
              try {
                // Track what fields were changed
                const changedFields = []
                const fieldsToCheck = ['first_name', 'last_name', 'mobile_number', 'country', 'timezone']
                
                for (const field of fieldsToCheck) {
                  const oldValue = profile?.[field as keyof typeof profile]
                  const newValue = formData[field as keyof typeof formData]
                  
                  if (oldValue !== newValue) {
                    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                    changedFields.push({
                      field: fieldName,
                      from: oldValue || 'Empty',
                      to: newValue || 'Empty'
                    })
                  }
                }
                
                const changesSummary = changedFields.length > 0
                  ? changedFields.map(c => `${c.field}: "${c.from}" → "${c.to}"`).join(', ')
                  : 'No changes detected'
                
                const logResponse = await fetch('/api/user-activity', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    activity_type: 'profile_updated',
                    description: `Updated user profile - Changed: ${changesSummary}`,
                    metadata: {
                      changes_made: changedFields,
                      total_fields_changed: changedFields.length
                    }
                  })
                })
                
                // Activity logging successful
              } catch (err) {
                console.error('Failed to log user activity:', err)
              }
              
              toast({
                title: "Success",
                description: "Your profile has been updated.",
              })
              
              // Update local state
              setProfile({
                ...profile,
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                mobile_number: formData.mobile_number,
                country: formData.country,
                timezone: formData.timezone,
                updated_at: new Date().toISOString(),
              })
            } catch (error) {
              console.error('Error saving:', error)
              toast({
                title: "Error",
                description: "Failed to save profile changes.",
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
  }, [setPageHeader, formData, profile, saving, toast])

  const getInitials = () => {
    const firstInitial = formData.first_name ? formData.first_name[0] : ''
    const lastInitial = formData.last_name ? formData.last_name[0] : ''
    
    if (firstInitial || lastInitial) {
      return (firstInitial + lastInitial).toUpperCase()
    }
    if (formData.email) {
      return formData.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      member: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    }
    
    return (
      <Badge className={colors[role] || colors.member}>
        {role}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinnerWithText text="Loading profile..." />
        </div>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No profile information available.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm">{profile.id}</p>
                <p className="text-sm text-muted-foreground">Member since {formatDate(profile.created_at)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter your last name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
              Location Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Your personal location for messaging activities</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Used for scheduling and activity timestamps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Memberships Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Account Memberships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {memberships.map((membership) => (
                <div key={membership.account_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{membership.accounts?.name || 'Unknown Account'}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {formatDate(membership.joined_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(membership.role)}
                    <Badge variant={membership.status === 'active' ? 'translucent-green' : 'translucent-gray'}>
                      {membership.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {memberships.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No account memberships found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}