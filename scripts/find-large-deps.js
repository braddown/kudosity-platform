const { execSync } = require("child_process")
const fs = require("fs")

// Run npm list to get dependency tree
const output = execSync("npm list --json").toString()
const deps = JSON.parse(output)

// Get package sizes
console.log("Analyzing package sizes...")
console.log("This may take a moment...")

const packageSizes = {}

function getPackageSize(packageName) {
  try {
    const nodeModulesPath = `./node_modules/${packageName}`
    if (!fs.existsSync(nodeModulesPath)) return 0

    const output = execSync(`du -sk ${nodeModulesPath}`).toString()
    const size = Number.parseInt(output.split("\t")[0])
    return size
  } catch (error) {
    console.error(`Error getting size for ${packageName}:`, error.message)
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
console.log("\n=== PACKAGE SIZE ANALYSIS ===")
console.log("Largest packages:")
sortedPackages.slice(0, 20).forEach(([pkg, size]) => {
  console.log(`${pkg}: ${(size / 1024).toFixed(2)} MB`)
})

// Suggest alternatives for large packages
console.log("\nPossible optimizations:")
sortedPackages.forEach(([pkg, size]) => {
  if (size > 10000) {
    // More than ~10MB
    if (pkg === "recharts") {
      console.log("- Consider replacing " + pkg + " with a lighter alternative like 'chart.js' or 'lightweight-charts'")
    } else if (pkg === "@faker-js/faker") {
      console.log("- Move " + pkg + " to devDependencies if it's only used for development")
    } else if (pkg.includes("ui") || pkg.includes("components")) {
      console.log("- Consider code-splitting or lazy loading " + pkg + " components")
    }
  }
})
