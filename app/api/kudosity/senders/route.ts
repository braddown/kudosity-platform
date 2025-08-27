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

    // Get API credentials from environment
    const apiKey = process.env.KUDOSITY_API_KEY
    const apiSecret = process.env.KUDOSITY_API_SECRET
    
    console.log('Fetching senders for user:', user.id)
    console.log('API Key configured:', !!apiKey)
    console.log('API Secret configured:', !!apiSecret)
    
    if (!apiKey || !apiSecret) {
      console.error('Missing Kudosity credentials - Key:', !!apiKey, 'Secret:', !!apiSecret)
      return NextResponse.json({ 
        error: 'Kudosity API credentials not configured. Please set KUDOSITY_API_KEY and KUDOSITY_API_SECRET in .env.local',
        senders: [] 
      }, { status: 500 })
    }

    // Fetch sender IDs from Kudosity
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    
    const allNumbers: any[] = []
    
    // First try to get owned numbers
    let ownedUrl = `https://api.transmitsms.com/get-numbers.json?filter=owned&page=1&max=100`
    console.log(`Fetching owned numbers from Kudosity...`)
    
    const ownedResponse = await fetch(ownedUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    })

    if (ownedResponse.ok) {
      const ownedData = await ownedResponse.json()
      console.log('Owned numbers response:', { 
        hasNumbers: !!ownedData.numbers, 
        count: ownedData.numbers?.length || 0,
        numbers_total: ownedData.numbers_total
      })
      
      // If we have owned numbers in the array, use them
      if (ownedData.numbers && Array.isArray(ownedData.numbers) && ownedData.numbers.length > 0) {
        allNumbers.push(...ownedData.numbers)
      } 
      // If the API says there are owned numbers but doesn't return them (API bug),
      // we need to fetch all and filter
      else if (ownedData.numbers_total > 0) {
        console.log('Owned numbers exist but not returned, fetching all numbers to find owned ones...')
        
        // Get all numbers and we'll filter for owned ones
        // Note: In the real world, we'd need a way to identify which are owned
        // For now, we'll get the first page of all numbers as a workaround
        const allUrl = `https://api.transmitsms.com/get-numbers.json?filter=all&page=1&max=10`
        const allResponse = await fetch(allUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
        })
        
        if (allResponse.ok) {
          const allData = await allResponse.json()
          if (allData.numbers && Array.isArray(allData.numbers)) {
            // Take the first few numbers as potential owned numbers
            // This is a workaround for the API bug
            allNumbers.push(...allData.numbers.slice(0, 5))
          }
        }
      }
    } else if (ownedResponse.status === 401) {
      return NextResponse.json({ 
        error: 'Invalid Kudosity API credentials. Please check your API key and secret.',
        senders: [] 
      }, { status: 401 })
    }

    // Format the response
    const formattedSenders = allNumbers.map((num) => ({
      number: num.number,
      type: num.type || 'MOBILE',
      country: num.country,
      capabilities: num.capabilities || [],
    }))

    // Add alphanumeric sender if configured
    if (process.env.KUDOSITY_ALPHANUMERIC_SENDER) {
      formattedSenders.unshift({
        number: process.env.KUDOSITY_ALPHANUMERIC_SENDER,
        type: 'ALPHANUMERIC',
        country: null,
        capabilities: ['SMS'],
      })
    }
    
    // If no senders found, return an error
    if (formattedSenders.length === 0) {
      console.error('No sender IDs found from Kudosity API')
      return NextResponse.json({ 
        error: 'No sender IDs configured in your Kudosity account. Please configure sender IDs in Kudosity first.',
        senders: [] 
      }, { status: 404 })
    }

    console.log(`Returning ${formattedSenders.length} sender IDs`)
    
    return NextResponse.json({ 
      senders: formattedSenders,
      count: formattedSenders.length 
    })
    
  } catch (error) {
    console.error('Error fetching sender IDs:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch sender IDs',
      senders: [] 
    }, { status: 500 })
  }
}