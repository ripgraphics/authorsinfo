import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientProfilePage } from './client'
import { getFollowersCount, getFollowers } from '@/lib/follows-server'
import { getFriends } from '@/lib/friends-server'
import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'

export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

// Helper function to check if two users are friends
async function checkIfFriends(userId1: string, userId2: string): Promise<boolean> {
  const { data: friendship } = await supabaseAdmin
    .from('user_friends')
    .select('id')
    .or(
      `and(user_id.eq.${userId1},friend_id.eq.${userId2},status.eq.accepted),and(user_id.eq.${userId2},friend_id.eq.${userId1},status.eq.accepted)`
    )
    .maybeSingle()

  return !!friendship
}

// Helper function to check if user1 is following user2
async function checkIfFollowing(followerId: string, targetId: string): Promise<boolean> {
  const userTargetType = await supabaseAdmin
    .from('follow_target_types')
    .select('id')
    .eq('name', 'user')
    .single()

  if (!userTargetType.data) {
    return false
  }

  const { data: follow } = await supabaseAdmin
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', targetId)
    .eq('target_type_id', userTargetType.data.id)
    .maybeSingle()

  return !!follow
}

// Get currently reading books for a user with privacy filtering
async function getCurrentlyReadingBooksForUser(
  profileOwnerId: string,
  viewerId: string | null
): Promise<any[]> {
  try {
    // If viewer is the owner, show all books
    const isOwner = viewerId === profileOwnerId

    // Get user privacy settings
    const { data: privacySettings } = await supabaseAdmin
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', profileOwnerId)
      .maybeSingle()

    // Determine if viewer can see reading progress at all
    let canViewProgress = isOwner
    if (!isOwner && viewerId) {
      // Check user-level privacy settings
      canViewProgress =
        privacySettings?.allow_public_reading_profile === true ||
        (privacySettings?.allow_friends_to_see_reading === true &&
          (await checkIfFriends(viewerId, profileOwnerId))) ||
        (privacySettings?.allow_followers_to_see_reading === true &&
          (await checkIfFollowing(viewerId, profileOwnerId)))
    }

    if (!canViewProgress) {
      return []
    }

    // Fetch reading progress entries with status = 'in_progress'
    // Select both progress_percentage and percentage fields, plus privacy fields
    const { data: currentlyReadingProgress, error: currentlyReadingError } = await supabaseAdmin
      .from('reading_progress')
      .select(
        'id, book_id, progress_percentage, percentage, current_page, total_pages, updated_at, privacy_level, allow_friends, allow_followers'
      )
      .eq('user_id', profileOwnerId)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(20) // Fetch more to allow for filtering

    if (currentlyReadingError) {
      console.error('Error fetching currently reading progress:', currentlyReadingError)
      return []
    }

    if (!currentlyReadingProgress || currentlyReadingProgress.length === 0) {
      return []
    }

    // Filter by reading_progress-level privacy if viewer is not the owner
    let filteredProgress = currentlyReadingProgress
    if (!isOwner && viewerId) {
      // Check if viewer is friend or follower
      const [isFriend, isFollower] = await Promise.all([
        checkIfFriends(viewerId, profileOwnerId),
        checkIfFollowing(viewerId, profileOwnerId),
      ])

      filteredProgress = currentlyReadingProgress.filter((rp: any) => {
        // Show if:
        // - privacy_level is 'public' OR
        // - allow_friends is true AND viewer is friend OR
        // - allow_followers is true AND viewer is follower
        return (
          rp.privacy_level === 'public' ||
          (rp.allow_friends === true && isFriend) ||
          (rp.allow_followers === true && isFollower)
        )
      })
    }

    if (filteredProgress.length === 0) {
      return []
    }

    // Get all book IDs
    const currentlyReadingBookIds = filteredProgress.map((rp: any) => rp.book_id).filter(Boolean)

    if (currentlyReadingBookIds.length === 0) {
      return []
    }

          // Fetch books with cover images, permalinks, and pages (to use as total_pages fallback)
          // Use Supabase as single source of truth - fetch ALL relevant fields
          const { data: currentlyReadingBooksFromDb, error: currentlyReadingBooksError } =
            await supabaseAdmin
              .from('books')
              .select(
                `
                id,
                title,
                permalink,
                pages,
                cover_image_id,
                cover_image:images!books_cover_image_id_fkey(url, alt_text)
              `
              )
              .in('id', currentlyReadingBookIds)

    if (currentlyReadingBooksError) {
      console.error('Error fetching currently reading books:', currentlyReadingBooksError)
      return []
    }

    if (!currentlyReadingBooksFromDb || currentlyReadingBooksFromDb.length === 0) {
      return []
    }

    // Create a map of book_id to book data (including pages from Supabase)
    const currentlyReadingBooksMap = new Map<string, any>()
    currentlyReadingBooksFromDb.forEach((book: any) => {
      currentlyReadingBooksMap.set(book.id, book)
    })

    // Create a map of book_id to progress percentage
    // Use Supabase as single source of truth - use whatever data exists in Supabase
    // Priority: current_page/total_pages calculation > progress_percentage > percentage
    const progressMap = new Map<string, number | null>()
    filteredProgress.forEach((rp: any) => {
      if (rp.book_id) {
        let percentage: number | null = null

        // Debug: Log actual data from Supabase
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Supabase reading_progress data:', {
            book_id: rp.book_id,
            progress_percentage: rp.progress_percentage,
            percentage: rp.percentage,
            current_page: rp.current_page,
            total_pages: rp.total_pages,
            hasProgressPercentage: typeof rp.progress_percentage === 'number',
            hasPercentage: typeof rp.percentage === 'number',
            hasCurrentPage: rp.current_page !== null && rp.current_page !== undefined,
            hasTotalPages: rp.total_pages !== null && rp.total_pages !== undefined,
          })
        }

        // Priority 1: Calculate from current_page (reading_progress) and pages (books table - single source of truth)
        // Use Supabase as single source of truth - books.pages is the ONLY source for total pages
        const bookData = currentlyReadingBooksMap.get(rp.book_id)
        const totalPagesFromBook = bookData?.pages || null

        if (
          rp.current_page !== null &&
          rp.current_page !== undefined &&
          rp.current_page > 0 &&
          totalPagesFromBook !== null &&
          totalPagesFromBook !== undefined &&
          totalPagesFromBook > 0
        ) {
          percentage = Math.round((rp.current_page / totalPagesFromBook) * 100)
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Calculated from pages (Supabase data):', {
              book_id: rp.book_id,
              current_page: rp.current_page,
              pages_from_book: totalPagesFromBook,
              calculated: percentage,
            })
          }
        }
        // Priority 2: Use progress_percentage from Supabase if available (including 0)
        else if (typeof rp.progress_percentage === 'number') {
          percentage = rp.progress_percentage
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Using progress_percentage from Supabase:', {
              book_id: rp.book_id,
              progress_percentage: percentage,
            })
          }
        }
        // Priority 3: Use percentage field from Supabase if available
        else if (typeof rp.percentage === 'number') {
          percentage = rp.percentage
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Using percentage from Supabase:', {
              book_id: rp.book_id,
              percentage: percentage,
            })
          }
        }
        // No progress data available in Supabase
        else {
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ No progress data in Supabase:', {
              book_id: rp.book_id,
              progress_percentage: rp.progress_percentage,
              percentage: rp.percentage,
              current_page: rp.current_page,
              total_pages: rp.total_pages,
              pages_from_book: totalPagesFromBook,
            })
          }
        }

        progressMap.set(rp.book_id, percentage)
      }
    })

    // Fetch authors for all currently reading books
    const currentlyReadingAuthorMap = new Map<string, any>()
    const { data: currentlyReadingBookAuthors, error: currentlyReadingAuthorsError } =
      await supabaseAdmin
        .from('book_authors')
        .select(
          `
          book_id,
          authors (
            id,
            name
          )
        `
        )
        .in('book_id', currentlyReadingBookIds)

    if (!currentlyReadingAuthorsError && currentlyReadingBookAuthors) {
      currentlyReadingBookAuthors.forEach((ba: any) => {
        if (ba.authors && !currentlyReadingAuthorMap.has(ba.book_id)) {
          currentlyReadingAuthorMap.set(ba.book_id, ba.authors)
        }
      })
    }

    // Transform the data to match the structure expected by the client component
    const currentlyReadingBooks = filteredProgress
      .map((rp: any) => {
        const book = currentlyReadingBooksMap.get(rp.book_id)
        if (!book || !book.id) {
          return null
        }

        const author = currentlyReadingAuthorMap.get(book.id) || null
        // Get the reading progress entry to access ALL data from Supabase
        const rpEntry = filteredProgress.find((rp: any) => rp.book_id === book.id)
        
        // Use Supabase data directly - get progress_percentage from map (which was calculated from Supabase data)
        const progress_percentage = progressMap.has(book.id) ? progressMap.get(book.id) : null

        // Use Supabase as single source of truth - current_page from reading_progress, pages from books table
        const currentPage = rpEntry?.current_page !== null && rpEntry?.current_page !== undefined ? rpEntry.current_page : null
        const totalPages = book.pages !== null && book.pages !== undefined ? book.pages : null

        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Final book data from Supabase:', {
            book_id: book.id,
            title: book.title,
            progress_percentage: progress_percentage,
            current_page: currentPage,
            total_pages: totalPages,
            rpEntry_exists: !!rpEntry,
          })
        }

        return {
          id: book.id,
          title: book.title,
          permalink: book.permalink || null,
          coverImageUrl: book.cover_image?.url || null,
          progress_percentage: progress_percentage,
          currentPage: currentPage,
          totalPages: totalPages,
          author: author
            ? {
                id: author.id,
                name: author.name,
              }
            : null,
        }
      })
      .filter(Boolean) // Remove null entries
      .slice(0, 5) // Limit to 5 books

    return currentlyReadingBooks
  } catch (error: any) {
    console.error('Error in getCurrentlyReadingBooksForUser:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      error: error,
    })
    return []
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  // Get current user (viewer) for privacy checks
  let viewerId: string | null = null
  try {
    const supabase = await createServerComponentClientAsync()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    viewerId = currentUser?.id || null
  } catch (error) {
    // If auth fails, viewerId remains null (public user)
    console.log('No authenticated user, viewing as public')
  }

  try {
    // First, try to find user by permalink
    let user = null
    let error = null

    // Check if the ID looks like a UUID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    if (isUUID) {
      // Try to find by UUID first
      const { data: uuidUser, error: uuidError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, permalink, location, website')
        .eq('id', id)
        .single()

      if (!uuidError && uuidUser) {
        user = uuidUser
      } else {
        // If not found by UUID, try by permalink
        const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
          .from('users')
          .select('id, name, email, created_at, permalink, location, website')
          .eq('permalink', id)
          .single()

        if (!permalinkError && permalinkUser) {
          user = permalinkUser
        } else {
          error = permalinkError
        }
      }
    } else {
      // Try to find by permalink
      const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, permalink, location, website')
        .eq('permalink', id)
        .single()

      if (!permalinkError && permalinkUser) {
        user = permalinkUser
      } else {
        error = permalinkError
      }
    }

    if (error || !user) {
      console.error('User not found:', error)
      notFound()
    }

    // Fetch user statistics
    const userStats = {
      booksRead: 0,
      friendsCount: 0,
      followersCount: 0, // Added missing followersCount
      location: user.location, // Now available from the users table
      website: user.website, // Now available from the users table
      joinedDate: user.created_at,
    }

    // Initialize followers and friends arrays at the top level
    let followers: any[] = []
    let friends: any[] = []
    let books: any[] = []

    try {
      // Get books read count
      const { data: booksRead, error: booksError } = await supabaseAdmin
        .from('reading_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed')

      if (!booksError) {
        userStats.booksRead = booksRead?.length || 0
        console.log('📚 Books Read Query:', { booksRead: booksRead?.length, error: booksError })
      }

      // Get friends count
      const { data: friendsCountData, error: friendsError } = await supabaseAdmin
        .from('user_friends')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const { data: reverseFriends, error: reverseFriendsError } = await supabaseAdmin
        .from('user_friends')
        .select('id', { count: 'exact' })
        .eq('friend_id', user.id)
        .eq('status', 'accepted')

      if (!friendsError && !reverseFriendsError) {
        userStats.friendsCount = (friendsCountData?.length || 0) + (reverseFriends?.length || 0)

        console.log('👥 Friends Query:', {
          friends: friendsCountData?.length,
          reverseFriends: reverseFriends?.length,
          totalFriends: userStats.friendsCount,
        })
      }

      // Get followers count and list from follows table (users following this user)
      try {
        const followersCount = await getFollowersCount(user.id, 'user')
        userStats.followersCount = followersCount

        // Fetch followers list if count > 0
        if (followersCount > 0) {
          const followersData = await getFollowers(user.id, 'user', 1, 100) // Get up to 100 followers
          followers = followersData.followers || []
        }
        console.log('👥 Followers Count:', followersCount, 'Followers List:', followers.length)
      } catch (followersError) {
        console.error('Error fetching followers:', followersError)
        // Continue with default value of 0
        userStats.followersCount = 0
        followers = []
      }

      // Get friends list (users who are friends with this user)
      try {
        if (userStats.friendsCount > 0) {
          const friendsData = await getFriends(user.id, 1, 100) // Get up to 100 friends
          friends = friendsData.friends || []
        }
        console.log('👥 Friends Count:', userStats.friendsCount, 'Friends List:', friends.length)
      } catch (friendsError) {
        console.error('Error fetching friends:', friendsError)
        friends = []
      }
    } catch (statsError) {
      console.error('Error fetching user stats:', statsError)
      // Continue with default values if stats fail
    }

    // Fetch avatar and cover images from images table via profiles
    let avatarUrl = '/placeholder.svg?height=200&width=200'
    let coverImageUrl = '/placeholder.svg?height=400&width=1200'

    try {
      // Get profile with avatar_image_id and cover_image_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('avatar_image_id, cover_image_id')
        .eq('user_id', user.id)
        .single()

      if (!profileError && profile) {
        // Fetch avatar image if avatar_image_id exists
        if (profile.avatar_image_id) {
          const { data: avatarImage, error: avatarError } = await supabaseAdmin
            .from('images')
            .select('url')
            .eq('id', profile.avatar_image_id)
            .single()

          if (!avatarError && avatarImage?.url) {
            avatarUrl = avatarImage.url
          }
        }

        // Fetch cover image if cover_image_id exists
        if (profile.cover_image_id) {
          const { data: coverImage, error: coverError } = await supabaseAdmin
            .from('images')
            .select('url')
            .eq('id', profile.cover_image_id)
            .single()

          if (!coverError && coverImage?.url) {
            coverImageUrl = coverImage.url
          }
        }
      }
    } catch (imageError) {
      console.error('Error fetching profile images:', imageError)
      // Continue with placeholder images if fetch fails
    }

    // Fetch user's books from reading_progress
    try {
      // First, fetch reading progress entries - only select columns that exist for all statuses
      const { data: readingProgress, error: readingError } = await supabaseAdmin
        .from('reading_progress')
        .select('id, book_id, status, progress_percentage, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (readingError) {
        console.error('Error fetching reading progress:', readingError)
        books = []
      } else if (readingProgress && readingProgress.length > 0) {
        // Get all book IDs
        const bookIds = readingProgress.map((rp: any) => rp.book_id).filter(Boolean)

        if (bookIds.length === 0) {
          console.log('📚 No book IDs found in reading progress')
          books = []
        } else {
          // Fetch books with cover images
          const { data: booksFromDb, error: booksError } = await supabaseAdmin
            .from('books')
            .select(
              `
              id,
              title,
              cover_image_id,
              cover_image:images!books_cover_image_id_fkey(url, alt_text)
            `
            )
            .in('id', bookIds)

          if (booksError) {
            console.error('Error fetching books:', booksError)
            books = []
          } else if (!booksFromDb || booksFromDb.length === 0) {
            console.log('📚 No books found for IDs:', bookIds)
            books = []
          } else {
            const booksData = booksFromDb

            // Create a map of book_id to book data
            const booksMap = new Map<string, any>()
            booksData.forEach((book: any) => {
              booksMap.set(book.id, book)
            })

            // Fetch authors for all books
            const authorMap = new Map<string, any>()
            const { data: bookAuthors, error: authorsError } = await supabaseAdmin
              .from('book_authors')
              .select(
                `
                book_id,
                authors (
                  id,
                  name
                )
              `
              )
              .in('book_id', bookIds)

            if (!authorsError && bookAuthors) {
              bookAuthors.forEach((ba: any) => {
                if (ba.authors && !authorMap.has(ba.book_id)) {
                  authorMap.set(ba.book_id, ba.authors)
                }
              })
            }

            // For completed books, fetch rating separately if needed
            const completedBookIds = readingProgress
              .filter((rp: any) => rp.status === 'completed')
              .map((rp: any) => rp.book_id)
              .filter(Boolean)

            const ratingMap = new Map<string, number | null>()
            if (completedBookIds.length > 0) {
              const { data: completedProgress, error: ratingError } = await supabaseAdmin
                .from('reading_progress')
                .select('book_id, rating')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .in('book_id', completedBookIds)

              if (!ratingError && completedProgress) {
                completedProgress.forEach((cp: any) => {
                  if (cp.book_id && cp.rating !== null && cp.rating !== undefined) {
                    ratingMap.set(cp.book_id, cp.rating)
                  }
                })
              }
            }

            // Transform the data to match BookCard props
            books = readingProgress
              .map((rp: any) => {
                const book = booksMap.get(rp.book_id)
                if (!book || !book.id) {
                  return null
                }

                const author = authorMap.get(book.id) || null
                const rating = ratingMap.get(book.id) || null

                return {
                  id: book.id,
                  title: book.title,
                  coverImageUrl: book.cover_image?.url || null,
                  status: rp.status,
                  rating: rating,
                  progress_percentage: rp.progress_percentage,
                  author: author
                    ? {
                        id: author.id,
                        name: author.name,
                      }
                    : null,
                }
              })
              .filter(Boolean) // Remove null entries

            console.log('📚 Final books array:', {
              readingProgressCount: readingProgress.length,
              booksCount: books.length,
              bookIds: bookIds.length,
              booksDataCount: booksData.length,
              authorMapSize: authorMap.size,
            })
          }
        }
      } else {
        console.log('📚 No reading progress found for user:', user.id)
        books = []
      }
    } catch (booksError) {
      console.error('Error fetching user books:', booksError)
      books = []
    }

    // Fetch currently reading books with privacy filtering
    const currentlyReadingBooks = await getCurrentlyReadingBooksForUser(user.id, viewerId)

    // Temporary debug logging
    console.log('🔍 Profile Page Debug:', {
      user: user,
      userStats: userStats,
      booksRead: userStats.booksRead,
      friendsCount: userStats.friendsCount,
      followersCount: userStats.followersCount,
      booksCount: books.length,
      currentlyReadingCount: currentlyReadingBooks.length,
    })

    return (
      <ClientProfilePage
        user={user}
        userStats={userStats}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        followers={followers}
        followersCount={userStats.followersCount}
        friends={friends}
        friendsCount={userStats.friendsCount}
        books={books}
        currentlyReadingBooks={currentlyReadingBooks}
        params={{ id: user.id }}
      />
    )
  } catch (error) {
    console.error('Error loading user profile:', error)
    notFound()
  }
}
