import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { handleDatabaseError, nextErrorResponse, badRequestError, unauthorizedError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    const body = await request.json()
    const blockedUserId: string | undefined = body?.user_id
    if (!blockedUserId) {
      return NextResponse.json(badRequestError('user_id is required'), { status: 400 })
    }

    // Idempotent block using unique (user_id, blocked_user_id)
    const { data: existing } = await (supabase.from('blocks') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('blocked_user_id', blockedUserId)
      .maybeSingle()

    if (!existing) {
      const { error: insertError } = await (supabase.from('blocks') as any).insert({
        user_id: user.id,
        blocked_user_id: blockedUserId,
      })

      if (insertError) {
        const { message, statusCode } = handleDatabaseError(insertError, 'Failed to block user')
        return NextResponse.json({ error: message }, { status: statusCode })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to block user')
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
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    const body = await request.json()
    const blockedUserId: string | undefined = body?.user_id
    if (!blockedUserId) {
      return NextResponse.json(badRequestError('user_id is required'), { status: 400 })
    }

    const { error: deleteError } = await (supabase.from('blocks') as any)
      .delete()
      .eq('user_id', user.id)
      .eq('blocked_user_id', blockedUserId)

    if (deleteError) {
      const { message, statusCode } = handleDatabaseError(deleteError, 'Failed to unblock user')
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to unblock user')
  }
}
