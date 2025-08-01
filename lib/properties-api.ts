import { supabase } from "./supabase"

export const propertiesApi = {
  // Get all properties for a contact
  getContactProperties: async (contactId: number) => {
    try {
      const { data, error } = await supabase
        .from("profile_properties")
        .select("*")
        .eq("contact_id", contactId)
        .order("property_key")

      if (error) throw error
      return { data: data || [] }
    } catch (error) {
      console.error("Error fetching contact properties:", error)
      return { data: [], error: error.message }
    }
  },

  // Get all unique property keys (for form building)
  getPropertyKeys: async () => {
    try {
      const { data, error } = await supabase
        .from("profile_properties")
        .select("property_key, property_type")
        .order("property_key")

      if (error) throw error

      // Get unique keys
      const uniqueKeys = data?.reduce(
        (acc, item) => {
          if (!acc.find((k) => k.key === item.property_key)) {
            acc.push({ key: item.property_key, type: item.property_type })
          }
          return acc
        },
        [] as Array<{ key: string; type: string }>,
      )

      return { data: uniqueKeys || [] }
    } catch (error) {
      console.error("Error fetching property keys:", error)
      return { data: [], error: error.message }
    }
  },

  // Set a property for a contact
  setContactProperty: async (contactId: number, key: string, value: string, type = "text") => {
    try {
      const { data, error } = await supabase
        .from("profile_properties")
        .upsert({
          contact_id: contactId,
          property_key: key,
          property_value: value,
          property_type: type,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error("Error setting contact property:", error)
      return { error: error.message }
    }
  },

  // Delete a property for a contact
  deleteContactProperty: async (contactId: number, key: string) => {
    try {
      const { error } = await supabase
        .from("profile_properties")
        .delete()
        .eq("contact_id", contactId)
        .eq("property_key", key)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error("Error deleting contact property:", error)
      return { error: error.message }
    }
  },

  // Get contacts with specific property values (for filtering)
  getContactsByProperty: async (key: string, value?: string) => {
    try {
      let query = supabase
        .from("profile_properties")
        .select(`
          contact_id,
          property_value,
          contacts (
            id,
            first_name,
            last_name,
            email,
            mobile_number,
            status
          )
        `)
        .eq("property_key", key)

      if (value) {
        query = query.eq("property_value", value)
      }

      const { data, error } = await query

      if (error) throw error
      return { data: data || [] }
    } catch (error) {
      console.error("Error fetching contacts by property:", error)
      return { data: [], error: error.message }
    }
  },
}
