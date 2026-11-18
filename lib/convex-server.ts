import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import type { FunctionReference } from 'convex/server'
import type { ConvexBook, ConvexAuthor, ConvexPublisher, ConvexUser } from './convex-types'

// Server-side Convex client for server actions
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL environment variable')
}

export const convexServer = new ConvexHttpClient(convexUrl)

// Type-safe query wrapper using generated API
export async function convexQuery<T>(
  functionRef: FunctionReference<'query'>,
  args: Record<string, any> = {}
): Promise<T> {
  try {
    return await convexServer.query(functionRef, args)
  } catch (error) {
    console.error(`Convex query failed:`, error)
    throw error
  }
}

// Type-safe mutation wrapper
export async function convexMutation<T>(
  functionRef: FunctionReference<'mutation'>,
  args: Record<string, any> = {}
): Promise<T> {
  try {
    return await convexServer.mutation(functionRef, args)
  } catch (error) {
    console.error(`Convex mutation failed:`, error)
    throw error
  }
}

// ════════════════════════════════════════════════════════════════
// BOOKS
// ═══════════════════════════════════════════════════════════════

export async function getRecentBooksFromConvex(limit = 6): Promise<ConvexBook[]> {
  try {
    const books = await convexQuery<ConvexBook[]>(api.queries.books.listBooks, { limit })
    return books || []
  } catch (error) {
    console.error('getRecentBooksFromConvex failed:', error)
    return []
  }
}

export async function getBookByIdFromConvex(id: string): Promise<ConvexBook | null> {
  try {
    const book = await convexQuery<ConvexBook | null>(api.queries.books.getBook, { id })
    return book
  } catch (error) {
    console.error('getBookByIdFromConvex failed:', error)
    return null
  }
}

export async function getBookDetailsFromConvex(id: string): Promise<any> {
  try {
    const book = await convexQuery<any>(api.queries.books.getBookDetails, { id })
    return book
  } catch (error) {
    console.error('getBookDetailsFromConvex failed:', error)
    return null
  }
}

// ════════════════════════════════════════════════════════════════
// BOOK IMAGES
// ════════════════════════════════════════════════════════════════

export async function getBookImagesFromConvex(bookId: string): Promise<any[]> {
  try {
    const images = await convexQuery<any[]>(api.queries.bookImages.getBookImages, { bookId })
    return images || []
  } catch (error) {
    console.error('getBookImagesFromConvex failed:', error)
    return []
  }
}

// ════════════════════════════════════════════════════════════════
// ENTITY IMAGES (Authors, Publishers, etc.)
// ════════════════════════════════════════════════════════════════

export async function getAuthorImagesFromConvex(authorId: string): Promise<any[]> {
  try {
    const images = await convexQuery<any[]>(api.queries.entityImages.getAuthorImages, { authorId })
    return images || []
  } catch (error) {
    console.error('getAuthorImagesFromConvex failed:', error)
    return []
  }
}

export async function getPublisherImagesFromConvex(publisherId: string): Promise<any[]> {
  try {
    const images = await convexQuery<any[]>(api.queries.entityImages.getPublisherImages, { publisherId })
    return images || []
  } catch (error) {
    console.error('getPublisherImagesFromConvex failed:', error)
    return []
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTHORS
// ══════════════════════════════════════════════════════════════

export async function getRecentAuthorsFromConvex(limit = 6): Promise<ConvexAuthor[]> {
  try {
    const authors = await convexQuery<ConvexAuthor[]>(api.queries.authors.listAuthors, { limit })
    return authors || []
  } catch (error) {
    console.error('getRecentAuthorsFromConvex failed:', error)
    return []
  }
}

export async function getAuthorByIdFromConvex(id: string): Promise<ConvexAuthor | null> {
  try {
    const author = await convexQuery<ConvexAuthor | null>(api.queries.authors.getAuthor, { id })
    return author
  } catch (error) {
    console.error('getAuthorByIdFromConvex failed:', error)
    return null
  }
}

// ═════════════════════════════════════════════════════════════
// PUBLISHERS
// ═══════════════════════════════════════════════════════════

export async function getRecentPublishersFromConvex(limit = 6): Promise<ConvexPublisher[]> {
  try {
    const publishers = await convexQuery<ConvexPublisher[]>(api.queries.publisherList.listPublishers, {})
    return (publishers || []).slice(0, limit)
  } catch (error) {
    console.error('getRecentPublishersFromConvex failed:', error)
    return []
  }
}

// ════════════════════════════════════════════════════════════════
// LIST QUERIES (Pagination & Filtering)
// ════════════════════════════════════════════════════════════════

export async function listBooksFromConvex(params: { search?: string; language?: string; publisherId?: string; year?: number; sortBy?: string; limit?: number; offset?: number } = {}): Promise<ConvexBook[]> {
  try {
    const books = await convexQuery<ConvexBook[]>(api.queries.bookList.listBooks, params)
    return books || []
  } catch (error) {
    console.error('listBooksFromConvex failed:', error)
    return []
  }
}

export async function getTotalBooksCountFromConvex(params: { search?: string; language?: string; publisherId?: string } = {}): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.bookList.getTotalBooksCount, params)
    return count || 0
  } catch (error) {
    console.error('getTotalBooksCountFromConvex failed:', error)
    return 0
  }
}

export async function getUniqueLanguagesFromConvex(): Promise<string[]> {
  try {
    const languages = await convexQuery<string[]>(api.queries.bookList.getUniqueLanguages, {})
    return languages || []
  } catch (error) {
    console.error('getUniqueLanguagesFromConvex failed:', error)
    return []
  }
}

export async function listAuthorsFromConvex(params: { search?: string; nationality?: string; sortBy?: string; limit?: number; offset?: number } = {}): Promise<ConvexAuthor[]> {
  try {
    const authors = await convexQuery<ConvexAuthor[]>(api.queries.authorList.listAuthors, params)
    return authors || []
  } catch (error) {
    console.error('listAuthorsFromConvex failed:', error)
    return []
  }
}

export async function getTotalAuthorsCountFromConvex(params: { search?: string; nationality?: string } = {}): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.authorList.getTotalAuthorsCount, params)
    return count || 0
  } catch (error) {
    console.error('getTotalAuthorsCountFromConvex failed:', error)
    return 0
  }
}

export async function getUniqueNationalitiesFromConvex(): Promise<string[]> {
  try {
    const nationalities = await convexQuery<string[]>(api.queries.authorList.getUniqueNationalities, {})
    return nationalities || []
  } catch (error) {
    console.error('getUniqueNationalitiesFromConvex failed:', error)
    return []
  }
}

export async function getTotalPublishersCountFromConvex(params: { search?: string } = {}): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.publisherList.getTotalPublishersCount, params)
    return count || 0
  } catch (error) {
    console.error('getTotalPublishersCountFromConvex failed:', error)
    return 0
  }
}

export async function listPublishersFromConvex(params: { search?: string; limit?: number; offset?: number } = {}): Promise<ConvexPublisher[]> {
  try {
    const publishers = await convexQuery<ConvexPublisher[]>(api.queries.publisherList.listPublishers, params)
    return publishers || []
  } catch (error) {
    console.error('listPublishersFromConvex failed:', error)
    return []
  }
}

export async function getPublisherByIdFromConvex(id: string): Promise<ConvexPublisher | null> {
  try {
    const publisher = await convexQuery<ConvexPublisher | null>(api.queries.publishers.getPublisher, { id })
    return publisher
  } catch (error) {
    console.error('getPublisherByIdFromConvex failed:', error)
    return null
  }
}

// ════════════════════════════════════════════════════════════════
// DISCUSSIONS
// ════════════════════════════════════════════════════════════════

export async function listDiscussionsFromConvex(params: { search?: string; groupId?: string; bookId?: string; authorId?: string; sortBy?: string; limit?: number; offset?: number } = {}): Promise<any[]> {
  try {
    const discussions = await convexQuery<any[]>(api.queries.discussions.listDiscussions, params)
    return discussions || []
  } catch (error) {
    console.error('listDiscussionsFromConvex failed:', error)
    return []
  }
}

export async function getTotalDiscussionsCountFromConvex(params: { search?: string; groupId?: string; bookId?: string; authorId?: string } = {}): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.discussions.getTotalDiscussionsCount, params)
    return count || 0
  } catch (error) {
    console.error('getTotalDiscussionsCountFromConvex failed:', error)
    return 0
  }
}

export async function getDiscussionFromConvex(id: string): Promise<any | null> {
  try {
    const discussion = await convexQuery<any | null>(api.queries.discussions.getDiscussion, { id })
    return discussion
  } catch (error) {
    console.error('getDiscussionFromConvex failed:', error)
    return null
  }
}

export async function getCommentsByDiscussionFromConvex(discussionId: string): Promise<any[]> {
  try {
    const comments = await convexQuery<any[]>(api.queries.discussions.getCommentsByDiscussion, { discussionId })
    return comments || []
  } catch (error) {
    console.error('getCommentsByDiscussionFromConvex failed:', error)
    return []
  }
}

// ════════════════════════════════════════════════════════════════
// PHOTOS
// ════════════════════════════════════════════════════════════════

export async function listPhotosFromConvex(params: { search?: string; authorId?: string; groupId?: string; sortBy?: string; limit?: number; offset?: number } = {}): Promise<any[]> {
  try {
    const photos = await convexQuery<any[]>(api.queries.photos.listPhotos, params)
    return photos || []
  } catch (error) {
    console.error('listPhotosFromConvex failed:', error)
    return []
  }
}

export async function getTotalPhotosCountFromConvex(params: { search?: string; authorId?: string; groupId?: string } = {}): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.photos.getTotalPhotosCount, params)
    return count || 0
  } catch (error) {
    console.error('getTotalPhotosCountFromConvex failed:', error)
    return 0
  }
}

export async function getPhotoFromConvex(id: string): Promise<any | null> {
  try {
    const photo = await convexQuery<any | null>(api.queries.photos.getPhoto, { id })
    return photo
  } catch (error) {
    console.error('getPhotoFromConvex failed:', error)
    return null
  }
}

// ═════════════════════════════════════════════════════════════// BOOK AUTHORS (Cross-references)
// ═══════════════════════════════════════════════════════════════

export async function getAuthorsByBookIdFromConvex(bookId: string): Promise<ConvexAuthor[]> {
  try {
    const authors = await convexQuery<ConvexAuthor[]>(api.queries.bookAuthors.getAuthorsByBookId, { bookId })
    return authors || []
  } catch (error) {
    console.error('getAuthorsByBookIdFromConvex failed:', error)
    return []
  }
}

export async function getBooksByAuthorIdFromConvex(authorId: string, limit = 10): Promise<ConvexBook[]> {
  try {
    const books = await convexQuery<ConvexBook[]>(api.queries.bookAuthors.getBooksByAuthorId, { authorId, limit })
    return books || []
  } catch (error) {
    console.error('getBooksByAuthorIdFromConvex failed:', error)
    return []
  }
}

export async function getBooksCountByAuthorIdFromConvex(authorId: string): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.books.getBooksCountByAuthorId, { authorId })
    return count || 0
  } catch (error) {
    console.error('getBooksCountByAuthorIdFromConvex failed:', error)
    return 0
  }
}

export async function getBooksByPublisherIdFromConvex(publisherId: string, limit = 10): Promise<ConvexBook[]> {
  try {
    const books = await convexQuery<ConvexBook[]>(api.queries.books.getBooksByPublisherId, { publisherId, limit })
    return books || []
  } catch (error) {
    console.error('getBooksByPublisherIdFromConvex failed:', error)
    return []
  }
}

export async function getBooksCountByPublisherIdFromConvex(publisherId: string): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.books.getBooksCountByPublisherId, { publisherId })
    return count || 0
  } catch (error) {
    console.error('getBooksCountByPublisherIdFromConvex failed:', error)
    return 0
  }
}

export async function getAuthorsByPublisherIdFromConvex(publisherId: string): Promise<ConvexAuthor[]> {
  try {
    const authors = await convexQuery<ConvexAuthor[]>(api.queries.books.getAuthorsByPublisherId, { publisherId })
    return authors || []
  } catch (error) {
    console.error('getAuthorsByPublisherIdFromConvex failed:', error)
    return []
  }
}

export async function getPublisherAuthorCountFromConvex(publisherId: string): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.books.getPublisherAuthorCount, { publisherId })
    return count || 0
  } catch (error) {
    console.error('getPublisherAuthorCountFromConvex failed:', error)
    return 0
  }
}

// ════════════════════════════════════════════════════════════════// USERS
// ════════════════════════════════════════════════════════════

export async function getUserByIdFromConvex(id: string): Promise<ConvexUser | null> {
  try {
    const user = await convexQuery<ConvexUser | null>(api.queries.users.getUser, { id })
    return user
  } catch (error) {
    console.error('getUserByIdFromConvex failed:', error)
    return null
  }
}

export async function getUserStatsFromConvex(userId: string): Promise<any> {
  try {
    const stats = await convexQuery<any>(api.queries.users.getUserStats, { userId })
    return stats
  } catch (error) {
    console.error('getUserStatsFromConvex failed:', error)
    return null
  }
}

// ══════════════════════════════════════════════════════════════
// FOLLOWS
// ═════════════════════════════════════════════════════════════

export async function getFollowersFromConvex(entityId: string, entityType: string): Promise<any[]> {
  try {
    const followers = await convexQuery<any[]>(api.queries.follows.getFollowers, { entityId, entityType })
    return followers || []
  } catch (error) {
    console.error('getFollowersFromConvex failed:', error)
    return []
  }
}

export async function getFollowersCountFromConvex(entityId: string): Promise<number> {
  try {
    const count = await convexQuery<number>(api.queries.follows.getFollowersCount, { entityId })
    return count || 0
  } catch (error) {
    console.error('getFollowersCountFromConvex failed:', error)
    return 0
  }
}

// ══════════════════════════════════════════════════════════════
// GROUPS
// ═════════════════════════════════════════════════════════════

export async function getGroupByIdFromConvex(id: string): Promise<any> {
  try {
    const group = await convexQuery<any>(api.queries.groups.getGroup, { id })
    return group
  } catch (error) {
    console.error('getGroupByIdFromConvex failed:', error)
    return null
  }
}

export async function getGroupMembersFromConvex(groupId: string): Promise<any[]> {
  try {
    const members = await convexQuery<any[]>(api.queries.groups.getGroupMembers, { groupId })
    return members || []
  } catch (error) {
    console.error('getGroupMembersFromConvex failed:', error)
    return []
  }
}

// ══════════════════════════════════════════════════════════════
// REVIEWS
// ═════════════════════════════════════════════════════════════

export async function getReviewsByBookFromConvex(bookId: string): Promise<any[]> {
  try {
    const reviews = await convexQuery<any[]>(api.queries.reviews.getReviewsByBook, { bookId })
    return reviews || []
  } catch (error) {
    console.error('getReviewsByBookFromConvex failed:', error)
    return []
  }
}

// Import transform functions from separate module
export { 
  transformConvexBookToSupabase, 
  transformConvexAuthorToSupabase, 
  transformConvexPublisherToSupabase 
} from './convex-transforms'