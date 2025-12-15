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
import { AuthorsListWrapper } from "./components/AuthorsListWrapper"

interface AuthorsPageProps {
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
  photo_url?: string
  author_image?: {
    id: string // UUID
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

  // Fetch all authors (or large subset) for client-side filtering
  // Apply nationality filter server-side if provided
  const query = {
    ...(nationality && { nationality }),
  }

  // Execute the query - fetch all matching authors (limit to reasonable number)
  const authors = await db.query(
    "authors",
    query,
    {
      ttl: 300, // Cache for 5 minutes
      cacheKey: `authors_all:${JSON.stringify({ nationality })}`,
      limit: 1000, // Fetch up to 1000 authors for client-side filtering
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

  // Get total count for initial pagination calculation
  const totalAuthorsResult = await db.query(
    "authors",
    query,
    {
      ttl: 300, // Cache for 5 minutes
      cacheKey: `authors_count:${JSON.stringify({ nationality })}`,
      count: true
    }
  )

  // Extract count from result
  const totalAuthors = typeof totalAuthorsResult === 'object' && 'count' in totalAuthorsResult 
    ? totalAuthorsResult.count 
    : 0

  // Return authors data to be passed to client component for instant filtering
  return {
    authors: processedAuthors,
    totalCount: totalAuthors,
    pageSize: 24,
  }
}

async function AuthorsListContent({
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
  const { authors, totalCount, pageSize } = await AuthorsList({
    page,
    search,
    nationality,
    sort,
  })

  return (
    <AuthorsListWrapper
      initialAuthors={authors}
      initialTotalCount={totalCount}
      page={page}
      pageSize={pageSize}
      nationality={nationality}
      sort={sort}
      initialSearch={search}
    />
  )
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  // Await searchParams before accessing its properties
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const search = params.search
  const nationality = params.nationality
  const sort = params.sort
  
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
        <AuthorsListContent
          page={page}
          search={search}
          nationality={nationality}
          sort={sort}
        />
      </Suspense>
    </div>
  )
}
