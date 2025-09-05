import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
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

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const max = parseInt(searchParams.get('max') || '20')
    const country = searchParams.get('country') // Optional country filter

    // Build query parameters
    const params = new URLSearchParams({
      filter: 'available',
      page: page.toString(),
      max: max.toString()
    })
    
    if (country) {
      params.append('country', country)
    }

    // Call Kudosity API
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    const apiUrl = `https://api.transmitsms.com/get-numbers.json?${params.toString()}`
    
    logger.debug('Fetching available numbers from Kudosity:', apiUrl)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Kudosity API error:', response.status, errorText)
      return NextResponse.json({ 
        error: 'Failed to fetch available numbers from Kudosity',
        details: `HTTP ${response.status}: ${errorText}`
      }, { status: 500 })
    }

    const data = await response.json()
    logger.debug('Kudosity available numbers response:', { 
      hasNumbers: !!data.numbers, 
      count: data.numbers?.length || 0,
      numbers_total: data.numbers_total,
      page: data.page
    })

    // Check for API errors in response
    if (data.error && data.error.code !== 'SUCCESS') {
      return NextResponse.json({ 
        error: 'Kudosity API error',
        details: data.error.description || 'Unknown error from Kudosity'
      }, { status: 400 })
    }

    // Format the response
    const availableNumbers = (data.numbers || []).map((num: any) => ({
      number: num.number.toString(),
      price: num.price || 0,
      country: num.country || null,
      capabilities: num.capabilities || ['SMS'],
      status: num.status || 'available'
    }))

    return NextResponse.json({ 
      success: true,
      numbers: availableNumbers,
      pagination: {
        current_page: data.page?.number || page,
        total_pages: data.page?.count || 1,
        total_numbers: data.numbers_total || 0,
        per_page: max
      }
    })
    
  } catch (error) {
    logger.error('Error fetching available numbers:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch available numbers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
