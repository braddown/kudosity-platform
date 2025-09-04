"use client"

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, UserMinus, UserCog, Trash2, MessageCircle, Mail, Smartphone } from 'lucide-react'

// Helper functions for profile analysis
const hasMarketingChannel = (profile: any): boolean => {
  const prefs = profile.notification_preferences || {}
  return prefs.sms === true || prefs.email === true || prefs.push === true
}

const allMarketingRevoked = (profile: any): boolean => {
  const prefs = profile.notification_preferences || {}
  return prefs.sms === false && prefs.email === false && prefs.push === false
}

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
  lifecycle_stage?: string
  created_at: string
  notification_preferences?: Record<string, boolean>
  [key: string]: any
}

interface ProfileStatisticsProps {
  allProfiles: Profile[]
  filteredProfiles: Profile[]
  selectedProfiles: Profile[]
  selectedType?: string
  onTypeClick?: (type: string) => void
}

export function ProfileStatistics({
  allProfiles,
  filteredProfiles,
  selectedProfiles,
  selectedType = 'all',
  onTypeClick
}: ProfileStatisticsProps) {

  const statistics = useMemo(() => {
    // Handle case where allProfiles is not yet loaded
    if (!allProfiles || !Array.isArray(allProfiles)) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        archived: 0,
        deleted: 0,
        marketing: 0,
        unsubscribed: 0,
        smsEnabled: 0,
        emailEnabled: 0,
        pushEnabled: 0
      }
    }

    // Calculate overall statistics from all profiles
    const total = allProfiles.length
    
    const active = allProfiles.filter(p => 
      p.status?.toLowerCase() === 'active'
    ).length
    
    const inactive = allProfiles.filter(p => 
      p.status?.toLowerCase() === 'inactive'
    ).length
    
    const pending = allProfiles.filter(p => 
      p.status?.toLowerCase() === 'pending'
    ).length
    
    const archived = allProfiles.filter(p => 
      p.lifecycle_stage?.toLowerCase() === 'inactive'
    ).length
    
    const deleted = allProfiles.filter(p => 
      p.status === 'deleted' || p.lifecycle_stage?.toLowerCase() === 'deleted'
    ).length
    
    const marketing = allProfiles.filter(p => 
      p.status !== 'destroyed' && hasMarketingChannel(p)
    ).length
    
    const unsubscribed = allProfiles.filter(p => 
      p.status !== 'destroyed' && allMarketingRevoked(p)
    ).length

    // Channel statistics
    const smsEnabled = allProfiles.filter(p => 
      p.notification_preferences?.sms === true
    ).length
    
    const emailEnabled = allProfiles.filter(p => 
      p.notification_preferences?.email === true
    ).length
    
    const pushEnabled = allProfiles.filter(p => 
      p.notification_preferences?.push === true
    ).length

    return {
      total,
      active,
      inactive,
      pending,
      archived,
      deleted,
      marketing,
      unsubscribed,
      smsEnabled,
      emailEnabled,
      pushEnabled
    }
  }, [allProfiles, hasMarketingChannel, allMarketingRevoked])

  const cards = [
    {
      title: "All Profiles",
      count: statistics.total,
      icon: <Users className="h-5 w-5" />,
      type: "all",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-600 dark:text-blue-400",
      description: "Total profiles (excluding destroyed)",
    },
    {
      title: "Active",
      count: statistics.active,
      icon: <UserCheck className="h-5 w-5" />,
      type: "active",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      borderColor: "border-green-500/20",
      textColor: "text-green-600 dark:text-green-400",
      description: "Active lifecycle status",
    },
    {
      title: "Inactive",
      count: statistics.inactive,
      icon: <UserMinus className="h-5 w-5" />,
      type: "inactive",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      borderColor: "border-yellow-500/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
      description: "Inactive profiles",
    },
    {
      title: "Deleted",
      count: statistics.deleted,
      icon: <Trash2 className="h-5 w-5" />,
      type: "deleted",
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
      borderColor: "border-gray-500/20",
      textColor: "text-gray-600 dark:text-gray-400",
      description: "Soft deleted, recoverable",
    },
    {
      title: "Marketing Enabled",
      count: statistics.marketing,
      icon: <UserCog className="h-5 w-5" />,
      type: "marketing",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      borderColor: "border-orange-500/20",
      textColor: "text-orange-600 dark:text-orange-400",
      description: "Any marketing channel enabled",
    },
    {
      title: "Unsubscribed",
      count: statistics.unsubscribed,
      icon: <UserX className="h-5 w-5" />,
      type: "unsubscribed",
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      borderColor: "border-red-500/20",
      textColor: "text-red-600 dark:text-red-400",
      description: "All marketing channels disabled",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <button
          key={card.type}
          onClick={() => onTypeClick && onTypeClick(card.type)}
          className={`
            p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-md
            ${
              selectedType === card.type
                ? `${card.color} ${card.borderColor} ring-2 ring-offset-2 ring-offset-background`
                : "bg-card hover:bg-accent border-border"
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${selectedType === card.type ? card.textColor : "text-foreground"}`}>
              {card.count.toLocaleString()}
            </p>
            <p className={`text-sm ${selectedType === card.type ? card.textColor : "text-muted-foreground"}`}>
              {card.title}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}