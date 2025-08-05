// Chat API functions for handling chat and message operations
export const chatApi = {
  // Get all chats with profile information
  getChats: async () => {
    try {
      console.log("🔍 Fetching chats from API...")

      const response = await fetch("/api/chats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch chats")
      }

      const result = await response.json()
      console.log("✅ Chats fetched successfully:", result.data?.length || 0, "chats")
      return { data: result.data || [] }
    } catch (error) {
      console.error("❌ Error fetching chats:", error)
      return {
        data: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },

  // Get messages for a specific chat
  getChatMessages: async (chatId: string) => {
    try {
      console.log(`🔍 Fetching messages for chat ${chatId}...`)

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch messages")
      }

      const result = await response.json()
      console.log("✅ Messages fetched successfully:", result.data?.length || 0, "messages")
      return { data: result.data || [] }
    } catch (error) {
      console.error("❌ Error fetching messages:", error)
      return {
        data: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },

  // Send a new message
  sendMessage: async (chatId: string, content: string, direction = "outbound") => {
    try {
      console.log(`📤 Sending message to chat ${chatId}...`)

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          direction,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const result = await response.json()
      console.log("✅ Message sent successfully:", result.data?.id)
      return { data: result.data }
    } catch (error) {
      console.error("❌ Error sending message:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },

  // Create a new chat
  createChat: async (profileId: string, channel = "SMS", subject?: string) => {
    try {
      console.log(`🆕 Creating new chat for profile ${profileId}...`)

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileId,
          channel,
          subject,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create chat")
      }

      const result = await response.json()
      console.log("✅ Chat created successfully:", result.data?.id)
      return { data: result.data }
    } catch (error) {
      console.error("❌ Error creating chat:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}
