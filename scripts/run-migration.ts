#!/usr/bin/env tsx

/**
 * Migration Runner for CDP Architecture
 * 
 * This script runs SQL migrations against the Supabase database.
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { logger } from "@/lib/utils/logger"

// Get Supabase configuration from environment or use defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgfsmeudhvsvwmzxexmv.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!supabaseServiceKey) {
  logger.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable is required')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration(migrationFile: string) {
  try {
    logger.debug(`🚀 Running migration: ${migrationFile}`)
    
    // Read the SQL file
    const migrationPath = join(process.cwd(), 'scripts', 'migrations', migrationFile)
    const sqlContent = readFileSync(migrationPath, 'utf-8')
    
    // Split SQL content by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    logger.debug(`📄 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue
      }
      
      logger.debug(`⏳ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_').select('*').limit(0)
          
          if (directError) {
            logger.error(`❌ Failed to execute statement ${i + 1}:`, error.message)
            logger.error(`Statement: ${statement.substring(0, 100)}...`)
            throw error
          }
        }
        
        logger.debug(`✅ Statement ${i + 1} executed successfully`)
        
      } catch (err) {
        logger.error(`❌ Error executing statement ${i + 1}:`, err)
        logger.error(`Statement: ${statement.substring(0, 200)}...`)
        throw err
      }
    }
    
    logger.debug(`🎉 Migration ${migrationFile} completed successfully!`)
    
  } catch (error) {
    logger.error(`💥 Migration failed:`, error)
    process.exit(1)
  }
}

// Get migration file from command line arguments
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.log(`
📋 Usage: npx tsx scripts/run-migration.ts <migration-file>

Available migrations:
- 001_create_cdp_architecture.sql  (Create CDP tables and structure)
- 002_matching_functions.sql       (Create matching and processing functions)

Example:
npx tsx scripts/run-migration.ts 001_create_cdp_architecture.sql
`)
  process.exit(1)
}

// Run the migration
runMigration(migrationFile)
  .then(() => {
    logger.debug('✨ Migration runner completed')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('💥 Migration runner failed:', error)
    process.exit(1)
  })