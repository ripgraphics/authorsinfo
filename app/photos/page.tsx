import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Search, Filter } from 'lucide-react'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

interface PhotosPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
    sort?: string
  }>
}

async function getUniqueCategories() {
  try {
    const photos = await fetchQuery(api.queries.photos.listPhotos, { limit: 1000 })
    const categories = new Set<string>()
    photos.forEach((photo) => {
      if (photo.metadata && typeof photo.metadata === 'object' && 'category' in photo.metadata) {
        const category = (photo.metadata as any).category
        if (category) {
          categories.add(String(category))
        }
      }
    })
    return Array.from(categories).sort()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

async function PhotosList({
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
  const pageSize = 24
  const offset = (page - 1) * pageSize

  const photos = await fetchQuery(api.queries.photos.listPhotos, {
    search,
    authorId: category && category !== 'all' ? category : undefined,
    sortBy: sort,
    limit: pageSize,
    offset,
  })

  const totalPhotos = await fetchQuery(api.queries.photos.getTotalPhotosCount, {
    search,
    authorId: category && category !== 'all' ? category : undefined,
  })

  const totalPages = Math.ceil(totalPhotos / pageSize)
  const categoriesList = await getUniqueCategories()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {photos.length > 0 ? (
          photos.map((photo) => (
            <Link href={`/photos/${photo._id}`} key={photo._id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                  {photo.url ? (
                    <Image
                      src={photo.url || '/placeholder.svg'}
                      alt={photo.alt_text || 'Photo'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {photo.alt_text || 'Untitled'}
                  </h3>
                  {photo.metadata &&
                    typeof photo.metadata === 'object' &&
                    'category' in photo.metadata && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {(photo.metadata as any).category}
                      </p>
                    )}
                  {photo.created_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No photos found. Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/photos?page=${page - 1}${search ? '&search=' + search : ''}${category ? '&category=' + category : ''}${sort ? '&sort=' + sort : ''}`}
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
                    href={`/photos?page=${pageNumber}${search ? '&search=' + search : ''}${category ? '&category=' + category : ''}${sort ? '&sort=' + sort : ''}`}
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
                  href={`/photos?page=${page + 1}${search ? '&search=' + search : ''}${category ? '&category=' + category : ''}${sort ? '&sort=' + sort : ''}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default async function PhotosPage({ searchParams }: PhotosPageProps) {
  const [categoriesList, params] = await Promise.all([getUniqueCategories(), searchParams])

  const page = params?.page ? parseInt(params.page) : 1
  const search = params?.search
  const category = params?.category
  const sort = params?.sort

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Photos</h1>
        <p className="text-muted-foreground mt-2">
          Browse and discover photos from our collection.
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <PhotosList page={page} search={search} category={category} sort={sort} />
      </Suspense>
    </div>
  )
}
