// Test script to verify navigation routes are working correctly
import { navItems, getRouteFromSubitem } from "../config/navigation"

console.log("=== NAVIGATION ROUTE TESTING ===")

navItems.forEach((item) => {
  console.log(`\n${item.name}:`)
  item.subitems.forEach((subitem) => {
    const route = getRouteFromSubitem(subitem, item.name)
    console.log(`  ${subitem} -> ${route}`)
  })
})

console.log("\n=== SPECIAL ROUTES ===")
console.log("Activity -> /campaigns/activity")
console.log("Data-Sources -> /data-sources")
console.log("Account-Settings -> /account-settings")
console.log("Reply-Automation -> /reply-automation")

console.log("\n=== NAVIGATION STRUCTURE ===")
console.log("1. Dashboards: Overview, Performance, Logs")
console.log("2. Audience: Profiles, Segments, Properties, Data-Sources")
console.log("3. Messaging: Chat, Broadcast, Templates")
console.log("4. Campaigns: Touchpoints, Journeys, Activity")
console.log("5. Automation: Agents, Reply-Automation")
console.log("6. Settings: Account-Settings, Pricing, Developers")
