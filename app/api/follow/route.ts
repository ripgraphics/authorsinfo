import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'
import { getFollowTargetType } from '@/lib/follows-server'
import { supabaseAdmin } from '@/lib/supabase'
import { followEntity, unfollowEntity } from '@/app/actions/follow'
import { getUserIdFromPermalinkServer } from '@/lib/utils/profile-url-server'

// Create the cache outside of the helper function so it persists between calls
const targetTypeIdCache = new Map<string, number>()

// Helper function to get the target type ID from the database
const getTargetTypeId = async (targetType: string): Promise<number | null> => {
  if (targetTypeIdCache.has(targetType)) {
    return targetTypeIdCache.get(targetType)!
  }

  const { data, error } = await supabaseAdmin
    .from('follow_target_types')
    .select('id')
    .eq('name', targetType)
    .single()

  if (error) {
    console.error(`Error fetching target type ID for ${targetType}:`, error)
    return null
  }

  // The ID is a number, not a string
  const id = data.id
  targetTypeIdCache.set(targetType, id)
  return id
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClientAsync()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { entityId, targetType } = await request.json()

    if (!entityId || !targetType) {
      return NextResponse.json({ error: 'entityId and targetType are required' }, { status: 400 })
    }

    // Convert permalink to UUID if this is a user follow
    let actualEntityId = entityId
    if (targetType === 'user') {
      const userUUID = await getUserIdFromPermalinkServer(entityId)
      if (!userUUID) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      actualEntityId = userUUID
    }

    // Prevent users from following themselves
    if (targetType === 'user' && user.id === actualEntityId) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 })
    }

    // Get the target type ID
    const targetTypeData = await getFollowTargetType(targetType)
    if (!targetTypeData) {
      return NextResponse.json({ error: `Invalid target type: ${targetType}` }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', actualEntityId)
      .eq('target_type_id', targetTypeData.id)
      .single()

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this entity' }, { status: 400 })
    }

    // Create the follow relationship
    const { data, error } = await (supabase.from('follows') as any)
      .insert({
        follower_id: user.id,
        following_id: actualEntityId,
        target_type_id: (targetTypeData as any).id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating follow:', error)

      // Provide more specific error messages based on the error type
      if (error.code === '23503') {
        // Foreign key constraint violation
        return NextResponse.json(
          { error: `Cannot follow ${targetType}: Entity does not exist or is not accessible` },
          { status: 400 }
        )
      } else if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json({ error: `Already following this ${targetType}` }, { status: 400 })
      } else {
        return NextResponse.json(
          { error: `Failed to follow ${targetType}: ${error.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Successfully followed entity',
    })
  } catch (error) {
    console.error('Error in follow API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerComponentClientAsync()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { entityId, targetType } = await request.json()

    if (!entityId || !targetType) {
      return NextResponse.json({ error: 'entityId and targetType are required' }, { status: 400 })
    }

    // Convert permalink to UUID if this is a user follow
    let actualEntityId = entityId
    if (targetType === 'user') {
      const userUUID = await getUserIdFromPermalinkServer(entityId)
      if (!userUUID) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      actualEntityId = userUUID
    }

    // Get the target type ID
    const targetTypeData = await getFollowTargetType(targetType)
    if (!targetTypeData) {
      return NextResponse.json({ error: `Invalid target type: ${targetType}` }, { status: 400 })
    }

    // Delete the follow relationship
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', actualEntityId)
      .eq('target_type_id', targetTypeData.id)

    if (error) {
      console.error('Error unfollowing:', error)
      return NextResponse.json(
        { error: `Failed to unfollow ${targetType}: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed entity',
    })
  } catch (error) {
    console.error('Error in unfollow API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get('entityId')
  const targetType = searchParams.get('targetType')

  if (!entityId || !targetType) {
    return NextResponse.json(
      { error: 'entityId and targetType are required' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  }

  try {
    const supabase = await createServerComponentClientAsync()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // If no user, they can't be following anything.
      return NextResponse.json(
        { isFollowing: false },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    // Convert permalink to UUID if this is a user follow
    let actualEntityId = entityId
    if (targetType === 'user') {
      const userUUID = await getUserIdFromPermalinkServer(entityId)
      if (!userUUID) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      actualEntityId = userUUID
    }

    const targetTypeId = await getTargetTypeId(targetType)
    if (!targetTypeId) {
      return NextResponse.json(
        { error: `Invalid target type: ${targetType}` },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    const { data, error } = await supabaseAdmin.rpc('check_is_following', {
      p_follower_id: user.id,
      p_following_id: actualEntityId,
      p_target_type_id: targetTypeId,
    })

    // Check the actual is_following property, not just if data exists
    const isFollowing = data && data.length > 0 && data[0].is_following === true

    if (error) {
      console.error('Error checking follow status:', error)
      return NextResponse.json(
        { error: 'Failed to check follow status' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    return NextResponse.json(
      { isFollowing },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Error in GET /api/follow:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  }
}

