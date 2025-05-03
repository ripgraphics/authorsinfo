import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building, Search, Filter } from "lucide-react"
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
import { InteractiveControls } from "./components/InteractiveControls"
import { PageContainer } from "@/components/page-container"

interface Publisher {
  id: number
  name: string
  country_id: number | null
  country_details?: {
    id: number
    name: string
    code: string
  }
  founded_year?: number
  logo_url?: string
}

interface Country {
  id: number
  name: string
  code: string
}

interface QueryResponse<T> {
  data: T[]
  count: number | null
}

interface PublishersPageProps {
  searchParams: {
    page?: string
    search?: string
    location?: string
    sort?: string
  }
}

// Function to detect the location field in the publishers table
async function detectLocationField() {
  try {
    // Get a sample publisher to examine its structure
    const publishers = await db.query<Publisher>(
      "publishers",
      {},
      {
        ttl: 3600, // Cache for 1 hour
        cacheKey: "sample_publisher",
        limit: 1,
        select: "*, country_details:country_id(id, name, code)"
      }
    )

    if (!Array.isArray(publishers) || publishers.length === 0) {
      console.error("No sample publisher found")
      return null
    }

    // Check if country_id exists in the publisher object
    if ('country_id' in publishers[0] && publishers[0].country_id !== null) {
      console.log("Detected location field: country_id")
      return 'country_id'
    }

    console.log("No location field found in publishers table")
    return null
  } catch (error) {
    console.error("Error detecting location field:", error)
    return null
  }
}

async function getUniqueLocations() {
  try {
    // Detect the location field
    const locationField = await detectLocationField()

    if (!locationField) {
      console.log("No location field found in publishers table")
      return []
    }

    // Use the detected field to fetch unique locations with country details
    const publishers = await db.query<Publisher>(
      "publishers",
      { [locationField]: { not: "is", value: null } },
      {
        ttl: 3600, // Cache for 1 hour
        cacheKey: `unique_locations_${locationField}`,
        orderBy: { [locationField]: "asc" },
        select: "*, country_details:country_id(id, name, code)"
      }
    )

    if (!Array.isArray(publishers)) {
      return []
    }

    // Extract unique locations with country details
    const uniqueLocations = Array.from(
      new Set(
        publishers
          .map((item) => item.country_details)
          .filter((country): country is Country => country !== null)
          .map((country) => country.id.toString())
      )
    )

    return uniqueLocations
  } catch (error) {
    console.error("Error fetching locations:", error)
    return []
  }
}

async function PublishersList({
  page,
  search,
  location,
  sort,
}: {
  page: number
  search?: string
  location?: string
  sort?: string
}) {
  const pageSize = 24
  const offset = (page - 1) * pageSize

  // Build the query
  const query = {
    ...(search && { name: { ilike: `%${search}%` } }),
    ...(location && location !== "all" && { country_id: location }),
  }

  // Define a more specific type for orderBy
  type OrderByType = { name?: "asc" | "desc"; founded_year?: "asc" | "desc" }
  
  const orderBy: OrderByType = sort === "name_asc" ? { name: "asc" } :
                              sort === "name_desc" ? { name: "desc" } :
                              sort === "founded_year_asc" ? { founded_year: "asc" } :
                              sort === "founded_year_desc" ? { founded_year: "desc" } :
                              { name: "asc" }

  // Execute the query with caching
  const [publishers, countResponse] = await Promise.all([
    db.query<Publisher>(
      "publishers",
      query,
      {
        ttl: 300, // Cache for 5 minutes
        cacheKey: `publishers:${JSON.stringify({ page, search, location, sort })}`,
        orderBy,
        limit: pageSize,
        offset,
        select: "*, country_details:country_id(id, name, code)"
      }
    ),
    db.query<Publisher>(
      "publishers",
      query,
      {
        ttl: 300, // Cache for 5 minutes
        cacheKey: `publishers_count:${JSON.stringify({ search, location })}`,
        count: true
      }
    )
  ])

  if (!Array.isArray(publishers) || !('count' in countResponse)) {
    return null
  }

  const totalPages = Math.ceil((countResponse.count || 0) / pageSize)

  // Get unique locations for the filter
  const locationsList = await getUniqueLocations()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {publishers.length > 0 ? (
          publishers.map((publisher) => (
            <Link href={`/publishers/${publisher.id}`} key={publisher.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full" style={{ aspectRatio: "7/4" }}>
                  {publisher.logo_url ? (
                    <Image
                      src={publisher.logo_url || "/placeholder.svg"}
                      alt={publisher.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{publisher.name}</h3>
                  {publisher.country_details && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{publisher.country_details.name}</p>
                  )}
                  {publisher.founded_year && (
                    <p className="text-xs text-muted-foreground mt-1">Founded: {publisher.founded_year}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No publishers found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/publishers?page=${page - 1}${search ? `&search=${search}` : ""}${location ? `&location=${location}` : ""}${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i

              if (pageNumber <= 0 || pageNumber > totalPages) return null

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href={`/publishers?page=${pageNumber}${search ? `&search=${search}` : ""}${location ? `&location=${location}` : ""}${sort ? `&sort=${sort}` : ""}`}
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
                  href={`/publishers?page=${page + 1}${search ? `&search=${search}` : ""}${location ? `&location=${location}` : ""}${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default async function PublishersPage({ searchParams }: PublishersPageProps) {
  // Get all required data first
  const [locationsList, params] = await Promise.all([
    getUniqueLocations(),
    Promise.resolve(searchParams)
  ])

  const page = params?.page ? parseInt(params.page) : 1
  const search = params?.search
  const location = params?.location
  const sort = params?.sort

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">Publishers</h1>
          <p className="text-muted-foreground mt-2">Browse and discover publishers from our collection.</p>
        </div>
        <InteractiveControls
          locations={locationsList}
          search={search}
          location={location}
          sort={sort}
        />
        <Suspense fallback={<div>Loading...</div>}>
          <PublishersList
            page={page}
            search={search}
            location={location}
            sort={sort}
          />
        </Suspense>
      </div>
    </PageContainer>
  )
}
