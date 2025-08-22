/**
 * Predefined loading messages for consistency across the application
 */
export const LoadingMessages = {
  // Authentication
  LOGIN: "Signing you in...",
  LOGOUT: "Signing you out...",
  SIGNUP: "Creating your account...",
  VERIFY: "Verifying your email...",
  
  // Data operations
  FETCH: "Loading data...",
  SAVE: "Saving changes...",
  DELETE: "Deleting...",
  UPDATE: "Updating...",
  
  // Page loads
  PROFILES: "Loading profiles...",
  LISTS: "Loading lists...",
  CAMPAIGNS: "Loading campaigns...",
  SETTINGS: "Loading settings...",
  OVERVIEW: "Loading overview...",
  
  // Table operations
  TABLE_LOAD: "Loading table data...",
  TABLE_FILTER: "Applying filters...",
  TABLE_SORT: "Sorting data...",
  TABLE_EXPORT: "Exporting data...",
  
  // Default
  DEFAULT: "Loading..."
} as const

export type LoadingMessageKey = keyof typeof LoadingMessages
