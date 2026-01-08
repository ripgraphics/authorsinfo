import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import type { Author } from '@/types/database'
import { ClientAuthorPage } from './client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getFollowers, getFollowersCount } from '@/lib/follows-server'
import { getAuthorEvents } from '@/lib/events'
import EventCard from '@/components/event-card'
import type { Event } from '@/types/database'
import { createClient } from '@/lib/supabase-server'

interface AuthorPageProps {
  params: Promise<{
    id: string
  }>
}

interface AlbumImage {
  image: {
    url: string
  }
}

interface AlbumData {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  album_images: AlbumImage[]
}

async function getAuthor(id: string) {
  try {
    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .select(
        `
    *,
        cover_image:cover_image_id(id, url, alt_text),
        author_image:author_image_id(id, url, alt_text)
  `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching author:', error)
      return null
    }

    return author as Author
  } catch (error) {
    console.error('Unexpected error fetching author:', error)
    return null
  }
}

async function getAuthorBooks(authorId: string) {
  // This query should match the query structure used in the books page
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select(
      `
      id,
      title,
      cover_image:cover_image_id(id, url, alt_text)
    `
    )
    .eq('author_id', authorId)
    .order('title')
    .limit(12)

  if (error) {
    console.error('Error fetching author books:', error)
    return []
  }

  // Process books to include cover image URL - ONLY from Cloudinary (no fallback to original_image_url)
  const bookRows = (books ?? []) as any[]
  return bookRows.map((book) => {
    // Determine the cover image URL - ONLY from Cloudinary
    // If Cloudinary image is missing, show nothing (so we know it's broken)
    let coverImageUrl = null
    if (book.cover_image?.url) {
      coverImageUrl = book.cover_image.url
    } else if (book.cover_image_url) {
      coverImageUrl = book.cover_image_url
    }
    // NO fallback to original_image_url - images table is source of truth

    return {
      id: book.id,
      title: book.title,
      cover_image_url: coverImageUrl,
    }
  })
}

async function getAuthorFollowers(authorId: string) {
  try {
    // Get first 50 followers
    const { followers, count } = await getFollowers(authorId, 'author', 1, 50)
    return { followers, count }
  } catch (error) {
    console.error('Error fetching author followers:', error)
    return { followers: [], count: 0 }
  }
}

async function getAuthorActivities(authorId: string) {
  try {
    // First, get books by this author
    const { data: authorBooks } = await supabaseAdmin
      .from('books')
      .select('id')
      .eq('author_id', authorId)

    if (!authorBooks || authorBooks.length === 0) {
      console.log('No books found for author ID:', authorId)
      return []
    }

    const bookIds = authorBooks.map((book) => book.id)

    // Get activities related to these books
    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select(
        `
        id,
        activity_type,
        created_at,
        data,
        book_id,
        user_id
      `
      )
      .in('book_id', bookIds)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching author activities:', error)
      return []
    }

    if (!activities || activities.length === 0) {
      console.log("No activities found for author's books")
      // Return empty array to use mock data on the client
      return []
    }

    // Get book information for all activities
    const activityBookIds = activities.map((activity) => activity.book_id).filter(Boolean)

    let books: Record<string, any> = {}

    if (activityBookIds.length > 0) {
      const { data: booksData } = await supabaseAdmin
        .from('books')
        .select('id, title, author')
        .in('id', activityBookIds)

      if (booksData) {
        // Create a lookup map by book id
        books = booksData.reduce(
          (acc, book) => {
            acc[book.id] = book
            return acc
          },
          {} as Record<string, any>
        )
      }
    }

    // Get user information for each activity
    const userIds = activities.map((activity) => activity.user_id).filter(Boolean)
    let users: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from('profiles')
        .select('user_id, bio')
        .in('user_id', userIds)

      if (usersData) {
        // Create a lookup map by user id
        users = usersData.reduce(
          (acc, user) => {
            acc[user.user_id] = user
            return acc
          },
          {} as Record<string, any>
        )
      }
    }

    // Format the activities for display
    return activities.map((activity) => {
      // Calculate time ago for display
      const timeAgo = getTimeAgo(new Date(activity.created_at))

      // Cast data to appropriate type
      const data = activity.data as Record<string, any> | null

      // Get book information from our lookup map
      const book = activity.book_id ? books[activity.book_id] : null

      return {
        id: activity.id,
        type: activity.activity_type,
        timeAgo,
        bookTitle: book?.title || data?.book_title || 'Unknown Book',
        bookAuthor: book?.author || data?.book_author || 'Unknown Author',
        rating: data?.rating as number,
        shelf: data?.shelf as string,
        reviewText: data?.review_text as string,
        books: book,
      }
    })
  } catch (error) {
    console.error('Unexpected error fetching author activities:', error)
    return []
  }
}

async function getAuthorAlbums(authorId: string) {
  try {
    const supabase = createClient()

    // Check if authorId is already a UUID (contains hyphens)
    const isUuid = authorId.includes('-')
    const entityId = isUuid ? authorId : `00000000-0000-0000-0000-${authorId.padStart(12, '0')}`

    const { data: albums, error } = await supabase
      .from('photo_albums')
      .select(
        `
        id,
        name,
        description,
        is_public,
        created_at,
        album_images(
          image:images(
            url
          )
        )
      `
      )
      .eq('entity_type', 'author')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching author albums:', error)
      return []
    }

    return (albums as unknown as AlbumData[]).map((album) => ({
      id: album.id,
      name: album.name,
      description: album.description || undefined,
      cover_image_url: album.album_images[0]?.image?.url || undefined,
      photo_count: album.album_images.length,
      created_at: album.created_at,
    }))
  } catch (error) {
    console.error('Error fetching author albums:', error)
    return []
  }
}

async function getCurrentlyReadingBooksByAuthor(authorId: string, currentUserId: string | null = null) {
  try {
    // First, get all books by this author from both author_id and book_authors junction table
    const [booksByAuthorIdResult, bookAuthorsResult] = await Promise.all([
      // Books with direct author_id
      supabaseAdmin
        .from('books')
        .select('id')
        .eq('author_id', authorId),
      // Books associated via book_authors junction table
      supabaseAdmin
        .from('book_authors')
        .select('book_id')
        .eq('author_id', authorId),
    ])

    // Combine and deduplicate book IDs
    const allBookIds = new Set<string>()
    
    // Add books from direct author_id
    if (booksByAuthorIdResult.data) {
      booksByAuthorIdResult.data.forEach((book: any) => allBookIds.add(book.id))
    }
    
    // Add books from junction table
    if (bookAuthorsResult.data && bookAuthorsResult.data.length > 0) {
      const junctionBookIds = bookAuthorsResult.data
        .map((ba: any) => ba.book_id)
        .filter(Boolean)
      
      if (junctionBookIds.length > 0) {
        const { data: junctionBooks } = await supabaseAdmin
          .from('books')
          .select('id')
          .in('id', junctionBookIds)
        
        if (junctionBooks) {
          junctionBooks.forEach((book: any) => allBookIds.add(book.id))
        }
      }
    }

    const bookIds = Array.from(allBookIds)

    if (bookIds.length === 0) {
      return []
    }

    // Get reading progress entries for books by this author that are currently being read
    // Following the same pattern as profile page - query directly from Supabase without privacy filtering
    // Fetch all progress fields to use Supabase as single source of truth
    const { data: readingProgress, error } = await supabaseAdmin
      .from('reading_progress')
      .select('id, book_id, user_id, progress_percentage, percentage, current_page, total_pages, updated_at, privacy_level, allow_friends, allow_followers')
      .in('book_id', bookIds)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      // Don't limit here - we need all entries to count total users per book

    if (error) {
      console.error('Error fetching currently reading books:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return []
    }

    if (!readingProgress || readingProgress.length === 0) {
      return []
    }

    // Get all book IDs from reading progress
    const progressBookIds = readingProgress.map((rp: any) => rp.book_id).filter(Boolean)

        // Fetch books with cover images and permalinks (same pattern as profile page)
        const { data: booksFromDb, error: booksError } = await supabaseAdmin
          .from('books')
          .select(
            `
            id,
            title,
            permalink,
            cover_image_id,
            pages,
            cover_image:images!books_cover_image_id_fkey(url, alt_text)
          `
          )
          .in('id', progressBookIds)

    if (booksError) {
      console.error('Error fetching books:', booksError)
      return []
    }

    if (!booksFromDb || booksFromDb.length === 0) {
      return []
    }

    // Create a map of book_id to book data
    const booksMap = new Map<string, any>()
    booksFromDb.forEach((book: any) => {
      booksMap.set(book.id, book)
    })

    // Create a map of book_id+user_id to progress percentage
    // Use Supabase as single source of truth - calculate from current_page/total_pages if available (most accurate)
    // Priority: current_page/total_pages > progress_percentage > percentage
    const progressMap = new Map<string, number | null>()
    readingProgress.forEach((rp: any) => {
      if (rp.id && rp.book_id && rp.user_id) {
        // Use a composite key of book_id + user_id to track progress per user
        const key = `${rp.book_id}_${rp.user_id}`
        let percentage: number | null = null

        // Priority 1: Calculate from current_page (reading_progress) and pages (books table - single source of truth)
        // Use Supabase as single source of truth - books.pages is the ONLY source for total pages
        const bookData = booksMap.get(rp.book_id)
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
        }
        // Priority 2: Use progress_percentage if it's a valid number (including 0)
        else if (typeof rp.progress_percentage === 'number') {
          percentage = rp.progress_percentage
        }
        // Priority 3: Use percentage field if progress_percentage is not available
        else if (typeof rp.percentage === 'number') {
          percentage = rp.percentage
        }

        progressMap.set(key, percentage)
      }
    })

    // Get unique user IDs from reading progress
    const userIds = Array.from(
      new Set(readingProgress.map((rp: any) => rp.user_id).filter(Boolean))
    )

    // Fetch user names from users table
    const usersMap = new Map<string, any>()
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .in('id', userIds)

      if (!usersError && users) {
        users.forEach((user: any) => {
          usersMap.set(user.id, user)
        })
      }
    }

    // Fetch profiles for avatar_image_id
    const profilesMap = new Map<string, any>()
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, avatar_image_id')
        .in('user_id', userIds)

      if (!profilesError && profiles) {
        profiles.forEach((profile: any) => {
          profilesMap.set(profile.user_id, profile)
        })
      }
    }

    // Fetch avatar URLs from images table
    const avatarImageIds = Array.from(
      new Set(
        Array.from(profilesMap.values())
          .map((p: any) => p.avatar_image_id)
          .filter(Boolean)
      )
    )

    const avatarMap = new Map<string, string>()
    if (avatarImageIds.length > 0) {
      const { data: images, error: imagesError } = await supabaseAdmin
        .from('images')
        .select('id, url')
        .in('id', avatarImageIds)

      if (!imagesError && images) {
        images.forEach((image: any) => {
          avatarMap.set(image.id, image.url)
        })
      }
    }

    // Fetch authors for all books (same pattern as profile page)
    const { data: bookAuthors } = await supabaseAdmin
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
      .in('book_id', progressBookIds)

    const authorMap = new Map<string, any>()
    if (bookAuthors) {
      bookAuthors.forEach((ba: any) => {
        if (ba.authors && !authorMap.has(ba.book_id)) {
          authorMap.set(ba.book_id, ba.authors)
        }
      })
    }

    // Get current user's friends if user is logged in
    let friendUserIds: Set<string> = new Set()
    if (currentUserId) {
      const { data: friendsData } = await supabaseAdmin
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'accepted')

      if (friendsData) {
        friendsData.forEach((friend: any) => {
          const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id
          friendUserIds.add(friendId)
        })
      }
    }

    // Count total users and mutual friends per book
    const bookUserCounts = new Map<string, { totalUsers: number; mutualFriends: number }>()
    
    readingProgress.forEach((rp: any) => {
      if (!rp.book_id) return
      
      const existing = bookUserCounts.get(rp.book_id) || { totalUsers: 0, mutualFriends: 0 }
      existing.totalUsers++
      
      // Check if this user is a mutual friend
      if (currentUserId && rp.user_id !== currentUserId && friendUserIds.has(rp.user_id)) {
        existing.mutualFriends++
      }
      
      bookUserCounts.set(rp.book_id, existing)
    })

    // Transform the data to match the structure expected by the client component (same pattern as profile page)
    // Deduplicate by book_id - if multiple users are reading the same book, show the most recent one
    const bookProgressMap = new Map<string, any>()
    
    readingProgress.forEach((rp: any) => {
      const book = booksMap.get(rp.book_id)
      if (!book || !book.id) {
        return
      }

      // If we already have this book, keep the one with the most recent updated_at
      const existing = bookProgressMap.get(book.id)
      if (!existing || new Date(rp.updated_at) > new Date(existing.updatedAt)) {
        const author = authorMap.get(book.id) || null
        const progressKey = `${rp.book_id}_${rp.user_id}`
        const progress_percentage = progressMap.get(progressKey) || null
        const user = usersMap.get(rp.user_id)
        const profile = user ? profilesMap.get(user.id) : null
        const avatarUrl = profile?.avatar_image_id
          ? avatarMap.get(profile.avatar_image_id) || null
          : null

        const counts = bookUserCounts.get(book.id) || { totalUsers: 0, mutualFriends: 0 }
        
        bookProgressMap.set(book.id, {
          id: book.id,
          title: book.title,
          permalink: book.permalink || null,
          coverImageUrl: book.cover_image?.url || null,
          percentage: progress_percentage,
          currentPage: rp.current_page !== null && rp.current_page !== undefined ? rp.current_page : null,
          totalPages: book.pages || null, // Single source of truth - only use books.pages
          author: author
            ? {
                id: author.id,
                name: author.name,
              }
            : null,
          user: user
            ? {
                id: user.id,
                name: user.name || 'Unknown User',
                avatarUrl: avatarUrl,
              }
            : null,
          updatedAt: rp.updated_at,
          totalUsersReading: counts.totalUsers,
          mutualFriendsReading: counts.mutualFriends,
        })
      }
    })

    // Convert map to array and sort by updatedAt (most recent first)
    return Array.from(bookProgressMap.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  } catch (error: any) {
    console.error('Error fetching currently reading books by author:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      error: error,
    })
    return []
  }
}

// Helper function to convert timestamp to "time ago" format
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  // Await params before accessing its properties
  const { id: authorId } = await params

  if (!authorId) {
    notFound()
  }

  const author = await getAuthor(authorId)
  if (!author) {
    notFound()
  }

  // Get current user ID if logged in
  const supabase = await createServerComponentClientAsync()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUserId = user?.id || null

  const [books, followers, activities, albums, currentlyReadingBooks] = await Promise.all([
    getAuthorBooks(authorId),
    getAuthorFollowers(authorId),
    getAuthorActivities(authorId),
    getAuthorAlbums(authorId),
    getCurrentlyReadingBooksByAuthor(authorId, currentUserId),
  ])

  return (
    <ClientAuthorPage
      author={author}
      authorImageUrl={author.author_image?.url || ''}
      coverImageUrl={author.cover_image?.url || ''}
      params={{ id: authorId }}
      followers={followers.followers}
      followersCount={followers.count}
      books={books}
      booksCount={books.length}
      activities={activities}
      photos={[]} // TODO: Implement photo fetching
      photosCount={0} // TODO: Implement photo count
      albums={albums}
      currentlyReadingBooks={currentlyReadingBooks}
    />
  )
}
