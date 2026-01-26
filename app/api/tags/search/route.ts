import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { searchTags, searchUsersForMentions, searchEntitiesForMentions } from '@/lib/tags/tag-service'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  types: z
    .array(z.enum(['user', 'entity', 'topic', 'collaborator', 'location', 'taxonomy']))
    .optional(),
  entityTypes: z.array(z.enum(['author', 'book', 'group', 'event'])).optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
})

/**
 * GET /api/tags/search
 * Search tags across all types with unified autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const typesParam = searchParams.get('types')
    const entityTypesParam = searchParams.get('entityTypes')
    const limitParam = searchParams.get('limit')

    const validation = searchSchema.safeParse({
      q: query,
      types: typesParam ? typesParam.split(',') : undefined,
      entityTypes: entityTypesParam ? entityTypesParam.split(',') : undefined,
      limit: limitParam ? parseInt(limitParam, 10) : 20,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { q, types, entityTypes, limit } = validation.data

    // If searching for users specifically, use user search
    if (types?.includes('user') || (!types && q.startsWith('@'))) {
      const cleanQuery = q.replace(/^@/, '')
      const userResults = await searchUsersForMentions(cleanQuery, limit)
      return NextResponse.json({ results: userResults, type: 'users' })
    }

    // If searching for entities specifically
    if (types?.includes('entity') || entityTypes) {
      const cleanQuery = q.replace(/^@/, '')
      const entityResults = await searchEntitiesForMentions(cleanQuery, entityTypes, limit)
      return NextResponse.json({ results: entityResults, type: 'entities' })
    }

    // General tag search (includes topics, hashtags, etc.)
    const tagResults = await searchTags(q, types, limit)

    return NextResponse.json({
      results: tagResults,
      type: 'tags',
    })
  } catch (error) {
    console.error('Error in tag search:', error)
    return NextResponse.json(
      { error: 'Failed to search tags', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
