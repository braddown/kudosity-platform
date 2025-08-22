import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

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

    // Get account settings for API key
    const { data: account } = await supabase
      .from('accounts')
      .select('settings')
      .eq('id', user.user_metadata?.account_id)
      .single()

    // Get API credentials - try from account settings first, then env variables
    const apiKey = account?.settings?.kudosity_api_key || process.env.KUDOSITY_API_KEY || '53ec769b09dd4331797240f0c7be430f'
    const apiSecret = account?.settings?.kudosity_api_secret || process.env.KUDOSITY_API_SECRET || 'bradley1970'
    
    if (!apiKey || !apiSecret) {
      console.log('No Kudosity API credentials configured')
      // Return empty senders if no API credentials
      return NextResponse.json({
        senders: [],
        defaultSender: '',
        error: 'No API credentials configured'
      })
    }

    try {
      // Fetch ALL numbers from Kudosity Legacy API with pagination
      console.log('Fetching numbers from Kudosity Legacy API with pagination')
      
      let allSenders = []
      let page = 1
      let hasMore = true
      const perPage = 100 // Request max items per page
      
      while (hasMore) {
        // Build URL with correct pagination parameters
        const url = new URL('https://api.transmitsms.com/get-numbers.json')
        url.searchParams.append('filter', 'owned')  // Get owned numbers only
        url.searchParams.append('page', page.toString())
        url.searchParams.append('max', perPage.toString())  // Use 'max' instead of 'per_page'
        
        console.log(`Fetching page ${page} (max ${perPage} items per page)`)
        
        const numbersResponse = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        })

        console.log(`Page ${page} response status:`, numbersResponse.status)

        if (numbersResponse.ok) {
          const data = await numbersResponse.json()
          console.log(`Page ${page} data:`, {
            total: data.total,
            page: data.page || page,
            max: data.max || perPage,
            numbers_count: data.numbers?.length || 0,
            raw_response_keys: Object.keys(data)
          })
          
          // Parse the response and add to our collection
          if (data.numbers && Array.isArray(data.numbers)) {
            // Add numbers from this page
            const pageSenders = data.numbers.map((num: any) => ({
              id: num.number || num,
              name: num.number || num,
              type: 'number'
            }))
            allSenders = [...allSenders, ...pageSenders]
            
            // Check if there are more pages
            // The API returns 'total' for total count across all pages
            if (data.total && typeof data.total === 'number') {
              // If we haven't retrieved all items yet, fetch next page
              if (allSenders.length < data.total) {
                page++
                console.log(`Retrieved ${allSenders.length} of ${data.total} total, fetching next page...`)
              } else {
                // We have all items
                hasMore = false
                console.log(`Retrieved all ${allSenders.length} senders`)
              }
            } else if (data.numbers.length === perPage) {
              // No total provided but full page returned, try next page
              page++
              console.log(`Full page of ${perPage} items returned, checking for more...`)
            } else {
              // Less than full page, we're done
              hasMore = false
              console.log(`Only ${data.numbers.length} items returned (less than max ${perPage}), no more pages`)
            }
          } else if (Array.isArray(data) && page === 1) {
            // First page might return array directly (no pagination)
            allSenders = data.map((num: any) => ({
              id: num.number || num,
              name: num.number || num,
              type: 'number'
            }))
            hasMore = false
          } else {
            // No more data
            hasMore = false
          }
          
          // Safety limit to prevent infinite loops
          if (page > 20) {
            console.log('Reached maximum page limit (20 pages)')
            hasMore = false
          }
        } else {
          // If any page fails, stop pagination
          if (page === 1) {
            // First page failed, return error
            const errorText = await numbersResponse.text()
            console.log('Numbers endpoint error:', numbersResponse.status, errorText)
            
            return NextResponse.json({
              senders: [],
              defaultSender: '',
              error: `Unable to fetch senders from Kudosity API (${numbersResponse.status})`
            })
          } else {
            // Subsequent page failed, return what we have
            console.log(`Failed to fetch page ${page}, returning ${allSenders.length} senders collected so far`)
            hasMore = false
          }
        }
      }
      
      console.log(`Total senders retrieved: ${allSenders.length}`)
      
      // Only return what we got from the API
      const defaultSender = allSenders.length > 0 ? allSenders[0].id : ''
      
      return NextResponse.json({
        senders: allSenders,
        defaultSender,
        total: allSenders.length
      })
    } catch (apiError) {
      console.error('Failed to fetch from Kudosity API:', apiError)
      
      // If API call fails, return empty array
      // The UI will show a manual input field
      return NextResponse.json({
        senders: [],
        defaultSender: '',
        error: 'Could not connect to Kudosity API'
      })
    }

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
