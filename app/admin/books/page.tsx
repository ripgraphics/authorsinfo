import { Suspense } from "react"
import Link from "next/link"
import { BookPlus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { BookManagementClient } from "./client"
import { getFilteredBooks, getBookFormOptions, type BookFilter } from "@/app/actions/admin-books"

interface AdminBooksPageProps {
  searchParams: {
    page?: string
    pageSize?: string
    sort?: string
    direction?: string
    title?: string
    author?: string
    publisher?: string
    isbn?: string
    language?: string
    publishedYear?: string
    genre?: string
    format?: string
    binding?: string
    minRating?: string
    maxRating?: string
    status?: string
  }
}

async function BooksContent({
  filters,
  page,
  pageSize,
  sortField,
  sortDirection,
}: {
  filters: BookFilter
  page: number
  pageSize: number
  sortField: string
  sortDirection: "asc" | "desc"
}) {
  // Fetch books with filters
  const { books, count, error } = await getFilteredBooks(filters, page, pageSize, sortField, sortDirection)

  // Fetch form options for filters
  const options = await getBookFormOptions()

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error loading books: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <BookManagementClient
      books={books}
      totalBooks={count}
      initialPage={page}
      initialPageSize={pageSize}
      initialSortField={sortField}
      initialSortDirection={sortDirection}
      initialFilters={filters}
      genres={options.genres}
      formatTypes={options.formatTypes}
      bindingTypes={options.bindingTypes}
      languages={options.languages}
    />
  )
}

function BooksContentSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-3">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminBooksPage({ searchParams }: AdminBooksPageProps) {
  // Parse search params
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 20
  const sortField = searchParams.sort || "title"
  const sortDirection = (searchParams.direction || "asc") as "asc" | "desc"

  // Build filters from search params
  const filters: BookFilter = {
    title: searchParams.title,
    author: searchParams.author,
    publisher: searchParams.publisher,
    isbn: searchParams.isbn,
    language: searchParams.language,
    publishedYear: searchParams.publishedYear,
    genre: searchParams.genre,
    format: searchParams.format,
    binding: searchParams.binding,
    minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
    maxRating: searchParams.maxRating ? Number(searchParams.maxRating) : undefined,
    status: searchParams.status,
  }

  // Remove undefined values
  Object.keys(filters).forEach((key) => {
    if (filters[key as keyof BookFilter] === undefined) {
      delete filters[key as keyof BookFilter]
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Book Management</h1>
          <p className="text-muted-foreground">Manage your books with advanced filtering and bulk operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/books/add">
              <BookPlus className="h-4 w-4 mr-2" />
              Add New Book
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/books/import">
              <Upload className="h-4 w-4 mr-2" />
              Import Books
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Books</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
          <TabsTrigger value="popular">Popular Books</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <Suspense fallback={<BooksContentSkeleton />}>
            <BooksContent
              filters={filters}
              page={page}
              pageSize={pageSize}
              sortField={sortField}
              sortDirection={sortDirection}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="recent" className="mt-6">
          <Suspense fallback={<BooksContentSkeleton />}>
            <BooksContent
              filters={filters}
              page={page}
              pageSize={pageSize}
              sortField="publication_date"
              sortDirection="desc"
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="popular" className="mt-6">
          <Suspense fallback={<BooksContentSkeleton />}>
            <BooksContent
              filters={filters}
              page={page}
              pageSize={pageSize}
              sortField="average_rating"
              sortDirection="desc"
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
