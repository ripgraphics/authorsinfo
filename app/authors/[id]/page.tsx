import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import type { Author } from "@/types/database"
import { ClientAuthorPage } from "./client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getFollowers, getFollowersCount } from "@/lib/follows-server"
import { getAuthorEvents } from '@/lib/events'
import EventCard from '@/components/event-card'
import type { Event } from '@/types/database'
import { createClient } from '@/lib/supabase-server'

interface AuthorPageProps {
  params: {
    id: string
  }
}

interface AlbumImage {
  image: {
    url: string;
  };
}

interface AlbumData {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  album_images: AlbumImage[];
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

async function getAuthorAlbums(authorId: string) {
  try {
    const supabase = createClient()
    
    // Check if authorId is already a UUID (contains hyphens)
    const isUuid = authorId.includes('-')
    const entityId = isUuid ? authorId : `00000000-0000-0000-0000-${authorId.padStart(12, '0')}`
    
    const { data: albums, error } = await supabase
      .from('photo_albums')
      .select(`
        id,
        name,
        description,
        is_public,
        created_at,
        album_images(
          image:images(
            url
          )
        )
      `)
      .eq('entity_type', 'author')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching author albums:', error)
      return []
    }

    return (albums as unknown as AlbumData[]).map(album => ({
      id: album.id,
      name: album.name,
      description: album.description || undefined,
      cover_image_url: album.album_images[0]?.image?.url || undefined,
      photo_count: album.album_images.length,
      created_at: album.created_at
    }))
  } catch (error) {
    console.error('Error fetching author albums:', error)
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
  // Await params before accessing its properties
  const resolvedParams = await Promise.resolve(params)
  const authorId = resolvedParams.id

  if (!authorId) {
    notFound()
  }

  const author = await getAuthor(authorId)
  if (!author) {
    notFound()
  }

  const [books, followers, activities, albums] = await Promise.all([
    getAuthorBooks(authorId),
    getAuthorFollowers(authorId),
    getAuthorActivities(authorId),
    getAuthorAlbums(authorId)
  ])

  return (
    <ClientAuthorPage
      author={author}
      authorImageUrl={author.author_image?.url || ""}
      coverImageUrl={author.cover_image?.url || ""}
      params={resolvedParams}
      followers={followers.followers}
      followersCount={followers.count}
      books={books}
      booksCount={books.length}
      activities={activities}
      photos={[]} // TODO: Implement photo fetching
      photosCount={0} // TODO: Implement photo count
      albums={albums}
    />
  )
} 