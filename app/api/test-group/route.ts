import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')
    
    if (!groupId) {
      return NextResponse.json({ 
        error: 'Missing group ID parameter' 
      }, { status: 400 })
    }
    
    console.log("Testing group with ID:", groupId)
    
    // Test fetching specific group
    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()
    
    if (error) {
      console.error("Error fetching group:", error)
      return NextResponse.json({ 
        error: 'Failed to fetch group', 
        details: error.message,
        code: error.code,
        groupId
      }, { status: 500 })
    }

    console.log("Group found:", group ? "Yes" : "No")
    
    return NextResponse.json({ 
      success: true, 
      message: group ? 'Group found' : 'Group not found',
      group: group || null,
      groupId
    })

  } catch (error: any) {
    console.error('Group test error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error testing group',
      details: error.message 
    }, { status: 500 })
  }
} 