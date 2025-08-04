"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useSimpleNavigation } from "@/lib/navigation/useNavigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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

  return (
    <aside
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
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
                  <item.icon className="h-5 w-5" />
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
                        if (isOpen) onClose()
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
  )
}
