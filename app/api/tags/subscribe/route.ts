import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { subscribeToTag, unsubscribeFromTag, getUserTagSubscriptions } from '@/lib/tags/tag-subscriptions'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

const subscribeSchema = z.object({
  tagId: z.string().uuid(),
  notificationPreferences: z
    .object({
      mentions: z.boolean().optional(),
      trending: z.boolean().optional(),
    })
    .optional(),
})

/**
 * POST /api/tags/subscribe
 * Subscribe to a tag
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
    const validation = subscribeSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { tagId, notificationPreferences } = validation.data

    const success = await subscribeToTag(user.id, tagId, notificationPreferences)

    if (!success) {
      return NextResponse.json({ error: 'Failed to subscribe to tag' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscribed to tag successfully',
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to subscribe to tag')
  }
}

/**
 * DELETE /api/tags/subscribe
 * Unsubscribe from a tag
 */
export async function DELETE(request: NextRequest) {
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
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    const success = await unsubscribeFromTag(user.id, tagId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to unsubscribe from tag' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed from tag successfully',
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to unsubscribe from tag')
  }
}

/**
 * GET /api/tags/subscribe
 * Get user's tag subscriptions
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

    const subscriptions = await getUserTagSubscriptions(user.id)

    return NextResponse.json({ subscriptions })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch subscriptions')
  }
}
