import { LayoutDashboard, Users, MessageSquare, Bot, Settings, Target, Code } from "lucide-react"
import type React from "react"

// Define the navigation item type
interface NavItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  subitems: string[]
}

// Single navigation system - this is the source of truth
export const navItems: NavItem[] = [
  {
    name: "Dashboards",
    icon: LayoutDashboard,
    subitems: ["Overview", "Performance", "Logs"],
  },
  {
    name: "Audience",
    icon: Users,
    subitems: ["Profiles", "Segments", "Properties", "Data-Sources"],
  },
  {
    name: "Messaging",
    icon: MessageSquare,
    subitems: ["Chat", "Broadcast", "Templates"],
  },
  {
    name: "Campaigns",
    icon: Target,
    subitems: ["Touchpoints", "Journeys", "Activity"],
  },
  {
    name: "Automation",
    icon: Bot,
    subitems: ["Agents", "Reply-Automation"],
  },
  {
    name: "Developers",
    icon: Code,
    subitems: ["API-Keys", "Webhooks", "API-Documentation"],
  },
  {
    name: "Settings",
    icon: Settings,
    subitems: ["Personal", "Organization", "Users", "Senders", "Domains"],
  },
]

// Helper function to get route from subitem name
export const getRouteFromSubitem = (subitem: string, parentName: string): string => {
  // Special cases for routes that don't follow the standard pattern
  const specialRoutes: Record<string, string> = {
    Activity: "/campaigns/activity",
    "Data-Sources": "/data-sources",
    "Reply-Automation": "/reply-automation",
    "API-Keys": "/api-keys",
    "API-Documentation": "/api-documentation",
    // Settings routes
    Personal: "/settings/personal",
    Organization: "/settings/organization",
    Users: "/settings/users",
    Senders: "/settings/senders",
    Domains: "/settings/domains",
  }

  if (specialRoutes[subitem]) {
    return specialRoutes[subitem]
  }

  // Standard pattern: convert to kebab-case
  return `/${subitem.toLowerCase().replace(/\s+/g, "-")}`
}

// Export for backward compatibility if needed elsewhere
export const navigationItems = navItems
export const settingsItems = navItems.find((item) => item.name === "Settings")?.subitems || []
