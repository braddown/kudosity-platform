"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-foreground">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Marketing Communications Section */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-foreground uppercase tracking-wider border-b pb-2">
              Marketing Communications
            </div>

            <div className="space-y-3">
              <PreferenceToggle
                id="marketing_emails"
                label="Marketing Emails"
                description="Promotional emails, newsletters, and offers"
                checked={profile.notification_preferences?.marketing_emails || false}
                onToggle={(checked) => onToggleChange("marketing_emails", checked)}
              />

              <PreferenceToggle
                id="marketing_sms"
                label="Marketing SMS"
                description="Promotional text messages and alerts"
                checked={profile.notification_preferences?.marketing_sms || false}
                onToggle={(checked) => onToggleChange("marketing_sms", checked)}
              />

              <PreferenceToggle
                id="marketing_whatsapp"
                label="Marketing WhatsApp"
                description="Promotional messages via WhatsApp"
                checked={profile.notification_preferences?.marketing_whatsapp || false}
                onToggle={(checked) => onToggleChange("marketing_whatsapp", checked)}
              />

              <PreferenceToggle
                id="marketing_rcs"
                label="Marketing RCS"
                description="Rich messaging with media and interactive elements"
                checked={profile.notification_preferences?.marketing_rcs || false}
                onToggle={(checked) => onToggleChange("marketing_rcs", checked)}
              />
            </div>
          </div>

          {/* Transactional Communications Section */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-foreground uppercase tracking-wider border-b pb-2">
              Transactional Communications
            </div>

            <div className="space-y-3">
              <PreferenceToggle
                id="transactional_emails"
                label="Transactional Emails"
                description="Order confirmations, receipts, and account updates"
                checked={profile.notification_preferences?.transactional_emails !== false}
                onToggle={(checked) => onToggleChange("transactional_emails", checked)}
              />

              <PreferenceToggle
                id="transactional_sms"
                label="Transactional SMS"
                description="Order updates and important account notifications"
                checked={profile.notification_preferences?.transactional_sms !== false}
                onToggle={(checked) => onToggleChange("transactional_sms", checked)}
              />

              <PreferenceToggle
                id="transactional_whatsapp"
                label="Transactional WhatsApp"
                description="Order and service updates via WhatsApp"
                checked={profile.notification_preferences?.transactional_whatsapp !== false}
                onToggle={(checked) => onToggleChange("transactional_whatsapp", checked)}
              />

              <PreferenceToggle
                id="transactional_rcs"
                label="Transactional RCS"
                description="Rich transactional messages with interactive elements"
                checked={profile.notification_preferences?.transactional_rcs !== false}
                onToggle={(checked) => onToggleChange("transactional_rcs", checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * PreferenceToggle - Individual preference toggle component
 */
interface PreferenceToggleProps {
  id: string
  label: string
  description: string
  checked: boolean
  onToggle: (checked: boolean) => void
}

function PreferenceToggle({
  id,
  label,
  description,
  checked,
  onToggle
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  )
}