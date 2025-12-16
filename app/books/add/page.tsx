import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookByISBN } from "@/lib/isbndb"
import { supabaseAdmin } from "@/lib/supabase/server"
import { AddBookClient } from "./AddBookClient"

interface AddBookPageProps {
  searchParams: Promise<{
    isbn?: string
  }>
}

export default async function AddBookPage({ searchParams }: AddBookPageProps) {
  const params = await searchParams
  const { isbn } = params

  // If no ISBN is provided, show a form to enter one
  if (!isbn) {
    return (
      <div className="space-y-6">
        <div className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">Add a New Book</h1>
          <p className="text-muted-foreground mt-2">Search for books or provide an ISBN number to add to your library</p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Enter Book Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">To add a book, please search for it first or provide an ISBN number.</p>
              <Button asChild>
                <a href="/search">Search for Books</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fetch book data from ISBNDB as fallback (client component will check sessionStorage first)
  // This ensures the page works even if sessionStorage is cleared
  const bookData = await getBookByISBN(isbn)

  // Check if book already exists in database and get full details
  let existingBook = null
  let otherBooksByAuthor: any[] = []
  let otherBooksByPublisher: any[] = []
  
  if (bookData.isbn) {
    const { data } = await supabaseAdmin
      .from("books")
      .select(`
        id,
        title,
        cover_image_id,
        cover_image:cover_image_id(url, alt_text),
        author_id,
        author:author_id(id, name),
        publisher_id,
        publisher:publisher_id(id, name)
      `)
      .eq("isbn10", bookData.isbn)
      .single()
    if (data) {
      existingBook = data
      
      // Fetch other books by the same author
      if (data.author_id) {
        const { data: authorBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("author_id", data.author_id)
          .neq("id", data.id)
          .limit(6)
        if (authorBooks) otherBooksByAuthor = authorBooks
      }
      
      // Fetch other books by the same publisher
      if (data.publisher_id) {
        const { data: publisherBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("publisher_id", data.publisher_id)
          .neq("id", data.id)
          .limit(6)
        if (publisherBooks) otherBooksByPublisher = publisherBooks
      }
    }
  } else if (bookData.isbn13) {
    const { data } = await supabaseAdmin
      .from("books")
      .select(`
        id,
        title,
        cover_image_id,
        cover_image:cover_image_id(url, alt_text),
        author_id,
        author:author_id(id, name),
        publisher_id,
        publisher:publisher_id(id, name)
      `)
      .eq("isbn13", bookData.isbn13)
      .single()
    if (data) {
      existingBook = data
      
      // Fetch other books by the same author
      if (data.author_id) {
        const { data: authorBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("author_id", data.author_id)
          .neq("id", data.id)
          .limit(6)
        if (authorBooks) otherBooksByAuthor = authorBooks
      }
      
      // Fetch other books by the same publisher
      if (data.publisher_id) {
        const { data: publisherBooks } = await supabaseAdmin
          .from("books")
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:cover_image_id(url, alt_text)
          `)
          .eq("publisher_id", data.publisher_id)
          .neq("id", data.id)
          .limit(6)
        if (publisherBooks) otherBooksByPublisher = publisherBooks
      }
    }
  }

  return (
    <AddBookClient
      isbn={isbn}
      serverBookData={bookData}
      existingBook={existingBook}
      otherBooksByAuthor={otherBooksByAuthor}
      otherBooksByPublisher={otherBooksByPublisher}
    />
  )
}
