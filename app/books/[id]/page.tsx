import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getBookById, getAuthorsByBookId, getPublisherById, getReviewsByBookId, getBooksByPublisherId, getBooksByAuthorId } from "@/app/actions/data"
import { supabaseAdmin } from "@/lib/supabase"
import type { Book, Author, Review, BindingType, FormatType } from '@/types/book'
import { PageBanner } from "@/components/page-banner"
import { ClientBookPage } from "./client"
import { getFollowers, getFollowersCount } from "@/lib/follows-server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface BookPageProps {
  params: {
    id: string
  }
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

export default async function BookPageServer({ params }: { params: { id: string } }) {
  const id = await params.id
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

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

    // Fetch followers for this book
    let followers: any[] = []
    let followersCount = 0
    try {
      const followersData = await getFollowers(id, 'book')
      followers = followersData.followers
      followersCount = followersData.count
    } catch (error) {
      console.error("Error fetching book followers:", error)
      // Continue with empty followers array
    }

    return (
      <>
        {/* Full width banner outside container constraints */}
        <div className="w-full">
          <PageBanner />
        </div>

        <ClientBookPage
          book={book}
          authors={authors}
          publisher={publisher}
          publisherBooksCount={publisherBooksCount}
          authorBookCounts={authorBookCounts}
          reviews={reviews}
          bindingType={bindingType}
          formatType={formatType}
          readingProgress={readingProgress}
          followers={followers}
          followersCount={followersCount}
          params={{ id }}
        />
      </>
    )
  } catch (error) {
    console.error("Error in BookPage:", error)
    return <div>Error loading book details.</div> // Or a more user-friendly error message
  }
}