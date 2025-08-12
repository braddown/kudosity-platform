"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface ContactPropertiesFormProps {
  profile: any
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSelectChange: (field: string, value: string) => void
  onSave?: () => void
}

/**
 * ContactPropertiesForm - Basic profile fields form
 * 
 * Extracted from the original ProfilePage component to handle basic contact
 * information fields like name, email, phone, country, timezone, etc.
 * 
 * @param profile - The profile data object
 * @param onInputChange - Handler for input field changes
 * @param onSelectChange - Handler for select field changes
 */
export function ContactPropertiesForm({ profile, onInputChange, onSelectChange, onSave }: ContactPropertiesFormProps) {
  // Handle Enter key press to save
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Save on Enter key, but not in textarea fields (allow new lines in textarea)
    const target = e.target as HTMLElement
    if (e.key === 'Enter' && target.tagName !== 'TEXTAREA' && onSave) {
      e.preventDefault()
      onSave()
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-foreground">Contact Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">
              Mobile <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="mobile" 
              name="mobile" 
              value={profile.mobile || ""} 
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              required
              placeholder="Required"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={profile.first_name || ""}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={profile.last_name || ""}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={profile.email || ""}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              value={profile.notes || ""} 
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Additional notes about this contact"
              rows={4}
            />
          </div>

          {/* Address Fields - in the specified order */}
          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address Line 1</Label>
            <Input 
              id="address_line_1" 
              name="address_line_1" 
              value={profile.address_line_1 || ""} 
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2</Label>
            <Input 
              id="address_line_2" 
              name="address_line_2" 
              value={profile.address_line_2 || ""} 
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city" 
              name="city" 
              value={profile.city || ""} 
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="City"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input 
              id="state" 
              name="state" 
              value={profile.state || ""} 
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="State or province"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postcode/ZIP</Label>
            <Input 
              id="postal_code" 
              name="postal_code" 
              value={profile.postal_code || ""} 
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="ZIP/Postal code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={typeof profile.country === "string" ? profile.country : ""}
              onValueChange={(value) => onSelectChange("country", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="New Zealand">New Zealand</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={profile.timezone || ""}
              onValueChange={(value) => onSelectChange("timezone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                <SelectItem value="America/Denver">America/Denver (MST/MDT)</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                <SelectItem value="America/Toronto">America/Toronto</SelectItem>
                <SelectItem value="America/Vancouver">America/Vancouver</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Rome">Europe/Rome (CET/CEST)</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                <SelectItem value="Asia/Shanghai">Asia/Shanghai (CST)</SelectItem>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                <SelectItem value="Australia/Melbourne">Australia/Melbourne (AEST/AEDT)</SelectItem>
                <SelectItem value="Australia/Brisbane">Australia/Brisbane (AEST)</SelectItem>
                <SelectItem value="Australia/Perth">Australia/Perth (AWST)</SelectItem>
                <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language_preferences">Language Preferences</Label>
            <Select
              value={profile.language_preferences || ""}
              onValueChange={(value) => onSelectChange("language_preferences", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="en-AU">English (Australia)</SelectItem>
                <SelectItem value="en-CA">English (Canada)</SelectItem>
                <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                <SelectItem value="fr-FR">French (France)</SelectItem>
                <SelectItem value="fr-CA">French (Canada)</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
                <SelectItem value="it-IT">Italian</SelectItem>
                <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                <SelectItem value="pt-PT">Portuguese (Portugal)</SelectItem>
                <SelectItem value="nl-NL">Dutch</SelectItem>
                <SelectItem value="sv-SE">Swedish</SelectItem>
                <SelectItem value="da-DK">Danish</SelectItem>
                <SelectItem value="no-NO">Norwegian</SelectItem>
                <SelectItem value="fi-FI">Finnish</SelectItem>
                <SelectItem value="ru-RU">Russian</SelectItem>
                <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                <SelectItem value="zh-TW">Chinese (Traditional)</SelectItem>
                <SelectItem value="ja-JP">Japanese</SelectItem>
                <SelectItem value="ko-KR">Korean</SelectItem>
                <SelectItem value="ar-SA">Arabic</SelectItem>
                <SelectItem value="hi-IN">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device">Device</Label>
            <Input
              id="device"
              name="device"
              value={profile.device || ""}
              onChange={onInputChange}
              placeholder="e.g. iPhone, Desktop"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="os">Operating System</Label>
            <Select
              value={profile.os || ""}
              onValueChange={(value) => onSelectChange("os", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operating system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Windows 11">Windows 11</SelectItem>
                <SelectItem value="Windows 10">Windows 10</SelectItem>
                <SelectItem value="Windows 8.1">Windows 8.1</SelectItem>
                <SelectItem value="macOS Sonoma">macOS Sonoma</SelectItem>
                <SelectItem value="macOS Ventura">macOS Ventura</SelectItem>
                <SelectItem value="macOS Monterey">macOS Monterey</SelectItem>
                <SelectItem value="macOS Big Sur">macOS Big Sur</SelectItem>
                <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                <SelectItem value="Linux">Linux</SelectItem>
                <SelectItem value="CentOS">CentOS</SelectItem>
                <SelectItem value="Debian">Debian</SelectItem>
                <SelectItem value="iOS 17">iOS 17</SelectItem>
                <SelectItem value="iOS 16">iOS 16</SelectItem>
                <SelectItem value="iOS 15">iOS 15</SelectItem>
                <SelectItem value="Android 14">Android 14</SelectItem>
                <SelectItem value="Android 13">Android 13</SelectItem>
                <SelectItem value="Android 12">Android 12</SelectItem>
                <SelectItem value="Android 11">Android 11</SelectItem>
                <SelectItem value="Chrome OS">Chrome OS</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={profile.location || ""}
              onChange={onInputChange}
              placeholder="e.g. Melbourne, VIC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              value={profile.source || ""}
              onValueChange={(value) => onSelectChange("source", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Landing Page">Landing Page</SelectItem>
                <SelectItem value="Contact Form">Contact Form</SelectItem>
                <SelectItem value="Newsletter Signup">Newsletter Signup</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Twitter">Twitter</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                <SelectItem value="Instagram Ads">Instagram Ads</SelectItem>
                <SelectItem value="LinkedIn Ads">LinkedIn Ads</SelectItem>
                <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                <SelectItem value="SMS Campaign">SMS Campaign</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Word of Mouth">Word of Mouth</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
                <SelectItem value="Webinar">Webinar</SelectItem>
                <SelectItem value="Trade Show">Trade Show</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Print Ad">Print Ad</SelectItem>
                <SelectItem value="Radio">Radio</SelectItem>
                <SelectItem value="TV">TV</SelectItem>
                <SelectItem value="Podcast">Podcast</SelectItem>
                <SelectItem value="Blog">Blog</SelectItem>
                <SelectItem value="SEO">SEO</SelectItem>
                <SelectItem value="Direct Mail">Direct Mail</SelectItem>
                <SelectItem value="Cold Call">Cold Call</SelectItem>
                <SelectItem value="Cold Email">Cold Email</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Affiliate">Affiliate</SelectItem>
                <SelectItem value="API">API</SelectItem>
                <SelectItem value="Import">Import</SelectItem>
                <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}