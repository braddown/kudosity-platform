"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/MainLayout"
import { KudosityTable } from "@/components/KudosityTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Plus, Shield, User, Activity, UserPlus, Settings, Users } from "lucide-react"
import { usePageHeader } from "@/components/PageHeaderContext"
import { createClient } from "@/lib/auth/client"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinnerWithText } from "@/components/ui/loading-spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getGravatarUrlSimple, getInitials } from "@/lib/utils/gravatar"

interface AccountMember {
  id: string
  user_id: string
  account_id: string
  role: string
  status: string
  joined_at: string
  email?: string
  full_name?: string
  avatar_url?: string
}

interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: string
  timestamp: string
  user_profiles?: {
    full_name: string
    email: string
  }
}

export default function UsersSettingsPage() {
  const { setPageHeader } = usePageHeader()
  const { toast } = useToast()
  const [users, setUsers] = useState<AccountMember[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('users')

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "User Management",
      actions: [
              {
        label: "Invite User",
        icon: <UserPlus className="h-4 w-4 text-white" />,
          onClick: () => {
            toast({
              title: "Coming Soon",
              description: "User invitation feature will be available soon.",
            })
          },
        },
      ],
    })
    
    // Cleanup function to reset header when component unmounts
    return () => {
      setPageHeader(null)
    }
  }, [setPageHeader, toast])

  // Function to fetch activity data
  const fetchActivityData = async (accountId: string) => {
    try {
      const supabase = createClient()
      
      // First fetch activities
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (activityError) {
        console.error('Error fetching activities from Supabase:', activityError)
        setActivities([])
        return
      }
      
      console.log('Activity data fetched:', activityData)
      
      if (activityData && activityData.length > 0) {
        // Get unique user IDs
        const userIds = Array.from(new Set(activityData.map(a => a.user_id)))
        
        // Fetch user profiles for those user IDs
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, first_name, last_name, email')
          .in('user_id', userIds)
        
        // Create a map of user profiles
        const profileMap = new Map()
        if (profiles) {
          profiles.forEach(p => profileMap.set(p.user_id, p))
        }
        
        const formattedActivities: ActivityLog[] = activityData.map((activity: any) => ({
          id: activity.id,
          user_id: activity.user_id,
          action: activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          details: activity.description,
          timestamp: activity.created_at,
          user_profiles: profileMap.get(activity.user_id) || {
            full_name: 'Unknown User',
            email: ''
          }
        }))
        console.log('Formatted activities:', formattedActivities)
        setActivities(formattedActivities)
      } else {
        console.log('No activities found, setting empty array')
        setActivities([])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivities([])
    }
  }

  // Fetch users and activity from the database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }
        
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
            title: "No Account Selected",
            description: "Please select an account to view users.",
            variant: "destructive"
          })
          setLoading(false)
          return
        }
        
        setCurrentAccountId(accountId)
        
        // Fetch account members directly
        console.log('Fetching members for account:', accountId)
        console.log('Current user:', user)
        
        // First, let's try a simple query
        const { data: testData, error: testError } = await supabase
          .from('account_members')
          .select('*')
          .eq('account_id', accountId)
        
        console.log('Test query result:', testData, testError)
        
        // Now the full query
        const { data: membersData, error: membersError } = await supabase
          .from('account_members')
          .select(`
            *,
            user_profiles!organization_members_user_id_fkey (
              email,
              full_name,
              avatar_url
            )
          `)
          .eq('account_id', accountId)
          .order('joined_at', { ascending: true })
        
        console.log('Members data:', membersData)
        console.log('Members error:', membersError)
        
        if (membersError) {
          console.error('Error fetching users:', membersError)
          toast({
            title: "Error",
            description: `Failed to load users: ${membersError.message}`,
            variant: "destructive"
          })
        } else if (membersData) {
          // Transform the data to match the expected format
          const transformedUsers = membersData.map(member => ({
            ...member,
            email: member.user_profiles?.email || '',
            full_name: member.user_profiles?.full_name || '',
            avatar_url: member.user_profiles?.avatar_url || ''
          }))
          
          setUsers(transformedUsers)
          
          // Find current user's role
          const currentMember = membersData?.find(m => m.user_id === user?.id)
          if (currentMember) {
            setCurrentUserRole(currentMember.role)
          }
        }
        
        // Fetch user activity logs
        await fetchActivityData(accountId)
        
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
    
    fetchData()
  }, [toast])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "translucent-green" | "translucent-yellow" | "translucent-gray"> = {
      active: "translucent-green",
      invited: "translucent-yellow",
      suspended: "translucent-gray",
    }
    return <Badge variant={variants[status] || "translucent-gray"}>{status}</Badge>
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      member: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.member}`}>
        {role === 'owner' && <Shield className="w-3 h-3 mr-1" />}
        {role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
        {role !== 'owner' && role !== 'admin' && <User className="w-3 h-3 mr-1" />}
        {role}
      </span>
    )
  }

  const canManageUser = (targetUser: AccountMember) => {
    // Owners can manage everyone except other owners
    if (currentUserRole === 'owner') {
      return targetUser.role !== 'owner' || targetUser.user_id === currentUserId
    }
    // Admins can manage members and viewers
    if (currentUserRole === 'admin') {
      return targetUser.role === 'member' || targetUser.role === 'viewer'
    }
    // Others cannot manage users
    return false
  }

  const ActionMenu = ({ item }: { item: AccountMember }) => {
    const isCurrentUser = item.user_id === currentUserId
    const canManage = canManageUser(item)
    
    if (!canManage || isCurrentUser) {
      return null
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Edit user feature will be available soon.",
              })
            }}
          >
            <Edit className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            Edit Role
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Manage permissions feature will be available soon.",
              })
            }}
          >
            <Settings className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
            Permissions
          </DropdownMenuItem>
          {item.role !== 'owner' && (
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Remove user feature will be available soon.",
                })
              }}
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const userColumns = [
    {
      header: "Name",
      accessorKey: "name" as const,
      cell: (row: AccountMember) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getGravatarUrlSimple(row.email, 80)} />
            <AvatarFallback className="text-xs">{getInitials(row.full_name, row.email)}</AvatarFallback>
          </Avatar>
          <span>{row.full_name || 'Unknown User'}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email" as const,
      cell: (row: AccountMember) => row.email || '-',
    },
    {
      header: "Role",
      accessorKey: "role" as const,
      cell: (row: AccountMember) => getRoleBadge(row.role),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: AccountMember) => getStatusBadge(row.status),
    },
    {
      header: "Joined",
      accessorKey: "joined_at" as const,
      cell: (row: AccountMember) => formatDate(row.joined_at),
    },
    {
      header: "Actions",
      accessorKey: "actions" as const,
      cell: (row: AccountMember) => <ActionMenu item={row} />,
    },
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinnerWithText text="Loading users..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        // Refresh activity data when switching to activity tab
        if (value === 'activity' && currentAccountId) {
          fetchActivityData(currentAccountId)
        }
      }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Users</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage users who have access to this account
              </p>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <KudosityTable data={users} columns={userColumns} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found in this account.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Log</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track user actions and changes in this account
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity) => {
                  // Use audience icon (Users) for recipient profile related activities
                  const isProfileActivity = activity.action.toLowerCase().includes('recipient profile')
                  const IconComponent = isProfileActivity ? Users : Activity
                  const iconColor = isProfileActivity ? 'text-purple-500' : 'text-orange-500'
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="mt-1">
                        <IconComponent className={`h-4 w-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{activity.action}</p>
                          <span className="text-xs text-muted-foreground">
                            by {activity.user_profiles?.full_name || activity.user_profiles?.email}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {activities.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No activity recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}