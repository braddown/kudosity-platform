import { supabase } from "../supabase"

// Get all profiles with optional filtering
export const getProfiles = async (options?: {
  search?: string
  status?: string
  limit?: number
  offset?: number
}) => {
  try {
    console.log("Fetching profiles from Supabase with options:", options)

    // If specific limit/offset provided, use those (for pagination)
    if (options?.limit || options?.offset) {
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", "00000000-0000-0000-0000-000000000000") // Exclude metadata profile
        .order("created_at", { ascending: false })

      // Apply filters if provided
      if (options?.search) {
        query = query.or(
          `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%,mobile.ilike.%${options.search}%`,
        )
      }

      if (options?.status) {
        query = query.eq("status", options.status)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching profiles:", error)
        return { data: [], error: error.message }
      }

      console.log(`Successfully fetched ${data?.length || 0} profiles`)
      return { data: data || [], error: null }
    }

    // Otherwise, fetch ALL profiles using batching to avoid 1000 record limit
    console.log("Fetching ALL profiles using batching approach...")

    // First, get the total count
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("id", "00000000-0000-0000-0000-000000000000") // Exclude metadata profile

    if (countError) {
      console.error("Error getting profile count:", countError)
      return { data: [], error: countError.message }
    }

    console.log(`Total profiles in database: ${count}`)

    if (!count || count === 0) {
      return { data: [], error: null }
    }

    // Now fetch all records in batches to avoid the 1000 record limit
    const batchSize = 1000
    const totalRecords = count
    const batches = Math.ceil(totalRecords / batchSize)

    let allProfiles: any[] = []

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = start + batchSize - 1

      console.log(`Fetching batch ${i + 1}/${batches}: records ${start} to ${end}`)

      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", "00000000-0000-0000-0000-000000000000") // Exclude metadata profile
        .range(start, end)
        .order("created_at", { ascending: false })

      // Apply filters if provided
      if (options?.search) {
        query = query.or(
          `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%,mobile.ilike.%${options.search}%`,
        )
      }

      if (options?.status) {
        query = query.eq("status", options.status)
      }

      const { data: batchData, error: batchError } = await query

      if (batchError) {
        console.error(`Error fetching batch ${i + 1}:`, batchError)
        throw batchError
      }

      if (batchData) {
        allProfiles = [...allProfiles, ...batchData]
        console.log(`Batch ${i + 1} fetched: ${batchData.length} records. Total so far: ${allProfiles.length}`)
      }
    }

    console.log(`Successfully fetched all profiles: ${allProfiles.length} records`)
    return { data: allProfiles, error: null }
  } catch (error: any) {
    console.error("Profiles API error:", error)
    return { data: [], error: error.message || "Failed to fetch profiles" }
  }
}

// Get a single profile by ID
export const getProfile = async (id: string) => {
  try {
    console.log("Fetching profile by ID:", id)

    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return { data: null, error: error.message }
    }

    console.log("Successfully fetched profile:", data)
    return { data, error: null }
  } catch (error: any) {
    console.error("Get profile API error:", error)
    return { data: null, error: error.message || "Failed to fetch profile" }
  }
}

// Create a new profile
export const createProfile = async (profileData: any) => {
  try {
    console.log("Creating profile:", profileData)

    const { data, error } = await supabase.from("profiles").insert([profileData]).select().single()

    if (error) {
      console.error("Error creating profile:", error)
      return { data: null, error: error.message }
    }

    console.log("Successfully created profile:", data)
    return { data, error: null }
  } catch (error: any) {
    console.error("Create profile API error:", error)
    return { data: null, error: error.message || "Failed to create profile" }
  }
}

// Update an existing profile
export const updateProfile = async (id: string, profileData: any) => {
  try {
    console.log("Updating profile:", id, profileData)

    const { data, error } = await supabase.from("profiles").update(profileData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating profile:", error)
      return { data: null, error: error.message }
    }

    console.log("Successfully updated profile:", data)
    return { data, error: null }
  } catch (error: any) {
    console.error("Update profile API error:", error)
    return { data: null, error: error.message || "Failed to update profile" }
  }
}

// Soft delete a profile (mark as inactive)
export const softDeleteProfile = async (id: string) => {
  try {
    console.log("Soft deleting profile:", id)

    const { data, error } = await supabase
      .from("profiles")
      .update({ status: "Inactive", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error soft deleting profile:", error)
      return { data: null, error: error.message }
    }

    console.log("Successfully soft deleted profile:", data)
    return { data, error: null }
  } catch (error: any) {
    console.error("Soft delete profile API error:", error)
    return { data: null, error: error.message || "Failed to soft delete profile" }
  }
}

// Restore a soft-deleted profile
export const restoreProfile = async (id: string) => {
  try {
    console.log("Restoring profile:", id)

    const { data, error } = await supabase
      .from("profiles")
      .update({ status: "Active", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    console.log("Successfully restored profile:", data)
    return { data, error: null }
  } catch (error: any) {
    console.error("Restore profile API error:", error)
    return { data: null, error: error.message || "Failed to restore profile" }
  }
}

// Permanently delete a profile
export const deleteProfile = async (id: string) => {
  try {
    console.log("Permanently deleting profile:", id)

    const { error } = await supabase.from("profiles").delete().eq("id", id)

    if (error) {
      console.error("Error deleting profile:", error)
      return { data: null, error: error.message }
    }

    console.log("Successfully deleted profile:", id)
    return { data: { id }, error: null }
  } catch (error: any) {
    console.error("Delete profile API error:", error)
    return { data: null, error: error.message || "Failed to delete profile" }
  }
}

// Get profiles count for summary cards
export const getProfilesCount = async () => {
  try {
    console.log("Getting profiles count...")

    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("id", "00000000-0000-0000-0000-000000000000") // Exclude metadata profile

    if (error) {
      console.error("Error getting profiles count:", error)
      return { count: 0, error: error.message }
    }

    console.log(`Total profiles count: ${count}`)
    return { count: count || 0, error: null }
  } catch (error: any) {
    console.error("Profiles count API error:", error)
    return { count: 0, error: error.message || "Failed to get profiles count" }
  }
}

// Get table schema for properties management
export const getTableSchema = async () => {
  try {
    console.log("Getting table schema...")

    // Define the schema based on our known structure
    const columns = [
      { column_name: "id", data_type: "uuid", is_nullable: "NO" },
      { column_name: "first_name", data_type: "character varying", is_nullable: "NO" },
      { column_name: "last_name", data_type: "character varying", is_nullable: "NO" },
      { column_name: "email", data_type: "character varying", is_nullable: "YES" },
      { column_name: "mobile", data_type: "character varying", is_nullable: "YES" },
      { column_name: "phone", data_type: "character varying", is_nullable: "YES" },
      { column_name: "country", data_type: "character varying", is_nullable: "YES" },
      { column_name: "state", data_type: "character varying", is_nullable: "YES" },
      { column_name: "postcode", data_type: "character varying", is_nullable: "YES" },
      { column_name: "suburb", data_type: "character varying", is_nullable: "YES" },
      { column_name: "timezone", data_type: "character varying", is_nullable: "YES" },
      { column_name: "status", data_type: "character varying", is_nullable: "NO" },
      { column_name: "created_at", data_type: "timestamp with time zone", is_nullable: "NO" },
      { column_name: "updated_at", data_type: "timestamp with time zone", is_nullable: "YES" },
      { column_name: "custom_fields", data_type: "jsonb", is_nullable: "YES" },
      { column_name: "tags", data_type: "ARRAY", is_nullable: "YES" },
      { column_name: "last_login", data_type: "timestamp with time zone", is_nullable: "YES" },
      { column_name: "performance_metrics", data_type: "jsonb", is_nullable: "YES" },
    ]

    console.log("Successfully retrieved table schema")
    return { data: columns, error: null }
  } catch (error: any) {
    console.error("Get table schema API error:", error)
    return { data: null, error: error.message || "Failed to get table schema" }
  }
}

// Alternative approach: Store field definitions in a separate simple table or use a different method
const getCustomFieldDefinitions = async () => {
  try {
    // Try to get field definitions from any existing profile's custom_fields
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("custom_fields")
      .not("custom_fields", "is", null)
      .limit(1)

    if (error || !profiles?.length) {
      return {}
    }

    // Look for _field_definitions in any profile
    for (const profile of profiles) {
      if (profile.custom_fields?._field_definitions) {
        return profile.custom_fields._field_definitions
      }
    }

    return {}
  } catch (error) {
    console.log("No custom field definitions found")
    return {}
  }
}

const saveCustomFieldDefinitions = async (definitions: any) => {
  try {
    // Find any existing profile to store the definitions in
    const { data: existingProfiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, custom_fields")
      .limit(1)

    if (fetchError) {
      console.error("Error fetching profiles for metadata storage:", fetchError)
      return false
    }

    if (existingProfiles && existingProfiles.length > 0) {
      // Use the first profile to store field definitions
      const profile = existingProfiles[0]
      const updatedCustomFields = {
        ...profile.custom_fields,
        _field_definitions: definitions,
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ custom_fields: updatedCustomFields })
        .eq("id", profile.id)

      if (updateError) {
        console.error("Error updating profile with field definitions:", updateError)
        return false
      }

      return true
    } else {
      // No profiles exist yet, create a minimal one for metadata storage
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          first_name: "System",
          last_name: "Metadata",
          status: "Active", // Use "Active" instead of "System"
          custom_fields: {
            _field_definitions: definitions,
            _is_metadata: true,
          },
        },
      ])

      if (insertError) {
        console.error("Error creating metadata profile:", insertError)
        return false
      }

      return true
    }
  } catch (error) {
    console.error("Error saving custom field definitions:", error)
    return false
  }
}

// Get custom fields schema by analyzing existing data
export const getCustomFieldsSchema = async () => {
  try {
    console.log("Getting custom fields schema from profiles data...")

    // First, try to get stored field definitions
    const storedDefinitions = await getCustomFieldDefinitions()

    // Then analyze existing profile data to find all custom fields
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("custom_fields")
      .not("custom_fields", "is", null)
      .limit(100)

    if (error) {
      console.error("Error getting custom fields schema:", error)
      return { data: storedDefinitions, error: null } // Return stored definitions even if analysis fails
    }

    const customFieldKeys = new Set<string>()
    const customFieldTypes: Record<string, string> = {}

    // Analyze all profiles to find all custom fields
    profiles?.forEach((profile) => {
      if (profile.custom_fields && typeof profile.custom_fields === "object") {
        Object.entries(profile.custom_fields).forEach(([key, value]) => {
          // Skip metadata fields
          if (key.startsWith("_")) return

          customFieldKeys.add(key)

          // Determine type based on value
          if (!customFieldTypes[key] && value !== null && value !== undefined && value !== "") {
            if (typeof value === "number") {
              customFieldTypes[key] = "number"
            } else if (typeof value === "boolean") {
              customFieldTypes[key] = "boolean"
            } else if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)))) {
              customFieldTypes[key] = "date"
            } else if (typeof value === "string" && value.includes("@")) {
              customFieldTypes[key] = "email"
            } else if (typeof value === "string" && value.includes("http")) {
              customFieldTypes[key] = "url"
            } else if (typeof value === "string" && value.length > 100) {
              customFieldTypes[key] = "textarea"
            } else {
              customFieldTypes[key] = "string"
            }
          }
        })
      }
    })

    // Convert to object format expected by UI, merging stored definitions with discovered fields
    const customFieldsSchema: Record<string, any> = {}

    // Add discovered fields
    Array.from(customFieldKeys).forEach((key) => {
      const storedDef = storedDefinitions[key]

      customFieldsSchema[key] = {
        key: key,
        label:
          storedDef?.label ||
          key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        type: storedDef?.type || customFieldTypes[key] || "string",
        required: storedDef?.required || false,
        description: storedDef?.description || `Custom field: ${key}`,
        defaultValue: storedDef?.defaultValue || "",
      }
    })

    // Add stored definitions that might not have data yet
    Object.entries(storedDefinitions).forEach(([key, definition]: [string, any]) => {
      if (!customFieldsSchema[key]) {
        customFieldsSchema[key] = {
          key: key,
          label: definition.label,
          type: definition.type,
          required: definition.required || false,
          description: definition.description || "",
          defaultValue: definition.defaultValue || "",
        }
      }
    })

    console.log(`Successfully retrieved custom fields schema: ${Object.keys(customFieldsSchema).length} fields`)
    return { data: customFieldsSchema, error: null }
  } catch (error: any) {
    console.error("Get custom fields schema API error:", error)
    return { data: {}, error: error.message || "Failed to get custom fields schema" }
  }
}

// Create a custom field - stores definition in metadata
export const createCustomField = async (fieldData: any) => {
  try {
    console.log("Creating custom field:", fieldData)

    // Get existing field definitions
    const existingDefinitions = await getCustomFieldDefinitions()

    // Add the new field definition
    const updatedDefinitions = {
      ...existingDefinitions,
      [fieldData.key]: {
        label: fieldData.label,
        type: fieldData.type,
        required: fieldData.required || false,
        defaultValue: fieldData.defaultValue || "",
        description: fieldData.description || "",
        created_at: new Date().toISOString(),
      },
    }

    // Save updated definitions
    const saved = await saveCustomFieldDefinitions(updatedDefinitions)

    if (!saved) {
      throw new Error("Failed to save custom field definition")
    }

    console.log("Custom field created successfully")
    return { data: fieldData, error: null }
  } catch (error: any) {
    console.error("Error creating custom field:", error)
    return { data: null, error: error.message || "Failed to create custom field" }
  }
}

// Update a custom field definition
export const updateCustomField = async (fieldKey: string, fieldData: any) => {
  try {
    console.log("Updating custom field:", fieldKey, fieldData)

    // Get existing definitions
    const existingDefinitions = await getCustomFieldDefinitions()

    // Remove old key if it changed
    if (fieldKey !== fieldData.key && existingDefinitions[fieldKey]) {
      delete existingDefinitions[fieldKey]
    }

    // Update field definition
    const updatedDefinitions = {
      ...existingDefinitions,
      [fieldData.key]: {
        label: fieldData.label,
        type: fieldData.type,
        required: fieldData.required || false,
        defaultValue: fieldData.defaultValue || "",
        description: fieldData.description || "",
        updated_at: new Date().toISOString(),
      },
    }

    // Save updated definitions
    const saved = await saveCustomFieldDefinitions(updatedDefinitions)

    if (!saved) {
      throw new Error("Failed to save custom field definition")
    }

    return { data: fieldData, error: null }
  } catch (error: any) {
    console.error("Error updating custom field:", error)
    return { data: null, error: error.message || "Failed to update custom field" }
  }
}

// Delete a custom field
export const deleteCustomField = async (fieldKey: string) => {
  try {
    console.log("Deleting custom field:", fieldKey)

    // Get existing definitions
    const existingDefinitions = await getCustomFieldDefinitions()

    // Remove the field definition
    const updatedDefinitions = { ...existingDefinitions }
    delete updatedDefinitions[fieldKey]

    // Save updated definitions
    const saved = await saveCustomFieldDefinitions(updatedDefinitions)

    if (!saved) {
      throw new Error("Failed to save custom field definition")
    }

    return { data: { key: fieldKey }, error: null }
  } catch (error: any) {
    console.error("Error deleting custom field:", error)
    return { data: null, error: error.message || "Failed to delete custom field" }
  }
}

// Export the profilesApi object with all functions
export const profilesApi = {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  softDeleteProfile,
  restoreProfile,
  deleteProfile,
  getProfilesCount,
  getTableSchema,
  getCustomFieldsSchema,
  createCustomField,
  updateCustomField,
  deleteCustomField,
}

// Also export individual functions for direct import
