import { supabaseAdmin } from '@/lib/supabase'

export interface ActivityData {
  user_id: string
  activity_type: string
  book_id?: string
  author_id?: string
  publisher_id?: string
  data?: Record<string, any>
  created_at?: string
}

// Main function to generate author-related activities
export async function generateAuthorActivities(
  authorId: string,
  adminUserId: string
): Promise<boolean> {
  try {
    // Get author data
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('id, name, bio, created_at')
      .eq('id', authorId)
      .single()

    if (authorError || !author) {
      console.error('Error fetching author:', authorError)
      return false
    }

    // Find books by this author
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id, title, author, created_at')
      .eq('author_id', authorId)

    if (booksError) {
      console.error('Error fetching author books:', booksError)
      return false
    }

    const activities: ActivityData[] = []

    // Create author_created activity
    activities.push({
      user_id: adminUserId,
      activity_type: 'author_created',
      author_id: author.id,
      data: {
        author_id: author.id,
        author_name: author.name,
        books_count: books?.length || 0,
      },
      created_at: author.created_at,
    })

    // Create book_added activities for each book
    if (books && books.length > 0) {
      for (const book of books) {
        activities.push({
          user_id: adminUserId,
          activity_type: 'book_added',
          book_id: book.id,
          author_id: author.id,
          data: {
            book_title: book.title,
            book_author: book.author || author.name,
            author_id: author.id,
            author_name: author.name,
          },
          created_at: book.created_at,
        })
      }
    }

    // Insert all activities
    const { error: insertError } = await supabaseAdmin.from('activities').insert(activities)

    if (insertError) {
      console.error('Error inserting activities:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error generating author activities:', error)
    return false
  }
}

// Generate activities for books
export async function generateBookActivities(
  bookId: string,
  adminUserId: string
): Promise<boolean> {
  try {
    // Get book data
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select(
        `
        id, 
        title, 
        author_id,
        created_at
      `
      )
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      console.error('Error fetching book:', bookError)
      return false
    }

    // Get author data if available
    let authorName = 'Unknown Author'
    let authorId = null
    if (book.author_id) {
      const { data: author } = await supabaseAdmin
        .from('authors')
        .select('id, name')
        .eq('id', book.author_id)
        .single()

      if (author) {
        authorName = author.name
        authorId = author.id
      }
    }

    // Create book_added activity
    const activities: ActivityData[] = [
      {
        user_id: adminUserId,
        activity_type: 'book_added',
        book_id: book.id,
        author_id: authorId,
        data: {
          book_title: book.title,
          book_author: authorName,
          author_id: authorId,
          author_name: authorName,
        },
        created_at: book.created_at,
      },
    ]

    // Insert activity
    const { error: insertError } = await supabaseAdmin.from('activities').insert(activities)

    if (insertError) {
      console.error('Error inserting book activity:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error generating book activities:', error)
    return false
  }
}

// Generate activities for publishers
export async function generatePublisherActivities(
  publisherId: string,
  adminUserId: string
): Promise<boolean> {
  try {
    // Get publisher data
    const { data: publisher, error: publisherError } = await supabaseAdmin
      .from('publishers')
      .select('id, name, created_at')
      .eq('id', publisherId)
      .single()

    if (publisherError || !publisher) {
      console.error('Error fetching publisher:', publisherError)
      return false
    }

    // Find books by this publisher
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id, title, author, created_at')
      .eq('publisher_id', publisherId)

    if (booksError) {
      console.error('Error fetching publisher books:', booksError)
      return false
    }

    const activities: ActivityData[] = []

    // Create publisher_created activity
    activities.push({
      user_id: adminUserId,
      activity_type: 'publisher_created',
      publisher_id: publisher.id,
      data: {
        publisher_id: publisher.id,
        publisher_name: publisher.name,
        books_count: books?.length || 0,
      },
      created_at: publisher.created_at,
    })

    // Create book_published activities for each book
    if (books && books.length > 0) {
      for (const book of books) {
        activities.push({
          user_id: adminUserId,
          activity_type: 'book_published',
          book_id: book.id,
          publisher_id: publisher.id,
          data: {
            book_title: book.title,
            book_author: book.author,
            publisher_id: publisher.id,
            publisher_name: publisher.name,
          },
          created_at: book.created_at,
        })
      }
    }

    // Insert all activities
    const { error: insertError } = await supabaseAdmin.from('activities').insert(activities)

    if (insertError) {
      console.error('Error inserting publisher activities:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error generating publisher activities:', error)
    return false
  }
}

// Generate activities for user profiles - Modified to avoid using user_profile_id column
export async function generateUserProfileActivities(
  userId: string,
  adminUserId: string
): Promise<boolean> {
  try {
    // Get user profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, bio, created_at')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return false
    }

    // Get user data for name
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, created_at')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return false
    }

    const activities: ActivityData[] = []

    // Create profile_created activity - now storing profile info in the data field
    activities.push({
      user_id: adminUserId,
      activity_type: 'profile_created',
      // Not using user_profile_id column as it doesn't exist
      data: {
        user_id: userId,
        user_name: user?.name || 'Unknown User',
        profile_id: userId, // Store profile ID in data instead
      },
      created_at: profile.created_at || user?.created_at,
    })

    // Insert all activities
    const { error: insertError } = await supabaseAdmin.from('activities').insert(activities)

    if (insertError) {
      console.error('Error inserting user profile activities:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error generating user profile activities:', error)
    return false
  }
}

// Generate activities for groups - Modified to use existing columns
export async function generateGroupActivities(
  groupId: string,
  adminUserId: string
): Promise<boolean> {
  try {
    // Get group data
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name, created_by, created_at')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error('Error fetching group:', groupError)
      return false
    }

    // Get creator name
    let creatorName = 'Unknown User'
    if (group.created_by) {
      const { data: creator } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', group.created_by)
        .single()

      if (creator) {
        creatorName = creator.name
      }
    }

    // Get member count
    const { count: memberCount, error: countError } = await supabaseAdmin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    if (countError) {
      console.error('Error counting group members:', countError)
    }

    const activities: ActivityData[] = []

    // Create group_created activity - store group info in data field
    activities.push({
      user_id: group.created_by || adminUserId,
      activity_type: 'group_created',
      // We don't use group_id column directly, instead store in data
      data: {
        group_id: group.id,
        group_name: group.name,
        creator_id: group.created_by,
        creator_name: creatorName,
        member_count: memberCount || 1,
      },
      created_at: group.created_at,
    })

    // Insert all activities
    const { error: insertError } = await supabaseAdmin.from('activities').insert(activities)

    if (insertError) {
      console.error('Error inserting group activities:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error generating group activities:', error)
    return false
  }
}

// Generate activities for all existing authors
export async function generateAllAuthorActivities(
  adminUserId: string
): Promise<{ success: boolean; count: number }> {
  try {
    // Get all authors
    const { data: authors, error: authorsError } = await supabaseAdmin.from('authors').select('id')

    if (authorsError || !authors) {
      console.error('Error fetching authors:', authorsError)
      return { success: false, count: 0 }
    }

    let successCount = 0

    // Process each author
    for (const author of authors) {
      const success = await generateAuthorActivities(author.id, adminUserId)
      if (success) {
        successCount++
      }
    }

    return {
      success: true,
      count: successCount,
    }
  } catch (error) {
    console.error('Unexpected error generating all author activities:', error)
    return { success: false, count: 0 }
  }
}

// Generate activities for all existing books
export async function generateAllBookActivities(
  adminUserId: string
): Promise<{ success: boolean; count: number }> {
  try {
    // Get all books
    const { data: books, error: booksError } = await supabaseAdmin.from('books').select('id')

    if (booksError || !books) {
      console.error('Error fetching books:', booksError)
      return { success: false, count: 0 }
    }

    let successCount = 0

    // Process each book
    for (const book of books) {
      const success = await generateBookActivities(book.id, adminUserId)
      if (success) {
        successCount++
      }
    }

    return {
      success: true,
      count: successCount,
    }
  } catch (error) {
    console.error('Unexpected error generating all book activities:', error)
    return { success: false, count: 0 }
  }
}

// Generate activities for all existing publishers
export async function generateAllPublisherActivities(
  adminUserId: string
): Promise<{ success: boolean; count: number }> {
  try {
    // Get all publishers
    const { data: publishers, error: publishersError } = await supabaseAdmin
      .from('publishers')
      .select('id')

    if (publishersError || !publishers) {
      console.error('Error fetching publishers:', publishersError)
      return { success: false, count: 0 }
    }

    let successCount = 0

    // Process each publisher
    for (const publisher of publishers) {
      const success = await generatePublisherActivities(publisher.id, adminUserId)
      if (success) {
        successCount++
      }
    }

    return {
      success: true,
      count: successCount,
    }
  } catch (error) {
    console.error('Unexpected error generating all publisher activities:', error)
    return { success: false, count: 0 }
  }
}

// Generate activities for all existing user profiles
export async function generateAllUserProfileActivities(
  adminUserId: string
): Promise<{ success: boolean; count: number }> {
  try {
    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')

    if (profilesError || !profiles) {
      console.error('Error fetching user profiles:', profilesError)
      return { success: false, count: 0 }
    }

    let successCount = 0

    // Process each user profile
    for (const profile of profiles) {
      const success = await generateUserProfileActivities(profile.user_id, adminUserId)
      if (success) {
        successCount++
      }
    }

    return {
      success: true,
      count: successCount,
    }
  } catch (error) {
    console.error('Unexpected error generating all user profile activities:', error)
    return { success: false, count: 0 }
  }
}

// Generate activities for all existing groups
export async function generateAllGroupActivities(
  adminUserId: string
): Promise<{ success: boolean; count: number }> {
  try {
    // Get all groups
    const { data: groups, error: groupsError } = await supabaseAdmin.from('groups').select('id')

    if (groupsError || !groups) {
      console.error('Error fetching groups:', groupsError)
      return { success: false, count: 0 }
    }

    let successCount = 0

    // Process each group
    for (const group of groups) {
      const success = await generateGroupActivities(group.id, adminUserId)
      if (success) {
        successCount++
      }
    }

    return {
      success: true,
      count: successCount,
    }
  } catch (error) {
    console.error('Unexpected error generating all group activities:', error)
    return { success: false, count: 0 }
  }
}

// Generate activities for all entity types
export async function generateAllActivities(adminUserId: string): Promise<{
  success: boolean
  counts: {
    authors: number
    books: number
    publishers: number
    userProfiles: number
    groups: number
  }
}> {
  try {
    const authorResult = await generateAllAuthorActivities(adminUserId)
    const bookResult = await generateAllBookActivities(adminUserId)
    const publisherResult = await generateAllPublisherActivities(adminUserId)
    const userProfileResult = await generateAllUserProfileActivities(adminUserId)
    const groupResult = await generateAllGroupActivities(adminUserId)

    return {
      success:
        authorResult.success &&
        bookResult.success &&
        publisherResult.success &&
        userProfileResult.success &&
        groupResult.success,
      counts: {
        authors: authorResult.count,
        books: bookResult.count,
        publishers: publisherResult.count,
        userProfiles: userProfileResult.count,
        groups: groupResult.count,
      },
    }
  } catch (error) {
    console.error('Unexpected error generating all activities:', error)
    return {
      success: false,
      counts: {
        authors: 0,
        books: 0,
        publishers: 0,
        userProfiles: 0,
        groups: 0,
      },
    }
  }
}
