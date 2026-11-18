import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookOpen, Search, Filter } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getBooks, getUniqueLanguages, getTotalBooksCount } from '@/app/actions/data'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Book } from '@/types/database'

interface BooksPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    language?: string
    sort?: string
  }>
}

async function BooksList({
  page,
  search,
  language,
  sort,
}: {
  page: number
  search?: string
  language?: string
  sort?: string
}) {
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const queryParams: any = {
    limit: pageSize,
    offset,
    sortBy: sort === 'date_desc' ? 'publishedAt' : 'title',
  }

  if (search) queryParams.search = search
  if (language && language !== 'all') queryParams.language = language

  const [books, total] = await Promise.all([
    getBooks(queryParams),
    getTotalBooksCount({ search, language: language || undefined }),
  ])

  return { books: books as Book[], total, pageSize }
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const language = params.language || ''
  const sort = params.sort || 'title_asc'

  const languages = await getUniqueLanguages()
  const { books, total, pageSize } = await BooksList({ page, search, language, sort })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Books</h1>
        <p className="text-muted-foreground mt-2">Browse and discover books from our collection.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <form action="/books" method="get" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Search books..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        <Select name="language" defaultValue={language || 'all'}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select name="sort" defaultValue={sort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title_asc">Title A-Z</SelectItem>
            <SelectItem value="title_desc">Title Z-A</SelectItem>
            <SelectItem value="date_desc">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {books.length} of {total} books
      </p>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.length > 0 ? (
          books.map((book: Book) => (
            <Link href={`/books/${book.id}`} key={book.id} className="block group">
              <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
                <div className="relative w-full aspect-[2/3] bg-muted">
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2">{book.title}</h3>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No books found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={`/books?page=${page - 1}${search ? `&search=${search}` : ''}${language !== 'all' ? `&language=${language}` : ''}${sort !== 'title_asc' ? `&sort=${sort}` : ''}`} />
              </PaginationItem>
            )}
            <PaginationItem>
              <span className="px-4 py-2 text-sm">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={`/books?page=${page + 1}${search ? `&search=${search}` : ''}${language !== 'all' ? `&language=${language}` : ''}${sort !== 'title_asc' ? `&sort=${sort}` : ''}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
