"use client"
import { useState, useEffect, Suspense, type ReactNode } from "react"
import {
  Menu,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Loader2,
  PhoneCall,
  CreditCard,
  Tag,
  MessageCircle,
  HelpCircle,
  LogOut,
  FileText,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import Link from "next/link"
import { usePageHeader } from "./PageHeaderContext"
import { EditActionButtons } from "./EditActionButtons"
import { Logo } from "@/components/Logo"
import { useTheme } from "next-themes"
import { useSimpleNavigation } from "@/lib/navigation/useNavigation"

interface MainLayoutProps {
  children: ReactNode
}

function AccountDropdown({ onSelectProfileItem }: { onSelectProfileItem: (item: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    email?: string
    name?: string
    accountName?: string
    accountId?: string
  }>({})
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  // Fetch user information
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { createClient } = await import('@/lib/auth/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          
          // Get current account
          const cookies = document.cookie.split('; ')
          const accountCookie = cookies.find(c => c.startsWith('current_account='))
          const accountId = accountCookie?.split('=')[1]
          
          if (accountId) {
            const { data: account } = await supabase
              .from('accounts')
              .select('name, id')
              .eq('id', accountId)
              .single()
            
            setUserInfo({
              email: user.email,
              name: profile?.full_name || user.email?.split('@')[0],
              accountName: account?.name,
              accountId: account?.id
            })
          } else {
            setUserInfo({
              email: user.email,
              name: profile?.full_name || user.email?.split('@')[0]
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }
    
    fetchUserInfo()
  }, [])

  const handleItemClick = (item: string) => {
    setIsOpen(false)
    if (item === "Pricing") {
      router.push("/pricing")
    } else if (item === "Log out") {
      // Use proper sign out from Supabase auth
      import('@/lib/auth/client').then(({ signOut }) => {
        signOut()
      })
    } else if (item === "Light mode") {
      setTheme("light")
      localStorage.setItem("manual-theme-override", "light")
    } else if (item === "Dark mode") {
      setTheme("dark")
      localStorage.setItem("manual-theme-override", "dark")
    } else {
      onSelectProfileItem(item)
    }
  }

  const showLightMode = theme === "dark"
  const themeOption = showLightMode ? "Light mode" : "Dark mode"
  const themeIcon = showLightMode ? <Sun className="mr-3 h-4 w-4" /> : <Moon className="mr-3 h-4 w-4" />
  
  // Get initials from name or email
  const getInitials = () => {
    if (userInfo.name) {
      return userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (userInfo.email) {
      return userInfo.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground text-sm font-medium">
              {getInitials()}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 z-[100] p-0 bg-card border-border" side="bottom" align="end" forceMount>
          <div className="flex items-center space-x-3 p-4">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src="/placeholder.svg" alt={getInitials()} />
              <AvatarFallback className="bg-muted text-foreground">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium leading-none truncate text-foreground">
                {userInfo.name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                {userInfo.email || 'No email'}
              </p>
              {userInfo.accountName && (
                <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                  {userInfo.accountName}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator className="my-3" />
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground"
            onClick={() => router.push("/profile")}
          >
            <User className="mr-3 h-4 w-4" />
            <span>User Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground"
            onClick={() => handleItemClick("Billing")}
          >
            <CreditCard className="mr-3 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground"
            onClick={() => handleItemClick("Pricing")}
          >
            <Tag className="mr-3 h-4 w-4" />
            <span>Pricing</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground"
            onClick={() => handleItemClick("Contact us")}
          >
            <MessageCircle className="mr-3 h-4 w-4" />
            <span>Contact us</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground"
            onClick={() => handleItemClick("Help")}
          >
            <HelpCircle className="mr-3 h-4 w-4" />
            <span>Help</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground"
            onClick={() => handleItemClick("Terms and policies")}
          >
            <FileText className="mr-3 h-4 w-4" />
            <span>Terms and policies</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground"
            onClick={() => handleItemClick(themeOption)}
          >
            {themeIcon}
            <span>{themeOption}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="py-3 px-4 hover:bg-accent cursor-pointer text-foreground -mt-1"
            onClick={() => handleItemClick("Log out")}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { pageHeader } = usePageHeader()
  
  // Use unified navigation system - eliminates ~75 lines of duplicated logic
  const {
    navigation,
    expandedItems,
    selectedItem,
    toggleExpanded,
    navigateToItem,
    isExpanded,
    isSelected,
  } = useSimpleNavigation()

  // Navigation logic is now handled by useSimpleNavigation() hook

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar")
      const menuButton = document.querySelector('button[aria-label="Open sidebar"]')
      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSidebarOpen])

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [pathname])

  // Check authentication using Supabase
  useEffect(() => {
    const checkAuth = async () => {
      const { createClient } = await import('@/lib/auth/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user && pathname !== "/" && !pathname.startsWith("/auth")) {
        router.push("/auth/login")
      }
    }
    
    checkAuth()
  }, [pathname, router])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 bg-background z-[90] border-b border-border">
        <div className="flex justify-between items-center h-16 px-4 lg:px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2 hover:bg-accent"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Logo className="h-8 w-auto" />
          </div>
          <div className="relative z-[100]">
            <AccountDropdown
              onSelectProfileItem={(item) => {
                if (item === "Pricing") {
                  router.push("/pricing")
                } else {
                  console.log("Profile dropdown item selected:", item)
                }
              }}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-grow pt-16">
        <aside
          id="sidebar"
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed top-16 left-0 bottom-0 w-64 bg-background overflow-y-auto z-20 border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0`}
        >
          <nav className="px-4 lg:px-6 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.id}>
                  <button
                    className="w-full flex items-center px-2 py-2 text-sm leading-5 font-medium rounded-md focus:outline-none transition ease-in-out duration-150 text-foreground hover:bg-accent"
                    onClick={() => toggleExpanded(item.id)}
                    aria-expanded={isExpanded(item.id)}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 ${
                        isExpanded(item.id) && item.children?.some((child) => isSelected(child.id))
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                    </span>
                    <span className="ml-3">{item.label}</span>
                    {isExpanded(item.id) ? (
                      <ChevronUp className="ml-auto h-5 w-5" />
                    ) : (
                      <ChevronDown className="ml-auto h-5 w-5" />
                    )}
                  </button>
                  {isExpanded(item.id) && item.children && (
                    <div className="ml-2 py-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          className={`block py-2.5 pl-11 pr-3 my-1 text-sm rounded-md hover:bg-accent flex items-center w-full text-left
                          ${isSelected(child.id) ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                          onClick={() => {
                            navigateToItem(child.id, item.id)
                            if (isSidebarOpen) setIsSidebarOpen(false)
                          }}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1 bg-background lg:ml-64 flex flex-col">
          {/* Fixed Page Header */}
          {pageHeader && (
            <div className="fixed top-16 left-0 right-0 lg:left-64 w-full lg:w-auto border-b border-border py-4 px-6 flex justify-between items-center bg-background z-[75]">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-foreground">
                  {pathname === "/chat"
                    ? `Chat with ${searchParams.get("firstName") || ""} ${searchParams.get("lastName") || ""}`.trim() ||
                      "Select a Contact"
                    : pageHeader?.title || "Dashboard"}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {pathname === "/pricing" && (
                                  <Button
                  onClick={() => {
                    console.log("Contact sales clicked")
                  }}
                  variant="default"
                >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Contact Sales
                  </Button>
                )}
                {pageHeader.actions
                  ?.filter(
                    (action) =>
                      !action.label?.includes("Archive") &&
                      !action.label?.includes("Contacts") &&
                      !action.label?.includes("Settings"),
                  )
                  .map((action, index) => {
                    const isSaveAction = action.label?.includes("Save") || action.label?.includes("Saving")
                    const isCloseAction = !action.label && action.icon

                    if (isSaveAction && pageHeader.actions && pageHeader.actions.length > 1) {
                      const closeAction = pageHeader.actions.find((a) => !a.label && a.icon)
                      if (closeAction) {
                        return (
                          <EditActionButtons
                            key={index}
                            onSave={action.onClick || (() => {})}
                            onCancel={closeAction.onClick || (() => {})}
                            isSaving={action.label?.includes("Saving") || false}
                            saveText={action.label || "Save"}
                          />
                        )
                      }
                    }

                    if (isCloseAction && pageHeader.actions && pageHeader.actions.length > 1) {
                      const hasSaveAction = pageHeader.actions.some(
                        (a) => a.label?.includes("Save") || a.label?.includes("Saving"),
                      )
                      if (hasSaveAction) {
                        return null
                      }
                    }

                    if (action.href) {
                      return (
                        <Link key={index} href={action.href}>
                          <Button
                            variant={action.variant || "default"}
                            className={`bg-primary hover:bg-primary/90 text-primary-foreground ${action.className || ""}`}
                          >
                            {action.icon}
                            {action.label && <span className={action.icon ? "ml-1" : ""}>{action.label}</span>}
                          </Button>
                        </Link>
                      )
                    }
                    return (
                      <Button
                        key={index}
                        onClick={action.onClick}
                        variant={action.variant || "default"}
                        className={`${
                          action.variant === "ghost"
                            ? "hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white hover:text-foreground dark:hover:text-white transition-colors"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        } ${action.className || ""}`}
                      >
                        {action.icon}
                        {action.label && <span className={action.icon ? "ml-1" : ""}>{action.label}</span>}
                      </Button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div
            className={`flex-1 overflow-auto bg-background text-foreground p-5 ${pageHeader ? "pt-[88px]" : "pt-5"}`}
            style={{ minHeight: "calc(100vh - 64px)" }}
          >
            <Suspense
              fallback={
                <div className="p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
