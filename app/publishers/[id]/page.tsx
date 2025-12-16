import { createServerComponentClientAsync } from "@/lib/supabase/client-helper"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import type { Publisher } from "@/types/database"
import { ClientPublisherPage } from "./client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getFollowers, getFollowersCount } from "@/lib/follows-server"

interface PublisherPageProps {
  params: {
    id: string
  }
}

async function getPublisher(id: string) {
  try {
    const { data: publisher, error } = await supabaseAdmin
      .from("publishers")
      .select(`
        *,
        cover_image:cover_image_id(id, url, alt_text),
        publisher_image:publisher_image_id(id, url, alt_text),
        country_details:country_id(id, name, code)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching publisher:", error)
      return null
    }

    return publisher as Publisher
  } catch (error) {
    console.error("Unexpected error fetching publisher:", error)
    return null
  }
}

async function getPublisherBooks(publisherId: string) {
  // This query should match the query structure used in the books page
  const { data: books, error } = await supabaseAdmin
    .from("books")
    .select(`
      id,
      title,
      cover_image:cover_image_id(id, url, alt_text)
    `)
    .eq("publisher_id", publisherId)
    .order("title")
    .limit(12)

  if (error) {
    console.error("Error fetching publisher books:", error)
    throw new Error(`Failed to fetch publisher books: ${error.message}`)
  }

  // Process books to include cover image URL - ONLY from Cloudinary (no fallback to original_image_url)
  const bookRows = (books ?? []) as any[]
  return bookRows.map((book) => {
    // Determine the cover image URL - ONLY from Cloudinary
    // If Cloudinary image is missing, show nothing (so we know it's broken)
    let coverImageUrl = null
    if (book.cover_image?.url) {
      coverImageUrl = book.cover_image.url
    } else if (book.cover_image_url) {
      coverImageUrl = book.cover_image_url
    }
    // NO fallback to original_image_url - images table is source of truth

    return {
      id: book.id,
      title: book.title,
      cover_image_url: coverImageUrl
    }
  })
}

async function getPublisherFollowers(publisherId: string) {
  try {
    // Get first 50 followers
    const { followers, count } = await getFollowers(publisherId, 'publisher', 1, 50)
    return { followers, count }
  } catch (error) {
    console.error("Error fetching publisher followers:", error)
    return { followers: [], count: 0 }
  }
}

export default async function PublisherPage({ params }: { params: Promise<{ id: string }> }) {
  // Wait for params to be properly resolved
  const { id } = await params
  
  // Get publisher data using the existing function
  const publisher = await getPublisher(id)

  if (!publisher) {
    notFound()
  }

  // Get publisher image URL (you can modify this based on your schema)
  const publisherImageUrl =
    publisher.publisher_image?.url || publisher.logo_url || "/placeholder.svg?height=200&width=200"

  // Get cover image URL (you can modify this based on your schema)
  const coverImageUrl = publisher.cover_image?.url || "/placeholder.svg?height=400&width=1200"

  // Get publisher followers
  const { followers, count: followersCount } = await getPublisherFollowers(id)
  
  // Get publisher books with error handling
  let books: any[] = []
  try {
    books = await getPublisherBooks(id)
  } catch (error) {
    console.error("Error fetching publisher books:", error)
    books = []
  }
  
  // Get total book count for this publisher
  const { count: totalBooksCount } = await supabaseAdmin
    .from("books")
    .select("*", { count: 'exact', head: true })
    .eq("publisher_id", id)

  return (
    <ClientPublisherPage
      publisher={publisher}
      publisherImageUrl={publisherImageUrl}
      coverImageUrl={coverImageUrl}
      params={{ id }}
      followers={followers}
      followersCount={followersCount}
      books={books}
      booksCount={totalBooksCount || 0}
    />
  )
}