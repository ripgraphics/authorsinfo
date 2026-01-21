import { supabaseAdmin } from '@/lib/supabase'

// Enterprise Activity System
// Provides high-performance, scalable activity management

export interface EnterpriseActivityData {
  user_id: string
  activity_type: string
  entity_type: string
  entity_id: string
  data: Record<string, any>
  metadata?: {
    ip_address?: string
    user_agent?: string
    session_id?: string
    batch_id?: string
  }
  created_at?: string
}

export interface ActivityBatch {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_count: number
  processed_count: number
  error_count: number
  created_at: string
  completed_at?: string
}

export interface ActivityTemplate {
  id: string
  name: string
  activity_type: string
  entity_type: string
  template_data: Record<string, any>
  is_active: boolean
}

// Activity type validation
const VALID_ACTIVITY_TYPES = [
  // User activities
  'user_registered',
  'user_profile_updated',
  'user_login',
  'user_logout',
  // Book activities
  'book_added',
  'book_updated',
  'book_deleted',
  'book_reviewed',
  'book_rated',
  // Author activities
  'author_created',
  'author_updated',
  'author_deleted',
  // Publisher activities
  'publisher_created',
  'publisher_updated',
  'publisher_deleted',
  // Group activities
  'group_created',
  'group_joined',
  'group_left',
  'group_updated',
  // Reading activities
  'reading_started',
  'reading_finished',
  'reading_paused',
  'reading_resumed',
  // Social activities
  'friend_requested',
  'friend_accepted',
  'friend_declined',
  // Content activities
  'comment_added',
  'comment_updated',
  'comment_deleted',
  'post_created',
  'post_updated',
  'post_deleted',
] as const

export type ActivityType = (typeof VALID_ACTIVITY_TYPES)[number]

// Enterprise Activity Generator with batching and validation
export class EnterpriseActivityGenerator {
  private batchSize: number = 100
  private maxRetries: number = 3
  private batchId: string

  constructor() {
    this.batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Validate activity data
  private validateActivity(activity: EnterpriseActivityData): boolean {
    if (!VALID_ACTIVITY_TYPES.includes(activity.activity_type as ActivityType)) {
      console.error(`Invalid activity type: ${activity.activity_type}`)
      return false
    }

    if (!activity.user_id || !activity.entity_type || !activity.entity_id) {
      console.error('Missing required fields in activity data')
      return false
    }

    return true
  }

  // Check for existing activities to prevent duplicates
  private async checkForDuplicates(activity: EnterpriseActivityData): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('user_id', activity.user_id)
      .eq('activity_type', activity.activity_type)
      .eq('entity_type', activity.entity_type)
      .eq('entity_id', activity.entity_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(1)

    if (error) {
      console.error('Error checking for duplicates:', error)
      return false
    }

    return data && data.length > 0
  }

  // Insert activities in batches for performance
  private async insertActivityBatch(activities: EnterpriseActivityData[]): Promise<{
    success: boolean
    inserted: number
    errors: string[]
  }> {
    const validActivities = activities.filter((activity) => this.validateActivity(activity))
    const errors: string[] = []

    if (validActivities.length === 0) {
      return { success: false, inserted: 0, errors: ['No valid activities to insert'] }
    }

    // Process in batches
    const batches = this.chunkArray(validActivities, this.batchSize)
    let totalInserted = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      try {
        const { error } = await supabaseAdmin.from('posts').insert(
          batch.map((activity) => ({
            ...activity,
            metadata: {
              ...activity.metadata,
              batch_id: this.batchId,
            },
          }))
        )

        if (error) {
          console.error(`Batch ${i + 1} insertion error:`, error)
          errors.push(`Batch ${i + 1}: ${error.message}`)
        } else {
          totalInserted += batch.length
        }
      } catch (err) {
        console.error(`Batch ${i + 1} unexpected error:`, err)
        errors.push(`Batch ${i + 1}: Unexpected error`)
      }
    }

    return {
      success: errors.length === 0,
      inserted: totalInserted,
      errors,
    }
  }

  // Generate activities for authors with enterprise features
  async generateAuthorActivities(
    authorIds: string[],
    adminUserId: string,
    options: {
      skipDuplicates?: boolean
      includeMetadata?: boolean
      batchSize?: number
    } = {}
  ): Promise<{
    success: boolean
    processed: number
    inserted: number
    duplicates: number
    errors: string[]
  }> {
    const { skipDuplicates = true, includeMetadata = true, batchSize = this.batchSize } = options

    this.batchSize = batchSize
    const activities: EnterpriseActivityData[] = []
    let duplicates = 0
    const errors: string[] = []

    try {
      // Get all authors in one query
      const { data: authors, error: authorsError } = await supabaseAdmin
        .from('authors')
        .select(
          `
          id, 
          name, 
          bio, 
          created_at,
          updated_at
        `
        )
        .in('id', authorIds)

      if (authorsError) {
        throw new Error(`Failed to fetch authors: ${authorsError.message}`)
      }

      if (!authors || authors.length === 0) {
        return {
          success: false,
          processed: 0,
          inserted: 0,
          duplicates: 0,
          errors: ['No authors found'],
        }
      }

      // Get all books for these authors in one query
      const { data: books, error: booksError } = await supabaseAdmin
        .from('books')
        .select(
          `
          id, 
          title, 
          author_id, 
          created_at,
          updated_at
        `
        )
        .in('author_id', authorIds)

      if (booksError) {
        throw new Error(`Failed to fetch books: ${booksError.message}`)
      }

      // Group books by author
      const booksByAuthor =
        books?.reduce(
          (acc, book) => {
            if (!acc[book.author_id]) {
              acc[book.author_id] = []
            }
            acc[book.author_id].push(book)
            return acc
          },
          {} as Record<string, any[]>
        ) || {}

      // Generate activities for each author
      for (const author of authors) {
        const authorBooks = booksByAuthor[author.id] || []

        // Create author_created activity
        const authorActivity: EnterpriseActivityData = {
          user_id: adminUserId,
          activity_type: 'author_created',
          entity_type: 'author',
          entity_id: author.id,
          data: {
            author_id: author.id,
            author_name: author.name,
            books_count: authorBooks.length,
            bio: author.bio,
          },
          metadata: includeMetadata
            ? {
                batch_id: this.batchId,
                ip_address: 'system',
                user_agent: 'enterprise-activity-generator',
              }
            : undefined,
          created_at: author.created_at,
        }

        // Check for duplicates if enabled
        if (skipDuplicates) {
          const isDuplicate = await this.checkForDuplicates(authorActivity)
          if (isDuplicate) {
            duplicates++
            continue
          }
        }

        activities.push(authorActivity)

        // Create book_added activities for each book
        for (const book of authorBooks) {
          const bookActivity: EnterpriseActivityData = {
            user_id: adminUserId,
            activity_type: 'book_added',
            entity_type: 'book',
            entity_id: book.id,
            data: {
              book_id: book.id,
              book_title: book.title,
              author_id: author.id,
              author_name: author.name,
            },
            metadata: includeMetadata
              ? {
                  batch_id: this.batchId,
                  ip_address: 'system',
                  user_agent: 'enterprise-activity-generator',
                }
              : undefined,
            created_at: book.created_at,
          }

          if (skipDuplicates) {
            const isDuplicate = await this.checkForDuplicates(bookActivity)
            if (isDuplicate) {
              duplicates++
              continue
            }
          }

          activities.push(bookActivity)
        }
      }

      // Insert all activities in batches
      const insertResult = await this.insertActivityBatch(activities)

      return {
        success: insertResult.success,
        processed: authors.length,
        inserted: insertResult.inserted,
        duplicates,
        errors: [...errors, ...insertResult.errors],
      }
    } catch (error) {
      console.error('Enterprise author activity generation failed:', error)
      return {
        success: false,
        processed: 0,
        inserted: 0,
        duplicates: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  // Generate activities for books with enterprise features
  async generateBookActivities(
    bookIds: string[],
    adminUserId: string,
    options: {
      skipDuplicates?: boolean
      includeMetadata?: boolean
      batchSize?: number
    } = {}
  ): Promise<{
    success: boolean
    processed: number
    inserted: number
    duplicates: number
    errors: string[]
  }> {
    const { skipDuplicates = true, includeMetadata = true, batchSize = this.batchSize } = options

    this.batchSize = batchSize
    const activities: EnterpriseActivityData[] = []
    let duplicates = 0
    const errors: string[] = []

    try {
      // Get all books with author information
      const { data: books, error: booksError } = await supabaseAdmin
        .from('books')
        .select(
          `
          id, 
          title, 
          author_id,
          created_at,
          updated_at,
          authors!inner(id, name)
        `
        )
        .in('id', bookIds)

      if (booksError) {
        throw new Error(`Failed to fetch books: ${booksError.message}`)
      }

      if (!books || books.length === 0) {
        return {
          success: false,
          processed: 0,
          inserted: 0,
          duplicates: 0,
          errors: ['No books found'],
        }
      }

      // Generate activities for each book
      for (const book of books) {
        const bookActivity: EnterpriseActivityData = {
          user_id: adminUserId,
          activity_type: 'book_added',
          entity_type: 'book',
          entity_id: book.id,
          data: {
            book_id: book.id,
            book_title: book.title,
            author_id: book.author_id,
            author_name: Array.isArray(book.authors)
              ? book.authors[0]?.name
              : (book.authors as any)?.name,
          },
          metadata: includeMetadata
            ? {
                batch_id: this.batchId,
                ip_address: 'system',
                user_agent: 'enterprise-activity-generator',
              }
            : undefined,
          created_at: book.created_at,
        }

        if (skipDuplicates) {
          const isDuplicate = await this.checkForDuplicates(bookActivity)
          if (isDuplicate) {
            duplicates++
            continue
          }
        }

        activities.push(bookActivity)
      }

      // Insert all activities in batches
      const insertResult = await this.insertActivityBatch(activities)

      return {
        success: insertResult.success,
        processed: books.length,
        inserted: insertResult.inserted,
        duplicates,
        errors: [...errors, ...insertResult.errors],
      }
    } catch (error) {
      console.error('Enterprise book activity generation failed:', error)
      return {
        success: false,
        processed: 0,
        inserted: 0,
        duplicates: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  // Generate all activities with enterprise features
  async generateAllActivities(
    adminUserId: string,
    options: {
      skipDuplicates?: boolean
      includeMetadata?: boolean
      batchSize?: number
      entityTypes?: string[]
    } = {}
  ): Promise<{
    success: boolean
    total: {
      processed: number
      inserted: number
      duplicates: number
      errors: string[]
    }
    breakdown: {
      authors: { processed: number; inserted: number; duplicates: number }
      books: { processed: number; inserted: number; duplicates: number }
      publishers: { processed: number; inserted: number; duplicates: number }
      users: { processed: number; inserted: number; duplicates: number }
      groups: { processed: number; inserted: number; duplicates: number }
    }
  }> {
    const {
      skipDuplicates = true,
      includeMetadata = true,
      batchSize = this.batchSize,
      entityTypes = ['authors', 'books', 'publishers', 'users', 'groups'],
    } = options

    this.batchSize = batchSize
    const results = {
      authors: { processed: 0, inserted: 0, duplicates: 0 },
      books: { processed: 0, inserted: 0, duplicates: 0 },
      publishers: { processed: 0, inserted: 0, duplicates: 0 },
      users: { processed: 0, inserted: 0, duplicates: 0 },
      groups: { processed: 0, inserted: 0, duplicates: 0 },
    }

    const allErrors: string[] = []

    try {
      // Get all entity IDs for each type
      const entityPromises = []

      if (entityTypes.includes('authors')) {
        entityPromises.push(
          supabaseAdmin
            .from('authors')
            .select('id')
            .then(({ data, error }) => ({
              type: 'authors',
              ids: data?.map((a) => a.id) || [],
              error,
            }))
        )
      }

      if (entityTypes.includes('books')) {
        entityPromises.push(
          supabaseAdmin
            .from('books')
            .select('id')
            .then(({ data, error }) => ({
              type: 'books',
              ids: data?.map((b) => b.id) || [],
              error,
            }))
        )
      }

      if (entityTypes.includes('publishers')) {
        entityPromises.push(
          supabaseAdmin
            .from('publishers')
            .select('id')
            .then(({ data, error }) => ({
              type: 'publishers',
              ids: data?.map((p) => p.id) || [],
              error,
            }))
        )
      }

      if (entityTypes.includes('users')) {
        entityPromises.push(
          supabaseAdmin
            .from('users')
            .select('id')
            .then(({ data, error }) => ({
              type: 'users',
              ids: data?.map((u) => u.id) || [],
              error,
            }))
        )
      }

      if (entityTypes.includes('groups')) {
        entityPromises.push(
          supabaseAdmin
            .from('groups')
            .select('id')
            .then(({ data, error }) => ({
              type: 'groups',
              ids: data?.map((g) => g.id) || [],
              error,
            }))
        )
      }

      const entityResults = await Promise.all(entityPromises)

      // Process each entity type
      for (const result of entityResults) {
        if (result.error) {
          allErrors.push(`${result.type}: ${result.error.message}`)
          continue
        }

        if (result.ids.length === 0) {
          continue
        }

        let typeResult

        switch (result.type) {
          case 'authors':
            typeResult = await this.generateAuthorActivities(result.ids, adminUserId, {
              skipDuplicates,
              includeMetadata,
              batchSize,
            })
            results.authors = {
              processed: typeResult.processed,
              inserted: typeResult.inserted,
              duplicates: typeResult.duplicates,
            }
            break

          case 'books':
            typeResult = await this.generateBookActivities(result.ids, adminUserId, {
              skipDuplicates,
              includeMetadata,
              batchSize,
            })
            results.books = {
              processed: typeResult.processed,
              inserted: typeResult.inserted,
              duplicates: typeResult.duplicates,
            }
            break

          // Add other entity types as needed
        }

        if (typeResult && !typeResult.success) {
          allErrors.push(...typeResult.errors)
        }
      }

      const total = {
        processed: Object.values(results).reduce((sum, r) => sum + r.processed, 0),
        inserted: Object.values(results).reduce((sum, r) => sum + r.inserted, 0),
        duplicates: Object.values(results).reduce((sum, r) => sum + r.duplicates, 0),
        errors: allErrors,
      }

      return {
        success: allErrors.length === 0,
        total,
        breakdown: results,
      }
    } catch (error) {
      console.error('Enterprise all activities generation failed:', error)
      return {
        success: false,
        total: {
          processed: 0,
          inserted: 0,
          duplicates: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
        breakdown: results,
      }
    }
  }

  // Utility function to chunk arrays
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  // Get activity statistics
  async getActivityStats(): Promise<{
    total_activities: number
    activities_today: number
    activities_this_week: number
    activities_this_month: number
    by_type: Record<string, number>
    by_entity: Record<string, number>
  }> {
    try {
      // Get total count
      const { count: total } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })

      // Get today's count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayCount } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Get this week's count
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: weekCount } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Get this month's count
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { count: monthCount } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString())

      // Get breakdown by activity type
      const { data: typeBreakdown } = await supabaseAdmin
        .from('posts')
        .select('activity_type')
        .limit(1000) // Sample for breakdown

      const byType =
        typeBreakdown?.reduce(
          (acc, activity) => {
            acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ) || {}

      // Get breakdown by entity type
      const { data: entityBreakdown } = await supabaseAdmin
        .from('posts')
        .select('entity_type')
        .limit(1000) // Sample for breakdown

      const byEntity =
        entityBreakdown?.reduce(
          (acc, activity) => {
            if (activity.entity_type) {
              acc[activity.entity_type] = (acc[activity.entity_type] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>
        ) || {}

      return {
        total_activities: total || 0,
        activities_today: todayCount || 0,
        activities_this_week: weekCount || 0,
        activities_this_month: monthCount || 0,
        by_type: byType,
        by_entity: byEntity,
      }
    } catch (error) {
      console.error('Error getting activity stats:', error)
      return {
        total_activities: 0,
        activities_today: 0,
        activities_this_week: 0,
        activities_this_month: 0,
        by_type: {},
        by_entity: {},
      }
    }
  }
}

// Export singleton instance
export const enterpriseActivityGenerator = new EnterpriseActivityGenerator()
