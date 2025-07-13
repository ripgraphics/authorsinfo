import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log("Testing groups table...")
    
    // Test basic connection
    const { data: groups, error } = await supabaseAdmin
      .from('groups')
      .select('id, name, created_at')
      .limit(5)
    
    if (error) {
      console.error("Error fetching groups:", error)
      return NextResponse.json({ 
        error: 'Failed to fetch groups', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    console.log("Groups found:", groups?.length || 0)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Groups table accessible',
      groupCount: groups?.length || 0,
      groups: groups || [],
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    })

  } catch (error: any) {
    console.error('Groups test error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error testing groups',
      details: error.message 
    }, { status: 500 })
  }
} 