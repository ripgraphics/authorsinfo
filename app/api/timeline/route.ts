import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { checkColumnExists } from '@/lib/schema/schema-validators'

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

    // Resolve permalink to UUID when necessary
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(entityId)) {
      const table = entityType === 'user' ? 'users' : `${entityType}s`
      const { data: entityRow } = await (supabase
        .from(table) as any)
        .select('id, permalink')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .maybeSingle()
      if (entityRow?.id) {
        entityId = entityRow.id
      }
    }

    // Check if publish_status column exists before filtering
    const hasPublishStatus = await checkColumnExists('activities', 'publish_status')

    // Build query - conditionally apply publish_status filter
    let query = (supabase
      .from('activities') as any)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
    
    // Only filter by publish_status if the column exists
    if (hasPublishStatus) {
      query = query.or('publish_status.eq.published,publish_status.is.null')
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Attach the current user's reaction for each activity (if authenticated)
    let userReactionByActivity: Record<string, string | null> = {}
    try {
      const { data: auth } = await supabase.auth.getUser()
      const currentUserId = auth?.user?.id
      if (currentUserId && Array.isArray(data) && data.length > 0) {
        const activityIds = data.map((row: any) => row.id)
        // Use likes table for all entity types (activity_likes doesn't exist)
        const { data: reactions } = await (supabase
          .from('likes') as any)
          .select('entity_id')
          .eq('entity_type', 'activity')
          .eq('user_id', currentUserId)
          .in('entity_id', activityIds)
        if (Array.isArray(reactions)) {
          userReactionByActivity = reactions.reduce((acc: Record<string, string>, r: any) => {
            acc[r.entity_id] = 'like' // Always 'like' since table doesn't support reaction types
            return acc
          }, {})
        }
      }
    } catch (_) {
      // Non-fatal; omit user reaction if lookup fails
    }

    // Resolve author names from users table and avatars from images table via profiles.avatar_image_id
    let userIdToName: Record<string, string> = {}
    let userIdToAvatar: Record<string, string | null> = {}
    try {
      const allUserIds = Array.from(new Set((data || []).map((row: any) => row.user_id).filter(Boolean)))
      if (allUserIds.length > 0) {
        // Fetch user names
        const { data: users } = await (supabase
          .from('users') as any)
          .select('id, name')
          .in('id', allUserIds)
        if (Array.isArray(users)) {
          userIdToName = users.reduce((acc: Record<string, string>, u: any) => {
            if (u?.id && u?.name) acc[u.id] = u.name
            return acc
          }, {})
        }
        
        // Fetch user avatars from images table via profiles.avatar_image_id
        const { data: profiles } = await (supabase
          .from('profiles') as any)
          .select('user_id, avatar_image_id')
          .in('user_id', allUserIds)
          .not('avatar_image_id', 'is', null)
        
        if (profiles && profiles.length > 0) {
          // Get unique image IDs
          const imageIds = Array.from(new Set(profiles.map((p: any) => p.avatar_image_id).filter(Boolean)))
          
          if (imageIds.length > 0) {
            // Fetch image URLs from images table
            const { data: images } = await (supabase
              .from('images') as any)
              .select('id, url')
              .in('id', imageIds)
            
            if (images && images.length > 0) {
              // Create map of image_id to url
              const imageIdToUrl = new Map(images.map((img: any) => [img.id, img.url]))
              
              // Map user_id to avatar_url
              profiles.forEach((profile: any) => {
                if (profile.avatar_image_id && imageIdToUrl.has(profile.avatar_image_id)) {
                  const avatarUrl = imageIdToUrl.get(profile.avatar_image_id)
                  userIdToAvatar[profile.user_id] = (typeof avatarUrl === 'string' ? avatarUrl : null)
                }
              })
            }
          }
        }
      }
    } catch (_) {
      // Non-fatal; best-effort enrichment only
    }

    // Project only fields used by the UI to minimize payload
    const activities = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: userIdToName[row.user_id] || null,
      user_avatar_url: userIdToAvatar[row.user_id] ?? row.user_avatar_url ?? null, // Prefer avatar from images table via profiles.avatar_image_id
      activity_type: row.activity_type,
      data: row.data,
      created_at: row.created_at,
      is_public: row.is_public ?? null,
      like_count: row.like_count ?? 0,
      comment_count: row.comment_count ?? 0,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      content_type: row.content_type,
      image_url: row.image_url,
      text: row.text,
      visibility: row.visibility,
      content_summary: row.content_summary,
      link_url: row.link_url,
      hashtags: row.hashtags,
      share_count: row.share_count ?? 0,
      view_count: row.view_count ?? 0,
      engagement_score: row.engagement_score ?? 0,
      metadata: row.metadata ?? {},
      user_reaction_type: userReactionByActivity[row.id] || null,
      is_liked: !!userReactionByActivity[row.id]
    }))

    return NextResponse.json({ activities, pagination: { limit, offset, count: activities.length } })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


