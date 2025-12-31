import { createClient } from '@/lib/supabase-server'
import BookReviewsClient from './BookReviewsClient'

export default async function BookReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  // Fetch initial book reviews
  const { data: bookReviews } = await supabase
    .from('group_book_reviews')
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_id,
        average_rating,
        review_count
      ),
      users (
        id,
        name
      )
    `
    )
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Book Reviews</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            /* Will be handled by client component */
          }}
        >
          Write Review
        </button>
      </div>

      <BookReviewsClient initialBookReviews={bookReviews || []} groupId={id} />
    </div>
  )
}
