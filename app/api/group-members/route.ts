import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get('group_id')
    const userId = searchParams.get('user_id')

    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()

    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch group member data' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in group-members route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

