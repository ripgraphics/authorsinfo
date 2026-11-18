import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Book, Author, Review, BindingType, FormatType } from '@/types/book'
import { PageBanner } from '@/components/page-banner'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { ClientBookPage } from './client'
import { getFollowers, getFollowersCount, getMutualFriendsCount } from '@/lib/follows-server'
import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BookPageProps {
  params: Promise<{
    id: string
  }>
}

async function getBookDetails(bookId: string) {
  try {
    const result = await fetchQuery(api.queries.books.getBookDetails, { id: bookId }) as {
      book: {
        _id: string
        _creationTime: number
        supabaseId?: string
        title: string
        subtitle?: string
        description?: string
        isbn13?: string
        isbn10?: string
        publishedAt?: number
        publisherId?: string
        pageCount?: number
        language?: string
        format?: string
        coverImageId?: string
        coverUrl?: string
        price?: number
        currency?: string
        isAvailable?: boolean
        createdAt: number
        updatedAt: number
      } | null
      authors: Array<{
        _id: string
        _creationTime: number
        supabaseId?: string
        name: string
        bio?: string
        featured?: boolean
        birthDate?: number
        nationality?: string
        website?: string
        authorImageId?: string
        twitterHandle?: string
        socialHandle?: string
        instagramHandle?: string
        goodreadsUrl?: string
        coverImageId?: string
        createdAt: number
        updatedAt: number
      }>
      publisher: {
        _id: string
        _creationTime: number
        supabaseId?: string
        name: string
        website?: string
        logoId?: string
        createdAt: number
        updatedAt: number
      } | null
      bindingType: {
        id: string
        name: string
        description?: string
        createdAt?: number
        created_at?: string
        updatedAt?: number
        updated_at?: string
      } | null
      formatType: {
        id: string
        name: string
        description?: string
        createdAt?: number
        created_at?: string
        updatedAt?: number
        updated_at?: string
      } | null
    } | null
    return result
  } catch (error) {
    console.error('Error fetching book details:', error)
    return null
  }
}

async function getUserReadingProgress(currentUserId: string | null, bookId: string) {
  if (!currentUserId) return null
  try {
    const progress = await fetchQuery(api.queries.readingProgress.getReadingProgressByBook, {
      bookId,
      userId: currentUserId,
    })
    return progress || null
  } catch (error) {
    console.error('Error fetching reading progress:', error)
    return null
  }
}

function transformReviews(reviews: any[]): Review[] {
  return reviews.map((r) => ({
    id: r.id,
    book_id: r.bookId || r.book_id,
    user_id: r.userId || r.user_id,
    rating: r.rating,
    content: r.content ?? null,
    created_at: r.createdAt || r.created_at,
    updated_at: r.updatedAt || r.updated_at,
    contains_spoilers: false,
  }))
}

// Transform Convex book to Supabase Book type
function transformConvexBookToBook(book: any): Book {
  return {
    id: book.supabaseId ?? book._id,
    isbn10: book.isbn10 ?? null,
    isbn13: book.isbn13 ?? null,
    isbn: book.isbn13 ?? book.isbn10 ?? null,
    title: book.title,
    title_long: book.subtitle ?? null,
    publisher_id: book.publisherId ?? null,
    publication_date: book.publishedAt ? new Date(book.publishedAt).toISOString() : null,
    publish_date: book.publishedAt ? new Date(book.publishedAt).toISOString() : null,
    binding: null,
    pages: book.pageCount ?? null,
    page_count: book.pageCount ?? null,
    list_price: book.price ?? null,
    language: book.language ?? null,
    edition: null,
    synopsis: book.description ?? null,
    overview: book.description ?? null,
    dimensions: null,
    weight: null,
    lexile_measure: null,
    cover_image_id: book.coverImageId ?? null,
    original_image_url: book.coverUrl ?? null,
    cover_image_url: book.coverUrl ?? null,
    cover_image: book.coverImageId ? {
      id: 0,
      url: book.coverUrl ?? '',
      alt_text: book.title,
    } : null,
    author: null,
    featured: false,
    author_id: null,
    book_gallery_img: null,
    average_rating: null,
    review_count: null,
    genre: null,
    series: null,
    series_number: null,
    binding_type_id: null,
    format_type_id: null,
    format: book.format ?? null,
    description: book.description ?? null,
    created_at: new Date(book.createdAt).toISOString(),
    updated_at: new Date(book.updatedAt).toISOString(),
  } as Book
}

function transformConvexAuthorToAuthor(author: any): Author {
  return {
    id: author.supabaseId ?? author._id,
    name: author.name,
    bio: author.bio ?? undefined,
    created_at: new Date(author.createdAt).toISOString(),
    updated_at: new Date(author.updatedAt).toISOString(),
    author_image: author.authorImageId ? {
      id: author.authorImageId,
      url: author.authorImageId,
      alt_text: author.name,
    } : null,
    cover_image_id: author.coverImageId ?? undefined,
    cover_image: author.coverImageId ? {
      id: author.coverImageId,
      url: author.coverImageId,
      alt_text: author.name,
    } : null,
    nationality: author.nationality ?? undefined,
    website: author.website ?? undefined,
    permalink: undefined,
    social_handle: author.socialHandle ?? undefined,
    instagram_handle: author.instagramHandle ?? undefined,
    twitter_handle: author.twitterHandle ?? undefined,
    goodreads_url: author.goodreadsUrl ?? undefined,
    birth_date: author.birthDate ? new Date(author.birthDate).toISOString() : undefined,
    featured: author.featured ?? false,
    author_gallery_id: undefined,
  } as Author
}

function transformConvexPublisherToPublisher(publisher: any) {
  return {
    id: publisher.supabaseId ?? publisher._id,
    name: publisher.name,
    website: publisher.website ?? undefined,
    cover_image_id: publisher.logoId ?? undefined,
    publisher_image_id: undefined,
    country_id: undefined,
    created_at: new Date(publisher.createdAt).toISOString(),
    updated_at: new Date(publisher.updatedAt).toISOString(),
    cover_image: publisher.logoId ? {
      id: publisher.logoId,
      url: publisher.logoId,
      alt_text: publisher.name,
    } : null,
    publisher_image: null,
    country_details: null,
  }
}

export default async function BookPage({ params }: BookPageProps) {
  const resolvedParams = await params
  const id = resolvedParams.id

  if (id === 'add') {
    redirect('/books/add')
  }

  const supabase = await createServerComponentClientAsync()
  let currentUserId: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    currentUserId = user?.id || null
  } catch (error) {
    currentUserId = null
  }

  const bookDetails = await getBookDetails(id)

  if (!bookDetails || !bookDetails.book) {
    notFound()
  }

  const { book, authors, publisher, bindingType, formatType } = bookDetails
  const bookSupabaseId = book.supabaseId ?? book._id

  const followersData = await getFollowers(bookSupabaseId, 'book')

  // Transform Convex data to Supabase types
  const bookData = transformConvexBookToBook(book)
  const authorsList: Author[] = authors.map(transformConvexAuthorToAuthor)
  const mappedPublisher = publisher ? transformConvexPublisherToPublisher(publisher) : null

  const bindingTypeMapped: BindingType | null = bindingType ? {
    id: bindingType.id,
    name: bindingType.name,
    description: bindingType.description,
    created_at: bindingType.createdAt || bindingType.created_at,
    updated_at: bindingType.updatedAt || bindingType.updated_at,
  } : null

  const formatTypeMapped: FormatType | null = formatType ? {
    id: formatType.id,
    name: formatType.name,
    description: formatType.description,
    created_at: formatType.createdAt || formatType.created_at,
    updated_at: formatType.updatedAt || formatType.updated_at,
  } : null

  let reviews: Review[] = []
  try {
    const convexReviews = await fetchQuery(api.queries.reviews.getReviewsByBook, { bookId: id })
    reviews = transformReviews(convexReviews || [])
  } catch (error) {
    console.error('Error fetching reviews:', error)
  }

  const publisherBooksCount = mappedPublisher 
    ? await fetchQuery(api.queries.books.getBookCountByPublisherId, { publisherId: mappedPublisher.id })
    : 0

  const publisherAuthorCount = mappedPublisher
    ? await fetchQuery(api.queries.books.getPublisherAuthorCount, { publisherId: mappedPublisher.id })
    : 0

  let publisherFollowersCount = 0
  let publisherMutualFriendsCount = 0
  if (mappedPublisher) {
    try {
      publisherFollowersCount = await getFollowersCount(mappedPublisher.id, 'publisher')
    } catch (error) {
      publisherFollowersCount = 0
    }
    if (currentUserId) {
      try {
        publisherMutualFriendsCount = await getMutualFriendsCount(mappedPublisher.id, 'publisher', currentUserId)
      } catch (error) {
        publisherMutualFriendsCount = 0
      }
    }
  }

  const authorBookCounts: Record<string, number> = {}
  const authorFollowersCounts: Record<string, number> = {}
  const authorMutualFriendsCounts: Record<string, number> = {}

  const authorStats = await Promise.all(
    authorsList.map(async (author) => {
      const [bookCount, followersCount, mutualFriendsCount] = await Promise.all([
        fetchQuery(api.queries.books.getBookCountByAuthorId, { authorId: author.id }).catch(() => 0),
        getFollowersCount(author.id, 'author').catch(() => 0),
        currentUserId ? getMutualFriendsCount(author.id, 'author', currentUserId).catch(() => 0) : Promise.resolve(0),
      ])
      return { authorId: author.id, bookCount, followersCount, mutualFriendsCount }
    })
  )

  authorStats.forEach((stat) => {
    authorBookCounts[stat.authorId] = stat.bookCount
    authorFollowersCounts[stat.authorId] = stat.followersCount
    authorMutualFriendsCounts[stat.authorId] = stat.mutualFriendsCount
  })

  let readingProgress: any = null
  try {
    readingProgress = await getUserReadingProgress(currentUserId, id)
  } catch (error) {
    console.error('Error fetching reading progress:', error)
  }

  const followers = followersData?.followers || []
  const followersCount = followersData?.count || 0

  let bookMutualFriendsCount = 0
  if (currentUserId) {
    try {
      bookMutualFriendsCount = await getMutualFriendsCount(id, 'book', currentUserId)
    } catch (error) {
      console.error('Error fetching mutual friends count for book:', error)
    }
  }

  return (
    <>
      {isFeatureEnabled('BOOK_PAGE_BANNER_ENABLED') && (
        <div className="w-full">
          <PageBanner enabled={true} />
        </div>
      )}

      <ClientBookPage
        book={bookData as any}
        authors={authorsList}
        publisher={mappedPublisher}
        publisherBooksCount={publisherBooksCount}
        publisherAuthorCount={publisherAuthorCount}
        publisherFollowersCount={publisherFollowersCount}
        publisherMutualFriendsCount={publisherMutualFriendsCount}
        authorBookCounts={authorBookCounts}
        authorFollowersCounts={authorFollowersCounts}
        authorMutualFriendsCounts={authorMutualFriendsCounts}
        reviews={reviews}
        bindingType={bindingTypeMapped}
        formatType={formatTypeMapped}
        readingProgress={readingProgress}
        followers={followers}
        followersCount={followersCount}
        bookMutualFriendsCount={bookMutualFriendsCount}
        params={{ id }}
      />
    </>
  )
}