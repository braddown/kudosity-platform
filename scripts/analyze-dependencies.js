import { logger } from "@/lib/utils/logger"
/**
 * This script analyzes the project to find unused dependencies
 * Run with: node scripts/analyze-dependencies.js
 */

const fs = require("fs")
const glob = require("glob")

// Read package.json
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"))
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}

// Get all TypeScript and JavaScript files
const files = glob
  .sync("./app/**/*.{ts,tsx,js,jsx}")
  .concat(
    glob.sync("./components/**/*.{ts,tsx,js,jsx}"),
    glob.sync("./lib/**/*.{ts,tsx,js,jsx}"),
    glob.sync("./utils/**/*.{ts,tsx,js,jsx}"),
  )

// Check each dependency
const usedDependencies = new Set()
const unusedDependencies = new Set()

Object.keys(dependencies).forEach((dep) => {
  let isUsed = false

  // Check if dependency is used in any file
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8")
    if (
      content.includes(`from '${dep}'`) ||
      content.includes(`from "${dep}"`) ||
      content.includes(`require('${dep}')`) ||
      content.includes(`require("${dep}")`)
    ) {
      isUsed = true
      usedDependencies.add(dep)
      break
    }
  }

  if (!isUsed) {
    unusedDependencies.add(dep)
  }
})

logger.debug("=== DEPENDENCY ANALYSIS ===")
logger.debug(`Total dependencies: ${Object.keys(dependencies).length}`)
logger.debug(`Used dependencies: ${usedDependencies.size}`)
logger.debug(`Potentially unused dependencies: ${unusedDependencies.size}`)
logger.debug("\nPotentially unused dependencies:")
Array.from(unusedDependencies).forEach((dep) => {
  logger.debug(`- ${dep}`)
})

logger.debug("\nNote: This is a basic analysis and may have false positives.")
logger.debug("Some dependencies might be used indirectly or via dynamic imports.")
