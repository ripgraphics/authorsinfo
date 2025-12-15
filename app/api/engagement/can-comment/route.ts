import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entity_type') || 'activity'
    const entityId = searchParams.get('entity_id')

    if (!entityId) {
      return NextResponse.json({ error: 'entity_id is required' }, { status: 400 })
    }

    // Auth (unauthenticated users cannot comment)
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (!userId) {
      return NextResponse.json({ allowed: false })
    }

    if (entityType !== 'activity') {
      // For now we only support activities; extend as needed
      return NextResponse.json({ allowed: true })
    }

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, user_id')
      .eq('id', entityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json({ allowed: false })
    }

    const ownerUserId = (activity as any)?.user_id
    if (ownerUserId === userId) {
      return NextResponse.json({ allowed: true })
    }

    // Default policy is public unless specified
    let postingPolicy: 'public' | 'friends' | 'followers' | 'private' = 'public'
    const { data: ownerPrivacy } = await supabase
      .from('user_privacy_settings')
      .select('default_privacy_level')
      .eq('user_id', ownerUserId)
      .maybeSingle()

    const level = (ownerPrivacy as any)?.default_privacy_level as string | undefined
    if (level === 'followers') postingPolicy = 'followers'
    else if (level === 'friends') postingPolicy = 'friends'
    else if (level === 'private') postingPolicy = 'private'
    else postingPolicy = 'public'

    // Relationship checks
    const [{ data: youFollow }, { data: theyFollow }] = await Promise.all([
      supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', ownerUserId)
        .limit(1),
      supabase
        .from('follows')
        .select('id')
        .eq('follower_id', ownerUserId)
        .eq('following_id', userId)
        .limit(1)
    ])

    const isFollower = (youFollow?.length || 0) > 0
    const isFriend = isFollower && (theyFollow?.length || 0) > 0

    const allowed = (
      postingPolicy === 'public' ? true :
      postingPolicy === 'followers' ? (isFollower || isFriend) :
      postingPolicy === 'friends' ? isFriend :
      false
    )

    return NextResponse.json({ allowed })
  } catch (error) {
    return NextResponse.json({ allowed: false })
  }
}


