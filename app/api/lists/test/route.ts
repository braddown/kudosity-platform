import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log('Test endpoint called')
  return NextResponse.json({ 
    message: 'Lists API is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('Test POST endpoint called')
  try {
    const body = await request.json()
    console.log('Received body:', body)
    return NextResponse.json({ 
      message: 'POST received',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in test POST:', error)
    return NextResponse.json({ 
      error: 'Failed to parse body',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}
