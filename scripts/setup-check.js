import { logger } from "@/lib/utils/logger"
// Simple setup check script
logger.debug("Checking setup...")

// Check for required environment variables
const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  logger.warn(`Warning: Missing environment variables: ${missingVars.join(", ")}`)
  logger.warn("Using fallback values from config.ts")
} else {
  logger.debug("All required environment variables are present.")
}

logger.debug("Setup check completed.")
