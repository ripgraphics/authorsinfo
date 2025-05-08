import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import type { Author } from "@/types/database"
import { ClientAuthorPage } from "./client"
import { PageContainer } from "@/components/page-container"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getFollowers, getFollowersCount } from "@/lib/follows-server"

interface AuthorPageProps {
  params: {
    id: string
  }
}

async function getAuthor(id: string) {
  try {
    const { data: author, error } = await supabaseAdmin
          .from("authors")
          .select(`
    *,
        cover_image:cover_image_id(id, url, alt_text),
        author_image:author_image_id(id, url, alt_text)
  `)
      .eq("id", id)
          .single()

    if (error) {
      console.error("Error fetching author:", error)
      return null
    }

    return author as Author
  } catch (error) {
    console.error("Unexpected error fetching author:", error)
    return null
  }
}

async function getAuthorBooks(authorId: string) {
  // This query should match the query structure used in the books page
  const { data: books, error } = await supabaseAdmin
          .from("books")
          .select(`
      id,
      title,
      cover_image:cover_image_id(id, url, alt_text),
      original_image_url
    `)
    .eq("author_id", authorId)
    .order("title")
    .limit(12)

  if (error) {
    console.error("Error fetching author books:", error)
    return []
  }

  // Process books to include cover image URL - same approach as books page
  const bookRows = (books ?? []) as any[]
  return bookRows.map((book) => {
    // Determine the cover image URL exactly like the books page does
    let coverImageUrl = null
    if (book.cover_image?.url) {
      coverImageUrl = book.cover_image.url
    } else if (book.cover_image_url) {
      coverImageUrl = book.cover_image_url
    } else if (book.original_image_url) {
      coverImageUrl = book.original_image_url
    }

    return {
      id: book.id,
      title: book.title,
      cover_image_url: coverImageUrl
    }
  })
}

async function getAuthorFollowers(authorId: string) {
  try {
    // Get first 50 followers
    const { followers, count } = await getFollowers(authorId, 'author', 1, 50)
    return { followers, count }
        } catch (error) {
    console.error("Error fetching author followers:", error)
    return { followers: [], count: 0 }
  }
}

async function getAuthorActivities(authorId: string) {
  try {
    // First, get books by this author
    const { data: authorBooks } = await supabaseAdmin
      .from("books")
      .select("id")
      .eq("author_id", authorId)
    
    if (!authorBooks || authorBooks.length === 0) {
      console.log("No books found for author ID:", authorId)
      return []
    }
    
    const bookIds = authorBooks.map(book => book.id)
    
    // Get activities related to these books
    const { data: activities, error } = await supabaseAdmin
      .from("activities")
      .select(`
        id,
        activity_type,
        created_at,
        data,
        book_id,
        user_id
      `)
      .in("book_id", bookIds)
      .order("created_at", { ascending: false })
      .limit(10)
    
    if (error) {
      console.error("Error fetching author activities:", error)
      return []
    }

    if (!activities || activities.length === 0) {
      console.log("No activities found for author's books")
      // Return empty array to use mock data on the client
      return []
    }
    
    // Get book information for all activities
    const activityBookIds = activities.map(activity => activity.book_id).filter(Boolean)
    
    let books: Record<string, any> = {}
    
    if (activityBookIds.length > 0) {
      const { data: booksData } = await supabaseAdmin
        .from("books")
        .select("id, title, author")
        .in("id", activityBookIds)
        
      if (booksData) {
        // Create a lookup map by book id
        books = booksData.reduce((acc, book) => {
          acc[book.id] = book
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Get user information for each activity
    const userIds = activities.map(activity => activity.user_id).filter(Boolean)
    let users: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from("profiles")
        .select("user_id, bio")
        .in("user_id", userIds)
        
      if (usersData) {
        // Create a lookup map by user id
        users = usersData.reduce((acc, user) => {
          acc[user.user_id] = user
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Format the activities for display
    return activities.map(activity => {
      // Calculate time ago for display
      const timeAgo = getTimeAgo(new Date(activity.created_at))
      
      // Cast data to appropriate type
      const data = activity.data as Record<string, any> | null
      
      // Get book information from our lookup map
      const book = activity.book_id ? books[activity.book_id] : null
      
      return {
        id: activity.id,
        type: activity.activity_type,
        timeAgo,
        bookTitle: book?.title || data?.book_title || "Unknown Book",
        bookAuthor: book?.author || data?.book_author || "Unknown Author",
        rating: data?.rating as number,
        shelf: data?.shelf as string,
        reviewText: data?.review_text as string,
        books: book
      }
    })
  } catch (error) {
    console.error("Unexpected error fetching author activities:", error)
    return []
  }
}

// Helper function to convert timestamp to "time ago" format
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  // In Next.js 15, params needs to be awaited
  const resolvedParams = await params;
  const id = resolvedParams.id
  
  // Get author data using the existing function
  const author = await getAuthor(id)

  if (!author) {
    notFound()
  }

  // Get author image URL (you can modify this based on your schema)
  const authorImageUrl =
    author.author_image?.url || author.photo_url || "/placeholder.svg?height=200&width=200"

  // Get cover image URL (you can modify this based on your schema)
  const coverImageUrl = author.cover_image?.url || "/placeholder.svg?height=400&width=1200"

  // Get author followers
  const { followers, count: followersCount } = await getAuthorFollowers(id)
  
  // Get author books
  const books = await getAuthorBooks(id)
  
  // Get total book count for this author
  const { count: totalBooksCount } = await supabaseAdmin
    .from("books")
    .select("*", { count: 'exact', head: true })
    .eq("author_id", id)
    
  // Get author activities for timeline
  const activities = await getAuthorActivities(id)

  return (
    <PageContainer>
      <ClientAuthorPage
        author={author}
        authorImageUrl={authorImageUrl}
        coverImageUrl={coverImageUrl}
        params={{ id }}
        followers={followers}
        followersCount={followersCount}
        books={books}
        booksCount={totalBooksCount || 0}
        activities={activities}
      />
    </PageContainer>
  )
} 