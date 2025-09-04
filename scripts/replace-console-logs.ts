#!/usr/bin/env tsx

/**
 * Script to systematically replace console.log statements with proper logging
 * CC002: Clean Up Console Statements - Part of Claude Code optimization tasks
 */

import fs from 'fs'
import path from 'path'
import { createLogger } from '../lib/utils/logger'

const logger = createLogger('ConsoleLogReplacer')

interface ConsoleReplacement {
  pattern: RegExp
  replacement: (match: string, ...args: any[]) => string
}

// Define replacement patterns
const replacements: ConsoleReplacement[] = [
  // console.log with string literals
  {
    pattern: /console\.log\("([^"]+)"(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.debug('${message}', { ${context} })` : `logger.debug('${message}')`
  },
  {
    pattern: /console\.log\('([^']+)'(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.debug('${message}', { ${context} })` : `logger.debug('${message}')`
  },
  // console.log with template literals
  {
    pattern: /console\.log\(`([^`]+)`(?:,\s*(.+))?\)/g,
    replacement: (match, template, context) => {
      // Convert template literal variables to context object
      const message = template.replace(/\$\{([^}]+)\}/g, (_, expr) => {
        return `$\{${expr}\}`
      })
      return context ? `logger.debug(\`${message}\`, { ${context} })` : `logger.debug(\`${message}\`)`
    }
  },
  // console.error patterns
  {
    pattern: /console\.error\("([^"]+)"(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.error('${message}', ${context})` : `logger.error('${message}')`
  },
  {
    pattern: /console\.error\('([^']+)'(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.error('${message}', ${context})` : `logger.error('${message}')`
  },
  {
    pattern: /console\.error\(`([^`]+)`(?:,\s*(.+))?\)/g,
    replacement: (match, template, context) => 
      context ? `logger.error(\`${template}\`, ${context})` : `logger.error(\`${template}\`)`
  },
  // console.warn patterns
  {
    pattern: /console\.warn\("([^"]+)"(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.warn('${message}', { ${context} })` : `logger.warn('${message}')`
  },
  {
    pattern: /console\.warn\('([^']+)'(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.warn('${message}', { ${context} })` : `logger.warn('${message}')`
  },
  // console.info patterns
  {
    pattern: /console\.info\("([^"]+)"(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.info('${message}', { ${context} })` : `logger.info('${message}')`
  },
  {
    pattern: /console\.info\('([^']+)'(?:,\s*(.+))?\)/g,
    replacement: (match, message, context) => 
      context ? `logger.info('${message}', { ${context} })` : `logger.info('${message}')`
  }
]

function addLoggerImport(content: string, componentName: string): string {
  // Check if logger import already exists
  if (content.includes("from '@/lib/utils/logger'")) {
    return content
  }

  // Find the last import statement
  const importRegex = /^import.*from.*['"][^'"]+['"];?\s*$/gm
  const imports = Array.from(content.matchAll(importRegex))
  
  if (imports.length === 0) {
    // No imports found, add at the beginning
    return `import { createLogger } from '@/lib/utils/logger'\n\nconst logger = createLogger('${componentName}')\n\n${content}`
  }

  const lastImport = imports[imports.length - 1]
  const insertPosition = lastImport.index! + lastImport[0].length

  const loggerImport = `\nimport { createLogger } from '@/lib/utils/logger'\n\nconst logger = createLogger('${componentName}')\n`
  
  return content.slice(0, insertPosition) + loggerImport + content.slice(insertPosition)
}

function replaceConsoleLogs(content: string): string {
  let result = content

  for (const { pattern, replacement } of replacements) {
    result = result.replace(pattern, replacement)
  }

  return result
}

function getComponentName(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath))
  
  // Convert kebab-case or snake_case to PascalCase
  return basename
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function processFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Check if file has console statements
    if (!/console\.(log|error|warn|info|debug)/.test(content)) {
      return false
    }

    const componentName = getComponentName(filePath)
    
    // Add logger import and instance
    content = addLoggerImport(content, componentName)
    
    // Replace console statements
    content = replaceConsoleLogs(content)
    
    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8')
    
    logger.info('Processed file', { filePath, componentName })
    return true
  } catch (error) {
    logger.error('Error processing file', error, { filePath })
    return false
  }
}

function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        // Skip node_modules and other directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
          traverse(fullPath)
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }
  
  traverse(dir)
  return files
}

// Main execution
async function main() {
  const projectRoot = path.resolve(__dirname, '..')
  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  
  logger.info('Starting console.log replacement', { projectRoot })
  
  const files = findFiles(projectRoot, extensions)
  logger.info('Found files to process', { count: files.length })
  
  let processedCount = 0
  
  for (const file of files) {
    if (processFile(file)) {
      processedCount++
    }
  }
  
  logger.info('Console.log replacement completed', { 
    totalFiles: files.length, 
    processedFiles: processedCount 
  })
}

if (require.main === module) {
  main().catch(console.error)
}