import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, Search, Filter } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { db } from "@/lib/db"
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

interface AuthorsPageProps {
  searchParams: {
    page?: string
    search?: string
    nationality?: string
    sort?: string
  }
}

async function getUniqueNationalities() {
  const nationalities = await db.query(
    "authors",
    { nationality: { not: "is", value: null } },
    {
      ttl: 3600, // Cache for 1 hour
      cacheKey: "unique_nationalities"
    }
  )

  // Extract unique nationalities
  return Array.from(new Set(nationalities.map((item) => item.nationality).filter(Boolean)))
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
  const pageSize = 24
  const offset = (page - 1) * pageSize

  // Build the query
  const query = {
    ...(search && { name: { ilike: `%${search}%` } }),
    ...(nationality && { nationality }),
  }

  const orderBy = sort === "name_asc" ? { name: "asc" } :
                 sort === "name_desc" ? { name: "desc" } :
                 sort === "birth_date_asc" ? { birth_date: "asc" } :
                 sort === "birth_date_desc" ? { birth_date: "desc" } :
                 { name: "asc" }

  // Execute the query with caching
  const authors = await db.query(
    "authors",
    query,
    {
      ttl: 300, // Cache for 5 minutes
      cacheKey: `authors:${JSON.stringify({ page, search, nationality, sort })}`,
      orderBy,
      limit: pageSize,
      offset,
      include: {
        author_image: {
          select: ["id", "url", "alt_text"]
        }
      }
    }
  )

  // Process authors to include image URL
  const processedAuthors = authors.map((author) => ({
    ...author,
    photo_url: author.author_image?.url || author.photo_url || null,
  }))

  // Get total count for pagination
  const totalAuthors = await db.count(
    "authors",
    query,
    {
      ttl: 300, // Cache for 5 minutes
      cacheKey: `authors_count:${JSON.stringify({ search, nationality })}`
    }
  )

  const totalPages = Math.ceil(totalAuthors / pageSize)

  // Get unique nationalities for the filter
  const nationalities = await getUniqueNationalities()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {processedAuthors.length > 0 ? (
          processedAuthors.map((author) => (
            <Link href={`/authors/${author.id}`} key={author.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
                  {author.photo_url ? (
                    <Image
                      src={author.photo_url || "/placeholder.svg"}
                      alt={author.author_image?.alt_text || author.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{author.name}</h3>
                  {author.nationality && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{author.nationality}</p>
                  )}
                  {author.birth_date && <p className="text-xs text-muted-foreground mt-1">{author.birth_date}</p>}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No authors found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/authors?page=${page - 1}${search ? `&search=${search}` : ""}${nationality ? `&nationality=${nationality}` : ""}${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i

              if (pageNumber <= 0 || pageNumber > totalPages) return null

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href={`/authors?page=${pageNumber}${search ? `&search=${search}` : ""}${nationality ? `&nationality=${nationality}` : ""}${sort ? `&sort=${sort}` : ""}`}
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
                  href={`/authors?page=${page + 1}${search ? `&search=${search}` : ""}${nationality ? `&nationality=${nationality}` : ""}${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const page = await searchParams.page ? parseInt(await searchParams.page) : 1
  const search = await searchParams.search
  const nationality = await searchParams.nationality
  const sort = await searchParams.sort

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Authors"
        description="Browse and discover authors from our collection."
      />
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search authors..."
            defaultValue={search}
            onChange={(e) => {
              const searchParams = new URLSearchParams(window.location.search)
              if (e.target.value) {
                searchParams.set("search", e.target.value)
              } else {
                searchParams.delete("search")
              }
              searchParams.delete("page")
              window.location.search = searchParams.toString()
            }}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Filter authors by nationality and sort order.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Select
                  defaultValue={nationality}
                  onValueChange={(value) => {
                    const searchParams = new URLSearchParams(window.location.search)
                    if (value) {
                      searchParams.set("nationality", value)
                    } else {
                      searchParams.delete("nationality")
                    }
                    searchParams.delete("page")
                    window.location.search = searchParams.toString()
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All nationalities</SelectItem>
                    {nationalities.map((nat) => (
                      <SelectItem key={nat} value={nat}>
                        {nat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Sort by</Label>
                <Select
                  defaultValue={sort}
                  onValueChange={(value) => {
                    const searchParams = new URLSearchParams(window.location.search)
                    if (value) {
                      searchParams.set("sort", value)
                    } else {
                      searchParams.delete("sort")
                    }
                    searchParams.delete("page")
                    window.location.search = searchParams.toString()
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort order" />
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
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  onClick={() => {
                    window.location.search = ""
                  }}
                  variant="outline"
                >
                  Clear filters
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthorsList
          page={page}
          search={search}
          nationality={nationality}
          sort={sort}
        />
      </Suspense>
    </div>
  )
}
