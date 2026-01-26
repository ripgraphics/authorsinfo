import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { setLocalizedTagName, getLocalizedTagName } from '@/lib/tags/tag-i18n'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

const localizeSchema = z.object({
  tagId: z.string().uuid(),
  locale: z.string().min(2).max(5),
  name: z.string().min(1).max(100),
})

/**
 * POST /api/tags/localize
 * Set localized name for a tag
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
    const validation = localizeSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { tagId, locale, name } = validation.data

    const success = await setLocalizedTagName(tagId, locale, name)

    if (!success) {
      return NextResponse.json({ error: 'Failed to set localized name' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Localized name set successfully',
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to set localized name')
  }
}

/**
 * GET /api/tags/localize
 * Get localized name for a tag
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const searchParams = request.nextUrl.searchParams
    const tagId = searchParams.get('tagId')
    const locale = searchParams.get('locale') || 'en'

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    const localizedName = await getLocalizedTagName(tagId, locale)

    if (!localizedName) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({
      tagId,
      locale,
      name: localizedName,
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to get localized name')
  }
}
