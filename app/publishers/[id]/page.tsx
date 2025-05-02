import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import type { Publisher } from "@/types/database"
import { ClientPublisherPage } from "./client"
import { PageHeader } from "@/components/page-header"
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
  const { data: books, error } = await supabaseAdmin
    .from("books")
    .select(`
      id,
      title,
      cover_image:cover_image_id(id, url, alt_text),
      original_image_url,
      author_id,
      authors:author_id(id, name),
      binding_type:binding_type_id(id, name),
      format_type:format_type_id(id, name)
    `)
    .eq("publisher_id", publisherId)
    .order("title")
    .limit(12)

  if (error) {
    console.error("Error fetching publisher books:", error)
    return []
  }

  // Supabase join returns arrays for related fields, so cast to any[] and index
  const bookRows = (books ?? []) as any[]
  return bookRows.map((book) => ({
    ...book,
    cover_image_url: book.cover_image?.[0]?.url || book.original_image_url || null,
    author_name: book.authors?.[0]?.name || "Unknown Author",
    authorId: book.authors?.[0]?.id || null,
    binding: book.binding_type?.[0]?.name || null,
    format: book.format_type?.[0]?.name || null,
  }))
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

export default async function PublisherPage({ params }: { params: { id: string } }) {
  const id = await params.id
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
  
  // Get publisher books
  const books = await getPublisherBooks(id)
  
  // Get total book count for this publisher
  const { count: totalBooksCount } = await supabaseAdmin
    .from("books")
    .select("*", { count: 'exact', head: true })
    .eq("publisher_id", id)

  return (
    <div className="publisher-page-container">
      <PageHeader
        title={publisher.name}
        description={publisher.about || "Publisher details"}
      />
      <ClientPublisherPage
        publisher={publisher}
        publisherImageUrl={publisherImageUrl}
        coverImageUrl={coverImageUrl}
        params={params}
        followers={followers}
        followersCount={followersCount}
        books={books}
        booksCount={totalBooksCount || 0}
      />
    </div>
  )
}