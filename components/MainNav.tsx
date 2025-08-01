"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "./Logo"
import {
  BarChart3,
  Users,
  Settings,
  MessageSquare,
  Send,
  FileText,
  Zap,
  Route,
  Target,
  List,
  Database,
  Key,
  Webhook,
  BookOpen,
  DollarSign,
  Menu,
  Home,
  Bot,
  Phone,
} from "lucide-react"

const navigationItems = [
  { name: "Overview", href: "/overview", icon: Home },
  { name: "Profiles", href: "/profiles", icon: Users },
  { name: "Properties", href: "/properties", icon: Database },
  { name: "Segments", href: "/segments", icon: Target },
  { name: "Lists", href: "/lists", icon: List },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Performance", href: "/performance", icon: BarChart3 },
  { name: "Journeys", href: "/journeys", icon: Route },
  { name: "Touchpoints", href: "/touchpoints", icon: Zap },
  { name: "Broadcast", href: "/broadcast", icon: Send },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Reply Automation", href: "/reply-automation", icon: Bot },
  { name: "SMS", href: "/sms", icon: Phone },
  { name: "Data Sources", href: "/data-sources", icon: Database },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "API Keys", href: "/api-keys", icon: Key },
  { name: "Webhooks", href: "/webhooks", icon: Webhook },
  { name: "API Documentation", href: "/api-documentation", icon: BookOpen },
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Developers", href: "/developers", icon: BookOpen },
]

export function MainNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("space-y-1", mobile && "px-4")}>
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-background border-r overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 py-6">
            <Logo />
          </div>
          <div className="flex-1 px-4 pb-4">
            <NavItems />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <Logo />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center px-4 py-6 border-b">
                <Logo />
              </div>
              <div className="flex-1 py-4">
                <NavItems mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop content offset */}
      <div className="hidden lg:block lg:pl-64" />
    </>
  )
}
