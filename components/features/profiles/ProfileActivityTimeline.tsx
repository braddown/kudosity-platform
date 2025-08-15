import React, { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Calendar, FileEdit, MessageSquare, Shield, ShieldCheck, ShieldX, ChevronRight, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProfileActivityTimelineProps {
  profile?: any
  profileId?: string | null
  refreshTrigger?: number // Add a trigger to force refresh
  isNewProfile?: boolean
}

/**
 * ProfileActivityTimeline - Component for displaying profile activity history and events
 * 
 * @param profile - The current profile data
 * 
 * @example
 * ```tsx
 * <ProfileActivityTimeline
 *   profile={currentProfile}
 * />
 * ```
 */
export function ProfileActivityTimeline({
  profile,
  profileId,
  refreshTrigger,
  isNewProfile = false
}: ProfileActivityTimelineProps) {
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivityLogs = async () => {
      const id = profileId || profile?.id
      if (!id || isNewProfile) {
        setLoading(false)
        return
      }
      
      try {
        // Use the API endpoint instead of direct Supabase query
        const response = await fetch(`/api/cdp-profiles/${id}/activity`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          console.error('Error fetching activity logs:', await response.text())
          setActivityLogs([])
        } else {
          const result = await response.json()
          setActivityLogs(result.data || [])
        }
      } catch (err) {
        console.error('Exception fetching activity logs:', err)
        setActivityLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchActivityLogs()
  }, [profile?.id, refreshTrigger])

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'consent_given':
        return <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
      case 'consent_revoked':
        return <ShieldX className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
      case 'transactional_activated':
        return <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
      case 'transactional_deactivated':
        return <ShieldX className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
      case 'property_updated':
        return <FileEdit className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
      case 'profile_updated':
        return <FileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
      default:
        return <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5" />
    }
  }

  const getActivityColors = (activityType: string) => {
    switch (activityType) {
      case 'consent_given':
        return {
          bgColor: "bg-green-50 dark:bg-green-950/30",
          borderColor: "border-green-400 dark:border-green-500"
        }
      case 'consent_revoked':
        return {
          bgColor: "bg-red-50 dark:bg-red-950/30",
          borderColor: "border-red-400 dark:border-red-500"
        }
      case 'transactional_activated':
        return {
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          borderColor: "border-blue-400 dark:border-blue-500"
        }
      case 'transactional_deactivated':
        return {
          bgColor: "bg-orange-50 dark:bg-orange-950/30",
          borderColor: "border-orange-400 dark:border-orange-500"
        }
      case 'property_updated':
        return {
          bgColor: "bg-purple-50 dark:bg-purple-950/30",
          borderColor: "border-purple-400 dark:border-purple-500"
        }
      case 'profile_updated':
        return {
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          borderColor: "border-blue-400 dark:border-blue-500"
        }
      default:
        return {
          bgColor: "bg-gray-50 dark:bg-gray-950/30",
          borderColor: "border-gray-400 dark:border-gray-500"
        }
    }
  }

  // Combine and sort all events
  const allEvents = [
    // Activity logs from database
    ...activityLogs.map((log) => ({
      ...log,
      timestamp: log.created_at,
      type: 'activity'
    })),
    // Profile system events
    ...(profile.created_at ? [{
      id: 'profile_created',
      timestamp: profile.created_at,
      type: 'system',
      title: 'Profile Created',
      description: 'Contact was added to the system',
      icon: <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />,
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-400 dark:border-green-500"
    }] : [])
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Limit to 10 most recent events
  const limitedEvents = allEvents.slice(0, 10)
  const hasMore = allEvents.length > 10

  return (
    <Card data-testid="activity-history">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl font-medium text-foreground">
          <Clock className="h-4 w-4 text-cyan-500" />
          Recent Activity
        </CardTitle>
        {hasMore && !isNewProfile && (
          <Link href={`/profiles/${profileId || profile?.id}/activity`}>
            <Button variant="ghost" size="sm" className="text-xs">
              View All ({allEvents.length})
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Activity Logs */}
          <div className="space-y-3">
            {isNewProfile ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileEdit className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p className="text-sm">Activity will appear here once the profile is created</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Save the profile to start tracking activity
                </p>
              </div>
            ) : loading ? (
              <div className="text-sm text-gray-500">Loading activity history...</div>
            ) : (
              <>
                {/* Display limited events */}
                {limitedEvents.map((event) => {
                  if (event.type === 'activity') {
                    const colors = getActivityColors(event.activity_type)
                    return (
                      <ActivityEvent
                        key={event.id}
                        icon={getActivityIcon(event.activity_type)}
                        title={event.description}
                        timestamp={event.timestamp}
                        description={`Source: ${event.source}${event.channel ? ` • Channel: ${event.channel}` : ''}`}
                        bgColor={colors.bgColor}
                        borderColor={colors.borderColor}
                      />
                    )
                  } else {
                    return (
                      <ActivityEvent
                        key={event.id}
                        icon={event.icon}
                        title={event.title}
                        timestamp={event.timestamp}
                        description={event.description}
                        bgColor={event.bgColor}
                        borderColor={event.borderColor}
                      />
                    )
                  }
                })}

                {activityLogs.length === 0 && !loading && (
                  <div className="text-sm text-gray-500">No activity recorded yet.</div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * ActivityEvent - Individual activity event component
 */
interface ActivityEventProps {
  icon: React.ReactNode
  title: string
  timestamp: string
  description: string
  bgColor: string
  borderColor: string
}

function ActivityEvent({
  icon,
  title,
  timestamp,
  description,
  bgColor,
  borderColor
}: ActivityEventProps) {
  const formattedTime = format(parseISO(timestamp), "PPp")

  return (
    <div className={`flex items-start space-x-3 p-3 ${bgColor} rounded-lg border-l-4 ${borderColor}`}>
      {icon}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formattedTime}
          </p>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{description}</p>
      </div>
    </div>
  )
}

/**
 * ActivityPlaceholder - Placeholder for future activity events
 */
function ActivityPlaceholder() {
  return (
    <div className="border-t pt-4">
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
        <p className="text-sm">Additional activity events will appear here</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Messages, interactions, and other events will be tracked
        </p>
      </div>
    </div>
  )
}