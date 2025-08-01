"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AccountSettings() {
  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "John",
    lastName: "Doe",
    mobile: "+1 (555) 123-4567",
    email: "john.doe@example.com",
    country: "United States",
    timezone: "UTC-8 (Pacific Time)",
  })

  // Organization Information State
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

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Personal Information Section */}
      <Card className="w-full max-w-none">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Manage your personal account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Personal Information
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Information Section */}
      <Card className="w-full max-w-none">
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>Manage your organization settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Organization Information
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
