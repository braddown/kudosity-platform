// Simple setup check script
console.log("Checking setup...")

// Check for required environment variables
const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingVars.join(", ")}`)
  console.warn("Using fallback values from config.ts")
} else {
  console.log("All required environment variables are present.")
}

console.log("Setup check completed.")
