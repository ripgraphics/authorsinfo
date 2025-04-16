"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Plus, Search, Edit } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminAuthorsPageProps {
  searchParams: {
    page?: string
    search?: string
    nationality?: string
    sort?: string
  }
}

interface Author {
  id: string
  name: string
  nationality?: string
  birth_date?: string
  author_image?: {
    id: number
    url: string
    alt_text?: string
  }
  book_count?: number
}

// Server component to fetch authors
async function getAuthors({
  page = 1,
  search = "",
  nationality = "",
  sort = "name_asc",
}: {
  page: number
  search?: string
  nationality?: string
  sort?: string
}) {
  const pageSize = 10
  const offset = (page - 1) * pageSize

  // Build the query - avoid using relationships that might not be defined
  let query = supabaseAdmin.from("authors").select("*", { count: "exact" })

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
  const { data: authors, error, count } = await query

  if (error) {
    console.error("Error fetching authors:", error)
    throw new Error(`Error fetching authors: ${error.message}`)
  }

  // Now get book counts for each author separately
  const authorsWithBookCounts: Author[] = await Promise.all(
    (authors || []).map(async (author) => {
      // Try to get book count from book_authors table first
      try {
        const { count: bookCount, error: bookCountError } = await supabaseAdmin
          .from("book_authors")
          .select("*", { count: "exact" })
          .eq("author_id", author.id)

        if (!bookCountError) {
          return { ...author, book_count: bookCount || 0 }
        }
      } catch (e) {
        console.warn(`Could not get book count from book_authors for author ${author.id}:`, e)
      }

      // Fallback: try to get books with author_id field
      try {
        const { count: bookCount, error: bookCountError } = await supabaseAdmin
          .from("books")
          .select("*", { count: "exact" })
          .eq("author_id", author.id)

        if (!bookCountError) {
          return { ...author, book_count: bookCount || 0 }
        }
      } catch (e) {
        console.warn(`Could not get book count from books for author ${author.id}:`, e)
      }

      // If both methods fail, return 0 books
      return { ...author, book_count: 0 }
    }),
  )

  return {
    authors: authorsWithBookCounts,
    totalAuthors: count || 0,
  }
}

// Server component to fetch unique nationalities
async function getNationalities() {
  try {
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
  } catch (error) {
    console.error("Error fetching nationalities:", error)
    return []
  }
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
  const [data, setData] = useState<{ authors: Author[]; totalAuthors: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nationalities, setNationalities] = useState<string[]>([])
  const pageSize = 10

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch authors data
        const authorsData = await getAuthors({ page, search, nationality, sort })
        setData(authorsData)

        // Fetch nationalities for filter
        const nationalitiesData = await getNationalities()
        setNationalities(nationalitiesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, search, nationality, sort])

  if (loading) {
    return (
      <div className="space-y-4">
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
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (!data) {
    return <div className="p-4">No data available</div>
  }

  const { authors, totalAuthors } = data
  const totalPages = Math.ceil(totalAuthors / pageSize)

  return (
    <div className="space-y-6">
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
                      <TableCell>{author.nationality || "—"}</TableCell>
                      <TableCell>{author.birth_date || "—"}</TableCell>
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
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
                        href={`/admin/authors?page=${page - 1}${search ? `&search=${search}` : ""}${nationality ? `&nationality=${nationality}` : ""}${sort ? `&sort=${sort}` : ""}`}
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i

                    if (pageNumber <= 0 || pageNumber > totalPages) return null

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={`/admin/authors?page=${pageNumber}${search ? `&search=${search}` : ""}${nationality ? `&nationality=${nationality}` : ""}${sort ? `&sort=${sort}` : ""}`}
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
                        href={`/admin/authors?page=${page + 1}${search ? `&search=${search}` : ""}${nationality ? `&nationality=${nationality}` : ""}${sort ? `&sort=${sort}` : ""}`}
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
  const page = Number(searchParams.page) || 1
  const search = searchParams.search || ""
  const nationality = searchParams.nationality || ""
  const sort = searchParams.sort || "name_asc"
  const [availableNationalities, setAvailableNationalities] = useState<string[]>([])

  useEffect(() => {
    // Fetch nationalities for the filter dropdown
    async function fetchNationalities() {
      try {
        const data = await getNationalities()
        setAvailableNationalities(data)
      } catch (error) {
        console.error("Error fetching nationalities:", error)
      }
    }

    fetchNationalities()
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <form>
            <Input type="search" name="search" placeholder="Search authors..." className="pl-8" defaultValue={search} />
            <input type="hidden" name="page" value="1" />
            {nationality && <input type="hidden" name="nationality" value={nationality} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
          </form>
        </div>

        <div className="flex gap-2">
          <Select
            name="nationality"
            defaultValue={nationality || "all"}
            onValueChange={(value) => {
              const url = new URL(window.location.href)
              if (value === "all") {
                url.searchParams.delete("nationality")
              } else {
                url.searchParams.set("nationality", value)
              }
              url.searchParams.set("page", "1")
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
              url.searchParams.set("sort", value)
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
