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
import { supabaseAdmin } from "@/lib/supabase/server"
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
    const { data: samplePublisher, error } = await supabaseAdmin.from("publishers").select("*").limit(1).single()

    if (error || !samplePublisher) {
      console.error("Error fetching sample publisher:", error)
      return null
    }

    // Check for various possible location field names
    const possibleLocationFields = ["location", "headquarters", "hq", "address", "city", "country", "region", "state"]

    // Find the first field that exists in the publisher object
    const locationField = possibleLocationFields.find(
      (field) => field in samplePublisher && samplePublisher[field] !== null,
    )

    console.log("Detected location field:", locationField)
    return locationField || null
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

    // Use the detected field to fetch unique locations
    const { data, error } = await supabaseAdmin
      .from("publishers")
      .select(locationField)
      .not(locationField, "is", null)
      .order(locationField)

    if (error) {
      console.error(`Error fetching ${locationField}:`, error)
      return []
    }

    // Extract unique locations
    const uniqueLocations = Array.from(new Set(data.map((item) => item[locationField]).filter(Boolean)))

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

  // Detect the location field
  const locationField = await detectLocationField()

  // Build the query
  let query = supabaseAdmin.from("publishers").select("*")

  // Apply search filter if provided
  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  // Apply location filter if provided and location field exists
  if (location && location !== "all" && locationField) {
    query = query.eq(locationField, location)
  }

  // Apply sorting
  if (sort === "name_asc") {
    query = query.order("name", { ascending: true })
  } else if (sort === "name_desc") {
    query = query.order("name", { ascending: false })
  } else if (sort === "founded_year_asc") {
    query = query.order("founded_year", { ascending: true })
  } else if (sort === "founded_year_desc") {
    query = query.order("founded_year", { ascending: false })
  } else {
    // Default sorting
    query = query.order("name", { ascending: true })
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1)

  // Execute the query
  const { data: publishers, error } = await query

  if (error) {
    console.error("Error fetching publishers:", error)
    return <div>Error loading publishers</div>
  }

  // Get total count for pagination
  let countQuery = supabaseAdmin.from("publishers").select("*", { count: "exact", head: true })

  if (search) {
    countQuery = countQuery.ilike("name", `%${search}%`)
  }

  if (location && location !== "all" && locationField) {
    countQuery = countQuery.eq(locationField, location)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error("Error counting publishers:", countError)
    return <div>Error loading publishers</div>
  }

  const totalPublishers = count || 0
  const totalPages = Math.ceil(totalPublishers / pageSize)

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
                  {locationField && publisher[locationField] && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{publisher[locationField]}</p>
                  )}
                  {publisher.founded_year && (
                    <p className="text-xs text-muted-foreground mt-1">Est. {publisher.founded_year}</p>
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
                  href={`/publishers?page=${page - 1}${search ? `&search=${search}` : ""}${
                    location ? `&location=${location}` : ""
                  }${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i

              if (pageNumber <= 0 || pageNumber > totalPages) return null

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href={`/publishers?page=${pageNumber}${search ? `&search=${search}` : ""}${
                      location ? `&location=${location}` : ""
                    }${sort ? `&sort=${sort}` : ""}`}
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
                  href={`/publishers?page=${page + 1}${search ? `&search=${search}` : ""}${
                    location ? `&location=${location}` : ""
                  }${sort ? `&sort=${sort}` : ""}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default function PublishersPage({ searchParams }: PublishersPageProps) {
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const location = searchParams.location || ""
  const sort = searchParams.sort || "name_asc"

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Publishers</h1>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <form>
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search publishers..."
                    className="pl-8"
                    defaultValue={search}
                  />
                </form>
              </div>

              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Publishers</SheetTitle>
                      <SheetDescription>Apply filters to narrow down the list of publishers.</SheetDescription>
                    </SheetHeader>
                    <form action="/publishers" className="py-4 space-y-6">
                      {/* Hidden fields to preserve other params */}
                      <input type="hidden" name="page" value="1" />
                      {search && <input type="hidden" name="search" value={search} />}

                      <div className="space-y-4">
                        <Label htmlFor="location">Location</Label>
                        <Select name="location" defaultValue={location}>
                          <SelectTrigger>
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All locations</SelectItem>
                            <Suspense fallback={<SelectItem value="loading">Loading...</SelectItem>}>
                              {/* This will be populated server-side */}
                            </Suspense>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="sort">Sort By</Label>
                        <Select name="sort" defaultValue={sort}>
                          <SelectTrigger>
                            <SelectValue placeholder="Name (A-Z)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                            <SelectItem value="founded_year_asc">Founded Year (Oldest first)</SelectItem>
                            <SelectItem value="founded_year_desc">Founded Year (Newest first)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <SheetFooter>
                        <SheetClose asChild>
                          <Button type="submit">Apply Filters</Button>
                        </SheetClose>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>

                <Link href="/publishers/add">
                  <Button>Add New Publisher</Button>
                </Link>
              </div>
            </div>
          </div>

          <Suspense fallback={<div>Loading publishers...</div>}>
            <PublishersList page={page} search={search} location={location} sort={sort} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
