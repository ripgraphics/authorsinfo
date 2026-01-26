import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import {
  getPendingTaggings,
  approveTagging,
  rejectTagging,
} from '@/lib/tags/tag-approval-service'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

/**
 * GET /api/tags/approvals
 * Get pending taggings for an entity
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    const pending = await getPendingTaggings(entityType, entityId)

    return NextResponse.json({ pending })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch pending taggings')
  }
}

const approvalSchema = z.object({
  taggingId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

/**
 * POST /api/tags/approvals
 * Approve or reject a pending tagging
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

    const json = await request.json()
    const validation = approvalSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { taggingId, action, reason } = validation.data

    let success = false
    if (action === 'approve') {
      success = await approveTagging(taggingId, user.id)
    } else {
      success = await rejectTagging(taggingId, user.id, reason)
    }

    if (!success) {
      return NextResponse.json({ error: `Failed to ${action} tagging` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Tagging ${action}d successfully`,
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to process approval')
  }
}
