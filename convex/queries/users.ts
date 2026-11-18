import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get a user by ID (Supabase UUID or Convex _id) or permalink
 */
export const getUser = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Try Supabase UUID or Convex _id
    let results = await ctx.db
      .query('users')
      .filter(q => q.or(q.eq('supabaseId', args.id), q.eq('_id', args.id)))
      .take(1)
    let user = results[0]

    if (!user) {
      // Try permalink
      results = await ctx.db
        .query('users')
        .filter(q => q.eq('permalink', args.id))
        .take(1)
      user = results[0]
    }

    return user ?? null
  },
})

/**
 * List users with optional filters
 */
export const listUsers = query({
  args: {},
  handler: async (ctx, _args) => {
    return await ctx.db.query('users').take(500)
  },
})

/**
 * Get profile for a user
 */
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('profiles')
      .filter(q => q.eq('userId', args.userId))
      .take(1)
    return results[0] ?? null
  },
})

/**
 * Get user's reading statistics
 */
export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Resolve user to Convex _id
    const userResults = await ctx.db
      .query('users')
      .filter(q => q.or(q.eq('supabaseId', args.userId), q.eq('_id', args.userId)))
      .take(1)
    const user = userResults[0]
    if (!user) return { completedBooks: 0, totalFriends: 0, followersCount: 0 }

    const progress = await ctx.db.query('readingProgress').take(500)
    const friends = await ctx.db.query('userFriends').take(500)
    const follows = await ctx.db.query('follows').take(500)

    const completedBooks = progress.filter(
      p => p.userId === user.supabaseId && p.status === 'completed'
    ).length

    const totalFriends = friends.filter(f =>
      ((f.userId === user.supabaseId && f.status === 'accepted') ||
       (f.friendId === user.supabaseId && f.status === 'accepted'))
    ).length

    const followersCount = follows.filter(
      f => f.followingId === user.supabaseId
    ).length

    return { completedBooks, totalFriends, followersCount }
  },
})

/**
 * Get currently reading books for a user with privacy filtering
 */
export const getCurrentlyReadingBooksForUser = query({
  args: {
    profileOwnerId: v.string(),
    viewerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isOwner = args.viewerId === args.profileOwnerId
    
    // Get user privacy settings
    const privacySettings = await ctx.db.query('userPrivacySettings').collect()
    const settings = privacySettings.find((s: any) => s.userId === args.profileOwnerId)
    
    // Determine if viewer can see reading progress
    let canViewProgress = isOwner
    if (!isOwner) {
      if (!args.viewerId) {
        canViewProgress = settings?.allowPublicReadingProfile === true
      } else {
        // Check if viewer is friend
        const friends = await ctx.db.query('userFriends').collect()
        const isFriend = friends.some((f: any) => 
          f.status === 'accepted' && 
          ((f.userId === args.viewerId && f.friendId === args.profileOwnerId) ||
           (f.userId === args.profileOwnerId && f.friendId === args.viewerId))
        )
        
        // Check if viewer is following
        const follows = await ctx.db.query('follows').collect()
        const isFollowing = follows.some((f: any) => 
          f.followerId === args.viewerId && f.followingId === args.profileOwnerId
        )
        
        canViewProgress = 
          settings?.allowPublicReadingProfile === true ||
          (settings?.allowFriendsToSeeReading === true && isFriend) ||
          (settings?.allowFollowersToSeeReading === true && isFollowing)
      }
    }
    
    if (!canViewProgress) {
      return []
    }
    
    // Fetch reading progress entries with status = 'in_progress'
    const progress = await ctx.db.query('reading_progress').collect()
    const currentlyReadingProgress = progress.filter((p: any) => 
      (p.userId === args.profileOwnerId || p.user_id === args.profileOwnerId) && 
      p.status === 'in_progress'
    ).sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    
    if (currentlyReadingProgress.length === 0) {
      return []
    }
    
    // Filter by reading_progress-level privacy if viewer is not the owner
    let filteredProgress = currentlyReadingProgress
    if (!isOwner && args.viewerId) {
      const friends = await ctx.db.query('userFriends').collect()
      const isFriend = friends.some((f: any) => 
        f.status === 'accepted' && 
        ((f.userId === args.viewerId && f.friendId === args.profileOwnerId) ||
         (f.userId === args.profileOwnerId && f.friendId === args.viewerId))
      )
      
      const follows = await ctx.db.query('follows').collect()
      const isFollowing = follows.some((f: any) => 
        f.followerId === args.viewerId && f.followingId === args.profileOwnerId
      )
      
      filteredProgress = currentlyReadingProgress.filter((rp: any) => {
        return (
          rp.privacyLevel === 'public' ||
          (rp.allowFriends === true && isFriend) ||
          (rp.allowFollowers === true && isFollowing)
        )
      })
    }
    
    if (filteredProgress.length === 0) {
      return []
    }
    
    // Get all book IDs
    const currentlyReadingBookIds = filteredProgress.map((rp: any) => rp.bookId || rp.book_id).filter(Boolean)
    
    if (currentlyReadingBookIds.length === 0) {
      return []
    }
    
    // Fetch books with cover images, permalinks, and pages
    const books = await ctx.db.query('books').collect()
    const booksMap = new Map(books.filter((b: any) => currentlyReadingBookIds.includes(b.id || b._id)).map((b: any) => [b.id || b._id, b]))
    
    // Fetch authors for all currently reading books
    const bookAuthors = await ctx.db.query('book_authors').collect()
    const authors = await ctx.db.query('authors').collect()
    
    const authorMap = new Map<string, any>()
    bookAuthors.forEach((ba: any) => {
      const bookId = ba.bookId || ba.book_id
      const authorId = ba.authorId || ba.author_id
      if (!authorMap.has(bookId)) {
        const author = authors.find((a: any) => a.id === authorId || a._id === authorId)
        if (author) {
          authorMap.set(bookId, { id: author.id || author._id, name: author.name })
        }
      }
    })
    
    // Transform the data to match the structure expected by the client component
    const currentlyReadingBooks = filteredProgress
      .map((rp: any) => {
        const bookId = rp.bookId || rp.book_id
        const book = booksMap.get(bookId)
        if (!book || !book.id) {
          return null
        }
        
        const author = authorMap.get(bookId) || null
        
        // Calculate progress percentage
        let percentage: number | null = null
        const totalPagesFromBook = book.pages || book.pageCount || null
        
        if (
          rp.currentPage !== null &&
          rp.currentPage !== undefined &&
          rp.currentPage > 0 &&
          totalPagesFromBook !== null &&
          totalPagesFromBook !== undefined &&
          totalPagesFromBook > 0
        ) {
          percentage = Math.round((rp.currentPage / totalPagesFromBook) * 100)
        } else if (typeof rp.progressPercent === 'number') {
          percentage = rp.progressPercent
        } else if (typeof rp.progressPercentage === 'number') {
          percentage = rp.progressPercentage
        }
        
        const currentPage = rp.currentPage !== null && rp.currentPage !== undefined ? rp.currentPage : null
        const totalPages = totalPagesFromBook
        
        return {
          id: book.id || book._id,
          title: book.title,
          permalink: book.permalink || null,
          coverImageUrl: book.coverUrl || book.coverImageId || null,
          progress_percentage: percentage,
          currentPage: currentPage,
          totalPages: totalPages,
          author: author
            ? {
                id: author.id,
                name: author.name,
              }
            : null,
        }
      })
      .filter(Boolean)
      .slice(0, 5) // Limit to 5 books
    
    return currentlyReadingBooks
  },
})

/**
 * Get user's books from reading progress
 */
export const getUserBooks = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const progress = await ctx.db.query('reading_progress').collect()
    const books = await ctx.db.query('books').collect()
    const bookAuthors = await ctx.db.query('book_authors').collect()
    const authors = await ctx.db.query('authors').collect()
    
    const userProgress = progress.filter((p: any) => 
      (p.userId === args.userId || p.user_id === args.userId)
    ).sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    
    const bookIds = userProgress.map((p: any) => p.bookId || p.book_id).filter(Boolean)
    const booksMap = new Map(books.filter((b: any) => bookIds.includes(b.id || b._id)).map((b: any) => [b.id || b._id, b]))
    
    const authorMap = new Map<string, any>()
    bookAuthors.forEach((ba: any) => {
      const bookId = ba.bookId || ba.book_id
      const authorId = ba.authorId || ba.author_id
      if (!authorMap.has(bookId)) {
        const author = authors.find((a: any) => a.id === authorId || a._id === authorId)
        if (author) {
          authorMap.set(bookId, { id: author.id || author._id, name: author.name })
        }
      }
    })
    
    const limit = args.limit ?? 100
    return userProgress
      .slice(0, limit)
      .map((rp: any) => {
        const bookId = rp.bookId || rp.book_id
        const book = booksMap.get(bookId)
        if (!book || !book.id) return null
        
        const author = authorMap.get(bookId) || null
        
        return {
          id: book.id || book._id,
          title: book.title,
          coverImageUrl: book.coverUrl || book.coverImageId || null,
          status: rp.status,
          progressPercent: rp.progressPercent,
          currentPage: rp.currentPage,
          totalPages: rp.totalPages,
          author: author ? { id: author.id || author._id, name: author.name } : null,
          updatedAt: rp.updatedAt,
        }
      })
      .filter(Boolean)
  },
})

/**
 * Get user's friends
 */
export const getUserFriends = query({
  args: { userId: v.string(), page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const friends = await ctx.db.query('userFriends').collect()
    const users = await ctx.db.query('users').collect()
    
    const friendIds = new Set<string>()
    friends.forEach((f: any) => {
      if (f.status !== 'accepted') return
      if (f.userId === args.userId) {
        friendIds.add(f.friendId)
      }
      if (f.friendId === args.userId) {
        friendIds.add(f.userId)
      }
    })
    
    const friendsList = Array.from(friendIds).map((id: string) => {
      const user = users.find((u: any) => u.id === id || u._id === id)
      return user ? { id: user.id || user._id, name: user.name, email: user.email } : null
    }).filter(Boolean)
    
    const page = args.page ?? 1
    const limit = args.limit ?? 50
    const offset = (page - 1) * limit
    
    return {
      friends: friendsList.slice(offset, offset + limit),
      count: friendsList.length,
    }
  },
})

/**
 * Get user's followers
 */
export const getUserFollowers = query({
  args: { userId: v.string(), page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const follows = await ctx.db.query('follows').collect()
    const users = await ctx.db.query('users').collect()
    
    const followerIds = follows
      .filter((f: any) => f.followingId === args.userId || f.following_id === args.userId)
      .map((f: any) => f.followerId || f.follower_id)
    
    const followersList = followerIds.map((id: string) => {
      const user = users.find((u: any) => u.id === id || u._id === id)
      return user ? { id: user.id || user._id, name: user.name, email: user.email } : null
    }).filter(Boolean)
    
    const page = args.page ?? 1
    const limit = args.limit ?? 50
    const offset = (page - 1) * limit
    
    return {
      followers: followersList.slice(offset, offset + limit),
      count: followersList.length,
    }
  },
})