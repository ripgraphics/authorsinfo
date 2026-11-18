import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { User, Search, Filter } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAuthors, getUniqueNationalities, getTotalAuthorsCount } from '@/app/actions/data'
import type { Author } from '@/types/database'

interface AuthorsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    nationality?: string
    sort?: string
  }>
}

async function AuthorsList({
  page,
  search,
  nationality,
  sort,
}: {
  page: number
  search?: string
  nationality?: string
  sort?: string
}) {
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const queryParams: any = {
    limit: pageSize,
    offset,
    sortBy: 'name',
  }

  if (search) queryParams.search = search
  if (nationality && nationality !== 'all') queryParams.nationality = nationality

  const [authors, total] = await Promise.all([
    getAuthors(queryParams),
    getTotalAuthorsCount({ search, nationality: nationality || undefined }),
  ])

  return { authors: authors as Author[], total, pageSize }
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const nationality = params.nationality || ''
  const sort = params.sort || 'name_asc'

  const nationalities = await getUniqueNationalities()
  const { authors, total, pageSize } = await AuthorsList({ page, search, nationality, sort })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Authors</h1>
        <p className="text-muted-foreground mt-2">Browse and discover authors from our collection.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <form action="/authors" method="get" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Search authors..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        <Select name="nationality" defaultValue={nationality || 'all'}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Nationality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Nationalities</SelectItem>
            {nationalities.map((nat) => (
              <SelectItem key={nat} value={nat}>
                {nat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {authors.length} of {total} authors
      </p>

      {/* Authors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {authors.length > 0 ? (
          authors.map((author: Author) => (
            <Link href={`/authors/${author.id}`} key={author.id} className="block group">
              <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
                <div className="relative w-full aspect-square bg-muted">
                  {author.author_image?.url ? (
                    <Image
                      src={author.author_image.url}
                      alt={author.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm line-clamp-2">{author.name}</h3>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No authors found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={`/authors?page=${page - 1}${search ? `&search=${search}` : ''}${nationality !== 'all' ? `&nationality=${nationality}` : ''}`} />
              </PaginationItem>
            )}
            <PaginationItem>
              <span className="px-4 py-2 text-sm">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={`/authors?page=${page + 1}${search ? `&search=${search}` : ''}${nationality !== 'all' ? `&nationality=${nationality}` : ''}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
