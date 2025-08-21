import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  console.log('=== TEST DB CONNECTION ===')
  
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('URL:', supabaseUrl)
    console.log('Key exists:', !!supabaseKey)
    console.log('Key length:', supabaseKey?.length)
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        url: !!supabaseUrl,
        key: !!supabaseKey
      }, { status: 500 })
    }
    
    // Clean the key
    const cleanKey = supabaseKey.replace(/\s+/g, '')
    console.log('Clean key length:', cleanKey.length)
    
    // Create client
    const supabase = createClient(supabaseUrl, cleanKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test query
    console.log('Testing database query...')
    const { data, error } = await supabase
      .from('lists')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ 
        error: 'Query failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.log('Query successful, data:', data)
    
    return NextResponse.json({ 
      success: true,
      message: 'Database connection working',
      data: data
    })
    
  } catch (error: any) {
    console.error('Test DB error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
