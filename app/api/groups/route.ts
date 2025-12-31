import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { createGroupSchema } from '@/lib/validations/group'
import { logger } from '@/lib/logger'
import {
  handleDatabaseError,
  handleValidationError,
  nextErrorResponse,
  badRequestError,
  unauthorizedError,
} from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    const json = await request.json()

    // Validate input with Zod
    const validationResult = createGroupSchema.safeParse(json)

    if (!validationResult.success) {
      return NextResponse.json(handleValidationError(validationResult.error.flatten()), {
        status: 400,
      })
    }

    const { name, description, is_private, cover_image_url } = validationResult.data

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        is_private,
        cover_image_url,
        created_by: user.id,
        member_count: 1, // Creator is first member
      } as any)
      .select()
      .single()

    if (groupError) {
      const { message, statusCode } = handleDatabaseError(groupError, 'Failed to create group')
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    if (!group) {
      return NextResponse.json(badRequestError('Failed to create group'), { status: 500 })
    }

    // Add creator as admin member
    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: (group as any).id,
      user_id: user.id,
      role: 'admin',
      status: 'active',
    } as any)

    if (memberError) {
      logger.error({ err: memberError }, 'Failed to add creator to group')
      // Note: Group was created but member addition failed.
      // In a real enterprise app, we'd use a transaction here.
    }

    return NextResponse.json(group)
  } catch (error) {
    return nextErrorResponse(error, 'Failed to create group')
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const is_private = searchParams.get('is_private') === 'true'
    const created_by = searchParams.get('created_by')
    const search = searchParams.get('search')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    // Build query
    let query = supabase.from('groups').select(`
        id,
        name,
        description,
        member_count,
        created_at,
        is_private,
        created_by,
        cover_image_url
      `)

    // Apply filters
    if (is_private !== undefined) {
      query = query.eq('is_private', is_private)
    }

    if (created_by) {
      query = query.eq('created_by', created_by)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    const ascending = sort_order === 'asc'
    query = query.order(sort_by, { ascending })

    // Apply limit
    query = query.limit(limit)

    const { data: groups, error } = await query

    if (error) {
      const { message, statusCode } = handleDatabaseError(error, 'Failed to fetch groups')
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    return NextResponse.json({ groups: groups || [] })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch groups')
  }
}
