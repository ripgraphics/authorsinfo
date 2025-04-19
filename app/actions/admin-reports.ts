"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

export type DateRange = {
  startDate: string
  endDate: string
}

export type ReportType = "user_activity" | "content_popularity" | "reading_trends" | "author_performance"

export async function getUserActivityData(dateRange: DateRange) {
  try {
    const { startDate, endDate } = dateRange

    // Get new user registrations over time
    const { data: newUsers, error: newUsersError } = await supabaseAdmin
      .from("users")
      .select("id, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at")

    if (newUsersError) throw newUsersError

    // Get user logins over time (if you have a login_history table)
    let loginData = []
    try {
      const { data: logins, error: loginsError } = await supabaseAdmin
        .from("login_history")
        .select("id, user_id, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at")

      if (!loginsError) {
        loginData = logins || []
      }
    } catch (error) {
      console.log("Login history table might not exist:", error)
    }

    // Get user reading activity (if you have a reading_activity or similar table)
    let readingData = []
    try {
      const { data: readings, error: readingsError } = await supabaseAdmin
        .from("reading_activity")
        .select("id, user_id, book_id, status, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at")

      if (!readingsError) {
        readingData = readings || []
      }
    } catch (error) {
      console.log("Reading activity table might not exist:", error)
    }

    // Process data for visualization
    // Group new users by day
    const usersByDay = groupByDay(newUsers || [], "created_at")
    const loginsByDay = groupByDay(loginData, "created_at")
    const readingsByDay = groupByDay(readingData, "created_at")

    return {
      userRegistrations: {
        labels: Object.keys(usersByDay),
        data: Object.values(usersByDay),
      },
      userLogins: {
        labels: Object.keys(loginsByDay),
        data: Object.values(loginsByDay),
      },
      readingActivity: {
        labels: Object.keys(readingsByDay),
        data: Object.values(readingsByDay),
      },
      totalNewUsers: newUsers?.length || 0,
      totalLogins: loginData.length,
      totalReadingActivities: readingData.length,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching user activity data:", error)
    return {
      userRegistrations: { labels: [], data: [] },
      userLogins: { labels: [], data: [] },
      readingActivity: { labels: [], data: [] },
      totalNewUsers: 0,
      totalLogins: 0,
      totalReadingActivities: 0,
      error: String(error),
    }
  }
}

export async function getContentPopularityData(dateRange: DateRange) {
  try {
    const { startDate, endDate } = dateRange

    // Get most viewed books
    let viewData = []
    try {
      const { data: views, error: viewsError } = await supabaseAdmin
        .from("book_views")
        .select("id, book_id, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (!viewsError && views) {
        // Count views per book
        const bookViewCounts: Record<string, number> = {}
        for (const view of views) {
          if (view.book_id) {
            bookViewCounts[view.book_id] = (bookViewCounts[view.book_id] || 0) + 1
          }
        }

        // Get book details for the most viewed books
        const topBookIds = Object.entries(bookViewCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id]) => id)

        if (topBookIds.length > 0) {
          const { data: books } = await supabaseAdmin
            .from("books")
            .select("id, title, author_id, cover_image_id")
            .in("id", topBookIds)

          // Combine with view counts
          viewData = (books || []).map((book) => ({
            ...book,
            views: bookViewCounts[book.id] || 0,
          }))
        }
      }
    } catch (error) {
      console.log("Book views table might not exist:", error)
    }

    // Get most rated books
    let ratingData = []
    try {
      const { data: ratings, error: ratingsError } = await supabaseAdmin
        .from("book_ratings")
        .select("id, book_id, rating, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (!ratingsError && ratings) {
        // Calculate average rating per book
        const bookRatings: Record<string, { sum: number; count: number }> = {}
        for (const rating of ratings) {
          if (rating.book_id && rating.rating) {
            if (!bookRatings[rating.book_id]) {
              bookRatings[rating.book_id] = { sum: 0, count: 0 }
            }
            bookRatings[rating.book_id].sum += rating.rating
            bookRatings[rating.book_id].count += 1
          }
        }

        // Calculate averages
        const bookAverages: Record<string, number> = {}
        for (const [bookId, data] of Object.entries(bookRatings)) {
          bookAverages[bookId] = data.sum / data.count
        }

        // Get book details for the most rated books
        const topRatedBookIds = Object.entries(bookRatings)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([id]) => id)

        if (topRatedBookIds.length > 0) {
          const { data: books } = await supabaseAdmin
            .from("books")
            .select("id, title, author_id, cover_image_id")
            .in("id", topRatedBookIds)

          // Combine with rating data
          ratingData = (books || []).map((book) => ({
            ...book,
            averageRating: bookAverages[book.id] || 0,
            ratingCount: bookRatings[book.id]?.count || 0,
          }))
        }
      }
    } catch (error) {
      console.log("Book ratings table might not exist:", error)
    }

    // Get genre popularity
    let genreData = []
    try {
      // First get all books with their genres
      const { data: books, error: booksError } = await supabaseAdmin.from("books").select("id, genre_id")

      if (!booksError && books) {
        // Count books per genre
        const genreCounts: Record<string, number> = {}
        for (const book of books) {
          if (book.genre_id) {
            genreCounts[book.genre_id] = (genreCounts[book.genre_id] || 0) + 1
          }
        }

        // Get genre details
        const { data: genres } = await supabaseAdmin.from("book_genres").select("id, name")

        // Combine with counts
        genreData = (genres || []).map((genre) => ({
          id: genre.id,
          name: genre.name,
          bookCount: genreCounts[genre.id] || 0,
        }))

        // Sort by book count
        genreData.sort((a, b) => b.bookCount - a.bookCount)
      }
    } catch (error) {
      console.log("Error fetching genre data:", error)
    }

    return {
      mostViewedBooks: viewData,
      mostRatedBooks: ratingData,
      genrePopularity: genreData,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching content popularity data:", error)
    return {
      mostViewedBooks: [],
      mostRatedBooks: [],
      genrePopularity: [],
      error: String(error),
    }
  }
}

export async function getReadingTrendsData(dateRange: DateRange) {
  try {
    const { startDate, endDate } = dateRange

    // Get reading status distribution
    let statusData: { status: string; count: number }[] = []
    try {
      const { data, error } = await supabaseAdmin
        .from("reading_activity")
        .select("status")
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (!error && data) {
        // Count by status
        const statusCounts: Record<string, number> = {}
        for (const item of data) {
          if (item.status) {
            statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
          }
        }

        // Convert to array format
        statusData = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        }))
      }
    } catch (error) {
      console.log("Reading activity table might not exist:", error)
    }

    // Get reading completion rates
    const completionData = {
      completed: 0,
      abandoned: 0,
      inProgress: 0,
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("reading_activity")
        .select("status")
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (!error && data) {
        for (const item of data) {
          if (item.status === "completed") {
            completionData.completed++
          } else if (item.status === "abandoned") {
            completionData.abandoned++
          } else if (item.status === "reading" || item.status === "in_progress") {
            completionData.inProgress++
          }
        }
      }
    } catch (error) {
      console.log("Reading activity table might not exist:", error)
    }

    // Get reading time trends (if you have reading_sessions or similar)
    let readingTimeData = []
    try {
      const { data, error } = await supabaseAdmin
        .from("reading_sessions")
        .select("id, user_id, book_id, duration_minutes, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at")

      if (!error && data) {
        // Group by day
        readingTimeData = groupByDay(data, "created_at", "duration_minutes")
      }
    } catch (error) {
      console.log("Reading sessions table might not exist:", error)
    }

    return {
      statusDistribution: statusData,
      completionRates: completionData,
      readingTimeByDay: {
        labels: Object.keys(readingTimeData),
        data: Object.values(readingTimeData),
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching reading trends data:", error)
    return {
      statusDistribution: [],
      completionRates: { completed: 0, abandoned: 0, inProgress: 0 },
      readingTimeByDay: { labels: [], data: [] },
      error: String(error),
    }
  }
}

export async function getAuthorPerformanceData(dateRange: DateRange) {
  try {
    const { startDate, endDate } = dateRange

    // Get top authors by book count
    const { data: authors, error: authorsError } = await supabaseAdmin.from("authors").select("id, name")

    if (authorsError) throw authorsError

    // Get book counts for each author
    const { data: books, error: booksError } = await supabaseAdmin.from("books").select("id, author_id")

    if (booksError) throw booksError

    // Count books per author
    const authorBookCounts: Record<string, number> = {}
    for (const book of books || []) {
      if (book.author_id) {
        authorBookCounts[book.author_id] = (authorBookCounts[book.author_id] || 0) + 1
      }
    }

    // Get author ratings (if you have book_ratings)
    const authorRatings: Record<string, { sum: number; count: number }> = {}
    try {
      const { data: bookRatings, error: ratingsError } = await supabaseAdmin
        .from("book_ratings")
        .select("id, book_id, rating")
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (!ratingsError && bookRatings) {
        // Get book to author mapping
        const bookToAuthor: Record<string, string> = {}
        for (const book of books || []) {
          if (book.id && book.author_id) {
            bookToAuthor[book.id] = book.author_id
          }
        }

        // Aggregate ratings by author
        for (const rating of bookRatings) {
          if (rating.book_id && rating.rating) {
            const authorId = bookToAuthor[rating.book_id]
            if (authorId) {
              if (!authorRatings[authorId]) {
                authorRatings[authorId] = { sum: 0, count: 0 }
              }
              authorRatings[authorId].sum += rating.rating
              authorRatings[authorId].count += 1
            }
          }
        }
      }
    } catch (error) {
      console.log("Book ratings table might not exist:", error)
    }

    // Combine author data
    const authorData = (authors || []).map((author) => {
      const bookCount = authorBookCounts[author.id] || 0
      const ratingData = authorRatings[author.id]
      const averageRating = ratingData ? ratingData.sum / ratingData.count : 0
      const ratingCount = ratingData?.count || 0

      return {
        id: author.id,
        name: author.name,
        bookCount,
        averageRating,
        ratingCount,
      }
    })

    // Sort by book count
    authorData.sort((a, b) => b.bookCount - a.bookCount)

    return {
      topAuthors: authorData.slice(0, 10),
      authorRatings: authorData
        .filter((author) => author.ratingCount > 0)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 10),
      error: null,
    }
  } catch (error) {
    console.error("Error fetching author performance data:", error)
    return {
      topAuthors: [],
      authorRatings: [],
      error: String(error),
    }
  }
}

// Helper function to group data by day
function groupByDay(data: any[], dateField: string, valueField?: string) {
  const result: Record<string, number> = {}

  for (const item of data) {
    if (item[dateField]) {
      const date = new Date(item[dateField]).toISOString().split("T")[0]
      if (valueField) {
        result[date] = (result[date] || 0) + (item[valueField] || 0)
      } else {
        result[date] = (result[date] || 0) + 1
      }
    }
  }

  return result
}

// Helper function to export data to CSV
export async function exportReportToCSV(reportType: ReportType, dateRange: DateRange) {
  try {
    let data: any
    let csvContent = ""

    switch (reportType) {
      case "user_activity":
        data = await getUserActivityData(dateRange)
        if (data.error) throw new Error(data.error)

        // Create CSV for user registrations
        csvContent += "User Activity Report\n"
        csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`

        csvContent += "User Registrations by Day\n"
        csvContent += "Date,Count\n"
        data.userRegistrations.labels.forEach((date: string, index: number) => {
          csvContent += `${date},${data.userRegistrations.data[index]}\n`
        })

        csvContent += "\nUser Logins by Day\n"
        csvContent += "Date,Count\n"
        data.userLogins.labels.forEach((date: string, index: number) => {
          csvContent += `${date},${data.userLogins.data[index]}\n`
        })

        csvContent += "\nReading Activity by Day\n"
        csvContent += "Date,Count\n"
        data.readingActivity.labels.forEach((date: string, index: number) => {
          csvContent += `${date},${data.readingActivity.data[index]}\n`
        })

        csvContent += `\nSummary\n`
        csvContent += `Total New Users,${data.totalNewUsers}\n`
        csvContent += `Total Logins,${data.totalLogins}\n`
        csvContent += `Total Reading Activities,${data.totalReadingActivities}\n`
        break

      case "content_popularity":
        data = await getContentPopularityData(dateRange)
        if (data.error) throw new Error(data.error)

        csvContent += "Content Popularity Report\n"
        csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`

        csvContent += "Most Viewed Books\n"
        csvContent += "Title,Views\n"
        data.mostViewedBooks.forEach((book: any) => {
          csvContent += `"${book.title}",${book.views}\n`
        })

        csvContent += "\nMost Rated Books\n"
        csvContent += "Title,Average Rating,Rating Count\n"
        data.mostRatedBooks.forEach((book: any) => {
          csvContent += `"${book.title}",${book.averageRating.toFixed(2)},${book.ratingCount}\n`
        })

        csvContent += "\nGenre Popularity\n"
        csvContent += "Genre,Book Count\n"
        data.genrePopularity.forEach((genre: any) => {
          csvContent += `"${genre.name}",${genre.bookCount}\n`
        })
        break

      case "reading_trends":
        data = await getReadingTrendsData(dateRange)
        if (data.error) throw new Error(data.error)

        csvContent += "Reading Trends Report\n"
        csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`

        csvContent += "Reading Status Distribution\n"
        csvContent += "Status,Count\n"
        data.statusDistribution.forEach((item: any) => {
          csvContent += `"${item.status}",${item.count}\n`
        })

        csvContent += "\nCompletion Rates\n"
        csvContent += "Status,Count\n"
        csvContent += `"Completed",${data.completionRates.completed}\n`
        csvContent += `"Abandoned",${data.completionRates.abandoned}\n`
        csvContent += `"In Progress",${data.completionRates.inProgress}\n`

        csvContent += "\nReading Time by Day\n"
        csvContent += "Date,Minutes\n"
        data.readingTimeByDay.labels.forEach((date: string, index: number) => {
          csvContent += `${date},${data.readingTimeByDay.data[index]}\n`
        })
        break

      case "author_performance":
        data = await getAuthorPerformanceData(dateRange)
        if (data.error) throw new Error(data.error)

        csvContent += "Author Performance Report\n"
        csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`

        csvContent += "Top Authors by Book Count\n"
        csvContent += "Author,Book Count\n"
        data.topAuthors.forEach((author: any) => {
          csvContent += `"${author.name}",${author.bookCount}\n`
        })

        csvContent += "\nTop Authors by Rating\n"
        csvContent += "Author,Average Rating,Rating Count\n"
        data.authorRatings.forEach((author: any) => {
          csvContent += `"${author.name}",${author.averageRating.toFixed(2)},${author.ratingCount}\n`
        })
        break

      default:
        throw new Error("Invalid report type")
    }

    return {
      success: true,
      csv: csvContent,
      error: null,
    }
  } catch (error) {
    console.error("Error exporting report to CSV:", error)
    return {
      success: false,
      csv: null,
      error: String(error),
    }
  }
}
