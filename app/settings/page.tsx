"use client"

import MainLayout from "@/components/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Building, Users, Mail, Globe, ArrowRight } from "lucide-react"
import { usePageHeader } from "@/components/PageHeaderContext"
import { useEffect } from "react"
import Link from "next/link"

export default function SettingsPage() {
  const { setPageHeader } = usePageHeader()

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Settings",
      actions: [],
    })
  }, [setPageHeader])

  const settingsCards = [
    {
      title: "Personal Settings",
      description: "Manage your personal profile and preferences",
      icon: <User className="h-6 w-6" />,
      href: "/settings/personal",
      color: "text-blue-600",
    },
    {
      title: "Organization",
      description: "Update your company information and details",
      icon: <Building className="h-6 w-6" />,
      href: "/settings/organization",
      color: "text-green-600",
    },
    {
      title: "Users",
      description: "Manage team members and their permissions",
      icon: <Users className="h-6 w-6" />,
      href: "/settings/users",
      color: "text-purple-600",
    },
    {
      title: "Senders",
      description: "Configure verified sender identities",
      icon: <Mail className="h-6 w-6" />,
      href: "/settings/senders",
      color: "text-orange-600",
    },
    {
      title: "Domains",
      description: "Manage domains and email authentication",
      icon: <Globe className="h-6 w-6" />,
      href: "/settings/domains",
      color: "text-red-600",
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-2">Account Configuration</h3>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`${card.color}`}>{card.icon}</div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{card.description}</CardDescription>
                  <div className="flex items-center text-sm text-primary">
                    Configure
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
