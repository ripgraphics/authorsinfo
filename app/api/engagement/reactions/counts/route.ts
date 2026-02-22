import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { getEntityTypeId } from '@/lib/entity-types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entity_id')
    const entityType = searchParams.get('entity_type')

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'Missing required parameters: entity_id, entity_type' },
        { status: 400 }
      )
    }

    const normalizedEntityType = entityType.toLowerCase()
    const shouldAggregatePostThread = normalizedEntityType === 'activity' || normalizedEntityType === 'post'

    let reactionData: Array<{ like_type: string; user_id?: string; created_at?: string }> = []

    if (shouldAggregatePostThread) {
      const entityTypeVariants = new Set<string>([entityType])
      entityTypeVariants.add(normalizedEntityType)
      entityTypeVariants.add(normalizedEntityType === 'activity' ? 'post' : 'activity')

      const [entityTypeId, aliasEntityTypeId] = await Promise.all([
        getEntityTypeId(normalizedEntityType),
        getEntityTypeId(normalizedEntityType === 'activity' ? 'post' : 'activity'),
      ])

      if (entityTypeId) entityTypeVariants.add(entityTypeId)
      if (aliasEntityTypeId) entityTypeVariants.add(aliasEntityTypeId)

      const typeValues = Array.from(entityTypeVariants)

      const { data: postLikeRows, error: postLikesError } = await supabaseAdmin
        .from('likes')
        .select('like_type, user_id, created_at')
        .in('entity_type', typeValues)
        .eq('entity_id', entityId)

      if (postLikesError) {
        console.error('Error fetching post reaction counts:', postLikesError)
        return NextResponse.json({ error: 'Failed to fetch reaction counts' }, { status: 500 })
      }

      const { data: threadComments, error: commentsError } = await supabaseAdmin
        .from('comments')
        .select('id')
        .in('entity_type', typeValues)
        .eq('entity_id', entityId)
        .eq('is_hidden', false)
        .eq('is_deleted', false)

      if (commentsError) {
        console.error('Error fetching thread comments for reaction aggregation:', commentsError)
        return NextResponse.json({ error: 'Failed to fetch reaction counts' }, { status: 500 })
      }

      const commentIds = (threadComments || []).map((comment: { id: string }) => comment.id)

      let commentLikeRows: Array<{ like_type: string; user_id?: string; created_at?: string }> = []
      if (commentIds.length > 0) {
        const { data: commentLikes, error: commentLikesError } = await supabaseAdmin
          .from('likes')
          .select('like_type, user_id, created_at')
          .eq('entity_type', 'comment')
          .in('entity_id', commentIds)

        if (commentLikesError) {
          console.error('Error fetching comment/reply reaction counts:', commentLikesError)
          return NextResponse.json({ error: 'Failed to fetch reaction counts' }, { status: 500 })
        }

        commentLikeRows = commentLikes || []
      }

      reactionData = [...(postLikeRows || []), ...commentLikeRows]
    } else {
      const { data, error } = await supabaseAdmin
        .from('likes')
        .select('like_type, user_id, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) {
        console.error('Error fetching reaction counts:', error)
        return NextResponse.json({ error: 'Failed to fetch reaction counts' }, { status: 500 })
      }

      reactionData = data || []
    }

    // Count reactions by type
    const allReactionTypes = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry']
    const counts: Record<string, number> = {}
    const usersByTypeRaw: Record<string, Array<{ user_id: string; created_at: string }>> = {}
    
    // Initialize all types to 0
    allReactionTypes.forEach(type => {
      counts[type] = 0
      usersByTypeRaw[type] = []
    })

    // Count each reaction type from the data
    let totalReactions = 0
    if (reactionData) {
      reactionData.forEach((row: { like_type: string; user_id?: string; created_at?: string }) => {
        const reactionType = (row.like_type || 'like').toLowerCase()
        if (counts[reactionType] !== undefined) {
          counts[reactionType]++
        } else {
          counts[reactionType] = 1
          usersByTypeRaw[reactionType] = []
        }

        if (row.user_id) {
          usersByTypeRaw[reactionType].push({
            user_id: row.user_id,
            created_at: row.created_at || new Date().toISOString(),
          })
        }
        totalReactions++
      })
    }

    const allUserIds = Array.from(
      new Set(
        Object.values(usersByTypeRaw)
          .flat()
          .map((entry) => entry.user_id)
          .filter(Boolean)
      )
    )

    const userProfiles: Record<string, { id: string; name: string; avatar_url: string | null; location: string | null }> = {}

    if (allUserIds.length > 0) {
      const [usersResult, profilesResult] = await Promise.all([
        supabaseAdmin.from('users').select('id, name').in('id', allUserIds),
        supabaseAdmin
          .from('profiles')
          .select('user_id, location, avatar_url')
          .in('user_id', allUserIds),
      ])

      const users = usersResult.data || []
      const profiles = profilesResult.data || []
      const profileByUserId = new Map(profiles.map((profile: any) => [profile.user_id, profile]))

      users.forEach((u: any) => {
        const profile = profileByUserId.get(u.id)
        userProfiles[u.id] = {
          id: u.id,
          name: u.name || 'Unknown User',
          avatar_url: profile?.avatar_url || null,
          location: profile?.location || null,
        }
      })
    }

    const usersByType: Record<string, Array<{
      id: string
      user: { id: string; name: string; avatar_url?: string; location?: string }
      reaction_type: string
      created_at: string
    }>> = {}

    Object.entries(usersByTypeRaw).forEach(([type, entries]) => {
      const latestByUser = new Map<string, { user_id: string; created_at: string }>()

      ;[...entries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .forEach((entry) => {
          if (!latestByUser.has(entry.user_id)) {
            latestByUser.set(entry.user_id, entry)
          }
        })

      usersByType[type] = Array.from(latestByUser.values())
        .slice(0, 15)
        .map((entry, index) => ({
          id: `${entry.user_id}-${type}-${entry.created_at}-${index}`,
          user: {
            id: entry.user_id,
            name: userProfiles[entry.user_id]?.name || 'Unknown User',
            avatar_url: userProfiles[entry.user_id]?.avatar_url || undefined,
            location: userProfiles[entry.user_id]?.location || undefined,
          },
          reaction_type: type,
          created_at: entry.created_at,
        }))
    })

    return NextResponse.json({
      success: true,
      entity_id: entityId,
      entity_type: entityType,
      counts,
      users_by_type: usersByType,
      total_reactions: totalReactions,
    })
  } catch (error) {
    console.error('Unexpected error in reaction counts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

