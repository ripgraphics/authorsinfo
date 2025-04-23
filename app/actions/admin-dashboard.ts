"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

// Define a type for book authors
interface BookAuthor {
  author_id: string;
  count: number;
}

// Define a type for reading challenges
interface ReadingChallenge {
  goal: number;
  books_read: number;
}

// Define a type for reading status
interface ReadingStatus {
  status: string;
}

// Define a type for review data
interface ReviewData {
  rating: number;
}

// Get content statistics
export async function getContentStats() {
  try {
    const [
      { count: booksCount },
      { count: authorsCount },
      { count: publishersCount },
      { count: usersCount },
      { count: reviewsCount },
    ] = await Promise.all([
      supabaseAdmin.from("books").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("authors").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("publishers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }),
    ])

    return {
      booksCount: booksCount || 0,
      authorsCount: authorsCount || 0,
      publishersCount: publishersCount || 0,
      usersCount: usersCount || 0,
      reviewsCount: reviewsCount || 0,
    }
  } catch (error) {
    console.error("Error fetching content stats:", error)
    return {
      booksCount: 0,
      authorsCount: 0,
      publishersCount: 0,
      usersCount: 0,
      reviewsCount: 0,
    }
  }
}

// Get recent content additions
export async function getRecentContent(days = 30) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [{ data: recentBooks }, { data: recentAuthors }, { data: recentPublishers }] = await Promise.all([
      supabaseAdmin
        .from("books")
        .select("id, title, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("authors")
        .select("id, name, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("publishers")
        .select("id, name, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    return {
      recentBooks: recentBooks || [],
      recentAuthors: recentAuthors || [],
      recentPublishers: recentPublishers || [],
    }
  } catch (error) {
    console.error("Error fetching recent content:", error)
    return {
      recentBooks: [],
      recentAuthors: [],
      recentPublishers: [],
    }
  }
}

// Get content growth trends
export async function getContentGrowthTrends(months = 6) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Generate an array of month start dates
    const monthDates = []
    for (let i = 0; i <= months; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      date.setDate(1) // First day of month
      monthDates.push(date)
    }

    // Format dates for SQL queries
    const formattedDates = monthDates.map((date) => date.toISOString())

    // Get book counts by month
    const bookCounts = []
    for (let i = 0; i < formattedDates.length - 1; i++) {
      const { count } = await supabaseAdmin
        .from("books")
        .select("*", { count: "exact", head: true })
        .gte("created_at", formattedDates[i])
        .lt("created_at", formattedDates[i + 1])

      bookCounts.push({
        month: new Date(formattedDates[i]).toLocaleString("default", { month: "short" }),
        count: count || 0,
      })
    }

    // Get author counts by month
    const authorCounts = []
    for (let i = 0; i < formattedDates.length - 1; i++) {
      const { count } = await supabaseAdmin
        .from("authors")
        .select("*", { count: "exact", head: true })
        .gte("created_at", formattedDates[i])
        .lt("created_at", formattedDates[i + 1])

      authorCounts.push({
        month: new Date(formattedDates[i]).toLocaleString("default", { month: "short" }),
        count: count || 0,
      })
    }

    return {
      bookGrowth: bookCounts,
      authorGrowth: authorCounts,
    }
  } catch (error) {
    console.error("Error fetching content growth trends:", error)
    return {
      bookGrowth: [],
      authorGrowth: [],
    }
  }
}

// Get popular content
export async function getPopularContent() {
  try {
    // Get top rated books
    const { data: topRatedBooks } = await supabaseAdmin
      .from("books")
      .select("id, title, average_rating")
      .not("average_rating", "is", null)
      .order("average_rating", { ascending: false })
      .limit(5)

    // Get most reviewed books
    const { data: mostReviewedBooks } = await supabaseAdmin
      .from("books")
      .select("id, title, review_count")
      .not("review_count", "is", null)
      .order("review_count", { ascending: false })
      .limit(5)

    // Get most prolific authors (authors with most books)
    const { data: bookAuthors } = await supabaseAdmin.from("book_authors").select("author_id, count")

    // Count books per author
    const authorBookCounts: Record<string, number> = {}
    bookAuthors?.forEach((item: BookAuthor) => {
      if (item.author_id) {
        authorBookCounts[item.author_id] = (authorBookCounts[item.author_id] || 0) + 1
      }
    })

    // Convert to array and sort
    const sortedAuthors = Object.entries(authorBookCounts)
      .map(([authorId, count]) => ({ authorId, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5)

    // Get author details
    const authorIds = sortedAuthors.map((item) => item.authorId)
    const { data: prolificAuthors } = await supabaseAdmin.from("authors").select("id, name").in("id", authorIds)

    // Combine with counts
    const authorsWithCounts =
      prolificAuthors?.map((author) => {
        const authorData = sortedAuthors.find((item) => item.authorId === author.id)
        return {
          ...author,
          bookCount: authorData?.count || 0,
        }
      }) || []

    return {
      topRatedBooks: topRatedBooks || [],
      mostReviewedBooks: mostReviewedBooks || [],
      prolificAuthors: authorsWithCounts,
    }
  } catch (error) {
    console.error("Error fetching popular content:", error)
    return {
      topRatedBooks: [],
      mostReviewedBooks: [],
      prolificAuthors: [],
    }
  }
}

// Get user engagement metrics
export async function getUserEngagementMetrics() {
  try {
    // Get reading challenge stats
    const { data: readingChallenges } = await supabaseAdmin.from("reading_challenges").select("goal, books_read")

    const totalChallenges = readingChallenges?.length || 0
    const totalGoals = readingChallenges?.reduce((sum: number, challenge: ReadingChallenge) => sum + (challenge.goal || 0), 0) || 0
    const totalBooksRead = readingChallenges?.reduce((sum: number, challenge: ReadingChallenge) => sum + (challenge.books_read || 0), 0) || 0

    // Get reading status counts using a different approach
    const { data: readingStatusData } = await supabaseAdmin.from("reading_status").select("status")
    
    // Count statuses manually
    const statusCounts: Record<string, number> = {}
    readingStatusData?.forEach((item: ReadingStatus) => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
    })
    
    const readingStatusCounts = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))

    // Get review stats using a different approach
    const { data: reviewData } = await supabaseAdmin.from("reviews").select("rating")
    
    // Count ratings manually
    const ratingCounts: Record<number, number> = {}
    reviewData?.forEach((item: ReviewData) => {
      ratingCounts[item.rating] = (ratingCounts[item.rating] || 0) + 1
    })
    
    const reviewStats = Object.entries(ratingCounts).map(([rating, count]) => ({
      rating: parseInt(rating),
      count
    }))

    return {
      readingChallenges: {
        totalChallenges,
        totalGoals,
        totalBooksRead,
        completionRate: totalGoals > 0 ? (totalBooksRead / totalGoals) * 100 : 0,
      },
      readingStatusCounts: readingStatusCounts || [],
      reviewStats: reviewStats || [],
    }
  } catch (error) {
    console.error("Error fetching user engagement metrics:", error)
    return {
      readingChallenges: {
        totalChallenges: 0,
        totalGoals: 0,
        totalBooksRead: 0,
        completionRate: 0,
      },
      readingStatusCounts: [],
      reviewStats: [],
    }
  }
}

// Get system health metrics
export async function getSystemHealthMetrics() {
  try {
    // Get storage usage
    const { data: images } = await supabaseAdmin.from("images").select("id")
    const imageCount = images?.length || 0

    // Get error logs (if you have an error_logs table)
    let errorLogs = null
    try {
      const { data } = await supabaseAdmin
        .from("error_logs")
        .select("id, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(5)
      errorLogs = data
    } catch (error) {
      console.log("Error fetching error logs (table may not exist):", error)
      errorLogs = []
    }

    return {
      storage: {
        imageCount,
        estimatedSize: imageCount * 2, // Rough estimate: 2MB per image
      },
      errorLogs: errorLogs || [],
    }
  } catch (error) {
    console.error("Error fetching system health metrics:", error)
    return {
      storage: {
        imageCount: 0,
        estimatedSize: 0,
      },
      errorLogs: [],
    }
  }
}
