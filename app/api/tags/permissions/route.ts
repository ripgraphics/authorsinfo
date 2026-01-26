import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import {
  checkTagPermission,
  grantTagPermission,
  getTagPermissions,
} from '@/lib/tags/tag-permissions'
import { z } from 'zod'
import { unauthorizedError, handleValidationError, nextErrorResponse } from '@/lib/error-handler'

const grantPermissionSchema = z.object({
  tagId: z.string().uuid(),
  userId: z.string().uuid(),
  permissionLevel: z.enum(['viewer', 'curator', 'moderator', 'admin']),
})

/**
 * POST /api/tags/permissions
 * Grant permission to a user for a tag
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
    const validation = grantPermissionSchema.safeParse(json)

    if (!validation.success) {
      return NextResponse.json(handleValidationError(validation.error.flatten()), { status: 400 })
    }

    const { tagId, userId, permissionLevel } = validation.data

    const success = await grantTagPermission(tagId, userId, permissionLevel, user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to grant permission or insufficient privileges' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Permission granted successfully',
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to grant permission')
  }
}

/**
 * GET /api/tags/permissions
 * Get permissions for a tag
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

    const permissions = await getTagPermissions(tagId)

    return NextResponse.json({ permissions })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch permissions')
  }
}
