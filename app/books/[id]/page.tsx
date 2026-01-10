import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import {
  getBookById,
  getAuthorsByBookId,
  getPublisherById,
  getReviewsByBookId,
  getBooksByPublisherId,
  getBooksByAuthorId,
  testDatabaseConnection,
} from '@/app/actions/data'
import { supabaseAdmin } from '@/lib/supabase'
import type { Book, Author, Review, BindingType, FormatType } from '@/types/book'
import { PageBanner } from '@/components/page-banner'
import { ClientBookPage } from './client'
import { getFollowers, getFollowersCount, getMutualFriendsCount } from '@/lib/follows-server'
import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BookPageProps {
  params: {
    id: string
  }
}

// Function to get binding and format types
async function getBookFormatAndBinding(bookId: string) {
  try {
    // First, get the book to get the binding_type_id and format_type_id
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('binding_type_id, format_type_id')
      .eq('id', bookId)
      .single()

    if (bookError) {
      console.error('Error fetching book binding and format IDs:', bookError)
      return { bindingType: null, formatType: null }
    }

    // Get binding type if it exists
    let bindingType = null
    if (book.binding_type_id) {
      const { data: bindingData, error: bindingError } = await supabaseAdmin
        .from('binding_types')
        .select('id, name, description')
        .eq('id', book.binding_type_id)
        .single()

      if (!bindingError && bindingData) {
        bindingType = {
          id: bindingData.id,
          name: bindingData.name,
          description: bindingData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as BindingType
      }
    }

    // Get format type if it exists
    let formatType = null
    if (book.format_type_id) {
      const { data: formatData, error: formatError } = await supabaseAdmin
        .from('format_types')
        .select('id, name, description')
        .eq('id', book.format_type_id)
        .single()

      if (!formatError && formatData) {
        formatType = {
          id: formatData.id,
          name: formatData.name,
          description: formatData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as FormatType
      }
    }

    return { bindingType, formatType }
  } catch (error) {
    console.error('Error in getBookFormatAndBinding:', error)
    return { bindingType: null, formatType: null }
  }
}

// Function to get a sample user from the database
async function getSampleUser() {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1).single()

    if (error) {
      console.error('Error fetching sample user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getSampleUser:', error)
    return null
  }
}

// Function to get user's reading progress for a book
async function getUserReadingProgress(userId: string | null, bookId: string) {
  // If no userId is provided, return null
  if (!userId) {
    return null
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('reading_progress')
      .select('*, current_page, progress_percentage') // Explicitly include current_page and progress_percentage
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single()

    if (error) {
      // If the error is that no rows were returned, that's fine
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching reading progress:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserReadingProgress:', error)
    return null
  }
}

export default async function BookPageServer({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id
  const supabase = await createServerComponentClientAsync()
  
  // Get current user for mutual friends calculation
  let currentUserId: string | null = null
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    currentUserId = user?.id || null
  } catch (error) {
    // User not logged in, continue without mutual friends
    currentUserId = null
  }

  // Special case: if id is "add", redirect to the add page
  if (id === 'add') {
    redirect('/books/add')
  }

  // Test database connection first (silent)
  const dbConnectionOk = await testDatabaseConnection()
  if (!dbConnectionOk) {
    console.error('Database connection failed, cannot fetch book')
    return <div>Database connection error. Please try again later.</div>
  }

  try {
    const bookOrNull = await getBookById(id)
    if (!bookOrNull) {
      notFound()
    }
    const book = bookOrNull

    // Map DB authors to domain Author
    let authors: Author[] = []
    try {
      const rawAuthors = (await getAuthorsByBookId(id)) as any[]
      authors = rawAuthors.map((a) => ({
        id: String(a.id),
        name: a.name,
        bio: a.bio ?? undefined,
        created_at: a.created_at,
        updated_at: a.updated_at,
        author_image: a.author_image ?? null,
        cover_image_id: a.cover_image_id ?? undefined,
      }))
    } catch (error) {
      console.error('Error fetching authors:', error)
      // Continue with empty authors array
    }

    // Fetch publisher if available with error handling
    let publisher = null
    try {
      if (book.publisher_id != null) {
        // Quiet: remove verbose publisher_id type log
        publisher = await getPublisherById(book.publisher_id.toString())
        // Quiet
      } else {
        // Quiet
      }
    } catch (error) {
      console.error(
        'Error fetching publisher for book:',
        id,
        'publisher_id:',
        book.publisher_id,
        'error:',
        error
      )
      // Continue with null publisher
    }

    // Fetch publisher's total books, author count, followers count, and mutual friends count for hover card
    let publisherBooksCount = 0
    let publisherAuthorCount = 0
    let publisherFollowersCount = 0
    let publisherMutualFriendsCount = 0
    if (publisher) {
      const { getPublisherAuthorCount } = await import('@/app/actions/data')
      const publisherBooks = await getBooksByPublisherId(publisher.id)
      publisherBooksCount = publisherBooks.length
      publisherAuthorCount = await getPublisherAuthorCount(publisher.id)
      
      // Get followers count
      try {
        publisherFollowersCount = await getFollowersCount(publisher.id, 'publisher')
      } catch (error) {
        console.error(`Error fetching followers count for publisher ${publisher.id}:`, error)
        publisherFollowersCount = 0
      }
      
      // Get mutual friends count
      if (currentUserId) {
        try {
          publisherMutualFriendsCount = await getMutualFriendsCount(publisher.id, 'publisher', currentUserId)
        } catch (error) {
          console.error(`Error fetching mutual friends count for publisher ${publisher.id}:`, error)
          publisherMutualFriendsCount = 0
        }
      }
    }

    // Fetch book counts, followers count, and mutual friends count for each author for hover cards
    const authorBookCounts: Record<string, number> = {}
    const authorFollowersCounts: Record<string, number> = {}
    const authorMutualFriendsCounts: Record<string, number> = {}
    for (const author of authors) {
      const booksByAuthor = await getBooksByAuthorId(author.id)
      authorBookCounts[author.id] = booksByAuthor.length
      
      // Get followers count
      try {
        authorFollowersCounts[author.id] = await getFollowersCount(author.id, 'author')
      } catch (error) {
        console.error(`Error fetching followers count for author ${author.id}:`, error)
        authorFollowersCounts[author.id] = 0
      }
      
      // Get mutual friends count
      if (currentUserId) {
        try {
          authorMutualFriendsCounts[author.id] = await getMutualFriendsCount(author.id, 'author', currentUserId)
        } catch (error) {
          console.error(`Error fetching mutual friends count for author ${author.id}:`, error)
          authorMutualFriendsCounts[author.id] = 0
        }
      } else {
        authorMutualFriendsCounts[author.id] = 0
      }
    }

    // Map DB reviews to domain Review
    let reviews: Review[] = []
    try {
      const rawReviews = (await getReviewsByBookId(id)) as any[]
      reviews = rawReviews.map((r) => ({
        id: r.id,
        book_id: r.book_id,
        user_id: r.user_id,
        rating: r.rating,
        content: r.content ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
        contains_spoilers: false,
      }))
    } catch (error) {
      console.error('Error fetching reviews:', error)
      // Continue with empty reviews array
    }

    // Fetch binding and format types
    const { bindingType, formatType } = (await getBookFormatAndBinding(id)) as {
      bindingType: BindingType | null
      formatType: FormatType | null
    }

    // Get a sample user from the database
    const sampleUser = await getSampleUser()
    const userId = sampleUser?.id || null

    // Fetch user's reading progress
    let readingProgress: any = null
    try {
      readingProgress = await getUserReadingProgress(userId, id)
    } catch (error) {
      console.error('Error fetching reading progress:', error)
      // Continue with null reading progress
    }

    // Fetch followers for this book
    let followers: any[] = []
    let followersCount = 0
    try {
      const followersData = await getFollowers(id, 'book')
      followers = followersData.followers
      followersCount = followersData.count
    } catch (error) {
      console.error('Error fetching book followers:', error)
      // Continue with empty followers array and default count
      followersCount = 0
    }

    // Fetch mutual friends count for this book
    let bookMutualFriendsCount = 0
    if (userId) {
      try {
        const { getMutualFriendsCount } = await import('@/lib/follows-server')
        bookMutualFriendsCount = await getMutualFriendsCount(id, 'book', userId)
      } catch (error) {
        console.error('Error fetching mutual friends count for book:', error)
        bookMutualFriendsCount = 0
      }
    }

    return (
      <>
        {/* Full width banner outside container constraints */}
        <div className="w-full">
          <PageBanner />
        </div>

        <ClientBookPage
          book={book}
          authors={authors}
          publisher={publisher}
          publisherBooksCount={publisherBooksCount}
          publisherAuthorCount={publisherAuthorCount}
          publisherFollowersCount={publisherFollowersCount}
          publisherMutualFriendsCount={publisherMutualFriendsCount}
          authorBookCounts={authorBookCounts}
          authorFollowersCounts={authorFollowersCounts}
          authorMutualFriendsCounts={authorMutualFriendsCounts}
          reviews={reviews}
          bindingType={bindingType}
          formatType={formatType}
          readingProgress={readingProgress}
          followers={followers}
          followersCount={followersCount}
          bookMutualFriendsCount={bookMutualFriendsCount}
          params={{ id }}
        />
      </>
    )
  } catch (error) {
    console.error('Error in BookPage:', error)
    return <div>Error loading book details.</div> // Or a more user-friendly error message
  }
}
