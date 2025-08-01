"use client"

import MainLayout from "@/components/MainLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePageHeader } from "@/components/PageHeaderContext"
import { useState, useEffect } from "react"

export default function OrganizationSettingsPage() {
  const { setPageHeader } = usePageHeader()

  // Organization Information State (from your original AccountSettings)
  const [orgInfo, setOrgInfo] = useState({
    companyName: "Acme Corp",
    companyAddress: "123 Main St, Anytown, USA",
    country: "United States",
    phoneNumber: "+1 (555) 987-6543",
    mainEmail: "info@acmecorp.com",
    billingEmail: "billing@acmecorp.com",
    supportEmail: "support@acmecorp.com",
    timezone: "UTC-5 (Eastern Time)",
  })

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Organization Settings",
      actions: [
        {
          label: "Save Changes",
          onClick: () => {
            // Handle save logic here
            console.log("Saving organization settings:", orgInfo)
          },
          className: "bg-blue-600 hover:bg-blue-700 text-white",
        },
      ],
    })
  }, [setPageHeader, orgInfo])

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={orgInfo.companyName}
                  onChange={(e) => setOrgInfo({ ...orgInfo, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input
                  id="companyAddress"
                  value={orgInfo.companyAddress}
                  onChange={(e) => setOrgInfo({ ...orgInfo, companyAddress: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgCountry">Country</Label>
                <Select value={orgInfo.country} onValueChange={(value) => setOrgInfo({ ...orgInfo, country: value })}>
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
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={orgInfo.phoneNumber}
                  onChange={(e) => setOrgInfo({ ...orgInfo, phoneNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mainEmail">Main Email</Label>
                <Input
                  id="mainEmail"
                  type="email"
                  value={orgInfo.mainEmail}
                  onChange={(e) => setOrgInfo({ ...orgInfo, mainEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingEmail">Billing Email</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={orgInfo.billingEmail}
                  onChange={(e) => setOrgInfo({ ...orgInfo, billingEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={orgInfo.supportEmail}
                  onChange={(e) => setOrgInfo({ ...orgInfo, supportEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgTimezone">Timezone</Label>
                <Select value={orgInfo.timezone} onValueChange={(value) => setOrgInfo({ ...orgInfo, timezone: value })}>
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
