import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { getTagFeed } from '@/lib/tags/tag-subscriptions'
import { unauthorizedError, nextErrorResponse } from '@/lib/error-handler'

/**
 * GET /api/tags/feed
 * Get tag-based feed for authenticated user
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
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const feed = await getTagFeed(user.id, limit, offset)

    return NextResponse.json({ feed })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch tag feed')
  }
}
