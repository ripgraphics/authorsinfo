import { createClient } from '@/lib/supabase-server'
import BookSwapsClient from './BookSwapsClient'

export default async function BookSwapsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  // Fetch initial book swaps
  const { data: bookSwaps } = await supabase
    .from('group_book_swaps')
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_id
      ),
      offered_by:users!offered_by(name),
      accepted_by:users!accepted_by(name)
    `
    )
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Book Swaps</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            /* Will be handled by client component */
          }}
        >
          Offer a Book
        </button>
      </div>

      <BookSwapsClient initialBookSwaps={bookSwaps || []} groupId={id} />
    </div>
  )
}
