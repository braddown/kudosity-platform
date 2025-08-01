"use client"

import MainLayout from "@/components/MainLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePageHeader } from "@/components/PageHeaderContext"
import { useState, useEffect } from "react"

export default function PersonalSettingsPage() {
  const { setPageHeader } = usePageHeader()

  // Personal Information State (from your original AccountSettings)
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "John",
    lastName: "Doe",
    mobile: "+1 (555) 123-4567",
    email: "john.doe@example.com",
    country: "United States",
    timezone: "UTC-8 (Pacific Time)",
  })

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Personal Settings",
      actions: [
        {
          label: "Save Changes",
          onClick: () => {
            // Handle save logic here
            console.log("Saving personal settings:", personalInfo)
          },
          className: "bg-blue-600 hover:bg-blue-700 text-white",
        },
      ],
    })
  }, [setPageHeader, personalInfo])

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={personalInfo.mobile}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={personalInfo.country}
                  onValueChange={(value) => setPersonalInfo({ ...personalInfo, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={personalInfo.timezone}
                  onValueChange={(value) => setPersonalInfo({ ...personalInfo, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</SelectItem>
                    <SelectItem value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</SelectItem>
                    <SelectItem value="UTC+0 (GMT)">UTC+0 (GMT)</SelectItem>
                    <SelectItem value="UTC+10 (AEST)">UTC+10 (AEST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
