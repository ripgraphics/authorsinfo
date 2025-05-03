import { Separator } from "@/components/ui/separator"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { getBookById, getAuthorsByBookId, getPublisherById, getReviewsByBookId, getBooksByPublisherId, getBooksByAuthorId } from "@/app/actions/data"
import { AuthorAvatar } from "@/components/author-avatar"
import {
  BookOpen,
  Calendar,
  User,
  ThumbsUp,
  MessageSquare,
  Share2,
  Star,
  Clock,
  BookMarked,
  Heart,
  Globe,
  Tag,
  FileText,
  Pencil,
  Ruler,
  Weight,
  BookText,
} from "lucide-react"
import { AboutAuthor } from "@/components/about-author"
import { AuthorHoverCard } from "@/components/author-hover-card"
import { PublisherHoverCard } from "@/components/publisher-hover-card"
import { supabaseAdmin } from "@/lib/supabase"
import { BookHeader } from "@/components/admin/book-header"
import type { Book, Author, Review, BindingType, FormatType } from '@/types/book'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageContainer } from "@/components/page-container"

interface BookPageProps {
  params: {
    id: string
  }
}

// Helper function to format date as MM-DD-YYYY
function formatDate(dateString?: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const year = date.getFullYear()

    return `${month}-${day}-${year}`
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString // Return original string if parsing fails
  }
}

// Function to get author image URL
function getAuthorImageUrl(author: Author): string {
  // First check if author has photo_url directly
  if (author.photo_url) {
    return author.photo_url
  }

  // Then check for author_image from the joined table
  if (author.author_image?.url) {
    return author.author_image.url
  }

  // Default placeholder
  return "/placeholder.svg"
}

// Function to get binding and format types
async function getBookFormatAndBinding(bookId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("books")
      .select(`
        binding_types!binding_type_id(id, name, description),
        format_types!format_type_id(id, name, description)
      `)
      .eq("id", bookId)
      .single()

    if (error) {
      console.error("Error fetching book format and binding:", error)
      return { bindingType: null, formatType: null }
    }

    const bindingType = data.binding_types?.[0]
    const formatType = data.format_types?.[0]

    return {
      bindingType: bindingType ? {
        id: bindingType.id,
        name: bindingType.name,
        description: bindingType.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as BindingType : null,
      formatType: formatType ? {
        id: formatType.id,
        name: formatType.name,
        description: formatType.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as FormatType : null
    }
  } catch (error) {
    console.error("Error in getBookFormatAndBinding:", error)
    return { bindingType: null, formatType: null }
  }
}

// Function to get a sample user from the database
async function getSampleUser() {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("id").limit(1).single()

    if (error) {
      console.error("Error fetching sample user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getSampleUser:", error)
    return null
  }
}

// Function to get user's reading progress for a book
async function getUserReadingProgress(userId: string | null, bookId: string) {
  // If no userId is provided, return null
  if (!userId) {
    return null
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("reading_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .single()

    if (error) {
      // If the error is that no rows were returned, that's fine
      if (error.code === "PGRST116") {
        return null
      }
      console.error("Error fetching reading progress:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserReadingProgress:", error)
    return null
  }
}

// Function to update reading progress
async function updateReadingProgress(progress: { user_id: string; book_id?: string; current_page?: number; total_pages?: number; status?: string; started_at?: string; finished_at?: string }) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reading_progress")
      .upsert(progress)
      .select()
      .single()

    if (error) {
      console.error("Error updating reading progress:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in updateReadingProgress:", error)
    return null
  }
}

export default async function BookPage({ params }: BookPageProps) {
  // Next.js App Router requires awaiting params before using
  const { id } = await params;

  // Special case: if id is "add", redirect to the add page
  if (id === "add") {
    redirect("/books/add")
  }

  try {
    const bookOrNull = await getBookById(id);
    if (!bookOrNull) {
      notFound();
    }
    const book = bookOrNull;

    // Map DB authors to domain Author
    let authors: Author[] = [];
    try {
      const rawAuthors = (await getAuthorsByBookId(id)) as any[];
      authors = rawAuthors.map((a) => ({
        id: String(a.id),
        name: a.name,
        bio: a.bio ?? undefined,
        created_at: a.created_at,
        updated_at: a.updated_at,
        photo_url: a.photo_url ?? undefined,
        author_image: a.author_image ?? null,
        cover_image_id: a.cover_image_id ?? undefined,
      }));
    } catch (error) {
      console.error("Error fetching authors:", error)
      // Continue with empty authors array
    }

    // Fetch publisher if available with error handling
    let publisher = null
    try {
      if (book.publisher_id != null) {
        publisher = await getPublisherById(book.publisher_id.toString())
      }
    } catch (error) {
      console.error("Error fetching publisher:", error)
      // Continue with null publisher
    }

    // Fetch publisher's total books for hover card
    let publisherBooksCount = 0
    if (publisher) {
      const publisherBooks = await getBooksByPublisherId(publisher.id)
      publisherBooksCount = publisherBooks.length
    }

    // Fetch book counts for each author for hover cards
    const authorBookCounts: Record<string, number> = {}
    for (const author of authors) {
      const booksByAuthor = await getBooksByAuthorId(author.id)
      authorBookCounts[author.id] = booksByAuthor.length
    }

    // Map DB reviews to domain Review
    let reviews: Review[] = [];
    try {
      const rawReviews = (await getReviewsByBookId(id)) as any[];
      reviews = rawReviews.map((r) => ({
        id: r.id,
        book_id: r.book_id,
        user_id: r.user_id,
        rating: r.rating,
        content: r.content ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
        contains_spoilers: false,
      }));
    } catch (error) {
      console.error("Error fetching reviews:", error)
      // Continue with empty reviews array
    }

    // Fetch binding and format types
    const { bindingType, formatType } = await getBookFormatAndBinding(id) as { bindingType: BindingType | null; formatType: FormatType | null };

    // Get a sample user from the database
    const sampleUser = await getSampleUser()
    const userId = sampleUser?.id || null

    // Fetch user's reading progress
    let readingProgress: any = null
    try {
      readingProgress = await getUserReadingProgress(userId, id)
    } catch (error) {
      console.error("Error fetching reading progress:", error)
      // Continue with null reading progress
    }

    // Default reading status for display purposes when no user is logged in
    const defaultStatus = "want_to_read"

    return (
      <PageContainer>
        <div className="book-page">
          <div className="book-page banner relative h-36 md:h-72 bg-gray-200 overflow-hidden">
            {/* Banner background */}
            {(book.cover_image_url || book.original_image_url) && (
              <div className="book-page banner-image absolute inset-0">
                <Image
                  src={book.cover_image_url ?? book.original_image_url ?? "/placeholder.svg"}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div className="book-page banner-overlay absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            <div className="relative h-full flex items-end pb-6">
              <div className="book-page header flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Author Avatar */}
                <div className="book-page header-avatar -mt-16 md:mt-0 z-10">
                  {authors && authors.length > 0 ? (
                    <AuthorAvatar
                      id={authors[0].id.toString()}
                      name={authors[0].name}
                      imageUrl={getAuthorImageUrl(authors[0])}
                      size="xl"
                      className="border-4"
                    />
                  ) : (
                    <AuthorAvatar name="Unknown Author" size="xl" className="border-4" />
                  )}
                </div>

                {/* Book Title and Info */}
                <div className="book-page title-info text-center md:text-left text-white">
                  <h1 className="text-3xl md:text-4xl font-bold">{book.title}</h1>
                  <div className="book-page author-links flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    {authors && authors.length > 0 ? (
                      authors.map((author) => (
                        <AuthorHoverCard
                          key={author.id}
                          author={author}
                          bookCount={authorBookCounts[author.id] || 0}
                        >
                          <span className="hover:underline cursor-pointer">{author.name}</span>
                        </AuthorHoverCard>
                      ))
                    ) : (
                      <span className="text-gray-300">Unknown Author</span>
                    )}
                  </div>

                  {book.average_rating !== undefined && book.average_rating !== null && (
                    <div className="book-rating flex items-center justify-center md:justify-start mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(Number(book.average_rating))
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2">
                        {Number(book.average_rating).toFixed(1)} · {reviews.length} reviews
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="py-6">
            <BookHeader 
              book={book as any} 
              mainAuthor={authors && authors.length > 0 ? authors[0] : undefined} 
              bookCount={authors && authors.length > 0 ? authorBookCounts[authors[0].id] || 0 : 0}
            />
            <div className="book-detail-layout grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Book Cover (1/4 width) */}
              <div className="book-sidebar lg:col-span-1">
                {/* Book Cover (full width) */}
                <Card className="book-cover-card overflow-hidden">
                  {(book.cover_image_url || book.original_image_url) ? (
                    <div className="book-cover w-full h-full">
                      <Image
                        src={book.cover_image_url ?? book.original_image_url ?? "/placeholder.svg"}
                        alt={book.title}
                        width={400}
                        height={600}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    </div>
                  ) : (
                    <div className="book-cover-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </Card>

                {/* Add to Shelf Section - KEEP THIS ONE */}
                <div className="book-page shelf-section space-y-4 w-full mt-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="shelf-button inline-flex items-center justify-center gap-2 w-full rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2">
                        <BookMarked className="mr-2 h-4 w-4" />
                        Add to Shelf
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg p-6">
                      <DialogHeader>
                        <DialogTitle>Add Book to Shelf</DialogTitle>
                        {/* Optional: Add DialogDescription here if needed */}
                      </DialogHeader>
                      <div role="menuitem" className="shelf-menu-item flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        ✓ Want to Read
                      </div>
                      <div role="menuitem" className="shelf-menu-item flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        Currently Reading
                      </div>
                      <div role="menuitem" className="shelf-menu-item flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        Read
                      </div>
                      <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
                      <button type="button" className="shelf-manage-button w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                        Manage shelves...
                      </button>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Author Info */}
                {authors && authors.length > 0 ? (
                  <AboutAuthor 
                    authors={authors} 
                    bookId={id} 
                    className="mt-6" 
                    books={authors.map(author => ({ author_id: author.id }))}
                    authorBookCounts={authorBookCounts}
                  />
                ) : (
                  <AboutAuthor 
                    authors={[]} 
                    bookId={id} 
                    className="mt-6" 
                  />
                )}
              </div>

              {/* Right Column - Book Details (3/4 width) */}
              <div className="book-content lg:col-span-3 space-y-6">
                {/* Book Details at the top */}
                <Card className="book-details-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Book Details</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href={`/books/${book.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit Book</span>
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="book-details-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Display book data based on the actual schema, excluding specified fields */}
                      <div className="book-detail-item">
                        <h3 className="font-medium">Title</h3>
                        <p className="text-muted-foreground">{book.title}</p>
                      </div>

                      {book.isbn && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">ISBN</h3>
                          <p className="text-muted-foreground">{book.isbn}</p>
                        </div>
                      )}

                      {book.isbn10 && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">ISBN-10</h3>
                          <p className="text-muted-foreground">{book.isbn10}</p>
                        </div>
                      )}

                      {book.isbn13 && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">ISBN-13</h3>
                          <p className="text-muted-foreground">{book.isbn13}</p>
                        </div>
                      )}

                      {book.author_id && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Author</h3>
                          <div className="text-muted-foreground">
                            {authors && authors.length > 0 ? (
                              <AuthorHoverCard author={authors[0]} bookCount={authorBookCounts[authors[0].id] || 0}>
                                <span className="hover:underline cursor-pointer">{authors[0].name}</span>
                              </AuthorHoverCard>
                            ) : (
                              book.author_id
                            )}
                          </div>
                        </div>
                      )}

                      {book.publisher_id && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Publisher</h3>
                          <div className="text-muted-foreground">
                            {publisher ? (
                              <PublisherHoverCard publisher={publisher} bookCount={publisherBooksCount}>
                                <span className="hover:underline cursor-pointer">{publisher.name}</span>
                              </PublisherHoverCard>
                            ) : (
                              book.publisher_id
                            )}
                          </div>
                        </div>
                      )}

                      {book.publish_date && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Publish Date</h3>
                          <p className="text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(book.publish_date)}
                          </p>
                        </div>
                      )}

                      {book.publication_date && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Publication Date</h3>
                          <p className="text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(book.publication_date)}
                          </p>
                        </div>
                      )}

                      {(bindingType || book.binding) && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Binding</h3>
                          <p className="text-muted-foreground flex items-center">
                            <BookText className="h-4 w-4 mr-2" />
                            {bindingType?.name || book.binding}
                          </p>
                        </div>
                      )}

                      {/* Only show page_count if it's a valid number */}
                      {book.page_count !== undefined && book.page_count !== null && !isNaN(Number(book.page_count)) && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Page Count</h3>
                          <p className="text-muted-foreground flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {book.page_count}
                          </p>
                        </div>
                      )}

                      {/* Only show pages if it's a valid number */}
                      {book.pages !== undefined && book.pages !== null && !isNaN(Number(book.pages)) && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Pages</h3>
                          <p className="text-muted-foreground flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {book.pages}
                          </p>
                        </div>
                      )}

                      {book.dimensions && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Dimensions</h3>
                          <p className="text-muted-foreground flex items-center">
                            <Ruler className="h-4 w-4 mr-2" />
                            {book.dimensions}
                          </p>
                        </div>
                      )}

                      {book.weight !== null && book.weight !== undefined && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Weight:</span>
                          <span className="font-medium">
                            {typeof book.weight === 'number' ? Number(book.weight).toFixed(2) : book.weight} kg
                          </span>
                        </div>
                      )}

                      {book.genre && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Genre</h3>
                          <p className="text-muted-foreground flex items-center">
                            <Tag className="h-4 w-4 mr-2" />
                            {book.genre}
                          </p>
                        </div>
                      )}

                      {book.language && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Language</h3>
                          <p className="text-muted-foreground flex items-center">
                            <Globe className="h-4 w-4 mr-2" />
                            {book.language}
                          </p>
                        </div>
                      )}

                      {book.average_rating !== undefined &&
                        book.average_rating !== null &&
                        !isNaN(Number(book.average_rating)) && (
                          <div className="book-detail-item">
                            <h3 className="font-medium">Average Rating</h3>
                            <p className="text-muted-foreground flex items-center">
                              <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                              {Number(book.average_rating).toFixed(1)} / 5
                            </p>
                          </div>
                        )}

                      {(formatType || book.format) && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Format</h3>
                          <p className="text-muted-foreground">{formatType?.name || book.format}</p>
                        </div>
                      )}

                      {book.edition && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Edition</h3>
                          <p className="text-muted-foreground">{book.edition}</p>
                        </div>
                      )}

                      {book.series && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Series</h3>
                          <p className="text-muted-foreground">{book.series}</p>
                        </div>
                      )}

                      {book.created_at && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Created At</h3>
                          <p className="text-muted-foreground">
                            {new Date(book.created_at).toLocaleDateString()}{" "}
                            {new Date(book.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      )}

                      {book.updated_at && (
                        <div className="book-detail-item">
                          <h3 className="font-medium">Updated At</h3>
                          <p className="text-muted-foreground">
                            {new Date(book.updated_at).toLocaleDateString()}{" "}
                            {new Date(book.updated_at).toLocaleTimeString()}
                          </p>
                        </div>
                      )}

                      {book.synopsis && (
                        <div className="book-detail-item col-span-full">
                          <h3 className="font-medium">Synopsis</h3>
                          <p className="text-muted-foreground">{book.synopsis}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Similar Books */}
                <Card className="similar-books-card">
                  <CardHeader>
                    <CardTitle>Similar Books</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Recommendations coming soon</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="reviews-card">
                  <CardHeader>
                    <CardTitle>Reviews</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add Review Form */}
                    <div className="review-form space-y-4">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt="User" />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input placeholder="Write a review..." />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="rating-selector flex items-center">
                          <span className="mr-2">Rate:</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-5 w-5 text-gray-300 cursor-pointer hover:text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <Button>Post Review</Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                      <div className="reviews-list space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="review-item space-y-2">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarImage src="/placeholder.svg" alt="User" />
                                <AvatarFallback>
                                  <User className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">User</h4>
                                    <div className="flex items-center">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                      {/* Only show date if created_at exists */}
                                      {review.created_at && (
                                        <span className="ml-2 text-sm text-muted-foreground">
                                          {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <p className="mt-2">{review.content}</p>
                                <div className="review-actions flex items-center gap-4 mt-2">
                                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>Like</span>
                                  </Button>
                                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>Reply</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-reviews text-center py-6">
                        <p className="text-muted-foreground">No reviews yet. Be the first to review this book!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  } catch (error) {
    console.error("Error in BookPage:", error)
    return <div>Error loading book details.</div> // Or a more user-friendly error message
  }
}
