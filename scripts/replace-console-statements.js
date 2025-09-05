#!/usr/bin/env node

/**
 * Script to replace console statements with proper logger calls
 * This script will systematically replace console.log, console.error, console.warn
 * with appropriate logger calls
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript and JavaScript files excluding node_modules
function getAllFiles() {
  try {
    const output = execSync(`find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file && !file.includes('scripts/replace-console-statements.js'));
  } catch (error) {
    console.error('Error finding files:', error.message);
    return [];
  }
}

// Check if file already imports logger
function hasLoggerImport(content) {
  return content.includes('from "@/lib/utils/logger"') || content.includes('from \'@/lib/utils/logger\'');
}

// Add logger import to file
function addLoggerImport(content) {
  if (hasLoggerImport(content)) {
    return content;
  }

  // Find existing imports
  const lines = content.split('\n');
  let lastImportIndex = -1;
  let hasUseClient = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '"use client"' || line === "'use client'") {
      hasUseClient = true;
      continue;
    }
    
    if (line.startsWith('import ') && !line.includes('from "react"')) {
      lastImportIndex = i;
    } else if (lastImportIndex !== -1 && !line.startsWith('import ') && line.trim() !== '') {
      break;
    }
  }

  // Insert logger import after last import
  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, 'import { logger } from "@/lib/utils/logger"');
  } else {
    // If no imports found, add after "use client" or at the beginning
    const insertIndex = hasUseClient ? 2 : 0;
    lines.splice(insertIndex, 0, 'import { logger } from "@/lib/utils/logger"');
  }

  return lines.join('\n');
}

// Replace console statements with logger calls
function replaceConsoleStatements(content) {
  let modified = content;
  let hasChanges = false;

  // Replace console.error with logger.error
  const errorRegex = /console\.error\s*\(\s*(['"`])(.*?)\1\s*,\s*([^)]+)\)/g;
  modified = modified.replace(errorRegex, (match, quote, message, errorVar) => {
    hasChanges = true;
    return `logger.error(${quote}${message}${quote}, ${errorVar.trim()})`;
  });

  // Replace console.error with string only
  const errorStringRegex = /console\.error\s*\(\s*(['"`])(.*?)\1\s*\)/g;
  modified = modified.replace(errorStringRegex, (match, quote, message) => {
    hasChanges = true;
    return `logger.error(${quote}${message}${quote})`;
  });

  // Replace console.warn
  const warnRegex = /console\.warn\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*([^)]+))?\)/g;
  modified = modified.replace(warnRegex, (match, quote, message, data) => {
    hasChanges = true;
    if (data) {
      return `logger.warn(${quote}${message}${quote}, ${data.trim()})`;
    }
    return `logger.warn(${quote}${message}${quote})`;
  });

  // Replace console.log with logger.debug (most console.log are debug statements)
  const logRegex = /console\.log\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*([^)]+))?\)/g;
  modified = modified.replace(logRegex, (match, quote, message, data) => {
    hasChanges = true;
    if (data) {
      return `logger.debug(${quote}${message}${quote}, ${data.trim()})`;
    }
    return `logger.debug(${quote}${message}${quote})`;
  });

  // Replace console.info
  const infoRegex = /console\.info\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*([^)]+))?\)/g;
  modified = modified.replace(infoRegex, (match, quote, message, data) => {
    hasChanges = true;
    if (data) {
      return `logger.info(${quote}${message}${quote}, ${data.trim()})`;
    }
    return `logger.info(${quote}${message}${quote})`;
  });

  return { content: modified, hasChanges };
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = replaceConsoleStatements(content);
    
    if (hasChanges) {
      const finalContent = addLoggerImport(newContent);
      fs.writeFileSync(filePath, finalContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🚀 Starting console statement replacement...');
  
  const files = getAllFiles();
  console.log(`📁 Found ${files.length} files to process`);
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      modifiedCount++;
      console.log(`✅ Modified: ${file}`);
    }
    processedCount++;
    
    if (processedCount % 50 === 0) {
      console.log(`📊 Progress: ${processedCount}/${files.length} files processed`);
    }
  }
  
  console.log(`\n🎉 Completed!`);
  console.log(`📊 Files processed: ${processedCount}`);
  console.log(`✏️  Files modified: ${modifiedCount}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review the changes: git diff`);
  console.log(`   2. Test the application: npm run dev`);
  console.log(`   3. Fix any remaining console statements manually`);
}

if (require.main === module) {
  main();
}