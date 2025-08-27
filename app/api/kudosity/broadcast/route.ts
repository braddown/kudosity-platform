import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

// Kudosity has rate limits - typically 10 messages per second for standard accounts
const MESSAGES_PER_SECOND = 10
const BATCH_SIZE = 10
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000 // 2 seconds

interface BroadcastRequest {
  campaignName: string
  recipients: string[]
  message: string
  sender: string
  trackLinks?: boolean
  audiences?: string[]
}

interface MessageResult {
  recipient: string
  status: 'sent' | 'failed' | 'retrying'
  messageId?: string
  error?: string
  attempts: number
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendSingleMessage(
  recipient: string,
  message: string,
  sender: string,
  trackLinks: boolean,
  apiKey: string,
  apiSecret: string,
  attempt: number = 1
): Promise<MessageResult> {
  try {
    // Clean up the recipient - remove spaces and + sign
    const cleanRecipient = recipient.replace(/[\s+]/g, '')
    
    const response = await fetch('https://api.transmitmessage.com/v2/sms', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Kudosity-Platform/1.0.0'
      },
      body: JSON.stringify({
        recipient: cleanRecipient,
        message: message,
        sender: String(sender || 'KUDOSITY'),
        track_links: trackLinks,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      // v2 API returns message_id or id on success
      const messageId = data.message_id || data.id
      if (messageId) {
        return {
          recipient,
          status: 'sent',
          messageId: messageId,
          attempts: attempt,
        }
      } else {
        throw new Error(`No message ID in response: ${JSON.stringify(data)}`)
      }
    } else if (response.status === 429 || response.status === 503) {
      // Rate limit or server error - should retry
      if (attempt < RETRY_ATTEMPTS) {
        console.log(`Retrying message to ${recipient} (attempt ${attempt + 1}/${RETRY_ATTEMPTS})`)
        await sleep(RETRY_DELAY * attempt) // Exponential backoff
        return sendSingleMessage(recipient, message, sender, trackLinks, apiKey, apiSecret, attempt + 1)
      }
      throw new Error(`Failed after ${RETRY_ATTEMPTS} attempts: ${response.status}`)
    } else {
      const errorText = await response.text()
      throw new Error(`API error ${response.status}: ${errorText}`)
    }
  } catch (error) {
    return {
      recipient,
      status: attempt < RETRY_ATTEMPTS ? 'retrying' : 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      attempts: attempt,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body: BroadcastRequest = await request.json()
    const { campaignName, recipients, message, sender, trackLinks = false, audiences = [] } = body

    // Get API credentials
    const apiKey = process.env.KUDOSITY_API_KEY
    const apiSecret = process.env.KUDOSITY_API_SECRET || '' // Secret is not used with X-API-KEY auth
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Kudosity API key not configured'
      }, { status: 500 })
    }

    // Get account ID
    const { data: accountData } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    
    const accountId = accountData?.account_id

    // Create broadcast campaign record
    const actualCampaignName = campaignName || `Broadcast ${new Date().toISOString()}`
    const { data: campaign, error: campaignError } = await supabase
      .from('broadcast_campaigns')
      .insert({
        account_id: accountId,
        name: actualCampaignName,
        message_content: message,
        sender_id: sender,
        total_recipients: recipients.length,
        audiences: audiences,
        status: 'processing',
        created_by: user.id,
      })
      .select()
      .single()
      
    if (!campaignError && campaign) {
      // Also insert into campaigns table for visibility in Campaign Activity
      await supabase
        .from('campaigns')
        .insert({
          id: campaign.id,
          name: actualCampaignName,
          type: 'SMS',
          status: 'Running',
          channel: 'sms',
          performance_metrics: {
            sent: 0,
            delivered: 0,
            failed: 0,
            total_recipients: recipients.length
          },
          budget: 0,
          description: `SMS Broadcast: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        })
    }

    if (campaignError) {
      console.error('Failed to create campaign:', campaignError)
      return NextResponse.json({ 
        error: 'Failed to create campaign record'
      }, { status: 500 })
    }

    // Start sending messages in batches with rate limiting
    const results: MessageResult[] = []
    const startTime = Date.now()
    
    // Process in batches to respect rate limits
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const batchStartTime = Date.now()
      
      // Send batch in parallel
      const batchPromises = batch.map(recipient => 
        sendSingleMessage(recipient, message, sender, trackLinks, apiKey, apiSecret)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Update progress
      const progress = Math.round((results.length / recipients.length) * 100)
      await supabase
        .from('broadcast_campaigns')
        .update({
          progress,
          sent_count: results.filter(r => r.status === 'sent').length,
          failed_count: results.filter(r => r.status === 'failed').length,
        })
        .eq('id', campaign.id)
      
      // Store individual message logs
      const messageLogs = batchResults.map(result => ({
        account_id: accountId,
        campaign_id: campaign.id,
        recipient: result.recipient,
        status: result.status,
        message_id: result.messageId,
        error_message: result.error,
        attempts: result.attempts,
        created_at: new Date().toISOString(),
      }))
      
      await supabase
        .from('message_logs')
        .insert(messageLogs)
      
      // Rate limiting - ensure we don't exceed messages per second
      const batchDuration = Date.now() - batchStartTime
      const minDuration = (BATCH_SIZE / MESSAGES_PER_SECOND) * 1000
      if (batchDuration < minDuration) {
        await sleep(minDuration - batchDuration)
      }
      
      // Send progress update via SSE or WebSocket if implemented
      // For now, the client will poll the campaign status
    }
    
    // Calculate final statistics
    const totalDuration = Date.now() - startTime
    const successCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length
    const averageRetries = results.reduce((sum, r) => sum + r.attempts, 0) / results.length
    
    // Update campaign with final status
    await supabase
      .from('broadcast_campaigns')
      .update({
        status: 'completed',
        progress: 100,
        sent_count: successCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
        duration_ms: totalDuration,
        average_retries: averageRetries,
      })
      .eq('id', campaign.id)
      
    // Also update campaigns table
    await supabase
      .from('campaigns')
      .update({
        status: 'Completed',
        performance_metrics: {
          sent: successCount,
          delivered: successCount,
          failed: failedCount,
          total_recipients: recipients.length
        },
      })
      .eq('id', campaign.id)
    
    // Store in message_history for activity tracking
    for (const result of results.filter(r => r.status === 'sent')) {
      await supabase
        .from('message_history')
        .insert({
          account_id: accountId,
          campaign_id: campaign.id,
          message_id: result.messageId,
          recipient: result.recipient,
          message: message,
          sender: sender,
          status: 'sent',
          created_at: new Date().toISOString(),
        })
    }
    
    return NextResponse.json({ 
      success: true,
      campaignId: campaign.id,
      stats: {
        total: recipients.length,
        sent: successCount,
        failed: failedCount,
        duration: `${(totalDuration / 1000).toFixed(2)}s`,
        averageRetries,
      }
    })
    
  } catch (error) {
    console.error('Broadcast error:', error)
    return NextResponse.json({ 
      error: 'Failed to send broadcast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check campaign status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const url = new URL(request.url)
    const campaignId = url.searchParams.get('campaignId')
    
    if (!campaignId) {
      // Return list of campaigns
      const { data: campaigns } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      return NextResponse.json({ campaigns })
    }
    
    // Return specific campaign status
    const { data: campaign } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    
    return NextResponse.json({ campaign })
    
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch campaign status'
    }, { status: 500 })
  }
}

