/**
 * Kudosity API Client
 * Wrapper for Kudosity MCP server integration
 */

import { createClient } from '@/lib/auth/client'

export interface SendSMSParams {
  recipient: string
  message: string
  sender?: string
  messageRef?: string
  trackLinks?: boolean
}

export interface SendSMSResponse {
  success: boolean
  messageId?: string
  error?: string
  segments?: number
  cost?: number
}

export interface MessageStatus {
  messageId: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  deliveredAt?: string
  error?: string
  clickCount?: number
  clicks?: Array<{
    url: string
    clickedAt: string
    userAgent?: string
  }>
}

export interface BulkSendParams {
  recipients: string[]
  message: string
  sender?: string
  trackLinks?: boolean
  personalization?: Record<string, any>
}

class KudosityAPI {
  private apiKey: string | null = null
  private defaultSender: string | null = null

  constructor() {
    // Initialize from environment or database settings
    this.loadConfiguration()
  }

  private async loadConfiguration() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Load API configuration from account settings
        const { data: settings } = await supabase
          .from('account_settings')
          .select('kudosity_api_key, kudosity_default_sender')
          .single()
        
        if (settings) {
          this.apiKey = settings.kudosity_api_key
          this.defaultSender = settings.kudosity_default_sender
        }
      }
    } catch (error) {
      console.error('Failed to load Kudosity configuration:', error)
    }
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(params: SendSMSParams): Promise<SendSMSResponse> {
    try {
      // Call the Kudosity MCP server via API endpoint
      const response = await fetch('/api/kudosity/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          sender: params.sender || this.defaultSender,
          trackLinks: params.trackLinks !== false, // Default to true
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return {
          success: false,
          error: `Failed to send SMS: ${error}`,
        }
      }

      const result = await response.json()
      return {
        success: true,
        messageId: result.messageId,
        segments: result.segments,
        cost: result.cost,
      }
    } catch (error) {
      console.error('SMS sending error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(params: BulkSendParams): Promise<{
    success: boolean
    sent: number
    failed: number
    results: Array<{ recipient: string; messageId?: string; error?: string }>
  }> {
    const results = []
    let sent = 0
    let failed = 0

    // Process in batches to respect rate limits
    const batchSize = 10
    for (let i = 0; i < params.recipients.length; i += batchSize) {
      const batch = params.recipients.slice(i, i + batchSize)
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (recipient) => {
          // Apply personalization if provided
          let personalizedMessage = params.message
          if (params.personalization && params.personalization[recipient]) {
            const tokens = params.personalization[recipient]
            personalizedMessage = params.message.replace(
              /\{\{(\w+)\}\}/g,
              (match, key) => tokens[key] || match
            )
          }

          const result = await this.sendSMS({
            recipient,
            message: personalizedMessage,
            sender: params.sender,
            trackLinks: params.trackLinks,
          })

          if (result.success) {
            sent++
            return { recipient, messageId: result.messageId }
          } else {
            failed++
            return { recipient, error: result.error }
          }
        })
      )

      results.push(...batchResults)

      // Add delay between batches to respect rate limits
      if (i + batchSize < params.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return {
      success: failed === 0,
      sent,
      failed,
      results,
    }
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus | null> {
    try {
      const response = await fetch(`/api/kudosity/message-status/${messageId}`)
      
      if (!response.ok) {
        console.error('Failed to get message status')
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting message status:', error)
      return null
    }
  }

  /**
   * Get message history with filtering
   */
  async getMessageHistory(params: {
    limit?: number
    offset?: number
    status?: string
    fromDate?: string
    toDate?: string
  }) {
    try {
      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.fromDate) queryParams.append('from_date', params.fromDate)
      if (params.toDate) queryParams.append('to_date', params.toDate)

      const response = await fetch(`/api/kudosity/messages?${queryParams}`)
      
      if (!response.ok) {
        console.error('Failed to get message history')
        return { messages: [], total: 0 }
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting message history:', error)
      return { messages: [], total: 0 }
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): { valid: boolean; formatted?: string; error?: string } {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Check if it starts with a country code
    if (digits.length < 10) {
      return { valid: false, error: 'Phone number too short' }
    }

    // Format to E.164
    let formatted = digits
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted
    }

    return { valid: true, formatted }
  }

  /**
   * Calculate message segments
   */
  calculateSegments(message: string): { segments: number; encoding: 'GSM' | 'Unicode' } {
    // Check if message contains Unicode characters
    const hasUnicode = /[^\x00-\x7F]/.test(message)
    const encoding = hasUnicode ? 'Unicode' : 'GSM'
    
    const maxLength = hasUnicode ? 70 : 160
    const maxLengthMultipart = hasUnicode ? 67 : 153
    
    if (message.length <= maxLength) {
      return { segments: 1, encoding }
    }
    
    return {
      segments: Math.ceil(message.length / maxLengthMultipart),
      encoding,
    }
  }

  /**
   * Estimate cost for sending messages
   */
  estimateCost(recipientCount: number, message: string): {
    segments: number
    totalSegments: number
    estimatedCost: number
    currency: string
  } {
    const { segments } = this.calculateSegments(message)
    const totalSegments = segments * recipientCount
    
    // Rough estimate - should be fetched from Kudosity pricing API
    const costPerSegment = 0.05 // Example: 5 cents per segment
    const estimatedCost = totalSegments * costPerSegment
    
    return {
      segments,
      totalSegments,
      estimatedCost,
      currency: 'USD',
    }
  }
}

// Export singleton instance
export const kudosityAPI = new KudosityAPI()
