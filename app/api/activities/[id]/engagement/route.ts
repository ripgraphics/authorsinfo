import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = id
    const { action, comment_text } = await request.json()

    console.log('🔍 POST /api/activities/[id]/engagement - Request:', {
      activityId,
      action,
      comment_text,
      userId: user.id
    })

    if (action === 'like') {
      // Handle like/unlike - update the like_count in activities table
      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('like_count, user_has_reacted')
        .eq('id', activityId)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching activity:', fetchError)
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
      }

      // Check if user already liked this activity
      const hasLiked = existingActivity.user_has_reacted || false
      const newLikeCount = hasLiked 
        ? Math.max(0, (existingActivity.like_count || 0) - 1)
        : (existingActivity.like_count || 0) + 1

      // Update the activity with new like count and user reaction status
      // Check if user_has_reacted column exists
      const { data: columnCheck } = await supabase
        .from('activities')
        .select('user_has_reacted')
        .limit(1);

      const hasUserHasReactedColumn = columnCheck && columnCheck.length > 0 && 'user_has_reacted' in columnCheck[0];
      
      if (hasUserHasReactedColumn) {
        // Update like_count and user_has_reacted
        const { error: updateError } = await supabase
          .from('activities')
          .update({
            like_count: hasLiked ? existingActivity.like_count - 1 : existingActivity.like_count + 1,
            user_has_reacted: !hasLiked
          })
          .eq('id', activityId);

        if (updateError) {
          console.error('❌ Error updating activity:', updateError);
          return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
        }
      } else {
        // Fallback: only update like_count if user_has_reacted column doesn't exist
        const { error: updateError } = await supabase
          .from('activities')
          .update({
            like_count: hasLiked ? existingActivity.like_count - 1 : existingActivity.like_count + 1
          })
          .eq('id', activityId);

        if (updateError) {
          console.error('❌ Error updating activity:', updateError);
          return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
        }
      }

      const response = {
        success: true,
        action: hasLiked ? 'unliked' : 'liked',
        message: hasLiked ? 'Post unliked successfully' : 'Post liked successfully',
        like_count: newLikeCount
      }

      console.log('✅ POST /api/activities/[id]/engagement - Like response:', response)
      return NextResponse.json(response)

    } else if (action === 'comment') {
      // Handle comment - update the comment_count in activities table
      if (!comment_text || !comment_text.trim()) {
        return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
      }

      // For now, just increment the comment count
      // In a full implementation, you might want to store actual comments
      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('comment_count')
        .eq('id', activityId)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching activity:', fetchError)
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
      }

      const newCommentCount = (existingActivity.comment_count || 0) + 1

      // Update the activity with new comment count
      const { error: updateError } = await supabase
        .from('activities')
        .update({ comment_count: newCommentCount })
        .eq('id', activityId)

      if (updateError) {
        console.error('❌ Error updating comment count:', updateError)
        return NextResponse.json({ error: 'Failed to update comment count' }, { status: 500 })
      }

      // Create a simple comment object for the response
      const newComment = {
        id: `comment-${Date.now()}`,
        comment_text: comment_text.trim(),
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email || 'You',
        user_avatar_url: user.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString(),
        entity_id: activityId,
        entity_type: 'activity'
      }

      const response = {
        success: true,
        comment: newComment,
        comment_count: newCommentCount,
        message: 'Comment added successfully'
      }

      console.log('✅ POST /api/activities/[id]/engagement - Comment response:', response)
      return NextResponse.json(response)

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ POST /api/activities/[id]/engagement - Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    console.log('🔍 GET /api/activities/[id]/engagement - Request:', {
      activityId,
      type,
      userId: user.id
    })

    console.log('🔍 GET /api/activities/[id]/engagement - Fetching engagement data for activity:', activityId)

    // Check if user_has_reacted column exists
    const { data: columnCheck } = await supabase
      .from('activities')
      .select('user_has_reacted')
      .limit(1);

    const hasUserHasReactedColumn = columnCheck && columnCheck.length > 0 && 'user_has_reacted' in columnCheck[0];

    // Fetch the activity data
    const { data: activity, error } = await supabase
      .from('activities')
      .select('like_count, comment_count, share_count, bookmark_count, user_has_reacted')
      .eq('id', activityId)
      .single()

    if (error) {
      console.error('❌ Error fetching activity:', error)
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Prepare response data
    const responseData = {
      like_count: activity.like_count || 0,
      comment_count: activity.comment_count || 0,
      share_count: activity.share_count || 0,
      bookmark_count: activity.bookmark_count || 0,
      user_has_reacted: hasUserHasReactedColumn ? (activity.user_has_reacted || false) : false
    }

    console.log('✅ GET /api/activities/[id]/engagement - Returning engagement data:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ GET /api/activities/[id]/engagement - Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
