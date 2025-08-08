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
        .from("cdp_profiles")
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
      .from("cdp_profiles")
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
        .from("cdp_profiles")
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

    const { data, error } = await supabase.from("cdp_profiles").select("*").eq("id", id).single()

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

    const { data, error } = await supabase.from("cdp_profiles").insert([profileData]).select().single()

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

    const { data, error } = await supabase.from("cdp_profiles").update(profileData).eq("id", id).select().single()

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
      .from("cdp_profiles")
      .update({ lifecycle_stage: "churned", updated_at: new Date().toISOString() })
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
      .from("cdp_profiles")
      .update({ lifecycle_stage: "customer", updated_at: new Date().toISOString() })
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

    const { error } = await supabase.from("cdp_profiles").delete().eq("id", id)

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
      .from("cdp_profiles")
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

// Get table schema for properties management - Updated for CDP structure
export const getTableSchema = async () => {
  try {
    console.log("Getting CDP profiles table schema...")

    // Define the schema based on our CDP structure
    const columns = [
      // Core identification
      { column_name: "id", data_type: "uuid", is_nullable: "NO" },
      { column_name: "mobile", data_type: "text", is_nullable: "NO" },
      
      // Basic contact information
      { column_name: "first_name", data_type: "text", is_nullable: "YES" },
      { column_name: "last_name", data_type: "text", is_nullable: "YES" },
      { column_name: "email", data_type: "text", is_nullable: "YES" },
      { column_name: "notes", data_type: "text", is_nullable: "YES" },
      
      // Address fields (CDP structure)
      { column_name: "address_line_1", data_type: "text", is_nullable: "YES" },
      { column_name: "address_line_2", data_type: "text", is_nullable: "YES" },
      { column_name: "postal_code", data_type: "text", is_nullable: "YES" },
      { column_name: "city", data_type: "text", is_nullable: "YES" },
      { column_name: "state", data_type: "text", is_nullable: "YES" },
      { column_name: "country", data_type: "text", is_nullable: "YES" },
      
      // Contact properties (preferences and metadata)
      { column_name: "timezone", data_type: "text", is_nullable: "YES" },
      { column_name: "language_preferences", data_type: "text", is_nullable: "YES" },
      { column_name: "os", data_type: "text", is_nullable: "YES" },
      { column_name: "device", data_type: "text", is_nullable: "YES" },
      { column_name: "source", data_type: "text", is_nullable: "YES" },
      { column_name: "location", data_type: "text", is_nullable: "YES" },
      
      // Custom data and preferences
      { column_name: "custom_fields", data_type: "jsonb", is_nullable: "YES" },
      { column_name: "notification_preferences", data_type: "jsonb", is_nullable: "YES" },
      { column_name: "tags", data_type: "ARRAY", is_nullable: "YES" },
      
      // Profile metadata
      { column_name: "created_at", data_type: "timestamp with time zone", is_nullable: "NO" },
      { column_name: "updated_at", data_type: "timestamp with time zone", is_nullable: "YES" },
      { column_name: "last_activity_at", data_type: "timestamp with time zone", is_nullable: "YES" },
      
      // Deduplication and merge management
      { column_name: "is_duplicate", data_type: "boolean", is_nullable: "YES" },
      { column_name: "duplicate_of_profile_id", data_type: "uuid", is_nullable: "YES" },
      { column_name: "merge_status", data_type: "text", is_nullable: "YES" },
      
      // Data management (GDPR compliance)
      { column_name: "data_retention_date", data_type: "timestamp with time zone", is_nullable: "YES" },
    ]

    console.log("Successfully retrieved CDP profiles table schema")
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
      .from("cdp_profiles")
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
      .from("cdp_profiles")
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
        .from("cdp_profiles")
        .update({ custom_fields: updatedCustomFields })
        .eq("id", profile.id)

      if (updateError) {
        console.error("Error updating profile with field definitions:", updateError)
        return false
      }

      return true
    } else {
      // No profiles exist yet, create a minimal one for metadata storage
      const { error: insertError } = await supabase.from("cdp_profiles").insert([
        {
          mobile: "system_metadata_profile",
          first_name: "System",
          last_name: "Metadata",
          source: "system",
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

// Get custom fields schema from custom_field_definitions table
export const getCustomFieldsSchema = async () => {
  try {
    console.log("Getting custom fields schema from custom_field_definitions table...")

    // Get field definitions from the dedicated table
    const { data: fieldDefinitions, error } = await supabase
      .from("custom_field_definitions")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error getting custom fields schema:", error)
      return { data: {}, error: error.message }
    }

    // Transform the data into the expected format
    const schema: Record<string, any> = {}
    
    fieldDefinitions?.forEach((field) => {
      schema[field.key] = {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required || false,
        defaultValue: field.default_value || "",
        description: field.description || "",
        created_at: field.created_at,
        updated_at: field.updated_at
      }
    })

    // Fallback: Also check for legacy field definitions stored in profiles (for backward compatibility)
    if (Object.keys(schema).length === 0) {
      console.log("No field definitions found in table, checking legacy profile storage...")
      const storedDefinitions = await getCustomFieldDefinitions()
      Object.entries(storedDefinitions).forEach(([key, definition]) => {
        schema[key] = definition
      })
    }

    console.log(`Found ${Object.keys(schema).length} custom fields`)
    return { data: schema, error: null }
  } catch (error: any) {
    console.error("Error getting custom fields schema:", error)
    return { data: {}, error: error.message || "Failed to get custom fields schema" }
  }
}

// Create a custom field - stores definition in custom_field_definitions table
export const createCustomField = async (fieldData: any) => {
  try {
    console.log("Creating custom field:", fieldData)

    // Insert the field definition into the custom_field_definitions table
    const { data: insertedField, error: insertError } = await supabase
      .from("custom_field_definitions")
      .insert([
        {
          key: fieldData.key,
          label: fieldData.label,
          type: fieldData.type,
          required: fieldData.required || false,
          default_value: fieldData.defaultValue || null,
          description: fieldData.description || null,
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting field definition:", insertError)
      throw new Error(`Failed to create field definition: ${insertError.message}`)
    }

    // Also save to legacy profile storage for backward compatibility
    try {
      const existingDefinitions = await getCustomFieldDefinitions()
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
      await saveCustomFieldDefinitions(updatedDefinitions)
      console.log("Also saved to legacy profile storage for backward compatibility")
    } catch (legacyError) {
      console.warn("Failed to save to legacy storage, but field definition was created successfully:", legacyError)
    }

    console.log("Custom field created successfully")
    return { data: insertedField, error: null }
  } catch (error: any) {
    console.error("Error creating custom field:", error)
    return { data: null, error: error.message || "Failed to create custom field" }
  }
}

// Update a custom field definition
export const updateCustomField = async (fieldKey: string, fieldData: any) => {
  try {
    console.log("Updating custom field:", fieldKey, fieldData)

    // Update the field definition in the custom_field_definitions table
    const { data: updatedField, error: updateError } = await supabase
      .from("custom_field_definitions")
      .update({
        key: fieldData.key,
        label: fieldData.label,
        type: fieldData.type,
        required: fieldData.required || false,
        default_value: fieldData.defaultValue || null,
        description: fieldData.description || null,
        updated_at: new Date().toISOString()
      })
      .eq("key", fieldKey)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating field definition:", updateError)
      throw new Error(`Failed to update field definition: ${updateError.message}`)
    }

    // If the key changed, we need to update all profile data
    if (fieldKey !== fieldData.key) {
      console.log(`Field key changed from '${fieldKey}' to '${fieldData.key}', updating profile data...`)
      
      const { data: profiles, error: fetchError } = await supabase
        .from("cdp_profiles")
        .select("id, custom_fields")
        .not("custom_fields", "is", null)

      if (fetchError) {
        console.error("Error fetching profiles for key update:", fetchError)
      } else {
        let updateCount = 0
        for (const profile of profiles || []) {
          if (profile.custom_fields && 
              typeof profile.custom_fields === 'object' && 
              profile.custom_fields !== null &&
              fieldKey in profile.custom_fields) {
            
            const updatedCustomFields = { ...profile.custom_fields }
            updatedCustomFields[fieldData.key] = updatedCustomFields[fieldKey]
            delete updatedCustomFields[fieldKey]
            
            const { error: profileUpdateError } = await supabase
              .from("cdp_profiles")
              .update({ 
                custom_fields: updatedCustomFields,
                updated_at: new Date().toISOString()
              })
              .eq("id", profile.id)
              
            if (!profileUpdateError) {
              updateCount++
            }
          }
        }
        console.log(`Updated field key in ${updateCount} profiles`)
      }
    }

    // Also update legacy profile storage for backward compatibility
    try {
      const existingDefinitions = await getCustomFieldDefinitions()
      if (fieldKey !== fieldData.key && existingDefinitions[fieldKey]) {
        delete existingDefinitions[fieldKey]
      }
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
      await saveCustomFieldDefinitions(updatedDefinitions)
      console.log("Also updated legacy profile storage for backward compatibility")
    } catch (legacyError) {
      console.warn("Failed to update legacy storage, but field definition was updated successfully:", legacyError)
    }

    return { data: updatedField, error: null }
  } catch (error: any) {
    console.error("Error updating custom field:", error)
    return { data: null, error: error.message || "Failed to update custom field" }
  }
}

// Delete a custom field - removes it from all profiles and definitions
export const deleteCustomField = async (fieldKey: string) => {
  try {
    console.log("Deleting custom field:", fieldKey)

    // Step 1: Remove field definition from custom_field_definitions table
    const { error: deleteDefinitionError } = await supabase
      .from("custom_field_definitions")
      .delete()
      .eq("key", fieldKey)

    if (deleteDefinitionError) {
      console.error("Error deleting field definition:", deleteDefinitionError)
      throw new Error(`Failed to delete field definition: ${deleteDefinitionError.message}`)
    }

    console.log(`Deleted field definition for '${fieldKey}' from custom_field_definitions table`)

    // Step 2: Remove field from stored field definitions in profiles (legacy support)
    const existingDefinitions = await getCustomFieldDefinitions()
    if (existingDefinitions[fieldKey]) {
      const updatedDefinitions = { ...existingDefinitions }
      delete updatedDefinitions[fieldKey]
      await saveCustomFieldDefinitions(updatedDefinitions)
      console.log(`Removed '${fieldKey}' from profile-stored field definitions`)
    }

    // Step 3: Remove field data from all profiles
    const { data: allProfiles, error: fetchError } = await supabase
      .from("cdp_profiles")
      .select("id, custom_fields")
      
    if (fetchError) {
      throw new Error(`Failed to fetch profiles: ${fetchError.message}`)
    }
    
    console.log(`Checking ${allProfiles?.length || 0} profiles for field '${fieldKey}'`)
    
    let updateCount = 0
    let foundCount = 0
    
    for (const profile of allProfiles || []) {
      // Check if the profile has the custom field
      if (profile.custom_fields && 
          typeof profile.custom_fields === 'object' && 
          profile.custom_fields !== null &&
          fieldKey in profile.custom_fields) {
        
        foundCount++
        const updatedCustomFields = { ...profile.custom_fields }
        delete updatedCustomFields[fieldKey]
        
        const { error: updateError } = await supabase
          .from("cdp_profiles")
          .update({ 
            custom_fields: updatedCustomFields,
            updated_at: new Date().toISOString()
          })
          .eq("id", profile.id)
          
        if (updateError) {
          console.error(`Failed to update profile ${profile.id}:`, updateError)
          continue // Continue with other profiles instead of failing completely
        }
        
        updateCount++
        
        // Log progress for large operations
        if (updateCount % 50 === 0) {
          console.log(`Updated ${updateCount} profiles so far...`)
        }
      }
    }
    
    console.log(`Found ${foundCount} profiles with field '${fieldKey}', successfully updated ${updateCount} profiles`)
    return { data: { key: fieldKey, removedFromProfiles: updateCount }, error: null }
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
