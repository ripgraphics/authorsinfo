import { createClient } from '@/lib/supabase-server'
import BookDiscussionsClient from './BookDiscussionsClient'

export default async function BookDiscussionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  // Fetch initial book discussions
  const { data: discussions } = await supabase
    .from('book_discussions')
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
      ),
      book_discussion_participants (
        user_id,
        role,
        last_read_at
      )
    `
    )
    .eq('group_id', id)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Book Discussions</h1>
        <button
          onClick={() => {
            /* Will be handled by client component */
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Discussion
        </button>
      </div>
      <BookDiscussionsClient initialDiscussions={discussions || []} groupId={id} />
    </div>
  )
}
