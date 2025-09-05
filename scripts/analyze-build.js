import { logger } from "@/lib/utils/logger"
// Node.js Build Analysis Script
const fs = require("fs")
const path = require("path")

function getDirectorySize(dirPath) {
  let totalSize = 0

  if (!fs.existsSync(dirPath)) {
    return 0
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const file of files) {
    const filePath = path.join(dirPath, file.name)

    if (file.isDirectory()) {
      totalSize += getDirectorySize(filePath)
    } else {
      try {
        const stats = fs.statSync(filePath)
        totalSize += stats.size
      } catch (err) {
        // Skip files that can't be accessed
      }
    }
  }

  return totalSize
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function findLargestFiles(dirPath, limit = 10) {
  const files = []

  if (!fs.existsSync(dirPath)) {
    return files
  }

  function scanDirectory(currentPath) {
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true })

      for (const item of items) {
        const itemPath = path.join(currentPath, item.name)

        if (item.isDirectory()) {
          scanDirectory(itemPath)
        } else {
          try {
            const stats = fs.statSync(itemPath)
            files.push({
              path: itemPath,
              size: stats.size,
            })
          } catch (err) {
            // Skip files that can't be accessed
          }
        }
      }
    } catch (err) {
      // Skip directories that can't be accessed
    }
  }

  scanDirectory(dirPath)

  return files.sort((a, b) => b.size - a.size).slice(0, limit)
}

logger.debug("=== BUILD SIZE ANALYSIS ===")

// Check if .next directory exists
const nextDir = ".next"
if (!fs.existsSync(nextDir)) {
  logger.debug('No .next directory found. Run "npm run build" first.')
  process.exit(1)
}

const staticDir = path.join(nextDir, "static")

if (fs.existsSync(staticDir)) {
  // Get JS files size
  const jsFiles = []
  const cssFiles = []

  function categorizeFiles(dirPath) {
    if (!fs.existsSync(dirPath)) return

    const items = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name)

      if (item.isDirectory()) {
        categorizeFiles(itemPath)
      } else {
        const stats = fs.statSync(itemPath)

        if (item.name.endsWith(".js")) {
          jsFiles.push({ path: itemPath, size: stats.size })
        } else if (item.name.endsWith(".css")) {
          cssFiles.push({ path: itemPath, size: stats.size })
        }
      }
    }
  }

  categorizeFiles(staticDir)

  const totalJsSize = jsFiles.reduce((sum, file) => sum + file.size, 0)
  const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0)

  logger.debug(`Total JS size: ${formatBytes(totalJsSize)}`)
  logger.debug(`Total CSS size: ${formatBytes(totalCssSize)}`)

  logger.debug("\nLargest files:")
  const largestFiles = findLargestFiles(staticDir, 10)

  largestFiles.forEach((file, index) => {
    const relativePath = path.relative(process.cwd(), file.path)
    logger.debug(`${index + 1}. ${relativePath} - ${formatBytes(file.size)}`)
  })
} else {
  logger.debug("No static directory found in .next")
}

logger.debug("\nNote: This analysis shows the current build output sizes.")
