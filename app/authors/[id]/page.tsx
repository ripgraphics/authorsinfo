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
      />
    </PageContainer>
  )
} 