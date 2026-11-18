/**
 * Shared Convex types - no 'use server' directive
 */

export interface ConvexBook {
  _id: string
  _creationTime: number
  supabaseId: string
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
}

export interface ConvexAuthor {
  _id: string
  _creationTime: number
  supabaseId: string
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
}

export interface ConvexPublisher {
  _id: string
  _creationTime: number
  supabaseId: string
  name: string
  website?: string
  createdAt: number
  updatedAt: number
}

export interface ConvexUser {
  _id: string
  _creationTime: number
  supabaseId: string
  name: string
  email: string
  createdAt: number
  updatedAt: number
}

export interface ConvexDiscussion {
  _id: string
  _creationTime: number
  supabaseId?: string
  bookId?: string
  categoryId?: number
  content: string
  createdAt?: number
  groupId?: string
  isPinned?: boolean
  permalink?: string
  title: string
  updatedAt?: number
  userId: string
}