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
import { supabaseAdmin } from "@/lib/supabase"
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
  const { data, error } = await supabaseAdmin
    .from("authors")
    .select("nationality")
    .not("nationality", "is", null)
    .order("nationality")

  if (error) {
    console.error("Error fetching nationalities:", error)
    return []
  }

  // Extract unique nationalities
  const uniqueNationalities = Array.from(new Set(data.map((item) => item.nationality).filter(Boolean)))

  return uniqueNationalities
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
  let query = supabaseAdmin.from("authors").select(`
      *,
      author_image:author_image_id(id, url, alt_text)
    `)

  // Apply search filter if provided
  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  // Apply nationality filter if provided
  if (nationality) {
    query = query.eq("nationality", nationality)
  }

  // Apply sorting
  if (sort === "name_asc") {
    query = query.order("name", { ascending: true })
  } else if (sort === "name_desc") {
    query = query.order("name", { ascending: false })
  } else if (sort === "birth_date_asc") {
    query = query.order("birth_date", { ascending: true })
  } else if (sort === "birth_date_desc") {
    query = query.order("birth_date", { ascending: false })
  } else {
    // Default sorting
    query = query.order("name", { ascending: true })
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1)

  // Execute the query
  const { data: authors, error } = await query

  if (error) {
    console.error("Error fetching authors:", error)
    return <div>Error loading authors</div>
  }

  // Process authors to include image URL
  const processedAuthors = authors.map((author) => ({
    ...author,
    photo_url: author.author_image?.url || author.photo_url || null,
  }))

  // Get total count for pagination
  let countQuery = supabaseAdmin.from("authors").select("*", { count: "exact", head: true })

  if (search) {
    countQuery = countQuery.ilike("name", `%${search}%`)
  }

  if (nationality) {
    countQuery = countQuery.eq("nationality", nationality)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error("Error counting authors:", countError)
    return <div>Error loading authors</div>
  }

  const totalAuthors = count || 0
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

export default function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const nationality = searchParams.nationality || ""
  const sort = searchParams.sort || "name_asc"

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Authors</h1>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <form>
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search authors..."
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
                      <SheetTitle>Filter Authors</SheetTitle>
                      <SheetDescription>Apply filters to narrow down the list of authors.</SheetDescription>
                    </SheetHeader>
                    <form action="/authors" className="py-4 space-y-6">
                      {/* Hidden fields to preserve other params */}
                      <input type="hidden" name="page" value="1" />
                      {search && <input type="hidden" name="search" value={search} />}

                      <div className="space-y-4">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Select name="nationality" defaultValue={nationality}>
                          <SelectTrigger>
                            <SelectValue placeholder="All nationalities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All nationalities</SelectItem>
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
                            <SelectItem value="birth_date_asc">Birth Date (Oldest first)</SelectItem>
                            <SelectItem value="birth_date_desc">Birth Date (Newest first)</SelectItem>
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

                <Link href="/authors/add">
                  <Button>Add New Author</Button>
                </Link>
              </div>
            </div>
          </div>

          <Suspense fallback={<div>Loading authors...</div>}>
            <AuthorsList page={page} search={search} nationality={nationality} sort={sort} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
