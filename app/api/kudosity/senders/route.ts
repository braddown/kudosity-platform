import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

// Default sender IDs for testing
// In production, these would come from the Kudosity API
const DEFAULT_SENDERS = [
  { id: 'KUDOSITY', name: 'KUDOSITY', type: 'alphanumeric' },
  { id: 'INFO', name: 'INFO', type: 'alphanumeric' },
  { id: 'ALERT', name: 'ALERT', type: 'alphanumeric' },
]

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get account settings to check for configured senders
    const { data: account } = await supabase
      .from('accounts')
      .select('settings')
      .eq('id', user.user_metadata?.account_id)
      .single()

    // Check if there are custom senders configured
    const customSenders = account?.settings?.kudosity_senders || []
    
    // In production, this would call the Kudosity API to get available senders
    // For now, we'll return default senders plus any custom ones
    const senders = [...DEFAULT_SENDERS, ...customSenders]
    
    // Get the default sender from account settings
    const defaultSender = account?.settings?.kudosity_default_sender || 'KUDOSITY'
    
    return NextResponse.json({
      senders,
      defaultSender,
    })

  } catch (error) {
    console.error('Failed to get senders:', error)
    return NextResponse.json(
      { error: 'Failed to get senders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { senderId, setAsDefault } = body

    if (!senderId) {
      return NextResponse.json(
        { error: 'Sender ID is required' },
        { status: 400 }
      )
    }

    // Update account settings with new sender
    const { data: account } = await supabase
      .from('accounts')
      .select('settings')
      .eq('id', user.user_metadata?.account_id)
      .single()

    const currentSettings = account?.settings || {}
    const customSenders = currentSettings.kudosity_senders || []
    
    // Add new sender if not already exists
    if (!customSenders.find((s: any) => s.id === senderId)) {
      customSenders.push({
        id: senderId,
        name: senderId,
        type: /^\d+$/.test(senderId) ? 'numeric' : 'alphanumeric',
      })
    }

    // Update settings
    const updatedSettings = {
      ...currentSettings,
      kudosity_senders: customSenders,
      ...(setAsDefault && { kudosity_default_sender: senderId }),
    }

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ settings: updatedSettings })
      .eq('id', user.user_metadata?.account_id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      senderId,
      isDefault: setAsDefault,
    })

  } catch (error) {
    console.error('Failed to add sender:', error)
    return NextResponse.json(
      { error: 'Failed to add sender' },
      { status: 500 }
    )
  }
}
