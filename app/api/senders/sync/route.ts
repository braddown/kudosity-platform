import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

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

    // Get user's account
    const { data: accountMember } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!accountMember?.account_id) {
      return NextResponse.json({ 
        error: 'No account found for user' 
      }, { status: 400 })
    }

    // Get API credentials from environment
    const apiKey = process.env.KUDOSITY_API_KEY
    const apiSecret = process.env.KUDOSITY_API_SECRET
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ 
        error: 'Kudosity API credentials not configured',
        details: 'Please set KUDOSITY_API_KEY and KUDOSITY_API_SECRET in environment variables'
      }, { status: 500 })
    }

    // Fetch numbers from Kudosity API
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    
    console.log('Syncing senders from Kudosity API...')
    
    // Fetch owned numbers from Kudosity
    const ownedResponse = await fetch('https://api.transmitsms.com/get-numbers.json?filter=owned&max=100', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    })

    if (!ownedResponse.ok) {
      const errorText = await ownedResponse.text()
      console.error('Kudosity API error:', ownedResponse.status, errorText)
      return NextResponse.json({ 
        error: 'Failed to fetch numbers from Kudosity',
        details: `HTTP ${ownedResponse.status}: ${errorText}`
      }, { status: 500 })
    }

    const ownedData = await ownedResponse.json()
    console.log('Kudosity API response:', { 
      hasNumbers: !!ownedData.numbers, 
      count: ownedData.numbers?.length || 0,
      numbers_total: ownedData.numbers_total
    })

    const kudosityNumbers = ownedData.numbers || []
    
    // Get existing senders to preserve custom descriptions and use cases
    const { data: existingSenders } = await supabase
      .from('senders')
      .select('sender_id, description, use_case')
      .eq('account_id', accountMember.account_id)

    const existingDescriptions = new Map(
      (existingSenders || []).map(sender => [sender.sender_id, sender.description])
    )
    
    const existingUseCases = new Map(
      (existingSenders || []).map(sender => [sender.sender_id, sender.use_case])
    )

    // Prepare senders data for database
    const sendersToUpsert = []

    // Process virtual numbers from Kudosity
    for (const num of kudosityNumbers) {
      const senderId = num.number.toString()
      const existingDescription = existingDescriptions.get(senderId)
      const existingUseCase = existingUseCases.get(senderId)
      
      // Use existing custom description if available, otherwise use default
      const description = existingDescription || `Virtual number from Kudosity - $${num.price || 0}/month`
      // Use existing custom use case if available, otherwise use default
      const use_case = existingUseCase || 'marketing'
      
      if (existingDescription) {
        console.log(`Preserving custom description for ${senderId}: "${existingDescription}"`)
      }
      if (existingUseCase && existingUseCase !== 'marketing') {
        console.log(`Preserving custom use case for ${senderId}: "${existingUseCase}"`)
      }
      
      const senderData = {
        sender_id: senderId,
        display_name: `Virtual Number (${num.number})`,
        description: description,
        type: 'virtual_number',
        country: null, // Kudosity API doesn't provide country in this response
        capabilities: ['SMS'], // Default capability
        status: num.status === 'active' ? 'active' : 'inactive',
        use_case: use_case,
        kudosity_number: num.number.toString(),
        price: num.price || null,
        next_charge: num.next_charge || null,
        auto_renew: num.auto_renew || false,
        source: 'kudosity_api',
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
        account_id: accountMember.account_id,
        created_by: user.id
      }
      sendersToUpsert.push(senderData)
    }

    // Add alphanumeric sender if configured
    if (process.env.KUDOSITY_ALPHANUMERIC_SENDER) {
      sendersToUpsert.push({
        sender_id: process.env.KUDOSITY_ALPHANUMERIC_SENDER,
        display_name: `Custom Sender (${process.env.KUDOSITY_ALPHANUMERIC_SENDER})`,
        description: `Alphanumeric sender from environment configuration`,
        type: 'alphanumeric',
        country: null,
        capabilities: ['SMS'],
        status: 'active',
        source: 'manual',
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
        account_id: accountMember.account_id,
        created_by: user.id
      })
    }

    console.log(`Upserting ${sendersToUpsert.length} senders to database...`)

    // Upsert senders to database
    const { data: upsertedSenders, error: upsertError } = await supabase
      .from('senders')
      .upsert(sendersToUpsert, { 
        onConflict: 'sender_id',
        ignoreDuplicates: false 
      })
      .select()

    if (upsertError) {
      console.error('Database upsert error:', upsertError)
      return NextResponse.json({ 
        error: 'Failed to save senders to database',
        details: upsertError.message
      }, { status: 500 })
    }

    // Mark any senders not in the current sync as needing sync (they may have been removed from Kudosity)
    const currentSenderIds = sendersToUpsert.map(s => s.sender_id)
    
    if (currentSenderIds.length > 0) {
      const { error: markStaleError } = await supabase
        .from('senders')
        .update({ 
          sync_status: 'needs_sync',
          last_synced_at: new Date().toISOString()
        })
        .eq('account_id', accountMember.account_id)
        .eq('source', 'kudosity_api')
        .not('sender_id', 'in', `(${currentSenderIds.map(id => `'${id}'`).join(',')})`)

      if (markStaleError) {
        console.error('Error marking stale senders:', markStaleError)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully synced ${sendersToUpsert.length} senders`,
      synced_count: sendersToUpsert.length,
      senders: upsertedSenders || []
    })
    
  } catch (error) {
    console.error('Error syncing senders:', error)
    return NextResponse.json({ 
      error: 'Failed to sync senders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
