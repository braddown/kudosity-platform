import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { cookies } from 'next/headers'

// Get a single profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify user has access to this account
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .select('role, status')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single()
    
    if (memberError || !membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch the specific profile - simplified query
    const { data: profile, error: profileError } = await supabase
      .from('cdp_profiles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      )
    }

    if (!profile) {
      console.log(`Profile not found: ${params.id} for account: ${accountId}`)
      return NextResponse.json(
        { error: 'Profile not found', details: `No profile exists with ID ${params.id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: profile })
  } catch (error: any) {
    console.error('CDP Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Update a profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify user can update profiles
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .select('role, status')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single()
    
    if (memberError || !membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const profileData = await request.json()
    
    // First, get the current profile data to track changes
    const { data: currentProfile, error: fetchError } = await supabase
      .from('cdp_profiles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found', details: `No profile exists with ID ${params.id}` },
        { status: 404 }
      )
    }

    // Note: This system allows cross-account profile access to maintain compatibility with existing data
    
    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('cdp_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Profile not found', details: `No profile exists with ID ${params.id}` },
        { status: 404 }
      )
    }

    // Log activity for changed properties (simplified and more robust)
    try {
      // Track changes in both regular fields and custom fields
      const loggedChanges = []
      
      // Check regular profile fields (excluding notification_preferences - handle separately)
      const regularFields = ['first_name', 'last_name', 'email', 'mobile', 'status', 'address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code']
      for (const field of regularFields) {
        if (field in profileData) {
          const oldValue = currentProfile[field]
          const newValue = updatedProfile[field]
          
          if (oldValue !== newValue) {
            loggedChanges.push({
              property_name: field,
              property_type: 'regular',
              previous_value: oldValue,
              new_value: newValue
            })
          }
        }
      }

      // Special handling for notification_preferences - only log individual channel changes
      if ('notification_preferences' in profileData) {
        const oldPrefs = currentProfile.notification_preferences || {}
        const newPrefs = updatedProfile.notification_preferences || {}
        
        // Check each channel individually
        const channelTypes = ['marketing_emails', 'marketing_sms', 'marketing_whatsapp', 'marketing_rcs', 
                            'transactional_emails', 'transactional_sms', 'transactional_whatsapp', 'transactional_rcs']
        
        for (const channel of channelTypes) {
          const oldValue = oldPrefs[channel] === true
          const newValue = newPrefs[channel] === true
          
          if (oldValue !== newValue) {
            const channelName = channel.replace(/^(marketing_|transactional_)/, '').toUpperCase()
            const isMarketing = channel.startsWith('marketing_')
            const channelType = isMarketing ? 'Marketing' : 'Transactional'
            
            // Use proper terminology and activity types for different channel types
            const oldLabel = isMarketing ? (oldValue ? 'Consented' : 'Revoked') : (oldValue ? 'Activated' : 'Deactivated')
            const newLabel = isMarketing ? (newValue ? 'Consented' : 'Revoked') : (newValue ? 'Activated' : 'Deactivated')
            const activityType = isMarketing ? (newValue ? 'consent_given' : 'consent_revoked') : (newValue ? 'transactional_activated' : 'transactional_deactivated')
            
            loggedChanges.push({
              property_name: `${channelType} ${channelName}`,
              property_type: 'notification',
              activity_type: activityType,
              previous_value: oldLabel,
              new_value: newLabel,
              channel: channelName.toLowerCase(),
              channel_type: isMarketing ? 'marketing' : 'transactional'
            })
          }
        }
      }

      // Check custom fields
      if (profileData.custom_fields) {
        const currentCustomFields = currentProfile.custom_fields || {}
        const newCustomFields = updatedProfile.custom_fields || {}
        
        // Check all keys from both old and new custom fields
        const allCustomKeys = new Set([...Object.keys(currentCustomFields), ...Object.keys(newCustomFields)])
        
        for (const fieldName of allCustomKeys) {
          const oldValue = currentCustomFields[fieldName]
          const newValue = newCustomFields[fieldName]
          
          if (oldValue !== newValue) {
            loggedChanges.push({
              property_name: fieldName,
              property_type: 'custom',
              previous_value: oldValue,
              new_value: newValue
            })
          }
        }
      }

      // Only log if there are actual changes
      if (loggedChanges.length > 0) {
        console.log('Logging individual activities for changes:', loggedChanges)
        
        // Get user's name for logging
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single()

        const userName = userProfile 
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.email
          : user.email

        // Create individual activity entries for each change
        const activityEntries = loggedChanges
          .filter(change => change.property_name !== '_field_definitions') // Skip internal field definitions
          .map(change => {
            // Format values for display
            const formatValue = (value: any, isNotification = false): string => {
              if (value === null || value === undefined || value === '') return 'Empty'
              if (typeof value === 'boolean') {
                // For notification channels, use On/Off instead of Yes/No
                return isNotification ? (value ? 'On' : 'Off') : (value ? 'Yes' : 'No')
              }
              if (typeof value === 'number') return String(value)
              if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'Empty'
              if (typeof value === 'object') {
                // For objects, try to get meaningful display
                return JSON.stringify(value)
              }
              return String(value)
            }

            const isNotificationField = change.property_type === 'notification'
            const formattedOldValue = formatValue(change.previous_value, isNotificationField)
            const formattedNewValue = formatValue(change.new_value, isNotificationField)
            const fieldDisplayName = change.property_name
            
            // Use specific activity type for notifications, otherwise default to property_updated
            const activityType = change.activity_type || 'property_updated'
            
            return {
              profile_id: params.id,
              activity_type: activityType,
              channel: change.channel || null,
              channel_type: change.channel_type || null,
              description: `${change.property_type === 'notification' ? '' : 'Updated '}${fieldDisplayName} ${change.property_type === 'notification' ? change.new_value.toLowerCase() : `from "${formattedOldValue}" to "${formattedNewValue}"`}`,
              metadata: {
                property_name: change.property_name,
                property_type: change.property_type,
                previous_value: change.previous_value,
                new_value: change.new_value,
                user_id: user.id,
                user_email: user.email,
                timestamp: new Date().toISOString()
              },
              source: userName,
              account_id: accountId,
              performed_by: user.id,
              created_at: new Date().toISOString()
            }
          })

        if (activityEntries.length > 0) {
          // Log to profile activity log
          const { error: logError } = await supabase
            .from('profile_activity_log')
            .insert(activityEntries)
            
          if (logError) {
            console.error('Failed to log profile activities:', logError)
          } else {
            console.log(`Successfully logged ${activityEntries.length} profile activity entries`)
          }

          // Also log to user activity log for settings/users activity tab
          const userActivityEntries = activityEntries.map(entry => {
            const profileDisplayName = updatedProfile.first_name || updatedProfile.last_name ? 
              `${updatedProfile.first_name || ''} ${updatedProfile.last_name || ''}`.trim() : 
              updatedProfile.email || 'Unknown'
            
            return {
              user_id: user.id,
              account_id: accountId,
              activity_type: 'recipient_profile_updated',
              description: `Updated ${profileDisplayName}: ${entry.description}`,
              metadata: {
                profile_id: params.id,
                profile_name: profileDisplayName,
                change_details: entry.metadata,
                timestamp: new Date().toISOString()
              },
              created_at: new Date().toISOString()
            }
          })

          const { error: userLogError } = await supabase
            .from('user_activity_log')
            .insert(userActivityEntries)

          if (userLogError) {
            console.error('Failed to log user activities:', userLogError)
          } else {
            console.log(`Successfully logged ${userActivityEntries.length} user activity entries`)
          }
        }
      } else {
        console.log('No changes detected, skipping activity log')
      }
    } catch (activityError) {
      console.error('Error logging profile update activity:', activityError)
      // Don't fail the update if activity logging fails
    }

    return NextResponse.json({ data: updatedProfile })
  } catch (error: any) {
    console.error('CDP Update Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Delete a profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account
    const cookieStore = cookies()
    const accountId = cookieStore.get('current_account')?.value
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account selected' },
        { status: 400 }
      )
    }

    // Verify user can delete profiles (admin/owner only)
    const { data: membership, error: memberError } = await supabase
      .from('account_members')
      .select('role, status')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single()
    
    if (memberError || !membership || membership.status !== 'active' || 
        !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Get profile info before deletion for logging
    const { data: profileInfo } = await supabase
      .from('cdp_profiles')
      .select('first_name, last_name, email')
      .eq('id', params.id)
      .single()

    const profileName = profileInfo ? 
      (profileInfo.first_name || profileInfo.last_name ? 
        `${profileInfo.first_name || ''} ${profileInfo.last_name || ''}`.trim() : 
        profileInfo.email || 'Unknown Profile') : 'Unknown Profile'

    // Log the permanent deletion activity before actually deleting
    // This ensures we have a record even if the profile is destroyed
    try {
      // Get user info for logging
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()

      const userName = userProfile 
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.email
        : user.email

      // Log to profile activity log
      await supabase
        .from('profile_activity_log')
        .insert({
          profile_id: params.id,
          activity_type: 'profile_destroyed',
          description: 'Profile permanently destroyed',
          metadata: {
            destroyed_by: user.id,
            destroyed_by_name: userName,
            timestamp: new Date().toISOString(),
            reason: 'Permanent deletion requested'
          },
          source: userName,
          account_id: accountId,
          performed_by: user.id,
          created_at: new Date().toISOString()
        })

      // Also log to user activity log for settings/users activity tab
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          account_id: accountId,
          activity_type: 'recipient_profile_deleted',
          description: `Deleted recipient profile: ${profileName}`,
          metadata: {
            profile_id: params.id,
            profile_name: profileName,
            deleted_by: user.id,
            deleted_by_name: userName,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Error logging destruction activity:', logError)
      // Continue with deletion even if logging fails
    }

    // Start a transaction to delete all related data
    console.log(`Starting permanent deletion of profile ${params.id}`)

    // 1. Delete from cdp_contacts (if any)
    const { error: contactsError } = await supabase
      .from('cdp_contacts')
      .delete()
      .eq('profile_id', params.id)
    
    if (contactsError) {
      console.error('Error deleting contacts:', contactsError)
      // Continue with deletion even if no contacts exist
    }

    // 2. Delete from cdp_profile_activities
    const { error: activitiesError } = await supabase
      .from('cdp_profile_activities')
      .delete()
      .eq('profile_id', params.id)
    
    if (activitiesError) {
      console.error('Error deleting activities:', activitiesError)
      // Continue with deletion
    }

    // 3. Delete from cdp_profile_merge_log
    const { error: mergeLogError } = await supabase
      .from('cdp_profile_merge_log')
      .delete()
      .eq('target_profile_id', params.id)
    
    if (mergeLogError) {
      console.error('Error deleting merge logs:', mergeLogError)
      // Continue with deletion
    }

    // 4. Delete from profile_activity_log (should cascade, but let's be explicit)
    const { error: activityLogError } = await supabase
      .from('profile_activity_log')
      .delete()
      .eq('profile_id', params.id)
    
    if (activityLogError) {
      console.error('Error deleting activity logs:', activityLogError)
      // Continue with deletion
    }

    // 5. Delete from list_memberships if the profile is in any lists
    const { error: listMembershipsError } = await supabase
      .from('list_memberships')
      .delete()
      .eq('contact_id', params.id)
    
    if (listMembershipsError) {
      console.error('Error deleting list memberships:', listMembershipsError)
      // Continue with deletion
    }

    // 6. Finally, delete the profile itself
    // Note: Some older profiles might not have account_id set, so we check both conditions
    const { data: profileToDelete } = await supabase
      .from('cdp_profiles')
      .select('id, account_id')
      .eq('id', params.id)
      .single()

    if (!profileToDelete) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Only check account_id if it's set on the profile
    let deleteQuery = supabase
      .from('cdp_profiles')
      .delete()
      .eq('id', params.id)
    
    if (profileToDelete.account_id) {
      deleteQuery = deleteQuery.eq('account_id', accountId)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Error deleting profile:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete profile', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log(`Successfully destroyed profile ${params.id} and all related data`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('CDP Delete Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
