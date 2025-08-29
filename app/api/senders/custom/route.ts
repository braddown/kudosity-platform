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

    // Parse request body
    const body = await request.json()
    const { 
      sender_id: rawSenderId, 
      type = 'alphanumeric', 
      countries = [],
      description = '',
      use_case = 'marketing'
    } = body

    console.log('Creating sender with use_case:', use_case)

    // Validate required fields
    if (!rawSenderId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'sender_id is required'
      }, { status: 400 })
    }

    // Validate type
    if (!['alphanumeric', 'mobile_number'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid sender type',
        details: 'type must be either "alphanumeric" or "mobile_number"'
      }, { status: 400 })
    }

    console.log('Validating sender:', { rawSenderId, type })

    let sender_id = rawSenderId

    // Validate sender_id based on type
    if (type === 'alphanumeric') {
      // Alphanumeric: max 11 characters, letters only, no spaces
      if (!/^[A-Za-z]{1,11}$/.test(sender_id)) {
        return NextResponse.json({ 
          error: 'Invalid alphanumeric sender ID',
          details: 'Alphanumeric sender ID must be 1-11 letters only (no spaces, numbers, or special characters)'
        }, { status: 400 })
      }
    } else if (type === 'mobile_number') {
      // Clean the mobile number first
      const cleanedNumber = rawSenderId.replace(/[\s\-\(\)]/g, '')
      console.log('Cleaned mobile number:', cleanedNumber)
      
      // Mobile number: international format validation (more flexible)
      // Allow 8-15 digits after country code, with optional + prefix
      if (!/^\+?[1-9]\d{8,14}$/.test(cleanedNumber)) {
        return NextResponse.json({ 
          error: 'Invalid mobile number',
          details: `Mobile number "${rawSenderId}" must be in international format with 8-15 digits (e.g., +61412345678). Cleaned: "${cleanedNumber}"`
        }, { status: 400 })
      }
      
      // Use cleaned version with + prefix
      sender_id = cleanedNumber.startsWith('+') ? cleanedNumber : '+' + cleanedNumber
      console.log('Final sender_id:', sender_id)
    }

    // Check if sender_id already exists for this account
    const { data: existingSender } = await supabase
      .from('senders')
      .select('id')
      .eq('account_id', accountMember.account_id)
      .eq('sender_id', sender_id)
      .single()

    if (existingSender) {
      return NextResponse.json({ 
        error: 'Sender ID already exists',
        details: `A sender with ID "${sender_id}" already exists in your account`
      }, { status: 400 })
    }

    // Prepare sender data
    const senderData = {
      sender_id,
      display_name: sender_id, // Use sender_id as display name
      description,
      type,
      country: countries.length > 0 ? countries.join(',') : null,
      country_name: null, // Will be populated later if needed
      capabilities: ['SMS'],
      status: 'active', // Set as active for now, admin system will be added later
      approval_status: 'approved',
      source: 'manual',
      use_case,
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
        error: 'Failed to save custom sender to database',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully added custom sender "${sender_id}"`,
      sender: newSender
    })
    
  } catch (error) {
    console.error('Error adding custom sender:', error)
    return NextResponse.json({ 
      error: 'Failed to add custom sender',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { 
      id,
      description,
      countries,
      use_case,
      status,
      approval_status,
      rejection_reason
    } = body

    console.log('Updating sender:', id, 'with description:', description, 'and use_case:', use_case)

    // Validate required fields
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required field: id' 
      }, { status: 400 })
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (countries !== undefined) updateData.country = countries.length > 0 ? countries.join(',') : null
    if (use_case !== undefined) updateData.use_case = use_case
    if (status !== undefined) updateData.status = status
    if (approval_status !== undefined) updateData.approval_status = approval_status
    if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason

    // Add approval date if status is being set to approved
    if (approval_status === 'approved') {
      updateData.approval_date = new Date().toISOString()
    }

    console.log('Database update data:', updateData)

    const { data: updatedSender, error: updateError } = await supabase
      .from('senders')
      .update(updateData)
      .eq('id', id)
      .eq('account_id', accountMember.account_id)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update sender',
        details: updateError.message
      }, { status: 500 })
    }

    if (!updatedSender) {
      return NextResponse.json({ 
        error: 'Sender not found or access denied'
      }, { status: 404 })
    }

    console.log('Successfully updated sender:', updatedSender.sender_id)

    return NextResponse.json({ 
      success: true,
      message: 'Successfully updated sender',
      sender: updatedSender
    })
    
  } catch (error) {
    console.error('Error updating sender:', error)
    return NextResponse.json({ 
      error: 'Failed to update sender',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get sender ID from query params
    const { searchParams } = new URL(request.url)
    const senderId = searchParams.get('id')

    if (!senderId) {
      return NextResponse.json({ 
        error: 'Missing sender ID parameter' 
      }, { status: 400 })
    }

    // Delete the sender
    const { data: deletedSender, error: deleteError } = await supabase
      .from('senders')
      .delete()
      .eq('id', senderId)
      .eq('account_id', accountMember.account_id)
      .select()
      .single()

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete sender',
        details: deleteError.message
      }, { status: 500 })
    }

    if (!deletedSender) {
      return NextResponse.json({ 
        error: 'Sender not found or access denied'
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully deleted sender',
      sender: deletedSender
    })
    
  } catch (error) {
    console.error('Error deleting sender:', error)
    return NextResponse.json({ 
      error: 'Failed to delete sender',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
