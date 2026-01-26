import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

const mergeSchema = z.object({
  sourceTagId: z.string().uuid(),
  targetTagId: z.string().uuid(),
})

/**
 * POST /api/tags/merge
 * Merge two tags (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    // TODO: Check if user is admin
    // const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    // if (profile?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    const json = await request.json()
    const validation = mergeSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { sourceTagId, targetTagId } = validation.data

    if (sourceTagId === targetTagId) {
      return NextResponse.json({ error: 'Cannot merge tag with itself' }, { status: 400 })
    }

    // Call merge function
    const { error: mergeError } = await (supabase.rpc as any)('merge_tags', {
      p_source_tag_id: sourceTagId,
      p_target_tag_id: targetTagId,
      p_actor_id: user.id,
    })

    if (mergeError) {
      return NextResponse.json(
        { error: 'Failed to merge tags', message: mergeError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tags merged successfully',
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to merge tags')
  }
}
