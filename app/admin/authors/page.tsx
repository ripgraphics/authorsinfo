'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Plus, Search, Edit } from 'lucide-react'
import { ReusableSearch } from '@/components/ui/reusable-search'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminAuthorsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    nationality?: string
    sort?: string
  }>
}

interface Author {
  id: string // UUID
  name: string
  nationality?: string
  birth_date?: string
  author_image?: {
    id: string // UUID
    url: string
    alt_text?: string
  }
  book_count?: number
}

// Client component for the authors table
function AuthorsTable({
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
  const [data, setData] = useState<{
    authors: Author[]
    totalAuthors: number
    totalPages: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nationalities, setNationalities] = useState<string[]>([])
  const pageSize = 10

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          ...(search && { search }),
          ...(nationality && { nationality }),
          sort: sort || 'name_asc',
        })

        // Fetch authors data
        const authorsResponse = await fetch(`/api/admin/authors?${params}`)
        if (!authorsResponse.ok) {
          throw new Error(`Failed to fetch authors: ${authorsResponse.statusText}`)
        }
        const authorsData = await authorsResponse.json()
        setData(authorsData)

        // Fetch nationalities for filter
        const nationalitiesResponse = await fetch('/api/admin/authors/nationalities')
        if (nationalitiesResponse.ok) {
          const nationalitiesData = await nationalitiesResponse.json()
          setNationalities(nationalitiesData.nationalities || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, search, nationality, sort])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Birth Date</TableHead>
                  <TableHead>Books</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const { authors, totalAuthors, totalPages } = data

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Birth Date</TableHead>
                  <TableHead>Books</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.length > 0 ? (
                  authors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell className="font-medium">{author.id}</TableCell>
                      <TableCell>{author.name}</TableCell>
                      <TableCell>{author.nationality || '—'}</TableCell>
                      <TableCell>{author.birth_date || '—'}</TableCell>
                      <TableCell>{author.book_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/authors/${author.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/authors/${author.id}`}>
                              <Search className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No authors found. Try adjusting your search or filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/admin/authors?page=${page - 1}${search ? `&search=${search}` : ''}${nationality ? `&nationality=${nationality}` : ''}${sort ? `&sort=${sort}` : ''}`}
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber =
                      page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i

                    if (pageNumber <= 0 || pageNumber > totalPages) return null

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={`/admin/authors?page=${pageNumber}${search ? `&search=${search}` : ''}${nationality ? `&nationality=${nationality}` : ''}${sort ? `&sort=${sort}` : ''}`}
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
                        href={`/admin/authors?page=${page + 1}${search ? `&search=${search}` : ''}${nationality ? `&nationality=${nationality}` : ''}${sort ? `&sort=${sort}` : ''}`}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminAuthorsPage({ searchParams }: AdminAuthorsPageProps) {
  // Use React.use() to unwrap the searchParams promise
  const params = use(searchParams)

  const page = Number(params.page) || 1
  const search = params.search || ''
  const nationality = params.nationality || ''
  const sort = params.sort || 'name_asc'
  const [availableNationalities, setAvailableNationalities] = useState<string[]>([])

  useEffect(() => {
    // Fetch nationalities for the filter dropdown
    async function fetchNationalities() {
      try {
        const response = await fetch('/api/admin/authors/nationalities')
        if (response.ok) {
          const data = await response.json()
          setAvailableNationalities(data.nationalities || [])
        }
      } catch (error) {
        console.error('Error fetching nationalities:', error)
      }
    }

    fetchNationalities()
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Authors Management</h1>
        <Button asChild>
          <Link href="/authors/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Author
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <ReusableSearch
            paramName="search"
            placeholder="Search authors..."
            debounceMs={300}
            basePath="/admin/authors"
            preserveParams={['nationality', 'sort']}
          />
        </div>

        <div className="flex gap-2">
          <Select
            name="nationality"
            defaultValue={nationality || 'all'}
            onValueChange={(value) => {
              const url = new URL(window.location.href)
              if (value === 'all') {
                url.searchParams.delete('nationality')
              } else {
                url.searchParams.set('nationality', value)
              }
              url.searchParams.set('page', '1')
              window.location.href = url.toString()
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All nationalities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All nationalities</SelectItem>
              {availableNationalities.map((nat) => (
                <SelectItem key={nat} value={nat}>
                  {nat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            name="sort"
            defaultValue={sort}
            onValueChange={(value) => {
              const url = new URL(window.location.href)
              url.searchParams.set('sort', value)
              window.location.href = url.toString()
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="birth_date_asc">Birth Date (Oldest first)</SelectItem>
              <SelectItem value="birth_date_desc">Birth Date (Newest first)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AuthorsTable page={page} search={search} nationality={nationality} sort={sort} />
    </div>
  )
}
