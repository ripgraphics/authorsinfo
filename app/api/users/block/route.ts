import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const blockedUserId: string | undefined = body?.user_id
    if (!blockedUserId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Idempotent block using unique (user_id, blocked_user_id)
    const { data: existing } = await supabase
      .from('blocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('blocked_user_id', blockedUserId)
      .maybeSingle()

    if (!existing) {
      const { error: insertError } = await supabase
        .from('blocks')
        .insert({ user_id: user.id, blocked_user_id: blockedUserId })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const blockedUserId: string | undefined = body?.user_id
    if (!blockedUserId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .eq('user_id', user.id)
      .eq('blocked_user_id', blockedUserId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}


