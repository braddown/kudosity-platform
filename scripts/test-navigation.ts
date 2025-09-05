// Test script to verify navigation routes are working correctly
import { navItems, getRouteFromSubitem } from "../config/navigation"
import { logger } from "@/lib/utils/logger"

logger.debug("=== NAVIGATION ROUTE TESTING ===")

navItems.forEach((item) => {
  logger.debug(`\n${item.name}:`)
  item.subitems.forEach((subitem) => {
    const route = getRouteFromSubitem(subitem, item.name)
    logger.debug(`  ${subitem} -> ${route}`)
  })
})

logger.debug("\n=== SPECIAL ROUTES ===")
logger.debug("Activity -> /campaigns/activity")
logger.debug("Data-Sources -> /data-sources")
logger.debug("Account-Settings -> /account-settings")
logger.debug("Reply-Automation -> /reply-automation")

logger.debug("\n=== NAVIGATION STRUCTURE ===")
logger.debug("1. Dashboards: Overview, Performance, Logs")
logger.debug("2. Audience: Profiles, Segments, Properties, Data-Sources")
logger.debug("3. Messaging: Chat, Broadcast, Templates")
logger.debug("4. Campaigns: Touchpoints, Journeys, Activity")
logger.debug("5. Automation: Agents, Reply-Automation")
logger.debug("6. Settings: Account-Settings, Pricing, Developers")
