'use server'

import { 
  getRecentBooksFromConvex, 
  getRecentAuthorsFromConvex, 
  getRecentPublishersFromConvex,
  listBooksFromConvex,
  getTotalBooksCountFromConvex,
  getUniqueLanguagesFromConvex,
  listAuthorsFromConvex,
  getTotalAuthorsCountFromConvex,
  getUniqueNationalitiesFromConvex,
  listPublishersFromConvex,
  getTotalPublishersCountFromConvex,
  listDiscussionsFromConvex,
  getTotalDiscussionsCountFromConvex,
  getDiscussionFromConvex,
  getCommentsByDiscussionFromConvex,
  listPhotosFromConvex,
  getTotalPhotosCountFromConvex,
  getPhotoFromConvex,
  transformConvexBookToSupabase,
  transformConvexAuthorToSupabase,
  transformConvexPublisherToSupabase
} from '@/lib/convex-server'
import type {
  Author,
  Book,
  Publisher,
} from '@/types/database'

// Books - Convex version
export async function getRecentBooks(limit = 10, offset = 0): Promise<Book[]> {
  try {
    const books = await getRecentBooksFromConvex(limit + offset)
    const paginated = books.slice(offset, offset + limit)
    return paginated.map(transformConvexBookToSupabase) as Book[]
  } catch (error) {
    console.error('Error fetching books from Convex:', error)
    return []
  }
}

// Authors - Convex version
export async function getRecentAuthors(limit = 10, offset = 0): Promise<Author[]> {
  try {
    const authors = await getRecentAuthorsFromConvex(limit + offset)
    const paginated = authors.slice(offset, offset + limit)
    return paginated.map(transformConvexAuthorToSupabase) as Author[]
  } catch (error) {
    console.error('Error fetching authors from Convex:', error)
    return []
  }
}

export async function getAuthorById(id: string): Promise<Author | null> {
  try {
    const { getAuthorByIdFromConvex, transformConvexAuthorToSupabase } = await import('@/lib/convex-server')
    const author = await getAuthorByIdFromConvex(id)
    if (!author) return null
    return transformConvexAuthorToSupabase(author) as Author
  } catch (error) {
    console.error('Error fetching author from Convex:', error)
    return null
  }
}

// Publishers - Convex version
export async function getRecentPublishers(limit = 10, offset = 0): Promise<Publisher[]> {
  try {
    const publishers = await getRecentPublishersFromConvex(limit + offset)
    const paginated = publishers.slice(offset, offset + limit)
    return paginated.map(transformConvexPublisherToSupabase) as Publisher[]
  } catch (error) {
    console.error('Error fetching publishers from Convex:', error)
    return []
  }
}

export async function getTotalPublishersCount(params: { search?: string } = {}): Promise<number> {
  try {
    return await getTotalPublishersCountFromConvex(params)
  } catch (error) {
    console.error('Error counting publishers from Convex:', error)
    return 0
  }
}

export async function getPublisherById(id: string): Promise<Publisher | null> {
  try {
    const { getPublisherByIdFromConvex, transformConvexPublisherToSupabase } = await import('@/lib/convex-server')
    const publisher = await getPublisherByIdFromConvex(id)
    if (!publisher) return null
    return transformConvexPublisherToSupabase(publisher) as Publisher
  } catch (error) {
    console.error('Error fetching publisher from Convex:', error)
    return null
  }
}

// ════════════════════════════════════════════════════════════════
// ADDITIONAL CONVEX FUNCTIONS
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// BOOK LIST QUERIES (Pagination & Filtering)
// ════════════════════════════════════════════════════════════════

export async function getBooks(
  params: { search?: string; language?: string; publisherId?: string; year?: number; sortBy?: string; limit?: number; offset?: number } = {}
): Promise<Book[]> {
  try {
    const books = await listBooksFromConvex(params)
    return books.map(transformConvexBookToSupabase) as Book[]
  } catch (error) {
    console.error('Error fetching books from Convex:', error)
    return []
  }
}

export async function getTotalBooksCount(params: { search?: string; language?: string; publisherId?: string } = {}): Promise<number> {
  try {
    return await getTotalBooksCountFromConvex(params)
  } catch (error) {
    console.error('Error counting books from Convex:', error)
    return 0
  }
}

export async function getUniqueLanguages(): Promise<string[]> {
  try {
    return await getUniqueLanguagesFromConvex()
  } catch (error) {
    console.error('Error fetching languages from Convex:', error)
    return []
  }
}

// ════════════════════════════════════════════════════════════════
// AUTHOR LIST QUERIES
// ════════════════════════════════════════════════════════════════

export async function getAuthors(
  params: { search?: string; nationality?: string; sortBy?: string; limit?: number; offset?: number } = {}
): Promise<Author[]> {
  try {
    const authors = await listAuthorsFromConvex(params)
    return authors.map(transformConvexAuthorToSupabase) as Author[]
  } catch (error) {
    console.error('Error fetching authors from Convex:', error)
    return []
  }
}

export async function getTotalAuthorsCount(params: { search?: string; nationality?: string } = {}): Promise<number> {
  try {
    return await getTotalAuthorsCountFromConvex(params)
  } catch (error) {
    console.error('Error counting authors from Convex:', error)
    return 0
  }
}

export async function getUniqueNationalities(): Promise<string[]> {
  try {
    return await getUniqueNationalitiesFromConvex()
  } catch (error) {
    console.error('Error fetching nationalities from Convex:', error)
    return []
  }
}

// ════════════════════════════════════════════════════════════════
// PUBLISHER LIST QUERIES
// ════════════════════════════════════════════════════════════════

export async function getListPublishers(
  params: { search?: string; sortBy?: string; limit?: number; offset?: number } = {}
): Promise<Publisher[]> {
  try {
    const publishers = await listPublishersFromConvex(params)
    return publishers.map(transformConvexPublisherToSupabase) as Publisher[]
  } catch (error) {
    console.error('Error fetching publishers from Convex:', error)
    return []
  }
}

// Authors by Book
export async function getAuthorsByBookId(bookId: string): Promise<Author[]> {
  try {
    const { getAuthorsByBookIdFromConvex, transformConvexAuthorToSupabase } = await import('@/lib/convex-server')
    const authors = await getAuthorsByBookIdFromConvex(bookId)
    return authors.map(transformConvexAuthorToSupabase) as Author[]
  } catch (error) {
    console.error('Error fetching authors by book from Convex:', error)
    return []
  }
}

// Books by Author
export async function getBooksByAuthorId(authorId: string, limit = 10): Promise<Book[]> {
  try {
    const { getBooksByAuthorIdFromConvex, transformConvexBookToSupabase } = await import('@/lib/convex-server')
    const books = await getBooksByAuthorIdFromConvex(authorId, limit)
    return books.map(transformConvexBookToSupabase) as Book[]
  } catch (error) {
    console.error('Error fetching books by author from Convex:', error)
    return []
  }
}

export async function getBooksCountByAuthorId(authorId: string): Promise<number> {
  try {
    const { getBooksCountByAuthorIdFromConvex } = await import('@/lib/convex-server')
    return await getBooksCountByAuthorIdFromConvex(authorId)
  } catch (error) {
    console.error('Error counting books by author from Convex:', error)
    return 0
  }
}

// Books by Publisher
export async function getBooksByPublisherId(publisherId: string, limit = 10): Promise<Book[]> {
  try {
    const { getBooksByPublisherIdFromConvex, transformConvexBookToSupabase } = await import('@/lib/convex-server')
    const books = await getBooksByPublisherIdFromConvex(publisherId, limit)
    return books.map(transformConvexBookToSupabase) as Book[]
  } catch (error) {
    console.error('Error fetching books by publisher from Convex:', error)
    return []
  }
}

export async function getBooksCountByPublisherId(publisherId: string): Promise<number> {
  try {
    const { getBooksCountByPublisherIdFromConvex } = await import('@/lib/convex-server')
    return await getBooksCountByPublisherIdFromConvex(publisherId)
  } catch (error) {
    console.error('Error counting books by publisher from Convex:', error)
    return 0
  }
}

// Authors by Publisher
export async function getAuthorsByPublisherId(publisherId: string): Promise<Author[]> {
  try {
    const { getAuthorsByPublisherIdFromConvex, transformConvexAuthorToSupabase } = await import('@/lib/convex-server')
    const authors = await getAuthorsByPublisherIdFromConvex(publisherId)
    return authors.map(transformConvexAuthorToSupabase) as Author[]
  } catch (error) {
    console.error('Error fetching authors by publisher from Convex:', error)
    return []
  }
}

export async function getPublisherAuthorCount(publisherId: string): Promise<number> {
  try {
    const { getPublisherAuthorCountFromConvex } = await import('@/lib/convex-server')
    return await getPublisherAuthorCountFromConvex(publisherId)
  } catch (error) {
    console.error('Error getting publisher author count from Convex:', error)
    return 0
  }
}

// ════════════════════════════════════════════════════════════════
// DISCUSSIONS
// ════════════════════════════════════════════════════════════════

export async function getDiscussions(
  params: { search?: string; groupId?: string; bookId?: string; authorId?: string; sortBy?: string; limit?: number; offset?: number } = {}
): Promise<any[]> {
  try {
    const discussions = await listDiscussionsFromConvex(params)
    return discussions
  } catch (error) {
    console.error('Error fetching discussions from Convex:', error)
    return []
  }
}

export async function getTotalDiscussionsCount(params: { search?: string; groupId?: string; bookId?: string; authorId?: string } = {}): Promise<number> {
  try {
    return await getTotalDiscussionsCountFromConvex(params)
  } catch (error) {
    console.error('Error counting discussions from Convex:', error)
    return 0
  }
}

export async function getDiscussionById(id: string): Promise<any | null> {
  try {
    const { getDiscussionFromConvex } = await import('@/lib/convex-server')
    return await getDiscussionFromConvex(id)
  } catch (error) {
    console.error('Error fetching discussion from Convex:', error)
    return null
  }
}

export async function getCommentsByDiscussion(discussionId: string): Promise<any[]> {
  try {
    const { getCommentsByDiscussionFromConvex } = await import('@/lib/convex-server')
    return await getCommentsByDiscussionFromConvex(discussionId)
  } catch (error) {
    console.error('Error fetching comments from Convex:', error)
    return []
  }
}

// ════════════════════════════════════════════════════════════════
// PHOTOS
// ════════════════════════════════════════════════════════════════

export async function getPhotos(
  params: { search?: string; authorId?: string; groupId?: string; sortBy?: string; limit?: number; offset?: number } = {}
): Promise<any[]> {
  try {
    const photos = await listPhotosFromConvex(params)
    return photos
  } catch (error) {
    console.error('Error fetching photos from Convex:', error)
    return []
  }
}

export async function getTotalPhotosCount(params: { search?: string; authorId?: string; groupId?: string } = {}): Promise<number> {
  try {
    return await getTotalPhotosCountFromConvex(params)
  } catch (error) {
    console.error('Error counting photos from Convex:', error)
    return 0
  }
}

export async function getPhotoById(id: string): Promise<any | null> {
  try {
    const { getPhotoFromConvex } = await import('@/lib/convex-server')
    return await getPhotoFromConvex(id)
  } catch (error) {
    console.error('Error fetching photo from Convex:', error)
    return null
  }
}