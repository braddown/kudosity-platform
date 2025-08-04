import React from "react"
import { format, parseISO } from "date-fns"
import { Calendar, FileEdit, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfileActivityTimelineProps {
  profile: any
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
  profile
}: ProfileActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-foreground">Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Profile Timeline */}
          <div className="space-y-3">
            {profile.updated_at && (
              <ActivityEvent
                icon={<FileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />}
                title="Profile Updated"
                timestamp={profile.updated_at}
                description="Contact information was modified"
                bgColor="bg-blue-50 dark:bg-blue-950/30"
                borderColor="border-blue-400 dark:border-blue-500"
              />
            )}

            {profile.created_at && (
              <ActivityEvent
                icon={<Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />}
                title="Profile Created"
                timestamp={profile.created_at}
                description="Contact was added to the system"
                bgColor="bg-green-50 dark:bg-green-950/30"
                borderColor="border-green-400 dark:border-green-500"
              />
            )}
          </div>

          {/* Future activity events placeholder */}
          <ActivityPlaceholder />
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