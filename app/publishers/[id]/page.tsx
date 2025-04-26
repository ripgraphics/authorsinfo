import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import type { Publisher } from "@/types/database"
import { ClientPublisherPage } from "./client"

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

  return books.map((book) => ({
    ...book,
    cover_image_url: book.cover_image?.url || book.original_image_url || null,
    author_name: book.authors?.name || "Unknown Author",
    binding: book.binding_type?.name || book.binding || null,
    format: book.format_type?.name || book.format || null,
  }))
}

export default async function PublisherPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch publisher data
  const { data: publisher, error } = await supabase.from("publishers").select("*").eq("id", params.id).single()

  if (error || !publisher) {
    notFound()
  }

  // Get publisher image URL (you can modify this based on your schema)
  const publisherImageUrl =
    publisher.publisher_image?.url || publisher.logo_url || "/placeholder.svg?height=200&width=200"

  // Get cover image URL (you can modify this based on your schema)
  const coverImageUrl = publisher.cover_image?.url || "/placeholder.svg?height=400&width=1200"

  return (
    <ClientPublisherPage
      publisher={publisher}
      publisherImageUrl={publisherImageUrl}
      coverImageUrl={coverImageUrl}
      params={params}
    />
  )
}