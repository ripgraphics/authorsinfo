import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Search, Filter } from "lucide-react"
import { PageContainer } from "@/components/page-container"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { BookCard } from "@/components/book-card"
import { InteractiveControls } from "./components/InteractiveControls"
import { BooksListWrapper } from "./components/BooksListWrapper"

interface BooksPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    language?: string
    sort?: string
    year?: string
  }>
}

async function getUniqueLanguages() {
  const { data, error } = await supabaseAdmin
    .from("books")
    .select("language")
    .not("language", "is", null)
    .order("language")

  if (error) {
    console.error("Error fetching languages:", error)
    return []
  }

  // Extract unique languages
  const uniqueLanguages = Array.from(new Set(data.map((item) => item.language).filter(Boolean)))

  return uniqueLanguages
}

async function getPublicationYears() {
  // First, let's check what date-related fields exist in the books table
  const { data: bookSample, error: sampleError } = await supabaseAdmin.from("books").select("*").limit(1)

  if (sampleError || !bookSample || bookSample.length === 0) {
    console.error("Error fetching book sample:", sampleError)
    return { years: [], dateField: null }
  }

  // Check which date field exists in the sample
  const sampleBook = bookSample[0] as Record<string, any>
  let dateField: string | null = null

  // Check potential date field names
  if (sampleBook.publication_date !== undefined) {
    dateField = "publication_date"
  } else if (sampleBook.published_date !== undefined) {
    dateField = "published_date"
  } else if (sampleBook.release_date !== undefined) {
    dateField = "release_date"
  } else if (sampleBook.year !== undefined) {
    dateField = "year"
  } else if (sampleBook.publication_year !== undefined) {
    dateField = "publication_year"
  }

  if (!dateField) {
    console.log("No date field found in books table. Sample book:", sampleBook)
    return { years: [], dateField: null }
  }

  // Now use the correct field to get the years
  const { data, error } = await supabaseAdmin.from("books").select(dateField).not(dateField, "is", null)

  if (error) {
    console.error(`Error fetching ${dateField}:`, error)
    return { years: [], dateField }
  }

  // Extract years from the date field
  const years = data
    .map((item: Record<string, any>) => {
      if (!item[dateField!]) return null

      // If it's already a year (number or string representing a year)
      if (typeof item[dateField!] === "number" || /^\d{4}$/.test(String(item[dateField!]))) {
        return String(item[dateField!])
      }

      // If it's a date string, extract the year
      const match = String(item[dateField!]).match(/(\d{4})/)
      return match ? match[1] : null
    })
    .filter((year): year is string => year !== null && year !== undefined && typeof year === 'string')

  const uniqueYears = Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a)) // Sort descending

  return { years: uniqueYears, dateField }
}

async function BooksList({
  page,
  search,
  language,
  sort,
  year,
}: {
  page: number
  search?: string
  language?: string
  sort?: string
  year?: string
}) {
  const pageSize = 24

  // Get publication years and the correct date field
  const { years, dateField } = await getPublicationYears()

  // Build the query - fetch ALL books (for client-side filtering)
  // We'll filter by search client-side for instant results
  let query = supabaseAdmin.from("books").select(`
      *,
      cover_image:cover_image_id(id, url, alt_text),
      author:author_id(id, name),
      publisher:publisher_id(id, name)
    `)

  // Apply language filter if provided (server-side)
  if (language && language !== "all") {
    query = query.eq("language", language)
  }

  // Apply year filter if provided (server-side)
  if (year && year !== "all" && dateField) {
    // If the field is a year field, use exact match
    if (dateField === "year" || dateField === "publication_year") {
      query = query.eq(dateField, year)
    } else {
      // For date fields, use date range filter instead of ilike
      // Filter for dates within the specified year
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      query = query.gte(dateField, yearStart).lte(dateField, yearEnd)
    }
  }

  // Apply sorting (server-side)
  if (sort === "title_asc") {
    query = query.order("title", { ascending: true })
  } else if (sort === "title_desc") {
    query = query.order("title", { ascending: false })
  } else if (sort === "date_asc" && dateField) {
    query = query.order(dateField, { ascending: true })
  } else if (sort === "date_desc" && dateField) {
    query = query.order(dateField, { ascending: false })
  } else {
    // Default sorting
    query = query.order("title", { ascending: true })
  }

  // Fetch all matching books (no pagination limit for client-side filtering)
  // Limit to reasonable number to prevent performance issues
  query = query.limit(1000)

  // Execute the query
  const { data: books, error } = await query

  if (error) {
    // Log the full error object to understand its structure
    console.error("Error fetching books - Full error:", JSON.stringify(error, null, 2))
    console.error("Error fetching books - Error type:", typeof error)
    console.error("Error fetching books - Error keys:", Object.keys(error))
    console.error("Error fetching books - Error properties:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      error: error,
    })
    return <div>Error loading books. Please check the console for details.</div>
  }

  // Process books to include cover image URL (only from Cloudinary via cover_image_id)
  const processedBooks = books.map((book: Record<string, any>) => {
    // Only use Cloudinary images via cover_image_id, no fallbacks to original_image_url
    const coverImageUrl = book.cover_image?.url || null

    // Safely extract publication year
    let publicationYear = null
    if (dateField && book[dateField]) {
      if (typeof book[dateField] === "number" || /^\d{4}$/.test(String(book[dateField]))) {
        publicationYear = String(book[dateField])
      } else {
        const match = String(book[dateField]).match(/(\d{4})/)
        if (match && match[1]) {
          publicationYear = match[1]
        }
      }
    }

    return {
      id: book.id,
      title: book.title,
      cover_image_url: coverImageUrl,
      publication_year: publicationYear,
      // Include other fields needed from the original book
      ...book,
    }
  })

  // Get total count (for initial pagination calculation)
  let countQuery = supabaseAdmin.from("books").select("*", { count: "exact", head: true })

  if (language && language !== "all") {
    countQuery = countQuery.eq("language", language)
  }

  if (year && year !== "all" && dateField) {
    if (dateField === "year" || dateField === "publication_year") {
      countQuery = countQuery.eq(dateField, year)
    } else {
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      countQuery = countQuery.gte(dateField, yearStart).lte(dateField, yearEnd)
    }
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error("Error counting books:", countError)
    return <div>Error loading books</div>
  }

  const totalBooks = count || 0

  // Return books data to be passed to client component for instant filtering
  return {
    books: processedBooks,
    totalCount: totalBooks,
    pageSize: 24,
  }
}

async function BooksListContent({
  page,
  search,
  language,
  sort,
  year,
}: {
  page: number
  search?: string
  language?: string
  sort?: string
  year?: string
}) {
  const { books, totalCount, pageSize } = await BooksList({
    page,
    search,
    language,
    sort,
    year,
  })

  return (
    <BooksListWrapper
      initialBooks={books}
      initialTotalCount={totalCount}
      page={page}
      pageSize={pageSize}
      language={language}
      year={year}
      sort={sort}
      initialSearch={search}
    />
  )
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  
  const page = Number(params.page) || 1
  const search = params.search || ""
  const language = params.language || ""
  const year = params.year || ""
  const sort = params.sort || "title_asc"

  const languages = await getUniqueLanguages();
  const { years } = await getPublicationYears();

  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Books</h1>
        <p className="text-muted-foreground mt-2">Browse and discover books from our collection.</p>
      </div>
      <InteractiveControls
        search={search}
        sort={sort}
        languages={languages}
        years={years}
        language={language}
        year={year}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <BooksListContent
          page={page}
          search={search}
          language={language}
          year={year}
          sort={sort}
        />
      </Suspense>
    </div>
  )
}
