import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { getTagLifecycleData } from '@/lib/tags/tag-analytics'
import { unauthorizedError, nextErrorResponse } from '@/lib/error-handler'

/**
 * GET /api/tags/analytics/lifecycle
 * Get lifecycle analytics for a tag
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    const lifecycle = await getTagLifecycleData(tagId)

    if (!lifecycle) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ lifecycle })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch lifecycle data')
  }
}
