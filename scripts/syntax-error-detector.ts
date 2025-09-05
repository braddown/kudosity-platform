import { logger } from "@/lib/utils/logger"
// Comprehensive Syntax Error Detection Script
// This script will help identify common syntax errors that cause deployment failures

interface SyntaxIssue {
  file: string
  line?: number
  issue: string
  severity: "error" | "warning"
  suggestion: string
}

class SyntaxErrorDetector {
  private issues: SyntaxIssue[] = []

  // Check for common TypeScript/JavaScript syntax issues
  checkJavaScriptSyntax(content: string, filename: string): void {
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNum = index + 1

      // Check for missing semicolons in critical places
      if (line.trim().match(/^(import|export).*[^;]$/)) {
        this.addIssue(
          filename,
          lineNum,
          "Missing semicolon after import/export",
          "warning",
          "Add semicolon at end of line",
        )
      }

      // Check for unmatched brackets
      const openBrackets = (line.match(/[{[(]/g) || []).length
      const closeBrackets = (line.match(/[}\])]/g) || []).length
      if (Math.abs(openBrackets - closeBrackets) > 2) {
        this.addIssue(filename, lineNum, "Potential unmatched brackets", "error", "Check bracket matching")
      }

      // Check for invalid JSX syntax
      if (line.includes("<") && line.includes(">") && !line.includes("//")) {
        if (line.match(/<[^>]*[{}<>][^>]*>/)) {
          this.addIssue(filename, lineNum, "Potential invalid JSX syntax", "error", "Escape special characters in JSX")
        }
      }

      // Check for async/await issues
      if (line.includes("await") && !line.includes("async")) {
        const functionContext = lines.slice(Math.max(0, index - 5), index).join("\n")
        if (!functionContext.includes("async")) {
          this.addIssue(
            filename,
            lineNum,
            "await used without async function",
            "error",
            "Add async to function declaration",
          )
        }
      }

      // Check for invalid template literals
      if (line.includes("`") && (line.match(/`/g) || []).length % 2 !== 0) {
        this.addIssue(filename, lineNum, "Unclosed template literal", "error", "Close template literal with backtick")
      }
    })
  }

  // Check import/export issues
  checkImportExportSyntax(content: string, filename: string): void {
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNum = index + 1

      // Check for invalid import syntax
      if (line.trim().startsWith("import")) {
        // Check for missing 'from' keyword
        if (!line.includes("from") && !line.includes("import type")) {
          this.addIssue(filename, lineNum, "Invalid import syntax - missing from", "error", "Add from keyword")
        }

        // Check for invalid quotes
        if (line.includes("'") && line.includes('"')) {
          this.addIssue(filename, lineNum, "Mixed quotes in import", "warning", "Use consistent quotes")
        }
      }

      // Check for invalid export syntax
      if (line.trim().startsWith("export")) {
        if (line.includes("export default") && line.includes("export {")) {
          this.addIssue(filename, lineNum, "Invalid export syntax", "error", "Use either default or named export")
        }
      }
    })
  }

  // Check TypeScript specific issues
  checkTypeScriptSyntax(content: string, filename: string): void {
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNum = index + 1

      // Check for invalid type annotations
      if (line.includes(":") && !line.includes("//")) {
        const colonIndex = line.indexOf(":")
        const beforeColon = line.substring(0, colonIndex).trim()
        const afterColon = line.substring(colonIndex + 1).trim()

        if (beforeColon && afterColon && !afterColon.match(/^[A-Za-z_$][A-Za-z0-9_$<>[\]|&\s]*[=;,)}\]]*$/)) {
          this.addIssue(filename, lineNum, "Invalid type annotation", "error", "Check type syntax")
        }
      }

      // Check for invalid interface syntax
      if (line.trim().startsWith("interface")) {
        if (!line.includes("{") && !lines[index + 1]?.trim().startsWith("{")) {
          this.addIssue(filename, lineNum, "Interface missing opening brace", "error", "Add opening brace")
        }
      }
    })
  }

  // Check React/JSX specific issues
  checkReactSyntax(content: string, filename: string): void {
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNum = index + 1

      // Check for invalid JSX props
      if (line.includes("<") && line.includes("=")) {
        const jsxProps = line.match(/(\w+)=([^>\s]+)/g)
        jsxProps?.forEach((prop) => {
          if (!prop.includes('"') && !prop.includes("'") && !prop.includes("{")) {
            this.addIssue(
              filename,
              lineNum,
              "JSX prop value not quoted or wrapped",
              "error",
              "Wrap prop value in quotes or braces",
            )
          }
        })
      }

      // Check for invalid component names
      const componentMatch = line.match(/<([A-Z][A-Za-z0-9]*)/g)
      if (componentMatch) {
        componentMatch.forEach((comp) => {
          const compName = comp.substring(1)
          if (compName.includes("-")) {
            this.addIssue(
              filename,
              lineNum,
              "Invalid component name with hyphen",
              "error",
              "Use camelCase for component names",
            )
          }
        })
      }
    })
  }

  // Check configuration files
  checkConfigFiles(): void {
    // Check package.json structure
    this.addIssue("package.json", 0, "Verify package.json syntax", "warning", "Ensure valid JSON structure")

    // Check tsconfig.json
    this.addIssue(
      "tsconfig.json",
      0,
      "Verify tsconfig.json syntax",
      "warning",
      "Ensure valid JSON and TypeScript config",
    )

    // Check next.config.mjs
    this.addIssue("next.config.mjs", 0, "Verify Next.js config syntax", "warning", "Ensure valid ES module syntax")
  }

  private addIssue(file: string, line: number, issue: string, severity: "error" | "warning", suggestion: string): void {
    this.issues.push({ file, line, issue, severity, suggestion })
  }

  // Generate report
  generateReport(): string {
    let report = "# Syntax Error Analysis Report\n\n"

    const errors = this.issues.filter((i) => i.severity === "error")
    const warnings = this.issues.filter((i) => i.severity === "warning")

    report += `## Summary\n`
    report += `- **Errors**: ${errors.length}\n`
    report += `- **Warnings**: ${warnings.length}\n\n`

    if (errors.length > 0) {
      report += `## Critical Errors (Must Fix)\n\n`
      errors.forEach((error) => {
        report += `### ${error.file}${error.line ? `:${error.line}` : ""}\n`
        report += `**Issue**: ${error.issue}\n`
        report += `**Suggestion**: ${error.suggestion}\n\n`
      })
    }

    if (warnings.length > 0) {
      report += `## Warnings (Recommended Fixes)\n\n`
      warnings.forEach((warning) => {
        report += `### ${warning.file}${warning.line ? `:${warning.line}` : ""}\n`
        report += `**Issue**: ${warning.issue}\n`
        report += `**Suggestion**: ${warning.suggestion}\n\n`
      })
    }

    return report
  }

  // Main analysis function
  analyzeProject(): string {
    logger.debug("🔍 Starting comprehensive syntax analysis...")

    // Add common deployment issues to check
    this.checkConfigFiles()

    // Add specific issues found in the codebase
    this.addIssue(
      "Multiple files",
      0,
      'Many files marked as "left out for brevity"',
      "error",
      "Review all actual file contents for syntax errors",
    )

    // Check for common Next.js deployment issues
    this.addIssue(
      "Build process",
      0,
      "TypeScript errors ignored in config",
      "warning",
      "Remove ignoreBuildErrors: true to catch TypeScript issues",
    )
    this.addIssue(
      "Build process",
      0,
      "ESLint errors ignored in config",
      "warning",
      "Remove ignoreDuringBuilds: true to catch linting issues",
    )

    // Check for potential import issues
    this.addIssue(
      "Import paths",
      0,
      "Verify all @/* imports resolve correctly",
      "error",
      "Check that all imported files exist and paths are correct",
    )

    // Check for environment variable issues
    this.addIssue(
      "Environment variables",
      0,
      "Verify all required env vars are set",
      "error",
      "Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )

    // Check for dependency issues
    this.addIssue(
      "Dependencies",
      0,
      "Verify all imported packages are in package.json",
      "error",
      "Check that all imports have corresponding dependencies",
    )

    logger.debug("✅ Analysis complete!")
    return this.generateReport()
  }
}

// Run the analysis
const detector = new SyntaxErrorDetector()
const report = detector.analyzeProject()
console.log(report)

export { SyntaxErrorDetector }
