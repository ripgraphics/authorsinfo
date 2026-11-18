/**
 * Convex Migration Strategy
 * 
 * This file documents the approach for migrating from Supabase to Convex.
 */

// ═══════════════════════════════════════════════════════════════
// CURRENT STATE
// ═══════════════════════════════════════════════════════════════

const currentState = {
  // Data Layer
  convex: {
    deployment: 'sleek-gerbil-105.convex.cloud',
    tables: 254,
    rows: 14594,
    verified: true
  },
  supabase: {
    url: 'https://adccinsmmmocxeylisbn.supabase.co',
    tables: 254,
    rows: '~15000',
    status: 'source_of_truth'
  },
  // App Infrastructure
  next: {
    version: '16.3.6',
    port: 3034,
    framework: 'App Router'
  }
};

// ═══════════════════════════════════════════════════════════════
// MIGRATION APPROACHES
// ═══════════════════════════════════════════════════════════════

/**
 * APPROACH A: Server Action Wrappers (Recommended for gradual migration)
 * 
 * Create Convex-backed server actions that wrap Convex queries.
 * This allows pages to keep using `await getRecentBooks()` style calls
 * while internally fetching from Convex.
 * 
 * Pros:
 * - Minimal changes to existing page components
 * - Can migrate one page at a time
 * - Fallback to Supabase if Convex fails
 * 
 * Cons:
 * - Still uses server actions (no real-time updates)
 * - Need to maintain two code paths during transition
 */

/**
 * APPROACH B: Client Components with useQuery (Full Convex adoption)
 * 
 * Convert pages to client components that use Convex hooks.
 * Provides real-time updates and better UX.
 * 
 * Pros:
 * - True Convex integration
 * - Real-time updates
 * - Optimistic UI
 * 
 * Cons:
 * - Major rewrite of many components
 * - Breaking changes to data flow
 */

/**
 * APPROACH C: Hybrid (Recommended Production Path)
 * 
 * Phase 1: Server action wrappers (quick win)
 * Phase 2: Critical paths use useQuery (real-time features)
 * Phase 3: Full migration after stability
 */

// ═══════════════════════════════════════════════════════════════
// CONVEX QUERIES AVAILABLE
// ═══════════════════════════════════════════════════════════════

const availableQueries = {
  authors: {
    listAuthors: 'queries/authors:listAuthors({ search?, limit? })',
    getAuthor: 'queries/authors:getAuthor({ id })'
  },
  books: {
    listBooks: 'queries/books:listBooks({ limit?, publisherId?, authorId? })',
    getBook: 'queries/books:getBook({ id })',
    getBookDetails: 'queries/books:getBookDetails({ id })'
  },
  users: {
    listUsers: 'queries/users:listUsers()',
    getUser: 'queries/users:getUser({ id })',
    getUserStats: 'queries/users:getUserStats({ userId })'
  },
  follows: {
    getFollowers: 'queries/follows:getFollowers({ entityId, entityType })',
    getFollowersCount: 'queries/follows:getFollowersCount({ entityId })'
  },
  publishers: {
    listPublishers: 'queries/publishers:listPublishers()',
    getPublisher: 'queries/publishers:getPublisher({ id })'
  },
  groups: {
    getGroup: 'queries/groups:getGroup({ id })',
    getGroupMembers: 'queries/groups:getGroupMembers({ groupId })'
  },
  reviews: {
    getReviewsByBook: 'queries/reviews:getReviewsByBook({ bookId })'
  }
};

// ═══════════════════════════════════════════════════════════════
// FIELD MAPPING (Supabase → Convex)
// ═══════════════════════════════════════════════════════════════

const fieldMappings = {
  // Authors
  authors: {
    // Convex fields
    name: 'name',
    bio: 'bio',
    featured: 'featured',
    nationality: 'nationality',
    website: 'website',
    twitterHandle: 'twitterHandle',
    socialHandle: 'socialHandle',
    instagramHandle: 'instagramHandle',
    goodreadsUrl: 'goodreadsUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    // Keep original ID for reference
    supabaseId: 'supabaseId' // Original UUID
  },
  // Books
  books: {
    title: 'title',
    subtitle: 'subtitle',
    description: 'description',
    isbn13: 'isbn13',
    isbn10: 'isbn10',
    publishedAt: 'publishedAt',
    publisherId: 'publisherId',
    pageCount: 'pageCount',
    language: 'language',
    format: 'format',
    coverImageId: 'coverImageId',
    coverUrl: 'coverUrl',
    price: 'price',
    currency: 'currency',
    isAvailable: 'isAvailable',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    supabaseId: 'supabaseId'
  }
};

// ═══════════════════════════════════════════════════════════════
// IMMEDIATE ACTIONS NEEDED
// ═══════════════════════════════════════════════════════════════

const immediateActions = [
  {
    priority: 'HIGH',
    task: 'Update .env.local Convex URL',
    status: 'DONE',
    details: 'Changed NEXT_PUBLIC_CONVEX_URL to sleek-gerbil-105'
  },
  {
    priority: 'HIGH',
    task: 'Create Convex client wrapper',
    status: 'PENDING',
    details: 'lib/convex-server.ts for server-side Convex access'
  },
  {
    priority: 'MEDIUM',
    task: 'Wrap getRecentBooks() in Convex',
    status: 'PENDING',
    details: 'Create server action that calls Convex query'
  },
  {
    priority: 'MEDIUM',
    task: 'Wrap getRecentAuthors() in Convex',
    status: 'PENDING',
    details: 'Create server action that calls Convex query'
  },
  {
    priority: 'LOW',
    task: 'Add error fallbacks',
    status: 'PENDING',
    details: 'Fallback to Supabase if Convex fails'
  }
];

// ═══════════════════════════════════════════════════════════════
// EXAMPLE: CONVEX SERVER ACTION WRAPPER
// ═══════════════════════════════════════════════════════════════

/*
'use server'

import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function getRecentBooksFromConvex(limit = 6): Promise<any[]> {
  try {
    const books = await convex.query('queries/books:listBooks', { limit })
    
    // Transform Convex data to match expected shape
    return books.map((book: any) => ({
      ...book,
      id: book.supabaseId ?? book._id, // Use supabaseId as fallback
      cover_image_url: book.coverUrl,
      // Add nested joins manually since Convex doesn't support them yet
    }))
  } catch (error) {
    console.error('Convex fetch failed:', error)
    // Fallback to Supabase
    return getRecentBooksFromSupabase(limit)
  }
}
*/

export {} // Empty export to make this a module
