// Simple script to check for common deployment issues
import fs from "fs"
import path from "path"

// Check for required environment variables
const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:")
  missingEnvVars.forEach((envVar) => {
    console.error(`  - ${envVar}`)
  })
} else {
  console.log("✅ All required environment variables are set")
}

// Check for common deployment blockers
const packageJsonPath = path.join(process.cwd(), "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

// Check for build script
if (!packageJson.scripts?.build) {
  console.error("❌ Missing build script in package.json")
} else {
  console.log("✅ Build script found in package.json")
}

// Check for dependencies that might cause issues
const problematicDeps = ["fsevents", "node-gyp", "node-sass"]
const foundProblematicDeps = Object.keys(packageJson.dependencies || {})
  .concat(Object.keys(packageJson.devDependencies || {}))
  .filter((dep) => problematicDeps.includes(dep))

if (foundProblematicDeps.length > 0) {
  console.warn("⚠️ Found potentially problematic dependencies:")
  foundProblematicDeps.forEach((dep) => {
    console.warn(`  - ${dep}`)
  })
} else {
  console.log("✅ No problematic dependencies found")
}

// Check for large files that might cause deployment issues
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const largeFiles = []

function checkDirectoryForLargeFiles(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory() && !filePath.includes("node_modules") && !filePath.includes(".next")) {
      checkDirectoryForLargeFiles(filePath)
    } else if (stats.size > MAX_FILE_SIZE) {
      largeFiles.push(`${filePath} (${(stats.size / (1024 * 1024)).toFixed(2)}MB)`)
    }
  }
}

checkDirectoryForLargeFiles(process.cwd())

if (largeFiles.length > 0) {
  console.warn("⚠️ Found large files that might cause deployment issues:")
  largeFiles.forEach((file) => {
    console.warn(`  - ${file}`)
  })
} else {
  console.log("✅ No large files found")
}

console.log("\n✨ Deployment check completed")
