import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Search, Filter } from "lucide-react"
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

interface DiscussionsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
    sort?: string
  }>
}

// Function to get unique discussion categories
async function getUniqueCategories() {
  try {
    // Use category_id instead of category (the column doesn't exist as 'category')
    // First try to get categories via category_id join, if that column exists
    const { data, error } = await supabaseAdmin
      .from("discussions")
      .select("category_id")
      .not("category_id", "is", null)

    if (error) {
      // If category_id doesn't work either, return empty array
      console.error("Error fetching discussion categories:", error)
      return []
    }

    // Extract unique category IDs
    const uniqueCategoryIds = Array.from(new Set(data.map((item) => item.category_id).filter(Boolean)))

    return uniqueCategoryIds
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
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
  const pageSize = 24
  const offset = (page - 1) * pageSize

  // Build the query
  let query = supabaseAdmin.from("discussions").select("*")

  // Apply search filter if provided
  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  // Apply category filter if provided (use category_id instead of category)
  if (category && category !== "all") {
    query = query.eq("category_id", category)
  }

  // Apply sorting
  if (sort === "title_asc") {
    query = query.order("title", { ascending: true })
  } else if (sort === "title_desc") {
    query = query.order("title", { ascending: false })
  } else if (sort === "created_at_asc") {
    query = query.order("created_at", { ascending: true })
  } else if (sort === "created_at_desc") {
    query = query.order("created_at", { ascending: false })
  } else {
    // Default sorting
    query = query.order("created_at", { ascending: false })
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1)

  // Execute the query
  const { data: discussions, error } = await query

  if (error) {
    console.error("Error fetching discussions:", error)
    return <div>Error loading discussions</div>
  }

  // Get total count for pagination
  let countQuery = supabaseAdmin.from("discussions").select("*", { count: "exact", head: true })

  if (search) {
    countQuery = countQuery.ilike("title", `%${search}%`)
  }

  if (category && category !== "all") {
    countQuery = countQuery.eq("category_id", category)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error("Error counting discussions:", countError)
    return <div>Error loading discussions</div>
  }

  const totalDiscussions = count || 0
  const totalPages = Math.ceil(totalDiscussions / pageSize)

  // Get unique categories for the filter
  const categoriesList = await getUniqueCategories()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {discussions.length > 0 ? (
          discussions.map((discussion) => (
            <Link href={`/discussions/${discussion.id}`} key={discussion.id} className="block">
              <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                  {discussion.cover_image_url ? (
                    <Image
                      src={discussion.cover_image_url || "/placeholder.svg"}
                      alt={discussion.title || "Discussion"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{discussion.title || "Untitled"}</h3>
                  {discussion.category_id && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{discussion.category_id}</p>
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
            <p className="text-muted-foreground">No discussions found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/discussions?page=${page - 1}${search ? `&search=${search}` : ""}${
                    category ? `&category=${category}` : ""
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
                    href={`/discussions?page=${pageNumber}${search ? `&search=${search}` : ""}${
                      category ? `&category=${category}` : ""
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
                  href={`/discussions?page=${page + 1}${search ? `&search=${search}` : ""}${
                    category ? `&category=${category}` : ""
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

export default async function DiscussionsPage({ searchParams }: DiscussionsPageProps) {
  // Get all required data first
  const [categoriesList, params] = await Promise.all([
    getUniqueCategories(),
    searchParams
  ])

  const page = params?.page ? parseInt(params.page) : 1
  const search = params?.search
  const category = params?.category
  const sort = params?.sort

  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Discussions</h1>
        <p className="text-muted-foreground mt-2">Browse and discover discussions from our community.</p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <DiscussionsList
          page={page}
          search={search}
          category={category}
          sort={sort}
        />
      </Suspense>
    </div>
  )
}
