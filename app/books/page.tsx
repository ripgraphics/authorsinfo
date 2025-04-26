import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Search, Filter } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabaseAdmin } from "@/lib/supabase"
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

interface BooksPageProps {
  searchParams: {
    page?: string
    search?: string
    language?: string
    sort?: string
    year?: string
  }
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
    return []
  }

  // Check which date field exists in the sample
  const sampleBook = bookSample[0]
  let dateField = null

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
    return []
  }

  // Now use the correct field to get the years
  const { data, error } = await supabaseAdmin.from("books").select(dateField).not(dateField, "is", null)

  if (error) {
    console.error(`Error fetching ${dateField}:`, error)
    return []
  }

  // Extract years from the date field
  const years = data
    .map((item) => {
      if (!item[dateField]) return null

      // If it's already a year (number or string representing a year)
      if (typeof item[dateField] === "number" || /^\d{4}$/.test(item[dateField])) {
        return String(item[dateField])
      }

      // If it's a date string, extract the year
      const match = String(item[dateField]).match(/(\d{4})/)
      return match ? match[1] : null
    })
    .filter(Boolean)

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
  const offset = (page - 1) * pageSize

  // Get publication years and the correct date field
  const { years, dateField } = await getPublicationYears()

  // Build the query
  let query = supabaseAdmin.from("books").select(`
      *,
      cover_image:cover_image_id(id, url, alt_text)
    `)

  // Apply search filter if provided
  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  // Apply language filter if provided
  if (language && language !== "all") {
    query = query.eq("language", language)
  }

  // Apply year filter if provided
  if (year && year !== "all" && dateField) {
    // If the field is a year field, use exact match
    if (dateField === "year" || dateField === "publication_year") {
      query = query.eq(dateField, year)
    } else {
      // Otherwise, use LIKE to match the year in a date string
      query = query.ilike(dateField, `%${year}%`)
    }
  }

  // Apply sorting
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

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1)

  // Execute the query
  const { data: books, error } = await query

  if (error) {
    console.error("Error fetching books:", error)
    return <div>Error loading books</div>
  }

  // Process books to include cover image URL
  const processedBooks = books.map((book) => {
    // Safely determine the cover image URL
    let coverImageUrl = null
    if (book.cover_image?.url) {
      coverImageUrl = book.cover_image.url
    } else if (book.cover_image_url) {
      coverImageUrl = book.cover_image_url
    } else if (book.original_image_url) {
      coverImageUrl = book.original_image_url
    }

    return {
      ...book,
      cover_image_url: coverImageUrl,
      publication_year: book[dateField]
        ? typeof book[dateField] === "number" || /^\d{4}$/.test(book[dateField])
          ? String(book[dateField])
          : String(book[dateField]).match(/(\d{4})/)
            ? String(book[dateField]).match(/(\d{4})/)[1]
            : null
        : null,
    }
  })

  // Get total count for pagination
  let countQuery = supabaseAdmin.from("books").select("*", { count: "exact", head: true })

  if (search) {
    countQuery = countQuery.ilike("title", `%${search}%`)
  }

  if (language && language !== "all") {
    countQuery = countQuery.eq("language", language)
  }

  if (year && year !== "all" && dateField) {
    if (dateField === "year" || dateField === "publication_year") {
      countQuery = countQuery.eq(dateField, year)
    } else {
      countQuery = countQuery.ilike(dateField, `%${year}%`)
    }
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error("Error counting books:", countError)
    return <div>Error loading books</div>
  }

  const totalBooks = count || 0
  const totalPages = Math.ceil(totalBooks / pageSize)

  // Get unique languages for the filter
  const languages = await getUniqueLanguages()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {processedBooks.length > 0 ? (
          processedBooks.map((book) => (
            <Link href={`/books/${book.id}`} key={book.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                {/* Image container with 2:3 aspect ratio */}
                <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url || "/placeholder.svg"}
                      alt={book.cover_image?.alt_text || book.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                  {book.publication_year && (
                    <p className="text-xs text-muted-foreground mt-1">{book.publication_year}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No books found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/books?page=${page - 1}${search ? `&search=${search}` : ""}${
                    language ? `&language=${language}` : ""
                  }${year ? `&year=${year}` : ""}${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i

              if (pageNumber <= 0 || pageNumber > totalPages) return null

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href={`/books?page=${pageNumber}${search ? `&search=${search}` : ""}${
                      language ? `&language=${language}` : ""
                    }${year ? `&year=${year}` : ""}${sort ? `&sort=${sort}` : ""}`}
                    isActive={pageNumber === page}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            {page < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href={`/books?page=${page + 1}${search ? `&search=${search}` : ""}${
                    language ? `&language=${language}` : ""
                  }${year ? `&year=${year}` : ""}${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default function BooksPage({ searchParams }: BooksPageProps) {
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const language = searchParams.language || ""
  const year = searchParams.year || ""
  const sort = searchParams.sort || "title_asc"

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 book-page container py-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Books</h1>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <form>
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search books..."
                    className="pl-8"
                    defaultValue={search}
                  />
                </form>
              </div>

              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Books</SheetTitle>
                      <SheetDescription>Apply filters to narrow down the list of books.</SheetDescription>
                    </SheetHeader>
                    <form action="/books" className="py-4 space-y-6">
                      {/* Hidden fields to preserve other params */}
                      <input type="hidden" name="page" value="1" />
                      {search && <input type="hidden" name="search" value={search} />}

                      <div className="space-y-4">
                        <Label htmlFor="language">Language</Label>
                        <Select name="language" defaultValue={language}>
                          <SelectTrigger>
                            <SelectValue placeholder="All languages" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All languages</SelectItem>
                            <Suspense fallback={<SelectItem value="loading">Loading...</SelectItem>}>
                              {/* This will be populated server-side */}
                            </Suspense>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="year">Publication Year</Label>
                        <Select name="year" defaultValue={year}>
                          <SelectTrigger>
                            <SelectValue placeholder="All years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All years</SelectItem>
                            <Suspense fallback={<SelectItem value="loading">Loading...</SelectItem>}>
                              {/* This will be populated server-side */}
                            </Suspense>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="sort">Sort By</Label>
                        <Select name="sort" defaultValue={sort}>
                          <SelectTrigger>
                            <SelectValue placeholder="Title (A-Z)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                            <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                            <SelectItem value="date_asc">Publication Date (Oldest first)</SelectItem>
                            <SelectItem value="date_desc">Publication Date (Newest first)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <SheetFooter>
                        <SheetClose asChild>
                          <Button type="submit">Apply Filters</Button>
                        </SheetClose>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>

                <Link href="/books/add">
                  <Button>Add New Book</Button>
                </Link>
              </div>
            </div>
          </div>

          <Suspense fallback={<div>Loading books...</div>}>
            <BooksList page={page} search={search} language={language} year={year} sort={sort} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
