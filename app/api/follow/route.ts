import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getFollowTargetType } from '@/lib/follows-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { entityId, targetType } = await request.json()
    
    if (!entityId || !targetType) {
      return NextResponse.json(
        { error: 'entityId and targetType are required' },
        { status: 400 }
      )
    }

    // Get the target type ID
    const targetTypeData = await getFollowTargetType(targetType)
    if (!targetTypeData) {
      return NextResponse.json(
        { error: `Invalid target type: ${targetType}` },
        { status: 400 }
      )
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', entityId)
      .eq('target_type_id', targetTypeData.id)
      .single()

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this entity' },
        { status: 400 }
      )
    }

    // Create the follow relationship
    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: entityId,
        target_type_id: targetTypeData.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating follow:', error)
      return NextResponse.json(
        { error: 'Failed to follow entity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Successfully followed entity'
    })

  } catch (error) {
    console.error('Error in follow API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { entityId, targetType } = await request.json()
    
    if (!entityId || !targetType) {
      return NextResponse.json(
        { error: 'entityId and targetType are required' },
        { status: 400 }
      )
    }

    // Get the target type ID
    const targetTypeData = await getFollowTargetType(targetType)
    if (!targetTypeData) {
      return NextResponse.json(
        { error: `Invalid target type: ${targetType}` },
        { status: 400 }
      )
    }

    // Delete the follow relationship
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', entityId)
      .eq('target_type_id', targetTypeData.id)

    if (error) {
      console.error('Error unfollowing:', error)
      return NextResponse.json(
        { error: 'Failed to unfollow entity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed entity'
    })

  } catch (error) {
    console.error('Error in unfollow API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const targetType = searchParams.get('targetType')
    
    if (!entityId || !targetType) {
      return NextResponse.json(
        { error: 'entityId and targetType are required' },
        { status: 400 }
      )
    }

    // Get the target type ID
    const targetTypeData = await getFollowTargetType(targetType)
    if (!targetTypeData) {
      return NextResponse.json(
        { error: `Invalid target type: ${targetType}` },
        { status: 400 }
      )
    }

    // Check if following
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', entityId)
      .eq('target_type_id', targetTypeData.id)
      .single()

    return NextResponse.json({
      isFollowing: !!follow
    })

  } catch (error) {
    console.error('Error in check follow status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 