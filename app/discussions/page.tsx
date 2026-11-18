import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Search, Filter } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getDiscussions, getTotalDiscussionsCount } from '@/app/actions/data'
import { transformConvexDiscussionToSupabase } from '@/lib/convex-transforms'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Discussion } from '@/types/database'

interface DiscussionsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
    sort?: string
  }>
}

async function DiscussionsList({
  page,
  search,
  category,
  sort,
}: {
  page: number
  search?: string
  category?: string
  sort?: string
}) {
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const queryParams: any = {
    limit: pageSize,
    offset,
    sortBy: sort === 'title_asc' ? 'title' : 'createdAt',
  }

  if (search) queryParams.search = search
  if (category && category !== 'all') queryParams.groupId = category

  const [discussions, total] = await Promise.all([
    getDiscussions(queryParams),
    getTotalDiscussionsCount({ search, groupId: category || undefined }),
  ])

  // Transform Convex data to Supabase format
  const transformedDiscussions = discussions.map(transformConvexDiscussionToSupabase)

  return { discussions: transformedDiscussions as Discussion[], total, pageSize }
}

export default async function DiscussionsPage({ searchParams }: DiscussionsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
const search = params.search || ''
const category = params.category || ''
const sort = params.sort || 'created_at_desc'

  const { discussions, total, pageSize } = await DiscussionsList({ page, search, category, sort })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Discussions</h1>
        <p className="text-muted-foreground mt-2">Browse and discover discussions from our community.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <form action="/discussions" method="get" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Search discussions..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>

        <Select name="category" defaultValue={category || 'all'}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="books">Books</SelectItem>
            <SelectItem value="authors">Authors</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
          </SelectContent>
        </Select>

        <Select name="sort" defaultValue={sort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">Newest First</SelectItem>
            <SelectItem value="created_at_asc">Oldest First</SelectItem>
            <SelectItem value="title_asc">Title A-Z</SelectItem>
            <SelectItem value="title_desc">Title Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {discussions.length} of {total} discussions
      </p>

      {/* Discussions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {discussions.length > 0 ? (
          discussions.map((discussion: Discussion) => (
            <Link href={`/discussions/${discussion.id}`} key={discussion.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {discussion.title || 'Untitled'}
                  </h3>
                  {discussion.category_id && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {discussion.category_id}
                    </p>
                  )}
                  {discussion.created_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No discussions found. Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/discussions?page=${page - 1}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${sort ? `&sort=${sort}` : ''}`}
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
                    href={`/discussions?page=${pageNumber}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${sort ? `&sort=${sort}` : ''}`}
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
                  href={`/discussions?page=${page + 1}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${sort ? `&sort=${sort}` : ''}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
