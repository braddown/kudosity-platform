// Current navigation items from the working system
const activeNavigationRoutes = [
  "/overview",
  "/profiles",
  "/segments",
  "/chat",
  "/broadcast",
  "/sms",
  "/templates",
  "/touchpoints",
  "/journeys",
  "/agents",
  "/reply-automation",
  "/campaigns",
  "/campaigns/activity",
  "/performance",
  "/logs",
  "/data-sources",
  "/properties",
  "/account-settings",
  "/pricing",
  "/developers",
  "/api-keys",
  "/webhooks",
  "/api-documentation",
]

// Components that are definitely in use based on navigation
const activeComponents = [
  "Overview.tsx",
  "ProfilesClientWrapper.tsx",
  "SegmentList.tsx",
  "ChatApp.tsx",
  "BroadcastMessage.tsx",
  "SMSClientWrapper.tsx",
  "TemplatesClientWrapper.tsx",
  "TouchpointsList.tsx",
  "Journeys.tsx",
  "Agents.tsx",
  "ReplyAutomation.tsx",
  "CampaignActivityTable.tsx",
  "Performance.tsx",
  "Logs.tsx",
  "DataSources.tsx",
  "PropertiesComponent.tsx",
  "AccountSettings.tsx",
  "Pricing.tsx",
  "Developers.tsx",
  "ApiKeys.tsx",
  "Webhooks.tsx",
  "ApiDocumentation.tsx",
]

// Layout and core components that must be kept
const coreComponents = [
  "MainLayout.tsx",
  "navigation/Header.tsx",
  "navigation/Sidebar.tsx",
  "navigation/AppLayout.tsx",
  "layouts/BaseLayout.tsx",
  "layouts/PageLayout.tsx",
  "layouts/DashboardLayout.tsx",
  "Logo.tsx",
  "theme-provider.tsx",
  "theme-toggle.tsx",
]

// Database-related components and APIs
const databaseComponents = [
  "lib/supabase.ts",
  "lib/profiles-api.ts",
  "lib/segments-api.ts",
  "lib/properties-api.ts",
  "lib/log-filters-api.ts",
  "lib/chat-api.ts",
]

console.log("=== CODE REVIEW ANALYSIS ===")
console.log("Active Navigation Routes:", activeNavigationRoutes.length)
console.log("Active Components:", activeComponents.length)
console.log("Core Components:", coreComponents.length)
console.log("Database Components:", databaseComponents.length)
