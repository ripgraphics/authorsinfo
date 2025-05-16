import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
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
import { AuthorsFilters } from "./components/AuthorsFilters"

interface AuthorsPageProps {
  searchParams: {
    page?: string
    search?: string
    nationality?: string
    sort?: string
  }
}

interface Author {
  id: number
  name: string
  nationality?: string
  birth_date?: string
  photo_url?: string
  author_image?: {
    id: number
    url: string
    alt_text: string
  }
}

async function getUniqueNationalities(): Promise<string[]> {
  const nationalities = await db.query(
    "authors",
    { nationality: { not: "is", value: null } },
    {
      ttl: 3600, // Cache for 1 hour
      cacheKey: "unique_nationalities"
    }
  ) as Author[]

  // Extract unique nationalities and ensure they are strings
  return Array.from(new Set(nationalities.map((item: Author) => item.nationality).filter(Boolean))) as string[]
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

  const orderBy = sort === "name_asc" ? { name: "asc" as const, birth_date: "asc" as const } :
                 sort === "name_desc" ? { name: "desc" as const, birth_date: "asc" as const } :
                 sort === "birth_date_asc" ? { birth_date: "asc" as const, name: "asc" as const } :
                 sort === "birth_date_desc" ? { birth_date: "desc" as const, name: "asc" as const } :
                 { name: "asc" as const, birth_date: "asc" as const }

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
      select: `
        *,
        author_image:author_image_id(id, url, alt_text)
      `
    }
  ) as Author[]

  // Process authors to include image URL
  const processedAuthors = authors.map((author) => ({
    ...author,
    photo_url: author.author_image?.url || author.photo_url || null,
  }))

  // Get total count for pagination
  const totalAuthorsResult = await db.query(
    "authors",
    query,
    {
      ttl: 300, // Cache for 5 minutes
      cacheKey: `authors_count:${JSON.stringify({ search, nationality })}`,
      count: true
    }
  )

  // Extract count from result
  const totalAuthors = typeof totalAuthorsResult === 'object' && 'count' in totalAuthorsResult 
    ? totalAuthorsResult.count 
    : 0

  const totalPages = Math.ceil(totalAuthors / pageSize)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {processedAuthors.length > 0 ? (
          processedAuthors.map((author) => (
            <Link href={`/authors/${author.id}`} key={author.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
                  {author.photo_url ? (
                    <div className="h-full w-full overflow-hidden">
                      <img 
                        src={author.photo_url} 
                        alt={author.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
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
  // Access searchParams without await
  const page = searchParams.page ? parseInt(searchParams.page) : 1
  const search = searchParams.search
  const nationality = searchParams.nationality
  const sort = searchParams.sort
  
  // Get unique nationalities for the filter
  const nationalities = await getUniqueNationalities()

  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Authors</h1>
        <p className="text-muted-foreground mt-2">Browse and discover authors from our collection.</p>
      </div>
      <AuthorsFilters
        search={search}
        nationality={nationality}
        sort={sort}
        nationalities={nationalities}
      />
      <Suspense fallback={<div>Loading authors...</div>}>
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
