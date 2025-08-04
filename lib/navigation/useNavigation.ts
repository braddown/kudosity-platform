"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  navigationConfig,
  findItemByPath,
  findParentItem,
  getBreadcrumbTrail,
  hasChildren,
  isLeafNode,
  type NavigationItem,
  type NavigationLeaf,
  type NavigationParent,
} from "./config"

/**
 * Navigation state interface
 */
interface NavigationState {
  expandedItems: string[]
  selectedItem: string | null
  activeItem: NavigationLeaf | null
  activeParent: NavigationParent | null
  breadcrumbs: NavigationItem[]
}

/**
 * Navigation actions interface
 */
interface NavigationActions {
  toggleExpanded: (itemId: string) => void
  setExpanded: (itemIds: string[]) => void
  selectItem: (itemId: string, parentId?: string) => void
  navigateToItem: (itemId: string, parentId?: string) => void
  navigateToPath: (path: string) => void
  isExpanded: (itemId: string) => boolean
  isSelected: (itemId: string) => boolean
  isActive: (path: string) => boolean
}

/**
 * Navigation hook options
 */
interface UseNavigationOptions {
  /** User permissions for filtering navigation items */
  permissions?: string[]
  /** Whether to automatically expand parent of active item */
  autoExpand?: boolean
  /** Whether to allow multiple expanded items */
  multiExpand?: boolean
  /** Initial expanded items */
  initialExpanded?: string[]
}

/**
 * Navigation hook return type
 */
interface UseNavigationReturn extends NavigationState, NavigationActions {
  /** Filtered navigation items based on permissions */
  navigation: NavigationItem[]
  /** All available navigation items (unfiltered) */
  allNavigation: NavigationItem[]
  /** Flat list of all leaf navigation items */
  flatNavigation: NavigationLeaf[]
}

/**
 * Unified Navigation Hook
 * 
 * This hook provides centralized navigation state management and utility functions.
 * It eliminates code duplication between navigation components and provides a
 * consistent API for all navigation operations.
 * 
 * ## Key Benefits:
 * - **Eliminates ~100+ lines of duplicated code** across navigation components
 * - **Single source of truth** for all navigation state and logic
 * - **Type-safe operations** with full TypeScript support
 * - **Performance optimized** with memoized computations
 * - **Permission-based filtering** for role-based navigation
 * - **Automatic active state detection** based on current pathname
 * 
 * ## Usage Examples:
 * 
 * ### Basic Usage:
 * ```typescript
 * const {
 *   navigation,
 *   expandedItems,
 *   selectedItem,
 *   toggleExpanded,
 *   navigateToItem,
 *   isExpanded,
 *   isSelected,
 * } = useNavigation()
 * ```
 * 
 * ### With Permissions:
 * ```typescript
 * const navigation = useNavigation({
 *   permissions: ['admin', 'user'],
 *   autoExpand: true,
 *   multiExpand: false
 * })
 * ```
 * 
 * ### Simple Hook:
 * ```typescript
 * const navigation = useSimpleNavigation() // Most common usage
 * ```
 * 
 * @param options Configuration options for the navigation hook
 * @returns Navigation state, data, and utility functions
 * 
 * @see {@link lib/navigation/config.ts} For navigation configuration
 * @see {@link lib/navigation/README.md} For complete documentation and examples
 */
export function useNavigation(options: UseNavigationOptions = {}): UseNavigationReturn {
  const {
    permissions = [],
    autoExpand = true,
    multiExpand = false,
    initialExpanded = [],
  } = options

  const router = useRouter()
  const pathname = usePathname()

  // Navigation state
  const [expandedItems, setExpandedItems] = useState<string[]>(initialExpanded)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  /**
   * Filter navigation items based on permissions
   */
  const filteredNavigation = useMemo(() => {
    if (permissions.length === 0) {
      return navigationConfig
    }

    const filterItems = (items: NavigationItem[]): NavigationItem[] => {
      return items
        .filter(item => {
          // If item has no permission requirements, include it
          if (!item.permissions || item.permissions.length === 0) {
            return true
          }
          // Check if user has any of the required permissions
          return item.permissions.some(permission => permissions.includes(permission))
        })
        .map(item => {
          // Recursively filter children for parent items
          if (hasChildren(item)) {
            return {
              ...item,
              children: filterItems(item.children),
            }
          }
          return item
        })
        .filter(item => {
          // Remove parent items that have no accessible children
          if (hasChildren(item)) {
            return item.children.length > 0
          }
          return true
        })
    }

    return filterItems(navigationConfig)
  }, [permissions])

  /**
   * Get flat list of all navigation items
   */
  const flatNavigation = useMemo(() => {
    const flattenItems = (items: NavigationItem[]): NavigationLeaf[] => {
      return items.reduce<NavigationLeaf[]>((acc, item) => {
        if (hasChildren(item)) {
          acc.push(...flattenItems(item.children))
        } else if (isLeafNode(item)) {
          acc.push(item)
        }
        return acc
      }, [])
    }

    return flattenItems(filteredNavigation)
  }, [filteredNavigation])

  /**
   * Find currently active navigation item based on pathname
   */
  const activeItem = useMemo(() => {
    return findItemByPath(pathname) || null
  }, [pathname])

  /**
   * Find parent of currently active item
   */
  const activeParent = useMemo(() => {
    if (!activeItem) return null
    return findParentItem(activeItem.path) || null
  }, [activeItem])

  /**
   * Generate breadcrumb trail for current path
   */
  const breadcrumbs = useMemo(() => {
    return getBreadcrumbTrail(pathname)
  }, [pathname])

  /**
   * Initialize navigation state based on current path
   */
  useEffect(() => {
    if (!activeItem || !autoExpand) return

    // Auto-expand parent of active item
    if (activeParent) {
      setExpandedItems(prev => {
        const newExpanded = multiExpand ? prev : []
        if (!newExpanded.includes(activeParent.id)) {
          return [...newExpanded, activeParent.id]
        }
        return newExpanded
      })
      setSelectedItem(activeItem.id)
    } else {
      setSelectedItem(activeItem.id)
    }
  }, [activeItem, activeParent, autoExpand, multiExpand])

  /**
   * Toggle expanded state of a navigation item
   */
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      if (prev.includes(itemId)) {
        // Collapse item
        return prev.filter(id => id !== itemId)
      } else {
        // Expand item
        const item = filteredNavigation.find(item => item.id === itemId)
        if (item && hasChildren(item)) {
          if (multiExpand) {
            return [...prev, itemId]
          } else {
            // Single expand mode - replace all expanded items
            return [itemId]
          }
        }
        return prev
      }
    })
  }, [filteredNavigation, multiExpand])

  /**
   * Set expanded items directly
   */
  const setExpanded = useCallback((itemIds: string[]) => {
    setExpandedItems(itemIds)
  }, [])

  /**
   * Select a navigation item
   */
  const selectItem = useCallback((itemId: string, parentId?: string) => {
    setSelectedItem(itemId)
    
    // Auto-expand parent if provided and not already expanded
    if (parentId && !expandedItems.includes(parentId)) {
      setExpandedItems(prev => multiExpand ? [...prev, parentId] : [parentId])
    }
  }, [expandedItems, multiExpand])

  /**
   * Navigate to a navigation item by ID
   */
  const navigateToItem = useCallback((itemId: string, parentId?: string) => {
    // Find the item in the navigation
    let targetItem: NavigationLeaf | null = null

    if (parentId) {
      const parent = filteredNavigation.find(item => item.id === parentId)
      if (parent && hasChildren(parent)) {
        const child = parent.children.find(child => child.id === itemId)
        if (child && isLeafNode(child)) {
          targetItem = child
        }
      }
    } else {
      // Look for item at top level or in children
      for (const item of filteredNavigation) {
        if (item.id === itemId && isLeafNode(item)) {
          targetItem = item
          break
        }
        if (hasChildren(item)) {
          const child = item.children.find(child => child.id === itemId)
          if (child && isLeafNode(child)) {
            targetItem = child
            break
          }
        }
      }
    }

    if (targetItem) {
      selectItem(itemId, parentId)
      router.push(targetItem.path)
    }
  }, [filteredNavigation, router, selectItem])

  /**
   * Navigate directly to a path
   */
  const navigateToPath = useCallback((path: string) => {
    const item = findItemByPath(path)
    if (item) {
      const parent = findParentItem(path)
      selectItem(item.id, parent?.id)
    }
    router.push(path)
  }, [router, selectItem])

  /**
   * Check if an item is expanded
   */
  const isExpanded = useCallback((itemId: string) => {
    return expandedItems.includes(itemId)
  }, [expandedItems])

  /**
   * Check if an item is selected
   */
  const isSelected = useCallback((itemId: string) => {
    return selectedItem === itemId
  }, [selectedItem])

  /**
   * Check if a path is active
   */
  const isActive = useCallback((path: string) => {
    return pathname === path || pathname.startsWith(path + "/")
  }, [pathname])

  return {
    // State
    expandedItems,
    selectedItem,
    activeItem,
    activeParent,
    breadcrumbs,
    
    // Navigation data
    navigation: filteredNavigation,
    allNavigation: navigationConfig,
    flatNavigation,
    
    // Actions
    toggleExpanded,
    setExpanded,
    selectItem,
    navigateToItem,
    navigateToPath,
    isExpanded,
    isSelected,
    isActive,
  }
}

/**
 * Simplified navigation hook for basic use cases
 * 
 * This provides a simpler API for components that don't need
 * advanced features like permissions or multi-expand.
 */
export function useSimpleNavigation() {
  return useNavigation({
    autoExpand: true,
    multiExpand: false,
  })
}

/**
 * Navigation hook for components that need permission filtering
 */
export function usePermissionNavigation(permissions: string[]) {
  return useNavigation({
    permissions,
    autoExpand: true,
    multiExpand: false,
  })
}

// Legacy compatibility exports
export { navigationConfig as navItems }
export { findItemByPath as getRouteFromSubitem }