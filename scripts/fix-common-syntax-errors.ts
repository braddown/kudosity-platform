// Script to fix common syntax errors that cause deployment failures

interface FixAction {
  file: string
  description: string
  before: string
  after: string
}

class SyntaxErrorFixer {
  private fixes: FixAction[] = []

  // Fix Next.js configuration to show actual errors
  fixNextConfig(): void {
    this.addFix(
      "next.config.mjs",
      "Enable TypeScript and ESLint error checking",
      `/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}`,
      `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily enable error checking to see build issues
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    unoptimized: true,
  },
  // Add experimental features if needed
  experimental: {
    // Enable if using app directory features
  },
}`,
    )
  }

  // Fix common TypeScript issues
  fixTypeScriptIssues(): void {
    this.addFix(
      "lib/utils.ts",
      "Fix any types in utility functions",
      "export function cn(...inputs: any[]) {",
      "export function cn(...inputs: (string | undefined | null | boolean)[]) {",
    )

    this.addFix(
      "lib/utils.ts",
      "Fix debounce function typing",
      "export function debounce(func: any, wait: number) {",
      "export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {",
    )
  }

  // Fix import/export issues
  fixImportExportIssues(): void {
    this.addFix(
      "components/ui/index.ts",
      "Add missing component exports",
      "// Add any missing exports here",
      `// Ensure all UI components are properly exported
export { Checkbox } from "./checkbox"
export { RadioGroup, RadioGroupItem } from "./radio-group"
export { Separator } from "./separator"
export { Skeleton } from "./skeleton"
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"`,
    )
  }

  // Fix React/JSX issues
  fixReactJSXIssues(): void {
    this.addFix(
      "app/layout.tsx",
      "Add proper metadata export",
      "export default function RootLayout",
      `export const metadata = {
  title: 'Kudosity App',
  description: 'Customer engagement platform',
}

export default function RootLayout`,
    )
  }

  private addFix(file: string, description: string, before: string, after: string): void {
    this.fixes.push({ file, description, before, after })
  }

  generateFixReport(): string {
    let report = "# Syntax Error Fixes\n\n"

    report += `## Recommended Fixes (${this.fixes.length} total)\n\n`

    this.fixes.forEach((fix, index) => {
      report += `### ${index + 1}. ${fix.file}\n`
      report += `**Description**: ${fix.description}\n\n`
      report += `**Before**:\n\`\`\`typescript\n${fix.before}\n\`\`\`\n\n`
      report += `**After**:\n\`\`\`typescript\n${fix.after}\n\`\`\`\n\n`
      report += "---\n\n"
    })

    return report
  }

  runFixes(): string {
    console.log("🔧 Generating syntax error fixes...")

    this.fixNextConfig()
    this.fixTypeScriptIssues()
    this.fixImportExportIssues()
    this.fixReactJSXIssues()

    console.log("✅ Fix recommendations generated!")
    return this.generateFixReport()
  }
}

// Generate fixes
const fixer = new SyntaxErrorFixer()
const fixReport = fixer.runFixes()
console.log(fixReport)

export { SyntaxErrorFixer }
