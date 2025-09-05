import { logger } from "@/lib/utils/logger"
const { execSync } = require("child_process")
const fs = require("fs")

// Run npm list to get dependency tree
const output = execSync("npm list --json").toString()
const deps = JSON.parse(output)

// Get package sizes
logger.debug("Analyzing package sizes...")
logger.debug("This may take a moment...")

const packageSizes = {}

function getPackageSize(packageName) {
  try {
    const nodeModulesPath = `./node_modules/${packageName}`
    if (!fs.existsSync(nodeModulesPath)) return 0

    const output = execSync(`du -sk ${nodeModulesPath}`).toString()
    const size = Number.parseInt(output.split("\t")[0])
    return size
  } catch (error) {
    logger.error(`Error getting size for ${packageName}:`, error.message)
    return 0
  }
}

// Get direct dependencies
const directDeps = {
  ...deps.dependencies,
  ...deps.devDependencies,
}

// Calculate sizes
Object.keys(directDeps).forEach((dep) => {
  packageSizes[dep] = getPackageSize(dep)
})

// Sort by size
const sortedPackages = Object.entries(packageSizes)
  .sort((a, b) => b[1] - a[1])
  .filter(([_, size]) => size > 0)

// Output results
logger.debug("\n=== PACKAGE SIZE ANALYSIS ===")
logger.debug("Largest packages:")
sortedPackages.slice(0, 20).forEach(([pkg, size]) => {
  logger.debug(`${pkg}: ${(size / 1024).toFixed(2)} MB`)
})

// Suggest alternatives for large packages
logger.debug("\nPossible optimizations:")
sortedPackages.forEach(([pkg, size]) => {
  if (size > 10000) {
    // More than ~10MB
    if (pkg === "recharts") {
      logger.debug("- Consider replacing " + pkg + " with a lighter alternative like 'chart.js' or 'lightweight-charts'")
    } else if (pkg === "@faker-js/faker") {
      logger.debug("- Move " + pkg + " to devDependencies if it's only used for development")
    } else if (pkg.includes("ui") || pkg.includes("components")) {
      logger.debug("- Consider code-splitting or lazy loading " + pkg + " components")
    }
  }
})
