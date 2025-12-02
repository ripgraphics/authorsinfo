import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user to check permissions
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Validate entity type
    const validEntityTypes = ['users', 'authors', 'publishers', 'groups', 'events']
    if (!validEntityTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    // Check if the entity exists based on type
    let entity
    let entityError
    
    switch (type) {
      case 'users':
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, permalink')
          .or(`id.eq.${id},permalink.eq.${id}`)
          .single()
        entity = user
        entityError = userError
        break
        
      case 'authors':
        const { data: author, error: authorError } = await supabase
          .from('authors')
          .select('id, name, permalink')
          .or(`id.eq.${id},permalink.eq.${id}`)
          .single()
        entity = author
        entityError = authorError
        break
        
      case 'publishers':
        const { data: publisher, error: publisherError } = await supabase
          .from('publishers')
          .select('id, name, permalink')
          .or(`id.eq.${id},permalink.eq.${id}`)
          .single()
        entity = publisher
        entityError = publisherError
        break
        
      case 'groups':
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('id, name, permalink')
          .or(`id.eq.${id},permalink.eq.${id}`)
          .single()
        entity = group
        entityError = groupError
        break
        
      case 'events':
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id, name, permalink')
          .or(`id.eq.${id},permalink.eq.${id}`)
          .single()
        entity = event
        entityError = eventError
        break
        
      default:
        return NextResponse.json({ error: 'Unsupported entity type' }, { status: 400 })
    }

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Check privacy settings for users
    let canViewProgress: boolean = true
    if (type === 'users') {
      const { data: privacySettings } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', entity.id)
        .single()

      canViewProgress = !!(
        (currentUser?.id === entity.id) || // Own profile
        privacySettings?.allow_public_reading_profile === true || // Public profile
        (currentUser && privacySettings?.allow_friends_to_see_reading === true && await checkIfFriends(currentUser.id, entity.id, supabase)) || // Friends only
        (currentUser && privacySettings?.allow_followers_to_see_reading === true && await checkIfFollowing(currentUser.id, entity.id, supabase)) // Followers only
      )
    }

    if (!canViewProgress) {
      return NextResponse.json({ error: 'Reading progress is private' }, { status: 403 })
    }

    // Fetch reading progress based on entity type
    let readingData
    let readingError
    
    switch (type) {
      case 'users':
        // For users, fetch their personal reading progress
        readingData = await fetchUserReadingProgress(entity.id, supabase)
        break
        
      case 'authors':
        // For authors, fetch books they've written and reading progress
        readingData = await fetchAuthorReadingProgress(entity.id, supabase)
        break
        
      case 'publishers':
        // For publishers, fetch books they've published and reading progress
        readingData = await fetchPublisherReadingProgress(entity.id, supabase)
        break
        
      case 'groups':
        // For groups, fetch collective reading progress
        readingData = await fetchGroupReadingProgress(entity.id, supabase)
        break
        
      case 'events':
        // For events, fetch reading progress related to the event
        readingData = await fetchEventReadingProgress(entity.id, supabase)
        break
        
      default:
        return NextResponse.json({ error: 'Unsupported entity type for reading progress' }, { status: 400 })
    }

    if (readingError) {
      console.error('Error fetching reading progress:', readingError)
      return NextResponse.json({ error: 'Failed to fetch reading progress' }, { status: 500 })
    }

    // Fetch entity statistics
    const { data: entityStats, error: statsError } = await supabase
      .rpc('get_entity_profile_stats', { 
        entity_uuid: entity.id, 
        entity_type: type 
      })

    if (statsError) {
      console.error('Error fetching entity stats:', statsError)
      // Continue without stats if they fail
    }

    const response = {
      entity: {
        id: entity.id,
        name: entity.name,
        permalink: entity.permalink,
        type: type
      },
      readingProgress: readingData,
      entityStats: entityStats?.[0] || {},
      additionalStats: {
        totalPagesRead: readingData.totalPagesRead || 0,
        averageRating: readingData.averageRating || 0,
        readingStreak: entityStats?.[0]?.reading_streak_days || 0,
        profileCompletion: entityStats?.[0]?.profile_completion || 0
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in reading progress API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions for different entity types
async function fetchUserReadingProgress(userId: string, supabase: any) {
  // Fetch currently reading books
  const { data: currentlyReading, error: currentError } = await supabase
    .from('reading_progress')
    .select(`
      id,
      book_id,
      status,
      progress_percentage,
      current_page,
      total_pages,
      started_at,
      updated_at,
      books (
        id,
        title,
        author,
        cover_image_url,
        average_rating,
        review_count,
        pages
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })

  // Fetch recently completed books
  const { data: recentlyCompleted, error: completedError } = await supabase
    .from('reading_progress')
    .select(`
      id,
      book_id,
      progress_percentage,
      completed_at,
      rating,
      review_text,
      books (
        id,
        title,
        author,
        cover_image_url,
        average_rating,
        review_count,
        pages
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5)

  if (currentError || completedError) {
    throw new Error('Failed to fetch user reading progress')
  }

  const totalPagesRead = currentlyReading?.reduce((sum: number, book: any) => 
    sum + (book.current_page || 0), 0) || 0

  const averageRating = recentlyCompleted?.length > 0 
    ? recentlyCompleted.reduce((sum: number, book: any) => sum + (book.rating || 0), 0) / recentlyCompleted.length
    : 0

  return {
    currentlyReading: currentlyReading || [],
    recentlyCompleted: recentlyCompleted || [],
    totalPagesRead,
    averageRating: Math.round(averageRating * 10) / 10
  }
}

async function fetchAuthorReadingProgress(authorId: string, supabase: any) {
  // Fetch books by this author and their reading progress
  const { data: authorBooks, error: booksError } = await supabase
    .from('book_authors')
    .select(`
      book_id,
      books (
        id,
        title,
        cover_image_url,
        average_rating,
        review_count,
        pages
      )
    `)
    .eq('author_id', authorId)

  if (booksError) {
    throw new Error('Failed to fetch author books')
  }

  // Get reading progress for these books across all users
  const bookIds = authorBooks?.map((ab: any) => ab.book_id) || []
  let totalReadingProgress = []
  
  if (bookIds.length > 0) {
    const { data: readingProgress, error: progressError } = await supabase
      .from('reading_progress')
      .select(`
        id,
        book_id,
        status,
        progress_percentage,
        user_id,
        users (name)
      `)
      .in('book_id', bookIds)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (!progressError) {
      totalReadingProgress = readingProgress || []
    }
  }

  return {
    authorBooks: authorBooks || [],
    totalReadingProgress,
    totalBooks: authorBooks?.length || 0,
    totalPagesRead: 0, // Would need to calculate from reading progress
    averageRating: authorBooks?.reduce((sum: number, ab: any) => sum + (ab.books?.average_rating || 0), 0) / Math.max(authorBooks?.length || 1, 1) || 0
  }
}

async function fetchPublisherReadingProgress(publisherId: string, supabase: any) {
  // Fetch books published by this publisher
  const { data: publisherBooks, error: booksError } = await supabase
    .from('books')
    .select(`
      id,
      title,
      author,
      cover_image_url,
      average_rating,
      review_count,
      pages
    `)
    .eq('publisher_id', publisherId)
    .order('average_rating', { ascending: false })

  if (booksError) {
    throw new Error('Failed to fetch publisher books')
  }

  return {
    publisherBooks: publisherBooks || [],
    totalBooks: publisherBooks?.length || 0,
    totalPagesRead: publisherBooks?.reduce((sum: number, book: any) => sum + (book.pages || 0), 0) || 0,
    averageRating: publisherBooks?.reduce((sum: number, book: any) => sum + (book.average_rating || 0), 0) / Math.max(publisherBooks?.length || 1, 1) || 0
  }
}

async function fetchGroupReadingProgress(groupId: string, supabase: any) {
  // Fetch group members and their collective reading progress
  const { data: groupMembers, error: membersError } = await supabase
    .from('group_members')
    .select(`
      user_id,
      users (name)
    `)
    .eq('group_id', groupId)
    .eq('status', 'active')

  if (membersError) {
    throw new Error('Failed to fetch group members')
  }

  const memberIds = groupMembers?.map((member: any) => member.user_id) || []
  let collectiveReadingProgress = []
  
  if (memberIds.length > 0) {
    const { data: readingProgress, error: progressError } = await supabase
      .from('reading_progress')
      .select(`
        id,
        book_id,
        status,
        progress_percentage,
        user_id,
        users (name),
        books (title, cover_image_url)
      `)
      .in('user_id', memberIds)
      .order('updated_at', { ascending: false })
      .limit(30)

    if (!progressError) {
      collectiveReadingProgress = readingProgress || []
    }
  }

  return {
    groupMembers: groupMembers || [],
    collectiveReadingProgress,
    totalMembers: groupMembers?.length || 0,
    totalPagesRead: 0,
    averageRating: 0
  }
}

async function fetchEventReadingProgress(eventId: string, supabase: any) {
  // Fetch reading progress related to this event (e.g., book club events)
  const { data: eventBooks, error: booksError } = await supabase
    .from('event_books')
    .select(`
      book_id,
      books (
        id,
        title,
        cover_image_url,
        average_rating,
        review_count,
        pages
      )
    `)
    .eq('event_id', eventId)

  if (booksError) {
    throw new Error('Failed to fetch event books')
  }

  return {
    eventBooks: eventBooks || [],
    totalBooks: eventBooks?.length || 0,
    totalPagesRead: eventBooks?.reduce((sum: number, eb: any) => sum + (eb.books?.pages || 0), 0) || 0,
    averageRating: eventBooks?.reduce((sum: number, eb: any) => sum + (eb.books?.average_rating || 0), 0) / Math.max(eventBooks?.length || 1, 1) || 0
  }
}

// Helper function to check if two users are friends
async function checkIfFriends(userId1: string, userId2: string, supabase: any): Promise<boolean> {
  const { data: friendship } = await supabase
    .from('user_friends')
    .select('id')
    .or(`and(user_id.eq.${userId1},friend_id.eq.${userId2}),and(user_id.eq.${userId2},friend_id.eq.${userId1})`)
    .eq('status', 'accepted')
    .single()

  return !!friendship
}

// Helper function to check if user1 is following user2
async function checkIfFollowing(followerId: string, targetId: string, supabase: any): Promise<boolean> {
  const { data: follow } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('target_id', targetId)
    .eq('target_type', 'user')
    .single()

  return !!follow
}
