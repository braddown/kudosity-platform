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

    // Parse request body
    const body = await request.json()
    const { number, forward_url } = body

    // Prepare form data for Kudosity API
    const formData = new URLSearchParams()
    if (number) {
      formData.append('number', number.toString())
    }
    if (forward_url) {
      formData.append('forward_url', forward_url)
    }

    // Call Kudosity lease-number API
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    
    console.log('Leasing number from Kudosity API...', { number, forward_url })
    
    const leaseResponse = await fetch('https://api.transmitsms.com/lease-number.json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    if (!leaseResponse.ok) {
      const errorText = await leaseResponse.text()
      console.error('Kudosity lease-number API error:', leaseResponse.status, errorText)
      return NextResponse.json({ 
        error: 'Failed to lease number from Kudosity',
        details: `HTTP ${leaseResponse.status}: ${errorText}`
      }, { status: 500 })
    }

    const leaseData = await leaseResponse.json()
    console.log('Kudosity lease-number response:', leaseData)

    // Check for API errors in response
    if (leaseData.error && leaseData.error.code !== 'SUCCESS') {
      return NextResponse.json({ 
        error: 'Kudosity API error',
        details: leaseData.error.description || 'Unknown error from Kudosity'
      }, { status: 400 })
    }

    // Add the new number to our database
    const senderData = {
      sender_id: leaseData.number.toString(),
      display_name: `Virtual Number (${leaseData.number})`,
      description: `Virtual number leased from Kudosity - $${leaseData.price || 0}/month`,
      type: 'virtual_number',
      country: null, // We could enhance this by detecting country from number
      capabilities: ['SMS'],
      status: leaseData.status === 'active' ? 'active' : 'inactive',
      kudosity_number: leaseData.number.toString(),
      price: leaseData.price || null,
      next_charge: leaseData.next_charge || null,
      auto_renew: leaseData.auto_renew || false,
      source: 'kudosity_api',
      last_synced_at: new Date().toISOString(),
      sync_status: 'synced',
      account_id: accountMember.account_id,
      created_by: user.id
    }

    const { data: newSender, error: insertError } = await supabase
      .from('senders')
      .insert([senderData])
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save new sender to database',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully leased number ${leaseData.number}`,
      sender: newSender,
      kudosity_response: {
        number: leaseData.number,
        price: leaseData.price,
        next_charge: leaseData.next_charge,
        auto_renew: leaseData.auto_renew,
        status: leaseData.status
      }
    })
    
  } catch (error) {
    console.error('Error leasing number:', error)
    return NextResponse.json({ 
      error: 'Failed to lease number',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
