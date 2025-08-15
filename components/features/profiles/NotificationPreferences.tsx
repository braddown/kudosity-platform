"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell } from "lucide-react"

interface NotificationPreferencesProps {
  profile: any
  onToggleChange: (field: string, checked: boolean) => void
}

/**
 * NotificationPreferences - Component for managing notification and communication preferences
 * 
 * @param profile - The current profile data
 * @param onToggleChange - Handler for preference toggle changes
 * 
 * @example
 * ```tsx
 * <NotificationPreferences
 *   profile={currentProfile}
 *   onToggleChange={handleToggleChange}
 * />
 * ```
 */
export function NotificationPreferences({
  profile,
  onToggleChange
}: NotificationPreferencesProps) {
  const preferences = profile.notification_preferences || {}
  
  console.log("🔍 NotificationPreferences - profile:", profile)
  console.log("🔍 NotificationPreferences - preferences:", preferences)
  
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format channel name with proper capitalization
  const formatChannelName = (channel: string) => {
    const channelNames: Record<string, string> = {
      'emails': 'Email',
      'sms': 'SMS',
      'whatsapp': 'WhatsApp',
      'rcs': 'RCS'
    }
    return channelNames[channel] || channel
  }

  // Get channel consent/activation info
  const getChannelInfo = (channel: string, type: 'marketing' | 'transactional') => {
    const channelInfoKey = `${type}_${channel}_${type === 'marketing' ? 'consent' : 'activation'}`
    const channelData = preferences[channelInfoKey]
    
    if (typeof channelData === 'object' && channelData !== null) {
      if (type === 'marketing') {
        return {
          date: channelData.consent_date,
          source: channelData.consent_source,
          label: 'Consent'
        }
      } else {
        return {
          date: channelData.activation_date,
          source: channelData.activation_source, 
          label: 'Activation'
        }
      }
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium text-foreground">
          <Bell className="h-4 w-4 text-orange-500" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Information Section */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Marketing Channels - Consent Required */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Marketing Channels</div>
              
              {['emails', 'sms', 'whatsapp', 'rcs'].map(channel => {
                const info = getChannelInfo(channel, 'marketing')
                const isEnabled = preferences[`marketing_${channel}`]
                
                return (
                  <div key={`marketing_${channel}`} className="space-y-3 p-3 border rounded-md h-32 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{formatChannelName(channel)}</p>
                      </div>
                      <Switch
                        checked={isEnabled || false}
                        onCheckedChange={(checked) => onToggleChange(`marketing_${channel}`, checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      {info && isEnabled && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Consent: {formatDate(info.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Source: {info.source || 'Not specified'}
                          </p>
                        </>
                      )}
                      {info && !isEnabled && (
                        <>
                          <p className="text-xs text-gray-400 line-through">
                            Consent: {formatDate(info.date)}
                          </p>
                          <p className="text-xs text-gray-400 line-through">
                            Source: {info.source || 'Not specified'}
                          </p>
                          <p className="text-xs text-red-500">Consent revoked</p>
                        </>
                      )}
                      {!info && isEnabled && (
                        <p className="text-xs text-amber-600">⚠️ Missing consent info</p>
                      )}
                      {!info && !isEnabled && (
                        <p className="text-xs text-gray-400">No consent given</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Transactional Channels - Activation Info */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-green-600 uppercase tracking-wider">Transactional Channels</div>
              
              {['emails', 'sms', 'whatsapp', 'rcs'].map(channel => {
                const info = getChannelInfo(channel, 'transactional')
                const isEnabled = preferences[`transactional_${channel}`] !== false
                
                return (
                  <div key={`transactional_${channel}`} className="space-y-3 p-3 border rounded-md h-32 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{formatChannelName(channel)}</p>
                      </div>
                      <Switch
                        checked={isEnabled || false}
                        onCheckedChange={(checked) => onToggleChange(`transactional_${channel}`, checked)}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      {info && isEnabled && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Activated: {formatDate(info.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Source: {info.source || 'Not specified'}
                          </p>
                        </>
                      )}
                      {info && !isEnabled && (
                        <>
                          <p className="text-xs text-gray-400 line-through">
                            Activated: {formatDate(info.date)}
                          </p>
                          <p className="text-xs text-gray-400 line-through">
                            Source: {info.source || 'Not specified'}
                          </p>
                          <p className="text-xs text-orange-500">Channel deactivated</p>
                        </>
                      )}
                      {!info && isEnabled && (
                        <p className="text-xs text-gray-400">Not activated</p>
                      )}
                      {!info && !isEnabled && (
                        <p className="text-xs text-gray-400">Channel inactive</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}

