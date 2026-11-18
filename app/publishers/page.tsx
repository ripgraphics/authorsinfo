import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building, Search, Filter } from 'lucide-react'
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
import { getListPublishers, getTotalPublishersCount } from '@/app/actions/data'
import type { Publisher } from '@/types/database'

interface PublishersPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
  }>
}

async function PublishersList({
  page,
  search,
  sort,
}: {
  page: number
  search?: string
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

  const [publishers, total] = await Promise.all([
    getListPublishers(queryParams),
    getTotalPublishersCount({ search }),
  ])

  return { publishers: publishers as Publisher[], total, pageSize }
}

export default async function PublishersPage({ searchParams }: PublishersPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const sort = params.sort || 'name_asc'

  const { publishers, total, pageSize } = await PublishersList({ page, search, sort })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Publishers</h1>
        <p className="text-muted-foreground mt-2">Browse and discover publishers from our collection.</p>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-[400px]">
          <form action="/publishers" method="get" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Search publishers..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {publishers.length} of {total} publishers
      </p>

      {/* Publishers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {publishers.length > 0 ? (
          publishers.map((publisher: Publisher) => (
            <Link href={`/publishers/${publisher.id}`} key={publisher.id} className="block group">
              <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
                <div className="relative w-full aspect-square bg-muted">
                  {publisher.cover_image?.url ? (
                    <Image
                      src={publisher.cover_image.url}
                      alt={publisher.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm line-clamp-2">{publisher.name}</h3>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No publishers found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={`/publishers?page=${page - 1}${search ? `&search=${search}` : ''}`} />
              </PaginationItem>
            )}
            <PaginationItem>
              <span className="px-4 py-2 text-sm">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={`/publishers?page=${page + 1}${search ? `&search=${search}` : ''}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
