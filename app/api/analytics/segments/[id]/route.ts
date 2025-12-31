import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const segmentId = parseInt(params.id, 10)

    const { data, error } = await supabase
      .from('user_segments')
      .select(`
        id,
        name,
        description,
        segment_type,
        status,
        member_count,
        criteria,
        created_by,
        created_at,
        updated_at,
        segment_members (
          id,
          user_id,
          joined_at,
          metadata
        )
      `)
      .eq('id', segmentId)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Segment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/analytics/segments/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch segment' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin' && userData?.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const segmentId = parseInt(params.id, 10)
    const body = await request.json()
    const { name, description, criteria, status } = body

    const { data, error } = await supabase
      .from('user_segments')
      .update({
        name,
        description,
        criteria,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', segmentId)
      .select()
      .single()

    if (error) throw error

    // Log criteria change
    if (body.criteria && previousData?.criteria !== body.criteria) {
      await supabase
        .from('segment_events')
        .insert([
          {
            segment_id: segmentId,
            user_id: user.id,
            event_type: 'criteria_update',
            previous_state: { criteria: previousData?.criteria },
            new_state: { criteria: body.criteria },
          },
        ])
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PATCH /api/analytics/segments/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update segment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin' && userData?.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const segmentId = parseInt(params.id, 10)

    const { error } = await supabase
      .from('user_segments')
      .delete()
      .eq('id', segmentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/analytics/segments/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete segment' },
      { status: 500 }
    )
  }
}
