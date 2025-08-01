import { supabase } from "./supabase"
import type { FilterGroup } from "@/components/Logs"

export interface LogFilter {
  id: string
  created_at: string
  updated_at: string
  name: string
  description?: string
  user_id: string
  filter_data: FilterGroup[]
  is_public: boolean
  tags: string[]
  usage_count: number
  last_used_at?: string
}

export interface LogFilterInsert {
  name: string
  description?: string
  user_id: string
  filter_data: FilterGroup[]
  is_public?: boolean
  tags?: string[]
}

export interface LogFilterUpdate {
  name?: string
  description?: string
  filter_data?: FilterGroup[]
  is_public?: boolean
  tags?: string[]
}

// Function to create the table if it doesn't exist
async function ensureTableExists() {
  try {
    if (!supabase) {
      throw new Error("Supabase client is not initialized")
    }

    // First, try a simple query to see if the table exists
    const { error: testError } = await supabase.from("log_filters").select("id").limit(1)

    if (testError && testError.message.includes("does not exist")) {
      console.log("log_filters table does not exist, attempting to create...")

      // Since we can't create tables directly through the client in most cases,
      // we'll return an error with instructions
      return {
        success: false,
        needsTableCreation: true,
        sql: `
-- Create the log_filters table
CREATE TABLE IF NOT EXISTS log_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  filter_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_log_filters_user_id ON log_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_log_filters_name ON log_filters(name);
CREATE INDEX IF NOT EXISTS idx_log_filters_created_at ON log_filters(created_at);

-- IMPORTANT: Disable RLS completely for this demo table
ALTER TABLE log_filters DISABLE ROW LEVEL SECURITY;

-- Alternative: If you prefer to keep RLS enabled, use these policies instead:
-- (Comment out the DISABLE command above and uncomment the policies below)

-- ALTER TABLE log_filters ENABLE ROW LEVEL SECURITY;
-- 
-- -- Drop any existing policies first
-- DROP POLICY IF EXISTS "log_filters_select_policy" ON log_filters;
-- DROP POLICY IF EXISTS "log_filters_insert_policy" ON log_filters;
-- DROP POLICY IF EXISTS "log_filters_update_policy" ON log_filters;
-- DROP POLICY IF EXISTS "log_filters_delete_policy" ON log_filters;
-- 
-- -- Create permissive policies for demo purposes
-- CREATE POLICY "log_filters_select_policy" ON log_filters FOR SELECT USING (true);
-- CREATE POLICY "log_filters_insert_policy" ON log_filters FOR INSERT WITH CHECK (true);
-- CREATE POLICY "log_filters_update_policy" ON log_filters FOR UPDATE USING (true);
-- CREATE POLICY "log_filters_delete_policy" ON log_filters FOR DELETE USING (true);
        `,
      }
    }

    // Table exists, but check if we can insert (RLS might be blocking)
    if (!testError) {
      // Try a test insert to check RLS
      const testInsert = {
        id: crypto.randomUUID(),
        name: "test_filter_" + Date.now(),
        description: "Test filter to check RLS",
        user_id: "test-user",
        filter_data: [{ conditions: [{ field: "test", operator: "contains", value: "test" }] }],
        is_public: false,
        tags: [],
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from("log_filters").insert(testInsert)

      if (insertError && insertError.message.includes("row-level security policy")) {
        // RLS is blocking, need to fix policies
        return {
          success: false,
          needsRLSFix: true,
          sql: `
-- Fix RLS policies for log_filters table
-- Option 1: Disable RLS completely (recommended for demo)
ALTER TABLE log_filters DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, run these commands instead:
-- ALTER TABLE log_filters ENABLE ROW LEVEL SECURITY;
-- 
-- -- Drop existing policies that might be causing issues
-- DROP POLICY IF EXISTS "Users can view their own log filters" ON log_filters;
-- DROP POLICY IF EXISTS "Users can insert their own log filters" ON log_filters;
-- DROP POLICY IF EXISTS "Users can update their own log filters" ON log_filters;
-- DROP POLICY IF EXISTS "Users can delete their own log filters" ON log_filters;
-- 
-- -- Create new permissive policies for demo purposes
-- CREATE POLICY "log_filters_select_policy" ON log_filters FOR SELECT USING (true);
-- CREATE POLICY "log_filters_insert_policy" ON log_filters FOR INSERT WITH CHECK (true);
-- CREATE POLICY "log_filters_update_policy" ON log_filters FOR UPDATE USING (true);
-- CREATE POLICY "log_filters_delete_policy" ON log_filters FOR DELETE USING (true);
          `,
        }
      }

      // Clean up test record if it was inserted
      if (!insertError) {
        await supabase.from("log_filters").delete().eq("id", testInsert.id)
      }
    }

    // Table exists and works
    return { success: true }
  } catch (error) {
    console.error("Error checking table existence:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export const logFiltersApi = {
  // Get all log filters for a user
  getLogFilters: async (userId: string) => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      // Check if table exists first
      const tableCheck = await ensureTableExists()
      if (!tableCheck.success) {
        if (tableCheck.needsTableCreation) {
          console.warn("log_filters table does not exist. Please create it manually.")
          return {
            data: [],
            error: "Table does not exist",
            needsTableCreation: true,
            sql: tableCheck.sql,
          }
        }
        if (tableCheck.needsRLSFix) {
          console.warn("RLS policies are blocking access. Please fix RLS settings.")
          return {
            data: [],
            error: "RLS policies need to be fixed",
            needsRLSFix: true,
            sql: tableCheck.sql,
          }
        }
        throw new Error(tableCheck.error || "Failed to verify table existence")
      }

      const { data, error } = await supabase
        .from("log_filters")
        .select("*")
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order("created_at", { ascending: false })

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error("Error fetching log filters:", error)
      return {
        data: [],
        error: error.message || "Failed to fetch log filters",
      }
    }
  },

  // Save a new log filter
  saveLogFilter: async (filter: LogFilterInsert) => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      // Check if table exists first
      const tableCheck = await ensureTableExists()
      if (!tableCheck.success) {
        if (tableCheck.needsTableCreation) {
          return {
            data: null,
            error: "Table does not exist",
            needsTableCreation: true,
            sql: tableCheck.sql,
          }
        }
        if (tableCheck.needsRLSFix) {
          return {
            data: null,
            error: "RLS policies are blocking access",
            needsRLSFix: true,
            sql: tableCheck.sql,
          }
        }
        throw new Error(tableCheck.error || "Failed to verify table existence")
      }

      // Generate a UUID for the filter
      const filterId = crypto.randomUUID()

      const filterToInsert = {
        id: filterId,
        ...filter,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
        tags: filter.tags || [],
      }

      console.log("Attempting to insert filter:", filterToInsert)

      const { data, error } = await supabase.from("log_filters").insert(filterToInsert).select().single()

      if (error) {
        console.error("Insert error:", error)

        // Check if it's an RLS error
        if (error.message.includes("row-level security policy")) {
          return {
            data: null,
            error: "RLS policies are blocking access",
            needsRLSFix: true,
            sql: `
-- Fix RLS policies for log_filters table
ALTER TABLE log_filters DISABLE ROW LEVEL SECURITY;

-- If you prefer to keep RLS enabled, use these policies instead:
-- ALTER TABLE log_filters ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can view their own log filters" ON log_filters;
-- DROP POLICY IF EXISTS "Users can insert their own log filters" ON log_filters;
-- DROP POLICY IF EXISTS "Users can update their own log filters" ON log_filters;
-- DROP POLICY IF EXISTS "Users can delete their own log filters" ON log_filters;
-- CREATE POLICY "log_filters_select_policy" ON log_filters FOR SELECT USING (true);
-- CREATE POLICY "log_filters_insert_policy" ON log_filters FOR INSERT WITH CHECK (true);
-- CREATE POLICY "log_filters_update_policy" ON log_filters FOR UPDATE USING (true);
-- CREATE POLICY "log_filters_delete_policy" ON log_filters FOR DELETE USING (true);
            `,
          }
        }

        throw error
      }

      console.log("Filter saved successfully:", data)
      return { data }
    } catch (error) {
      console.error("Error saving log filter:", error)
      return {
        data: null,
        error: error.message || "Failed to save log filter",
      }
    }
  },

  // Update an existing log filter
  updateLogFilter: async (filterId: string, updates: LogFilterUpdate) => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      // Check if table exists first
      const tableCheck = await ensureTableExists()
      if (!tableCheck.success) {
        if (tableCheck.needsRLSFix) {
          return {
            data: null,
            error: "RLS policies are blocking access",
            needsRLSFix: true,
            sql: tableCheck.sql,
          }
        }
        throw new Error(tableCheck.error || "Table does not exist")
      }

      const { data, error } = await supabase
        .from("log_filters")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", filterId)
        .select()
        .single()

      if (error) {
        if (error.message.includes("row-level security policy")) {
          return {
            data: null,
            error: "RLS policies are blocking access",
            needsRLSFix: true,
            sql: `ALTER TABLE log_filters DISABLE ROW LEVEL SECURITY;`,
          }
        }
        throw error
      }

      return { data }
    } catch (error) {
      console.error("Error updating log filter:", error)
      return {
        data: null,
        error: error.message || "Failed to update log filter",
      }
    }
  },

  // Delete a log filter
  deleteLogFilter: async (filterId: string) => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      // Check if table exists first
      const tableCheck = await ensureTableExists()
      if (!tableCheck.success) {
        if (tableCheck.needsRLSFix) {
          return {
            success: false,
            error: "RLS policies are blocking access",
            needsRLSFix: true,
            sql: tableCheck.sql,
          }
        }
        throw new Error(tableCheck.error || "Table does not exist")
      }

      const { error } = await supabase.from("log_filters").delete().eq("id", filterId)

      if (error) {
        if (error.message.includes("row-level security policy")) {
          return {
            success: false,
            error: "RLS policies are blocking access",
            needsRLSFix: true,
            sql: `ALTER TABLE log_filters DISABLE ROW LEVEL SECURITY;`,
          }
        }
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Error deleting log filter:", error)
      return {
        success: false,
        error: error.message || "Failed to delete log filter",
      }
    }
  },

  // Increment usage count and update last used
  useLogFilter: async (filterId: string) => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      // Check if table exists first
      const tableCheck = await ensureTableExists()
      if (!tableCheck.success) {
        return { success: false, error: "Table does not exist" }
      }

      // First get the current usage count
      const { data: currentData, error: fetchError } = await supabase
        .from("log_filters")
        .select("usage_count")
        .eq("id", filterId)
        .single()

      if (fetchError) {
        console.error("Error fetching current usage count:", fetchError)
        return { success: false, error: "Failed to fetch current usage count" }
      }

      // Update with incremented count
      const { error: updateError } = await supabase
        .from("log_filters")
        .update({
          usage_count: (currentData.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", filterId)

      if (updateError) {
        if (updateError.message.includes("row-level security policy")) {
          console.warn("RLS policy prevented usage count update, but continuing...")
          return { success: true } // Don't fail the operation for this
        }
        throw updateError
      }

      return { success: true }
    } catch (error) {
      console.error("Error updating log filter usage:", error)
      return {
        success: false,
        error: error.message || "Failed to update usage",
      }
    }
  },

  // Get popular/frequently used filters
  getPopularLogFilters: async (limit = 10) => {
    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized")
      }

      // Check if table exists first
      const tableCheck = await ensureTableExists()
      if (!tableCheck.success) {
        return {
          data: [],
          error: "Table does not exist",
        }
      }

      const { data, error } = await supabase
        .from("log_filters")
        .select("*")
        .eq("is_public", true)
        .order("usage_count", { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error("Error fetching popular log filters:", error)
      return {
        data: [],
        error: error.message || "Failed to fetch popular filters",
      }
    }
  },

  // Check if table exists and get creation SQL
  checkTableStatus: async () => {
    return await ensureTableExists()
  },
}
