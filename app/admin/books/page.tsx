import { Suspense } from "react"
import Link from "next/link"
import { BookPlus, Upload, RefreshCcw } from "lucide-react"
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

export default async function AdminBooksPage({ searchParams }: AdminBooksPageProps) {
  // Await search parameters for Next.js 15
  const search = await searchParams
  // Parse search params
  const page = Number(search.page) || 1
  const pageSize = Number(search.pageSize) || 20
  const sortField = search.sort || "title"
  const sortDirection = (search.direction || "asc") as "asc" | "desc"

  // Fetch form options including statuses
  const { statuses } = await getBookFormOptions()

  // Build filters from search params
  const filters: BookFilter = {
    title: search.title,
    author: search.author,
    publisher: search.publisher,
    isbn: search.isbn,
    language: search.language,
    publishedYear: search.publishedYear,
    genre: search.genre,
    format: search.format,
    binding: search.binding,
    minRating: search.minRating ? Number(search.minRating) : undefined,
    maxRating: search.maxRating ? Number(search.maxRating) : undefined,
    status: search.status,
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
        <div className="flex items-center gap-4">
          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-50 rounded">
            <form method="get" action="/admin/books" className="flex items-center gap-2">
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="pageSize" value={pageSize} />
              <input
                type="text"
                name="title"
                defaultValue={search.title ?? ''}
                placeholder="Filter by title"
                className="border border-gray-300 rounded px-2 py-1"
              />
              {/* Status filter */}
              <select
                name="status"
                defaultValue={search.status ?? ''}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                name="sort"
                defaultValue={sortField}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="created_at">Date Added</option>
                <option value="title">Title</option>
              </select>
              <select
                name="direction"
                defaultValue={sortDirection}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
              <Button type="submit" variant="outline">Filter & Sort</Button>
            </form>
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
            <Button variant="outline" asChild>
              <Link href="/api/isbn/import-all">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Import All Books
              </Link>
            </Button>
          </div>
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
              sortField="created_at"
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
