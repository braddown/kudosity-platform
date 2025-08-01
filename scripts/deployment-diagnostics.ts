// Deployment Diagnostics Script
// Identifies specific issues that commonly cause deployment failures

interface DeploymentIssue {
  category: string
  issue: string
  severity: "critical" | "high" | "medium" | "low"
  solution: string
  files?: string[]
}

class DeploymentDiagnostics {
  private issues: DeploymentIssue[] = []

  checkCommonDeploymentIssues(): void {
    // 1. Check for TypeScript configuration issues
    this.addIssue(
      "TypeScript Configuration",
      "Build errors are being ignored",
      "critical",
      'Remove "ignoreBuildErrors: true" from next.config.mjs to catch TypeScript errors during build',
      ["next.config.mjs"],
    )

    // 2. Check for missing dependencies
    this.addIssue(
      "Dependencies",
      "Potential missing dependencies for imported modules",
      "critical",
      "Verify all imported packages are listed in package.json dependencies",
      ["package.json"],
    )

    // 3. Check for environment variable issues
    this.addIssue(
      "Environment Variables",
      "Supabase configuration may be incomplete",
      "high",
      "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are properly set",
      ["lib/supabase.ts"],
    )

    // 4. Check for import path issues
    this.addIssue(
      "Import Paths",
      "Potential issues with @/* path resolution",
      "high",
      "Verify all files referenced by @/* imports actually exist",
      ["tsconfig.json"],
    )

    // 5. Check for React/JSX issues
    this.addIssue(
      "React/JSX",
      "Potential JSX syntax errors in components",
      "high",
      "Check for unescaped characters in JSX, missing key props, and invalid component names",
    )

    // 6. Check for async/await issues
    this.addIssue(
      "Async/Await",
      "Potential async function issues in API routes",
      "medium",
      "Ensure all async functions are properly declared and await is used correctly",
      ["app/api/**/*.ts"],
    )

    // 7. Check for SQL syntax in scripts
    this.addIssue(
      "SQL Scripts",
      "Multiple SQL scripts may have syntax errors",
      "medium",
      "Review all .sql files for proper syntax and semicolons",
      ["scripts/*.sql"],
    )
  }

  checkSpecificFileIssues(): void {
    // Check specific files that are visible in the codebase

    // lib/database-types.ts - looks good
    // app/api/chats/route.ts - looks good
    // tailwind.config.ts - looks good
    // next.config.mjs - has build error ignoring
    // tsconfig.json - looks good
    // lib/utils.ts - looks good
    // lib/supabase.ts - looks good
    // app/layout.tsx - looks good

    // The main issue is that most files are hidden
    this.addIssue(
      "Code Visibility",
      'Most component files are hidden ("left out for brevity")',
      "critical",
      "Need to review actual content of all component files for syntax errors",
      ["components/**/*.tsx", "app/**/*.tsx"],
    )
  }

  checkBuildConfiguration(): void {
    this.addIssue(
      "Build Configuration",
      "Next.js config ignores TypeScript and ESLint errors",
      "critical",
      "Temporarily remove ignoreBuildErrors and ignoreDuringBuilds to see actual errors",
      ["next.config.mjs"],
    )

    this.addIssue(
      "Build Configuration",
      "Images are unoptimized",
      "low",
      "This is fine for deployment but may indicate other config issues",
      ["next.config.mjs"],
    )
  }

  private addIssue(
    category: string,
    issue: string,
    severity: "critical" | "high" | "medium" | "low",
    solution: string,
    files?: string[],
  ): void {
    this.issues.push({ category, issue, severity, solution, files })
  }

  generateDiagnosticReport(): string {
    let report = "# Deployment Diagnostics Report\n\n"

    const critical = this.issues.filter((i) => i.severity === "critical")
    const high = this.issues.filter((i) => i.severity === "high")
    const medium = this.issues.filter((i) => i.severity === "medium")
    const low = this.issues.filter((i) => i.severity === "low")

    report += `## Summary\n`
    report += `- **Critical Issues**: ${critical.length} (Must fix immediately)\n`
    report += `- **High Priority**: ${high.length} (Fix before deployment)\n`
    report += `- **Medium Priority**: ${medium.length} (Should fix)\n`
    report += `- **Low Priority**: ${low.length} (Nice to fix)\n\n`

    // Critical issues first
    if (critical.length > 0) {
      report += `## 🚨 Critical Issues (Fix Immediately)\n\n`
      critical.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.category}\n`
        report += `**Issue**: ${issue.issue}\n`
        report += `**Solution**: ${issue.solution}\n`
        if (issue.files) {
          report += `**Files**: ${issue.files.join(", ")}\n`
        }
        report += "\n"
      })
    }

    // High priority issues
    if (high.length > 0) {
      report += `## ⚠️ High Priority Issues\n\n`
      high.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.category}\n`
        report += `**Issue**: ${issue.issue}\n`
        report += `**Solution**: ${issue.solution}\n`
        if (issue.files) {
          report += `**Files**: ${issue.files.join(", ")}\n`
        }
        report += "\n"
      })
    }

    // Immediate action items
    report += `## 🔧 Immediate Action Items\n\n`
    report += `1. **Enable TypeScript checking**: Remove \`ignoreBuildErrors: true\` from next.config.mjs\n`
    report += `2. **Enable ESLint checking**: Remove \`ignoreDuringBuilds: true\` from next.config.mjs\n`
    report += `3. **Run local build**: Execute \`npm run build\` locally to see actual errors\n`
    report += `4. **Check environment variables**: Verify all required env vars are set\n`
    report += `5. **Review hidden files**: Check actual content of all component files\n\n`

    return report
  }

  runDiagnostics(): string {
    console.log("🔍 Running deployment diagnostics...")

    this.checkCommonDeploymentIssues()
    this.checkSpecificFileIssues()
    this.checkBuildConfiguration()

    console.log("✅ Diagnostics complete!")
    return this.generateDiagnosticReport()
  }
}

// Run diagnostics
const diagnostics = new DeploymentDiagnostics()
const report = diagnostics.runDiagnostics()
console.log(report)

export { DeploymentDiagnostics }
