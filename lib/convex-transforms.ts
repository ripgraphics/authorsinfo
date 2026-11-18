/**
 * Transform functions to convert Convex data to Supabase-compatible types
 * These are pure functions, not server actions
 */

import type { ConvexBook, ConvexAuthor, ConvexPublisher, ConvexDiscussion } from './convex-types'

export function transformConvexBookToSupabase(book: ConvexBook): any {
  return {
    id: book.supabaseId,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    isbn13: book.isbn13,
    isbn10: book.isbn10,
    published_at: book.publishedAt ? new Date(book.publishedAt).toISOString() : null,
    publisher_id: book.publisherId,
    page_count: book.pageCount,
    language: book.language,
    format: book.format,
    cover_image_id: book.coverImageId,
    cover_url: book.coverUrl,
    cover_image_url: book.coverUrl, // Alias for component compatibility
    price: book.price,
    currency: book.currency,
    is_available: book.isAvailable,
    created_at: new Date(book.createdAt).toISOString(),
    updated_at: new Date(book.updatedAt).toISOString(),
  }
}

export function transformConvexAuthorToSupabase(author: ConvexAuthor): any {
  return {
    id: author.supabaseId,
    name: author.name,
    bio: author.bio,
    featured: author.featured,
    birth_date: author.birthDate ? new Date(author.birthDate).toISOString() : null,
    nationality: author.nationality,
    website: author.website,
    author_image_id: author.authorImageId,
    twitter_handle: author.twitterHandle,
    social_handle: author.socialHandle,
    instagram_handle: author.instagramHandle,
    goodreads_url: author.goodreadsUrl,
    cover_image_id: author.coverImageId,
    created_at: new Date(author.createdAt).toISOString(),
    updated_at: new Date(author.updatedAt).toISOString(),
  }
}

export function transformConvexPublisherToSupabase(publisher: ConvexPublisher): any {
  return {
    id: publisher.supabaseId,
    name: publisher.name,
    website: publisher.website,
    created_at: new Date(publisher.createdAt).toISOString(),
    updated_at: new Date(publisher.updatedAt).toISOString(),
  }
}

export function transformConvexDiscussionToSupabase(discussion: ConvexDiscussion): any {
  return {
    id: discussion.supabaseId,
    book_id: discussion.bookId,
    category_id: discussion.categoryId,
    content: discussion.content,
    created_at: discussion.createdAt ? new Date(discussion.createdAt).toISOString() : null,
    group_id: discussion.groupId,
    is_pinned: discussion.isPinned,
    permalink: discussion.permalink,
    title: discussion.title,
    updated_at: discussion.updatedAt ? new Date(discussion.updatedAt).toISOString() : null,
    user_id: discussion.userId,
  }
}