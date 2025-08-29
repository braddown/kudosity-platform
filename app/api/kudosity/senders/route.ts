import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error in senders API:', authError)
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No authenticated user found in senders API')
      return NextResponse.json({ 
        error: 'Unauthorized - No authenticated user found' 
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
        error: 'No account found for user',
        senders: [] 
      }, { status: 400 })
    }

    console.log('Fetching senders for account:', accountMember.account_id)

    // Fetch senders from database
    const { data: senders, error: sendersError } = await supabase
      .from('senders')
      .select('*')
      .eq('account_id', accountMember.account_id)
      .order('type', { ascending: true })
      .order('created_at', { ascending: true })

    if (sendersError) {
      console.error('Error fetching senders from database:', sendersError)
      return NextResponse.json({ 
        error: 'Failed to fetch senders from database',
        details: sendersError.message,
        senders: [] 
      }, { status: 500 })
    }

    // Format the response to match the expected format
    const formattedSenders = (senders || []).map((sender) => ({
      id: sender.id,
      sender_id: sender.sender_id,
      number: sender.sender_id, // Keep for backward compatibility
      display_name: sender.display_name,
      description: sender.description,
      type: sender.type,
      country: sender.country,
      country_name: sender.country_name,
      capabilities: sender.capabilities || ['SMS'],
      status: sender.status,
      approval_status: sender.approval_status,
      use_case: sender.use_case,
      price: sender.price,
      next_charge: sender.next_charge,
      auto_renew: sender.auto_renew,
      source: sender.source,
      last_synced_at: sender.last_synced_at
    }))

    console.log(`Returning ${formattedSenders.length} senders from database`)
    
    return NextResponse.json({ 
      senders: formattedSenders,
      count: formattedSenders.length,
      needs_sync: senders?.some(s => s.sync_status === 'needs_sync') || false,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching senders:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch senders',
      details: error instanceof Error ? error.message : 'Unknown error',
      senders: [] 
    }, { status: 500 })
  }
}