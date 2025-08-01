"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown, ChevronUp } from "lucide-react"
import { navItems, getRouteFromSubitem } from "@/config/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // Initialize based on current path
  useEffect(() => {
    const currentPath = pathname
    let found = false

    // Find matching subitem based on current path
    for (const item of navItems) {
      for (const subitem of item.subitems) {
        const expectedRoute = getRouteFromSubitem(subitem, item.name)
        if (currentPath === expectedRoute) {
          setExpandedItems([item.name])
          setSelectedItem(subitem)
          found = true
          break
        }
      }
      if (found) break
    }

    // Default to Overview if on root or no match found
    if (!found) {
      if (currentPath === "/" || currentPath === "") {
        setExpandedItems(["Dashboards"])
        setSelectedItem("Overview")
      }
    }
  }, [pathname])

  const navigateToSubitem = (subitem: string, parentItemName: string) => {
    const route = getRouteFromSubitem(subitem, parentItemName)
    router.push(route)
  }

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) => {
      if (prev.includes(name)) {
        return prev.filter((item) => item !== name)
      } else {
        const itemToExpand = navItems.find((it) => it.name === name)
        if (itemToExpand && itemToExpand.subitems.length > 0) {
          const firstSubitem = itemToExpand.subitems[0]
          setSelectedItem(firstSubitem)
          navigateToSubitem(firstSubitem, name)
        }
        return [name] // Only one item expanded at a time
      }
    })
  }

  const handleMenuItemClick = (subitem: string, parentItemName: string) => {
    setSelectedItem(subitem)
    if (!expandedItems.includes(parentItemName)) {
      setExpandedItems([parentItemName])
    }
    navigateToSubitem(subitem, parentItemName)
    if (isOpen) onClose() // Close sidebar on mobile
  }

  return (
    <aside
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed top-16 left-0 bottom-0 w-64 bg-background overflow-y-auto z-20 border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0`}
    >
      <nav className="px-4 lg:px-6 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.name}>
                <button
                  className="w-full flex items-center px-2 py-2 text-sm leading-5 font-medium rounded-md focus:outline-none transition ease-in-out duration-150 text-foreground hover:bg-accent"
                  onClick={() => toggleExpanded(item.name)}
                  aria-expanded={expandedItems.includes(item.name)}
                >
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 ${
                      expandedItems.includes(item.name) && item.subitems.some((sub) => selectedItem === sub)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </span>
                  <span className="ml-3">{item.name}</span>
                  {expandedItems.includes(item.name) ? (
                    <ChevronUp className="ml-auto h-5 w-5" />
                  ) : (
                    <ChevronDown className="ml-auto h-5 w-5" />
                  )}
                </button>
                {expandedItems.includes(item.name) && (
                  <div className="ml-2 py-1">
                    {item.subitems.map((subitem) => (
                      <button
                        key={subitem}
                        className={`block py-2.5 pl-11 pr-3 my-1 text-sm rounded-md hover:bg-accent flex items-center w-full text-left
                        ${selectedItem === subitem ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                        onClick={() => handleMenuItemClick(subitem, item.name)}
                      >
                        {subitem}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
