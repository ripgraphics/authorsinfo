import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'
import { notFound } from 'next/navigation'
import type { Author } from '@/types/database'
import { ClientAuthorPage } from './client'
import { getFollowers } from '@/lib/follows-server'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

interface AuthorPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Fetch author data from Convex
 */
async function getAuthor(id: string) {
  try {
    const author = await fetchQuery(api.queries.authors.getAuthor, { id })
    if (!author) return null
    
    // Transform Convex author to match Supabase Author type
    return {
      id: author.supabaseId ?? author._id,
      name: author.name,
      bio: author.bio ?? undefined,
      featured: author.featured ?? false,
      birth_date: author.birthDate ? new Date(author.birthDate).toISOString() : undefined,
      nationality: author.nationality ?? undefined,
      website: author.website ?? undefined,
      author_image_id: author.authorImageId ?? undefined,
      twitter_handle: author.twitterHandle ?? undefined,
      social_handle: author.socialHandle ?? undefined,
      instagram_handle: author.instagramHandle ?? undefined,
      goodreads_url: author.goodreadsUrl ?? undefined,
      cover_image_id: author.coverImageId ?? undefined,
      created_at: new Date(author.createdAt).toISOString(),
      updated_at: new Date(author.updatedAt).toISOString(),
      author_image: author.authorImageId ? {
        id: author.authorImageId,
        url: '', // Resolved below via getAuthorImagesFromConvex
        alt_text: author.name,
      } : null,
      cover_image: author.coverImageId ? {
        id: author.coverImageId,
        url: '', // Resolved below via getAuthorImagesFromConvex
        alt_text: author.name,
      } : null,
    } as Author
  } catch (error) {
    console.error('Error fetching author from Convex:', error)
    return null
  }
}

/**
 * Fetch books by author from Convex
 */
async function getAuthorBooks(authorId: string) {
  try {
    const bookAuthors = await fetchQuery(api.queries.bookAuthors.getBooksByAuthor, { authorId })
    
    if (!bookAuthors || bookAuthors.length === 0) {
      console.log(`No books found for author ${authorId}`)
      return []
    }

    return bookAuthors.map((book: any) => ({
      id: book.id,
      title: book.title,
      cover_image_url: book.cover_image_url || book.coverImageId || null,
    }))
  } catch (error) {
    console.error('Error in getAuthorBooks:', error)
    return []
  }
}

async function getAuthorFollowers(authorId: string) {
  try {
    const { followers, count } = await getFollowers(authorId, 'author', 1, 50)
    return { followers, count }
  } catch (error) {
    console.error('Error fetching author followers:', error)
    return { followers: [], count: 0 }
  }
}

async function getAuthorActivities(authorId: string) {
  try {
    const activities = await fetchQuery(api.queries.activities.getAuthorActivities, {
      authorId,
      limit: 10,
    })
    return activities || []
  } catch (error) {
    console.error('Error fetching author activities:', error)
    return []
  }
}

async function getAuthorAlbums(authorId: string) {
  try {
    const albums = await fetchQuery(api.queries.activities.getAlbums, {
      entityId: authorId,
      entityType: 'author',
    })
    
    if (!albums) return []

    return albums.map((album: any) => ({
      id: album.id,
      name: album.name,
      description: album.description || undefined,
      cover_image_url: album.cover_image_url || album.album_images?.[0]?.image?.url || undefined,
      photo_count: album.album_images?.length || 0,
      created_at: album.created_at,
    }))
  } catch (error) {
    console.error('Error fetching author albums:', error)
    return []
  }
}

async function getCurrentlyReadingBooksByAuthor(authorId: string, currentUserId: string | null = null) {
  try {
    const readingProgress = await fetchQuery(api.queries.readingProgress.getReadingProgressByAuthor, {
      authorId,
      userId: currentUserId || undefined,
    })

    if (!readingProgress || readingProgress.length === 0) {
      return []
    }

    // Get unique book IDs and user IDs from reading progress
    const bookIds = Array.from(new Set(readingProgress.map((rp: any) => rp.bookId || rp.book_id).filter(Boolean)))
    const userIds = Array.from(new Set(readingProgress.map((rp: any) => rp.userId || rp.user_id).filter(Boolean)))

    // Fetch book details
    const books = await Promise.all(
      bookIds.map(async (bookId: string) => {
        try {
          const book = await fetchQuery(api.queries.books.getBook, { id: bookId })
          return book
        } catch {
          return null
        }
      })
    )
    const booksMap = new Map(books.filter(Boolean).map((b: any) => [b.id, b]))

    // Fetch user details
    const users = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          // Query users table directly
          const allUsers = await fetchQuery(api.queries.authors.listAuthors, {})
          return allUsers.find((u: any) => u.id === userId || u._id === userId) ?? null
        } catch {
          return null
        }
      })
    )
    const usersMap = new Map(users.filter(Boolean).map((u: any) => [u.id || u._id, u]))

    // Transform to match CurrentlyReadingBook interface
    return readingProgress.map((rp: any) => {
      const bookId = rp.bookId || rp.book_id
      const userId = rp.userId || rp.user_id
      const book = booksMap.get(bookId)
      const user = usersMap.get(userId)

      return {
        id: bookId,
        title: book?.title || 'Unknown Book',
        coverImageUrl: book?.coverUrl || book?.coverImageId || null,
        author: book?.author ? { id: book.author.id, name: book.author.name } : null,
        currentPage: rp.currentPage ?? rp.current_page ?? null,
        totalPages: rp.totalPages ?? rp.total_pages ?? null,
        percentage: rp.progressPercentage ?? rp.percentage ?? null,
        user: user ? {
          id: user.id || user._id,
          name: user.name || 'Unknown User',
          avatarUrl: user.avatarId || null,
        } : null,
        updatedAt: rp.updatedAt ?? rp.updated_at,
      }
    })
  } catch (error) {
    console.error('Error fetching currently reading books:', error)
    return []
  }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
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

  // Fetch author images from Convex
  let authorImageUrl = ''
  let coverImageUrl = ''
  try {
    const { getAuthorImagesFromConvex } = await import('@/lib/convex-server')
    const images = await getAuthorImagesFromConvex(authorId)
    
    // Find avatar image
    const avatarImage = images.find((img: any) => img.image_type === 'author_avatar' || img.is_featured)
    if (avatarImage && avatarImage.url) {
      authorImageUrl = avatarImage.url
    }
    
    // Find cover image
    const coverImage = images.find((img: any) => img.image_type === 'author_cover')
    if (coverImage && coverImage.url) {
      coverImageUrl = coverImage.url
    }
    
    // Fallback to convex data
    if (!authorImageUrl && author.author_image?.url) {
      authorImageUrl = author.author_image.url
    }
    if (!coverImageUrl && author.cover_image?.url) {
      coverImageUrl = author.cover_image.url
    }
  } catch (error) {
    console.error('Error fetching author images:', error)
    // Use fallback URLs
    authorImageUrl = author.author_image?.url || ''
    coverImageUrl = author.cover_image?.url || ''
  }

  const [books, followers, activities, albums, currentlyReadingBooks] = await Promise.all([
    getAuthorBooks(authorId),
    getAuthorFollowers(authorId),
    getAuthorActivities(authorId),
    getAuthorAlbums(authorId),
    getCurrentlyReadingBooksByAuthor(authorId, currentUserId),
  ])

  // Get total book count from Convex
  const bookAuthors = await fetchQuery(api.queries.bookAuthors.getBooksByAuthor, { authorId })
  const totalBooksCount = bookAuthors?.length ?? 0

  // Get mutual friends count for the author
  let authorMutualFriendsCount = 0
  if (currentUserId) {
    try {
      const { getMutualFriendsCount } = await import('@/lib/follows-server')
      authorMutualFriendsCount = await getMutualFriendsCount(authorId, 'author', currentUserId)
    } catch (error) {
      console.error(`Error fetching mutual friends count for author ${authorId}:`, error)
      authorMutualFriendsCount = 0
    }
  }

  return (
    <ClientAuthorPage
      author={author}
      authorImageUrl={authorImageUrl}
      coverImageUrl={coverImageUrl}
      params={{ id: authorId }}
      followers={followers.followers}
      followersCount={followers.count}
      authorMutualFriendsCount={authorMutualFriendsCount}
      books={books}
      booksCount={totalBooksCount}
      activities={activities}
      photos={[]}
      photosCount={0}
      albums={albums}
      currentlyReadingBooks={currentlyReadingBooks}
    />
  )
}