import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

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

    const segmentId = parseInt(id, 10);

    const { data, count, error } = await supabase
      .from('segment_members')
      .select(
        `
        id,
        user_id,
        joined_at,
        metadata,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `,
        { count: 'exact' }
      )
      .eq('segment_id', segmentId)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    })
  } catch (error) {
    console.error('GET /api/analytics/segments/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const segmentId = parseInt(id, 10)
    const body = await request.json()
    const { user_id, metadata } = body

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing user_id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('segment_members')
      .insert({
        segment_id: segmentId,
        user_id,
        metadata
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('POST /api/analytics/segments/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const segmentId = parseInt(id, 10)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing user_id' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('segment_members')
      .delete()
      .eq('segment_id', segmentId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/analytics/segments/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
