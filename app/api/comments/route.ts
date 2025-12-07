import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Comment API Called ===')
    const supabase = await createRouteHandlerClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'User not found'
      }, { status: 401 })
    }

    console.log('User authenticated:', { id: user.id, email: user.email })

    const body = await request.json()
    const { post_id, user_id, content, entity_type, entity_id, parent_comment_id } = body

    console.log('Comment submission data:', { post_id, user_id, content, entity_type, entity_id, parent_comment_id })

    // Validate required fields
    if (!post_id || !user_id || !content || !entity_type || !entity_id) {
      const missingFields = []
      if (!post_id) missingFields.push('post_id')
      if (!user_id) missingFields.push('user_id')
      if (!content) missingFields.push('content')
      if (!entity_type) missingFields.push('entity_type')
      if (!entity_id) missingFields.push('entity_id')
      
      console.error('Missing required fields:', missingFields)
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: `Missing: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Verify the user is posting as themselves
    if (user.id !== user_id) {
      console.error('User ID mismatch:', { authUser: user.id, requestUser: user_id })
      return NextResponse.json({ 
        error: 'You can only post comments as yourself',
        details: 'Authentication user ID does not match request user ID'
      }, { status: 403 })
    }

    // If this is a reply, validate the parent comment exists
    if (parent_comment_id) {
      // Check if parent comment exists in the appropriate table
      let parentComment;
      switch (entity_type) {
        case 'event':
          const { data: eventParent } = await supabase
            .from('event_comments')
            .select('id')
            .eq('id', parent_comment_id)
            .single();
          parentComment = eventParent;
          break;
        case 'photo':
          const { data: photoParent } = await supabase
            .from('photo_comments')
            .select('id')
            .eq('id', parent_comment_id)
            .single();
          parentComment = photoParent;
          break;
        case 'activity':
          const { data: activityParent } = await supabase
            .from('activity_comments')
            .select('id')
            .eq('id', parent_comment_id)
            .single();
          parentComment = activityParent;
          break;
        case 'book_club_discussion':
          const { data: bookClubParent } = await supabase
            .from('book_club_discussion_comments')
            .select('id')
            .eq('id', parent_comment_id)
            .single();
          parentComment = bookClubParent;
          break;
        case 'discussion':
          const { data: discussionParent } = await supabase
            .from('discussion_comments')
            .select('id')
            .eq('id', parent_comment_id)
            .single();
          parentComment = discussionParent;
          break;
        case 'post':
        default:
          const { data: postParent } = await supabase
            .from('post_comments')
            .select('id')
            .eq('id', parent_comment_id)
            .single();
          parentComment = postParent;
          break;
      }

      if (!parentComment) {
        console.error('Parent comment not found:', parent_comment_id)
        return NextResponse.json({ 
          error: 'Parent comment not found',
          details: 'The comment you are replying to does not exist'
        }, { status: 404 })
      }
    }

    let comment;
    let insertError;

    // Use specialized comment tables based on entity type
    switch (entity_type) {
      case 'event':
        // Use event_comments table
        const { data: eventComment, error: eventError } = await supabase
          .from('event_comments')
          .insert([{
            event_id: entity_id,
            user_id,
            content: content.trim(),
            parent_comment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            user:users!event_comments_user_id_fkey(
              id,
              email,
              name
            )
          `)
          .single()
        
        comment = eventComment;
        insertError = eventError;
        break;

      case 'photo':
        // Use photo_comments table
        const { data: photoComment, error: photoError } = await supabase
          .from('photo_comments')
          .insert([{
            photo_id: entity_id,
            user_id,
            content: content.trim(),
            parent_comment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            user:users!photo_comments_user_id_fkey(
              id,
              email,
              name
            )
          `)
          .single()
        
        comment = photoComment;
        insertError = photoError;
        break;

      case 'post':
        // Use post_comments table
        const { data: postComment, error: postError } = await supabase
          .from('post_comments')
          .insert([{
            post_id: entity_id,
            user_id,
            content: content.trim(),
            parent_comment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            user:users!post_comments_user_id_fkey(
              id,
              email,
              name
            )
          `)
          .single()
        
        comment = postComment;
        insertError = postError;
        break;

      case 'activity':
        // Use activity_comments table
        const { data: activityComment, error: activityError } = await supabase
          .from('activity_comments')
          .insert([{
            activity_id: entity_id,
            user_id,
            content: content.trim(),
            parent_comment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            user:users!activity_comments_user_id_fkey(
              id,
              email,
              name
            )
          `)
          .single()
        
        comment = activityComment;
        insertError = activityError;
        break;

      case 'book_club_discussion':
        // Use book_club_discussion_comments table
        const { data: bookClubComment, error: bookClubError } = await supabase
          .from('book_club_discussion_comments')
          .insert([{
            discussion_id: entity_id,
            user_id,
            content: content.trim(),
            parent_comment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            user:users!book_club_discussion_comments_user_id_fkey(
              id,
              email,
              name
            )
          `)
          .single()
        
        comment = bookClubComment;
        insertError = bookClubError;
        break;

      case 'discussion':
        // Use discussion_comments table
        const { data: discussionComment, error: discussionError } = await supabase
          .from('discussion_comments')
          .insert([{
            discussion_id: entity_id,
            user_id,
            content: content.trim(),
            parent_comment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            user:users!discussion_comments_user_id_fkey(
              id,
              email,
              name
            )
          `)
          .single()
        
        comment = discussionComment;
        insertError = discussionError;
        break;

      case 'author':
        // Use engagement_comments table for author comments
        const { data: authorComment, error: authorError } = await supabase
          .from('engagement_comments')
          .insert([{
            user_id,
            entity_type: 'author',
            entity_id,
            comment_text: content.trim(),
            parent_comment_id,
            comment_depth: parent_comment_id ? 1 : 0,
            thread_id: parent_comment_id ? null : crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            user:users!engagement_comments_user_id_fkey(
              id,
              email,
              name
            )
          `)
          .single()
        
        comment = authorComment;
        insertError = authorError;
        break;

      default:
        // For other entity types, create a feed entry first, then use the generic comments table
        console.log('Creating feed entry for entity type:', entity_type)
        console.log('Feed entry data to insert:', {
          user_id,
          type: 'comment',
          content: {
            entity_type,
            entity_id,
            comment_content: content.trim()
          },
          entity_type,
          entity_id,
          visibility: 'public'
        })
        
        try {
          // Create a feed entry for this entity
          console.log('Attempting to insert feed entry...')
          const { data: feedEntry, error: feedError } = await supabase
            .from('feed_entries')
            .insert([{
              user_id,
              type: 'comment',
              content: {
                entity_type,
                entity_id,
                comment_content: content.trim()
              },
              entity_type,
              entity_id,
              visibility: 'public'
            }])
            .select()
            .single()

          console.log('Feed entry insert result:', { data: feedEntry, error: feedError })

          if (feedError) {
            console.error('Error creating feed entry:', feedError)
            console.error('Feed entry creation failed with details:', {
              error: feedError.message,
              code: feedError.code,
              details: feedError.details,
              hint: feedError.hint
            })
            
            return NextResponse.json({ 
              error: 'Failed to create comment',
              details: `Unable to create feed entry: ${feedError.message}`,
              code: feedError.code,
              suggestion: 'This entity type may not support comments or there may be a permission issue'
            }, { status: 500 })
          }

          console.log('Feed entry created successfully:', feedEntry.id)

          // Now create the comment using the generic comments table
          console.log('Attempting to create comment...')
          const { data: genericComment, error: genericError } = await supabase
            .from('comments')
            .insert([{
              user_id,
              feed_entry_id: feedEntry.id,
              content: content.trim(),
              entity_type,
              entity_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_hidden: false,
              is_deleted: false
            }])
            .select(`
              *,
              user:users!comments_user_id_fkey(
                id,
                email,
                name
              )
            `)
            .single()

          console.log('Comment insert result:', { data: genericComment, error: genericError })

          if (genericError) {
            console.error('Error creating generic comment:', genericError)
            // Try to clean up the feed entry if comment creation fails
            console.log('Cleaning up feed entry due to comment creation failure...')
            await supabase.from('feed_entries').delete().eq('id', feedEntry.id)
            return NextResponse.json({ 
              error: 'Failed to create comment',
              details: genericError.message,
              code: genericError.code
            }, { status: 500 })
          }

          comment = genericComment;
          insertError = null;
          console.log('Comment created successfully using feed entry approach')
        } catch (feedError) {
          console.error('Unexpected error in feed entry creation:', feedError)
          console.error('Error stack:', feedError instanceof Error ? feedError.stack : 'No stack trace')
          return NextResponse.json({ 
            error: 'Unexpected error creating feed entry',
            details: feedError instanceof Error ? feedError.message : 'Unknown error'
          }, { status: 500 })
        }
        break;
    }

    if (insertError) {
      console.error('Error inserting comment:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create comment',
        details: insertError.message 
      }, { status: 500 })
    }

    if (!comment) {
      console.error('Comment is null after insertion')
      return NextResponse.json({ 
        error: 'Failed to create comment',
        details: 'Comment was not created successfully'
      }, { status: 500 })
    }

    console.log('Comment created successfully:', comment.id)

    // Try to update the comment count in the activities table if this is an activity post
    // First check if the post_id corresponds to an activity
    const { data: activity, error: activityFetchError } = await supabase
      .from('activities')
      .select('id, comment_count')
      .eq('id', post_id)
      .single()

    if (activityFetchError) {
      console.log('Post is not an activity, skipping comment count update')
    } else if (activity) {
      console.log('Updating activity comment count for activity:', activity.id)
      const currentCount = activity?.comment_count || 0
      const { error: updateError } = await supabase
        .from('activities')
        .update({ 
          comment_count: currentCount + 1
        })
        .eq('id', post_id)

      if (updateError) {
        console.warn('Warning: Failed to update activity comment count:', updateError)
      } else {
        console.log('Activity comment count updated successfully')
      }
    }

    // Format the response based on the comment type
    const commentData = comment as any;
    const userData = commentData.user as any;
    let formattedComment;
    if (entity_type === 'event') {
      formattedComment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        updated_at: commentData.updated_at,
        user: {
          id: userData?.id,
          name: userData?.name || userData?.email || 'User',
          avatar_url: null
        },
        post_id: commentData.event_id,
        entity_type: 'event',
        entity_id: commentData.event_id
      }
    } else if (entity_type === 'photo') {
      formattedComment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        updated_at: commentData.updated_at,
        user: {
          id: userData?.id,
          name: userData?.name || userData?.email || 'User',
          avatar_url: null
        },
        post_id: commentData.photo_id,
        entity_type: 'photo',
        entity_id: commentData.photo_id
      }
    } else if (entity_type === 'post') {
      formattedComment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        updated_at: commentData.updated_at,
        user: {
          id: userData?.id,
          name: userData?.name || userData?.email || 'User',
          avatar_url: null
        },
        post_id: commentData.post_id,
        entity_type: 'post',
        entity_id: commentData.post_id
      }
    } else {
      // Generic comment format
      formattedComment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        updated_at: commentData.updated_at,
        user: {
          id: userData?.id,
          name: userData?.name || userData?.email || 'User',
          avatar_url: null
        },
        post_id: commentData.feed_entry_id,
        entity_type: commentData.entity_type,
        entity_id: commentData.entity_id
      }
    }

    return NextResponse.json({
      success: true,
      comment: formattedComment,
      message: 'Comment created successfully'
    })

  } catch (error) {
    console.error('=== Unexpected Error in Comments API ===')
    console.error('Error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    const { searchParams } = new URL(request.url)
    
    // Add a test endpoint for debugging
    if (searchParams.get('test') === 'true') {
      console.log('=== Testing Comment API ===')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ 
          error: 'Authentication failed',
          details: authError?.message || 'User not found'
        }, { status: 401 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Comment API is working',
        user: { id: user.id, email: user.email },
        timestamp: new Date().toISOString()
      })
    }
    
    const post_id = searchParams.get('post_id')
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!post_id) {
      return NextResponse.json({ 
        error: 'post_id is required' 
      }, { status: 400 })
    }

    let comments;
    let error;
    let count;

    // Use specialized comment tables based on entity type
    if (entity_type === 'event') {
      const result = await supabase
        .from('event_comments')
        .select(`
          *,
          user:users!event_comments_user_id_fkey(
            id,
            email,
            name
          )
        `, { count: 'exact' })
        .eq('event_id', post_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      comments = result.data;
      error = result.error;
      count = result.count;
    } else if (entity_type === 'photo') {
      const result = await supabase
        .from('photo_comments')
        .select(`
          *,
          user:users!photo_comments_user_id_fkey(
            id,
            email,
            name
          )
        `, { count: 'exact' })
        .eq('photo_id', post_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      comments = result.data;
      error = result.error;
      count = result.count;
    } else if (entity_type === 'post') {
      // Fetch comments with nested replies support
      const result = await supabase
        .from('post_comments')
        .select(`
          *,
          user:users!post_comments_user_id_fkey(
            id,
            email,
            name
          ),
          replies:post_comments!post_comments_parent_comment_id_fkey(
            id,
            content,
            created_at,
            updated_at,
            parent_comment_id,
            user:users!post_comments_user_id_fkey(
              id,
              email,
              name
            )
          )
        `, { count: 'exact' })
        .eq('post_id', post_id)
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      comments = result.data;
      error = result.error;
      count = result.count;
    } else if (entity_type === 'author') {
      // Fetch comments for author entities using the engagement_comments table
      const result = await supabase
        .from('engagement_comments')
        .select(`
          *,
          user:users!engagement_comments_user_id_fkey(
            id,
            email,
            name
          )
        `, { count: 'exact' })
        .eq('entity_id', post_id)
        .eq('entity_type', 'author')
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      comments = result.data;
      error = result.error;
      count = result.count;
    } else {
      // Build the query using the generic comments table structure
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:users!comments_user_id_fkey(
            id,
            email,
            name
          )
        `, { count: 'exact' })
        .eq('feed_entry_id', post_id) // Use feed_entry_id as per table structure
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (entity_type && entity_id) {
        query = query.eq('entity_type', entity_type).eq('entity_id', entity_id)
      }

      const result = await query;
      comments = result.data;
      error = result.error;
      count = result.count;
    }

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch comments',
        details: error.message 
      }, { status: 500 })
    }

    // Format the comments based on the entity type
    let formattedComments;
    if (entity_type === 'event') {
      formattedComments = comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.user?.id,
          name: comment.user?.name || comment.user?.email || 'User',
          avatar_url: null
        },
        post_id: comment.event_id,
        entity_type: 'event',
        entity_id: comment.event_id
      })) || []
    } else if (entity_type === 'photo') {
      formattedComments = comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.user?.id,
          name: comment.user?.name || comment.user?.email || 'User',
          avatar_url: null
        },
        post_id: comment.photo_id,
        entity_type: 'photo',
        entity_id: comment.photo_id
      })) || []
    } else if (entity_type === 'post') {
      formattedComments = comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.user?.id,
          name: comment.user?.name || comment.user?.email || 'User',
          avatar_url: null
        },
        post_id: comment.post_id,
        entity_type: 'post',
        entity_id: comment.post_id,
        // Add missing fields with default values for backward compatibility
        parent_comment_id: comment.parent_comment_id || null,
        comment_depth: comment.comment_depth || 0,
        thread_id: comment.thread_id || comment.id, // Use comment ID as fallback thread ID
        reply_count: comment.replies?.length || 0,
        replies: comment.replies?.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          user: {
            id: reply.user?.id,
            name: reply.user?.name || reply.user?.email || 'User',
            avatar_url: null
          },
          parent_comment_id: reply.parent_comment_id || null,
          comment_depth: reply.comment_depth || 1,
          thread_id: reply.thread_id || comment.id,
          reply_count: 0
        })) || []
      })) || []
    } else if (entity_type === 'author') {
      formattedComments = comments?.map(comment => ({
        id: comment.id,
        content: comment.comment_text,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.user?.id,
          name: comment.user?.name || comment.user?.email || 'User',
          avatar_url: null
        },
        post_id: comment.entity_id,
        entity_type: 'author',
        entity_id: comment.entity_id,
        parent_comment_id: comment.parent_comment_id || null,
        comment_depth: comment.comment_depth || 0,
        thread_id: comment.thread_id || comment.id,
        reply_count: comment.reply_count || 0
      })) || []
    } else {
      // Generic comment format
      formattedComments = comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.user?.id,
          name: comment.user?.name || comment.user?.email || 'User',
          avatar_url: null
        },
        post_id: comment.feed_entry_id,
        entity_type: comment.entity_type,
        entity_id: comment.entity_id
      })) || []
    }

    return NextResponse.json({
      success: true,
      comments: formattedComments,
      total: count || formattedComments.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in comments API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}