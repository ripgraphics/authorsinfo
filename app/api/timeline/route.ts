import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkColumnExists } from '@/lib/schema/schema-validators'
import { ENGAGEMENT_ENTITY_TYPE_POST } from '@/lib/engagement/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = (searchParams.get('entityType') || '').trim()
    let entityId = (searchParams.get('entityId') || '').trim()
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '20', 10), 100))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const isAuthenticated = !!user
    const readClient = isAuthenticated ? supabase : supabaseAdmin

    // Resolve permalink to UUID when necessary
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(entityId)) {
      const table = entityType === 'user' ? 'users' : `${entityType}s`
      const { data: entityRow } = await (readClient.from(table) as any)
        .select('id, permalink')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .maybeSingle()
      if (entityRow?.id) {
        entityId = entityRow.id
      }
    }

    // Check if publish_status column exists before filtering
    const hasPublishStatus = await checkColumnExists('posts', 'publish_status')

    // Build query - conditionally apply publish_status filter
    let query = (readClient.from('posts') as any)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    // Only filter by publish_status if the column exists
    if (hasPublishStatus) {
      query = query.or('publish_status.eq.published,publish_status.is.null')
    }

    // Enforce public visibility for unauthenticated requests
    const hasVisibility = await checkColumnExists('posts', 'visibility')
    if (!isAuthenticated && hasVisibility) {
      query = query.eq('visibility', 'public')
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Attach the current user's reaction for each post (if authenticated)
    // Timeline posts use engagement entity type from config (activity = post)
    let userReactionByActivity: Record<string, string | null> = {}
    try {
      const currentUserId = user?.id
      if (currentUserId && Array.isArray(data) && data.length > 0) {
        const postIds = data.map((row: any) => row.id)
        const { data: reactions } = await (supabase.from('likes') as any)
          .select('entity_id, like_type')
          .eq('entity_type', ENGAGEMENT_ENTITY_TYPE_POST)
          .eq('user_id', currentUserId)
          .in('entity_id', postIds)
        if (Array.isArray(reactions)) {
          userReactionByActivity = reactions.reduce(
            (acc: Record<string, string | null>, r: { entity_id: string; like_type?: string | null }) => {
              acc[r.entity_id] = r.like_type ?? 'like'
              return acc
            },
            {}
          )
        }
      }
    } catch (_) {
      // Non-fatal; omit user reaction if lookup fails
    }

    // Resolve author names from users table and avatars from images table
    let userIdToName: Record<string, string> = {}
    const userIdToAvatar: Record<string, string | null> = {}
    try {
      const allUserIds = Array.from(
        new Set((data || []).map((row: any) => row.user_id).filter(Boolean))
      )
      if (allUserIds.length > 0) {
        // Fetch user names (use readClient so unauthenticated requests get poster data via admin)
        const { data: users } = await (readClient.from('users') as any)
          .select('id, name')
          .in('id', allUserIds)
        if (Array.isArray(users)) {
          userIdToName = users.reduce((acc: Record<string, string>, u: any) => {
            if (u?.id && u?.name) acc[u.id] = u.name
            return acc
          }, {})
        }

        // Fetch user avatars from images table
        const { data: profiles } = await (readClient.from('profiles') as any)
          .select('user_id, avatar_image_id')
          .in('user_id', allUserIds)
          .not('avatar_image_id', 'is', null)

        if (profiles && profiles.length > 0) {
          const imageIds = Array.from(
            new Set(profiles.map((p: any) => p.avatar_image_id).filter(Boolean))
          )

          if (imageIds.length > 0) {
            const { data: images } = await (readClient.from('images') as any)
              .select('id, url')
              .in('id', imageIds)

            if (images && images.length > 0) {
              const imageIdToUrl = new Map(images.map((img: any) => [img.id, img.url]))
              profiles.forEach((profile: any) => {
                if (profile.avatar_image_id && imageIdToUrl.has(profile.avatar_image_id)) {
                  const avatarUrl = imageIdToUrl.get(profile.avatar_image_id)
                  userIdToAvatar[profile.user_id] = typeof avatarUrl === 'string' ? avatarUrl : null
                }
              })
            }
          }
        }
      }
    } catch (_) {
      // Non-fatal enrichment
    }

    // Fetch dynamic counts for all posts in a single batch RPC call
    let countsMap: Record<string, { likes_count: number; comments_count: number }> = {}
    if (Array.isArray(data) && data.length > 0) {
      try {
        const postIds = data.map((row: any) => row.id)
        const postTypes = data.map((row: any) => row.entity_type === 'book' ? 'book' : 'post')
        
        const { data: batchCounts, error: batchError } = await (readClient.rpc as any)('get_multiple_entities_engagement', {
          p_entity_ids: postIds,
          p_entity_types: postTypes
        })
        
        if (!batchError && Array.isArray(batchCounts)) {
          countsMap = batchCounts.reduce((acc: any, item: any) => {
            acc[item.entity_id] = {
              likes_count: Number(item.likes_count || 0),
              comments_count: Number(item.comments_count || 0)
            }
            return acc
          }, {})
        }
      } catch (e) {
        console.error('Error fetching batch engagement counts:', e)
      }
    }

    // Project only fields used by the UI
    const activities = (data || []).map((row: any) => {
      const engagement = countsMap[row.id] || { likes_count: 0, comments_count: 0 }
      
      return {
        id: row.id,
        user_id: row.user_id,
        user_name: userIdToName[row.user_id] || null,
        user_avatar_url: userIdToAvatar[row.user_id] ?? row.user_avatar_url ?? null,
        activity_type: 'post_created', // Uniform activity type for posts
        data: row.metadata, // Carry over metadata
        created_at: row.created_at,
        is_public: row.visibility === 'public',
        like_count: engagement.likes_count,
        comment_count: engagement.comments_count,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        content_type: row.content_type,
        image_url: row.image_url,
        text: row.content, // Map content back to text for UI compatibility
        visibility: row.visibility,
        content_summary: row.content_summary,
        link_url: row.link_url,
        hashtags: row.hashtags,
        share_count: row.share_count ?? 0,
        view_count: row.view_count ?? 0,
        engagement_score: row.engagement_score ?? 0,
        metadata: row.metadata ?? {},
        user_reaction_type: userReactionByActivity[row.id] || null,
        is_liked: !!userReactionByActivity[row.id],
      }
    })

    return NextResponse.json({
      activities,
      pagination: { limit, offset, count: activities.length },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

