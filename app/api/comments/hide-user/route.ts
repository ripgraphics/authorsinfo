import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

// Hide or unhide all comments authored by a specific user (per viewer)
// Records an entry in activity_log: action='hide_user_comments', target_type='user', target_id=<blocked user id>

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const targetUserId: string | undefined = body?.user_id
    if (!targetUserId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('activity_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('action', 'hide_user_comments')
      .eq('target_type', 'user')
      .eq('target_id', targetUserId)
      .maybeSingle()

    if (!existing) {
      const { error: insertError } = await (supabase.from('activity_log') as any).insert({
        user_id: user.id,
        action: 'hide_user_comments',
        target_type: 'user',
        target_id: targetUserId,
      })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const targetUserId: string | undefined = body?.user_id
    if (!targetUserId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('activity_log')
      .delete()
      .eq('user_id', user.id)
      .eq('action', 'hide_user_comments')
      .eq('target_type', 'user')
      .eq('target_id', targetUserId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

