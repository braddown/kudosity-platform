import { createClient } from '@/lib/auth/server'

interface SendSMSParams {
  recipient: string
  message: string
  sender?: string
  trackLinks?: boolean
}

interface BulkSMSParams {
  recipients: string[]
  message: string
  sender?: string
  trackLinks?: boolean
  campaignName?: string
}

interface SenderID {
  number: string
  label: string
  type: 'MOBILE' | 'LANDLINE' | 'ALPHANUMERIC' | 'VMN'
  country?: string
  capabilities?: string[]
}

export class KudosityAPI {
  private apiKey: string
  private apiSecret: string
  private baseUrl = 'https://api.transmitsms.com'
  private v2BaseUrl = 'https://api.transmitmessage.com'

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_KUDOSITY_API_KEY || process.env.KUDOSITY_API_KEY || ''
    this.apiSecret = process.env.NEXT_PUBLIC_KUDOSITY_API_SECRET || process.env.KUDOSITY_API_SECRET || ''
  }

  async getSenderIDs(): Promise<SenderID[]> {
    try {
      const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')
      
      // Fetch multiple pages to get all sender IDs
      const allNumbers: SenderID[] = []
      let page = 1
      let hasMore = true
      
      while (hasMore && page <= 10) { // Limit to 10 pages for safety
        const response = await fetch(
          `${this.baseUrl}/get-numbers.json?filter=owned&page=${page}&max=100`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json',
            },
          }
        )

        if (!response.ok) {
          console.error('Failed to fetch sender IDs:', response.status)
          break
        }

        const data = await response.json()
        
        if (data.numbers && data.numbers.length > 0) {
          const formattedNumbers = data.numbers.map((num: any) => ({
            number: num.number,
            label: num.number,
            type: num.type || 'MOBILE',
            country: num.country,
            capabilities: num.capabilities || [],
          }))
          allNumbers.push(...formattedNumbers)
          page++
        } else {
          hasMore = false
        }
      }

      // Add default alphanumeric sender if configured
      if (process.env.NEXT_PUBLIC_KUDOSITY_ALPHANUMERIC_SENDER) {
        allNumbers.unshift({
          number: process.env.NEXT_PUBLIC_KUDOSITY_ALPHANUMERIC_SENDER,
          label: process.env.NEXT_PUBLIC_KUDOSITY_ALPHANUMERIC_SENDER,
          type: 'ALPHANUMERIC',
        })
      }

      return allNumbers
    } catch (error) {
      console.error('Error fetching sender IDs:', error)
      return []
    }
  }

  async sendSMS({ recipient, message, sender, trackLinks = false }: SendSMSParams) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Process message for link tracking if enabled
      let processedMessage = message
      if (trackLinks) {
        processedMessage = await this.processLinksForTracking(message)
      }

      // Send via Kudosity v2 API
      const response = await fetch(`${this.v2BaseUrl}/v2/sms`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient,
          from: sender || process.env.NEXT_PUBLIC_KUDOSITY_DEFAULT_SENDER,
          message: processedMessage,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send SMS')
      }

      // Store in message history
      await supabase.from('message_history').insert({
        user_id: user.id,
        recipient,
        message: processedMessage,
        original_message: message,
        sender: sender || process.env.NEXT_PUBLIC_KUDOSITY_DEFAULT_SENDER,
        status: 'sent',
        message_ref: result.message_id,
        sent_at: new Date().toISOString(),
        metadata: {
          track_links: trackLinks,
          kudosity_response: result,
        },
      })

      return {
        success: true,
        messageId: result.message_id,
        ...result,
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      throw error
    }
  }

  async sendBulkSMS({ recipients, message, sender, trackLinks = false, campaignName }: BulkSMSParams) {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[],
      messageIds: [] as string[],
    }

    // Process in batches to avoid rate limiting
    const batchSize = 10
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      // Send messages in parallel within batch
      const promises = batch.map(async (recipient) => {
        try {
          const result = await this.sendSMS({
            recipient,
            message,
            sender,
            trackLinks,
          })
          results.sent++
          results.messageIds.push(result.messageId)
          return result
        } catch (error) {
          results.failed++
          results.errors.push({
            recipient,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          return null
        }
      })

      await Promise.all(promises)
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Store campaign summary
    if (campaignName) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase.from('campaigns').insert({
          user_id: user.id,
          name: campaignName,
          total_recipients: recipients.length,
          sent_count: results.sent,
          failed_count: results.failed,
          message,
          sender,
          track_links: trackLinks,
          message_ids: results.messageIds,
          created_at: new Date().toISOString(),
        })
      }
    }

    return {
      success: results.failed === 0,
      ...results,
    }
  }

  private async processLinksForTracking(message: string): Promise<string> {
    // This would integrate with your link tracking service
    // For now, we'll use a simple replacement
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return message.replace(urlRegex, (url) => {
      // In production, this would create a tracking link via your service
      const trackingId = Math.random().toString(36).substr(2, 8)
      return `https://link.conversr.chat/${trackingId}`
    })
  }
}

export const kudosityAPI = new KudosityAPI()