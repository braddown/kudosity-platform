import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Bot,
  Settings,
  Target,
  Code,
  BarChart3,
  Database,
  List,
  Send,
  FileText,
  Zap,
  Route,
  Key,
  Webhook,
  BookOpen,
  Home,
} from "lucide-react"
import type React from "react"

/**
 * Unified Navigation System - Single Source of Truth
 * 
 * This configuration consolidates all navigation data and provides
 * a consistent interface for accessing navigation items throughout
 * the application.
 * 
 * ## Key Features:
 * - Eliminates code duplication across navigation components
 * - Provides type-safe navigation with full TypeScript support
 * - Supports hierarchical navigation with parent/child relationships
 * - Includes permission-based filtering for role-based access
 * - Optimized for performance with pre-built lookup maps
 * - Extensible design for future navigation requirements
 * 
 * ## Usage:
 * ```typescript
 * import { navigationConfig, findItemByPath } from '@/lib/navigation/config'
 * 
 * // Get all navigation items
 * const navigation = navigationConfig
 * 
 * // Find item by path
 * const item = findItemByPath('/profiles')
 * ```
 * 
 * @see {@link lib/navigation/useNavigation.ts} For React hooks
 * @see {@link lib/navigation/README.md} For complete documentation
 */

/**
 * Base navigation item interface
 */
export interface BaseNavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  permissions?: string[]
  isExternal?: boolean
  isHidden?: boolean
}

/**
 * Navigation item with direct path (leaf node)
 */
export interface NavigationLeaf extends BaseNavigationItem {
  path: string
  children?: never
}

/**
 * Navigation item with children (parent node)
 */
export interface NavigationParent extends BaseNavigationItem {
  path?: string // Optional - parent might have a default child route
  children: NavigationItem[]
}

/**
 * Union type for all navigation items
 */
export type NavigationItem = NavigationLeaf | NavigationParent

/**
 * Type guard to check if item has children
 */
export const hasChildren = (item: NavigationItem): item is NavigationParent => {
  return 'children' in item && Array.isArray(item.children)
}

/**
 * Type guard to check if item is a leaf node
 */
export const isLeafNode = (item: NavigationItem): item is NavigationLeaf => {
  return 'path' in item && typeof item.path === 'string' && !hasChildren(item)
}

/**
 * Unified Navigation Configuration
 * 
 * This configuration includes all navigation items from both the previous
 * hierarchical system and the flat MainNav system, organized in a logical
 * hierarchy while maintaining access to all routes.
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: "dashboards",
    label: "Dashboards",
    icon: LayoutDashboard,
    description: "Overview and analytics dashboards",
    children: [
      {
        id: "overview",
        label: "Overview",
        icon: Home,
        path: "/overview",
        description: "Main dashboard overview"
      },
      {
        id: "performance",
        label: "Performance",
        icon: BarChart3,
        path: "/performance",
        description: "Performance metrics and analytics"
      },
      {
        id: "logs",
        label: "Logs",
        icon: FileText,
        path: "/logs",
        description: "System and activity logs"
      }
    ]
  },
  {
    id: "audience",
    label: "Audience",
    icon: Users,
    description: "Manage contacts, segments, and data",
    children: [
      {
        id: "profiles",
        label: "Recipient Profiles",
        icon: Users,
        path: "/profiles",
        description: "Recipient and customer profile management"
      },
      {
        id: "segments",
        label: "Segments",
        icon: Target,
        path: "/segments",
        description: "Audience segmentation"
      },
      {
        id: "lists",
        label: "Lists",
        icon: List,
        path: "/lists",
        description: "Contact lists"
      },
      {
        id: "properties",
        label: "Properties",
        icon: Database,
        path: "/properties",
        description: "Custom fields and properties"
      },
      {
        id: "data-sources",
        label: "Data Sources",
        icon: Database,
        path: "/data-sources",
        description: "External data integrations"
      }
    ]
  },
  {
    id: "messaging",
    label: "Messaging",
    icon: MessageSquare,
    description: "Communication and messaging tools",
    children: [
      {
        id: "chat",
        label: "Chat",
        icon: MessageSquare,
        path: "/chat",
        description: "Live chat with contacts"
      },
      {
        id: "broadcast",
        label: "Broadcast",
        icon: Send,
        path: "/broadcast",
        description: "Send broadcast messages"
      },
      {
        id: "templates",
        label: "Templates",
        icon: FileText,
        path: "/templates",
        description: "Message templates"
      }
    ]
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Target,
    description: "Campaign management and tracking",
    children: [
      {
        id: "touchpoints",
        label: "Touchpoints",
        icon: Zap,
        path: "/touchpoints",
        description: "Manage touchpoints"
      },
      {
        id: "journeys",
        label: "Journeys",
        icon: Route,
        path: "/journeys",
        description: "Customer journey automation"
      },
      {
        id: "activity",
        label: "Activity",
        icon: BarChart3,
        path: "/campaigns/activity",
        description: "Campaign activity and performance"
      }
    ]
  },
  {
    id: "automation",
    label: "Automation",
    icon: Bot,
    description: "Automated responses and AI agents",
    children: [
      {
        id: "agents",
        label: "Agents",
        icon: Bot,
        path: "/agents",
        description: "AI agents and chatbots"
      },
      {
        id: "reply-automation",
        label: "Reply Automation",
        icon: Bot,
        path: "/reply-automation",
        description: "Automated reply rules"
      }
    ]
  },
  {
    id: "developers",
    label: "Developers",
    icon: Code,
    description: "API and developer tools",
    children: [
      {
        id: "api-keys",
        label: "API Keys",
        icon: Key,
        path: "/api-keys",
        description: "Manage API keys"
      },
      {
        id: "webhooks",
        label: "Webhooks",
        icon: Webhook,
        path: "/webhooks",
        description: "Webhook configuration"
      },
      {
        id: "api-documentation",
        label: "API Documentation",
        icon: BookOpen,
        path: "/api-documentation",
        description: "API reference and docs"
      }
    ]
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Account settings and configuration",
    children: [
      {
        id: "account",
        label: "Account",
        icon: Settings,
        path: "/settings/account",
        description: "Account information and settings"
      },
      {
        id: "users",
        label: "Users",
        icon: Users,
        path: "/settings/users",
        description: "User management and permissions"
      },
      {
        id: "senders",
        label: "Senders",
        icon: Settings,
        path: "/settings/senders",
        description: "Sender profiles and settings"
      },
      {
        id: "domains",
        label: "Domains",
        icon: Settings,
        path: "/settings/domains",
        description: "Domain configuration"
      }
    ]
  }
]

/**
 * Flattened navigation items for direct access
 * This provides backward compatibility and quick access to all routes
 */
export const flatNavigationItems: NavigationLeaf[] = navigationConfig
  .flatMap(item => {
    if (hasChildren(item)) {
      return item.children.filter(isLeafNode)
    }
    return isLeafNode(item) ? [item] : []
  })

/**
 * Route to navigation item mapping for quick lookups
 */
export const routeToItemMap = new Map<string, NavigationLeaf>(
  flatNavigationItems.map(item => [item.path, item])
)

/**
 * Navigation item lookup by ID
 */
export const navigationItemsById = new Map<string, NavigationItem>()

// Build ID lookup map
const buildIdMap = (items: NavigationItem[], parentId?: string) => {
  items.forEach(item => {
    const fullId = parentId ? `${parentId}.${item.id}` : item.id
    navigationItemsById.set(item.id, item)
    navigationItemsById.set(fullId, item)
    
    if (hasChildren(item)) {
      buildIdMap(item.children, item.id)
    }
  })
}

buildIdMap(navigationConfig)

/**
 * Helper functions for navigation operations
 */

/**
 * Find navigation item by path
 */
export const findItemByPath = (path: string): NavigationLeaf | undefined => {
  return routeToItemMap.get(path)
}

/**
 * Find navigation item by ID
 */
export const findItemById = (id: string): NavigationItem | undefined => {
  return navigationItemsById.get(id)
}

/**
 * Get all parent categories
 */
export const getParentCategories = (): NavigationParent[] => {
  return navigationConfig.filter(hasChildren)
}

/**
 * Get all leaf items (direct routes)
 */
export const getAllRoutes = (): NavigationLeaf[] => {
  return flatNavigationItems
}

/**
 * Find parent of a navigation item
 */
export const findParentItem = (childPath: string): NavigationParent | undefined => {
  for (const parent of navigationConfig) {
    if (hasChildren(parent)) {
      const hasChild = parent.children.some(child => 
        isLeafNode(child) && child.path === childPath
      )
      if (hasChild) {
        return parent
      }
    }
  }
  return undefined
}

/**
 * Check if a path matches any navigation item
 */
export const isValidNavigationPath = (path: string): boolean => {
  return routeToItemMap.has(path)
}

/**
 * Get breadcrumb trail for a path
 */
export const getBreadcrumbTrail = (path: string): NavigationItem[] => {
  const trail: NavigationItem[] = []
  const leafItem = findItemByPath(path)
  
  if (!leafItem) return trail
  
  const parent = findParentItem(path)
  if (parent) {
    trail.push(parent, leafItem)
  } else {
    trail.push(leafItem)
  }
  
  return trail
}

// Legacy exports for backward compatibility
export const navItems = navigationConfig
export const getRouteFromSubitem = (subitem: string, parentName: string): string => {
  // Legacy function - try to find item by label matching
  const parent = navigationConfig.find(item => 
    item.label.toLowerCase() === parentName.toLowerCase()
  )
  
  if (parent && hasChildren(parent)) {
    const child = parent.children.find(child => 
      child.label.toLowerCase() === subitem.toLowerCase()
    )
    if (child && isLeafNode(child)) {
      return child.path
    }
  }
  
  // Fallback to original logic for unmapped items
  const specialRoutes: Record<string, string> = {
    Activity: "/campaigns/activity",
    "Data-Sources": "/data-sources",
    "Reply-Automation": "/reply-automation",
    "API-Keys": "/api-keys",
    "API-Documentation": "/api-documentation",
    Account: "/settings/account",
    Users: "/settings/users",
    Senders: "/settings/senders",
    Domains: "/settings/domains",
  }

  if (specialRoutes[subitem]) {
    return specialRoutes[subitem]
  }

  return `/${subitem.toLowerCase().replace(/\s+/g, "-")}`
}