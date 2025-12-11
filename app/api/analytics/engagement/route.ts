import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = await createRouteHandlerClientAsync()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json(
        { error: 'Failed to authenticate user' },
        { status: 500 }
      )
    }
    
    if (!session?.user) {
      console.error('No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = session.user

    const { action, entity_id, entity_type, timestamp } = await request.json()

    // Validate required fields
    if (!action || !entity_id || !entity_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert engagement tracking record
    const { error: insertError } = await supabase
      .from('engagement_analytics')
      .insert({
        user_id: user.id,
        action,
        entity_id,
        entity_type,
        timestamp: timestamp || new Date().toISOString(),
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          session_id: request.headers.get('x-session-id')
        }
      })

    if (insertError) {
      console.error('Error inserting engagement analytics:', insertError)
      return NextResponse.json(
        { error: 'Failed to track engagement' },
        { status: 500 }
      )
    }

    // Update entity engagement count (using RPC or fetch current value first)
    // Note: This requires a database function or we fetch, increment, and update
    // For now, we'll skip this update to avoid complexity
    // TODO: Implement proper engagement count increment using RPC function

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in engagement analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = await createRouteHandlerClientAsync()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json(
        { error: 'Failed to authenticate user' },
        { status: 500 }
      )
    }
    
    if (!session?.user) {
      console.error('No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = session.user

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entity_id')
    const entityType = searchParams.get('entity_type')
    const action = searchParams.get('action')

    let query = supabase
      .from('engagement_analytics')
      .select('*')

    if (entityId) query = query.eq('entity_id', entityId)
    if (entityType) query = query.eq('entity_type', entityType)
    if (action) query = query.eq('action', action)

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching engagement analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in engagement analytics GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 