import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  groupId: string
}

export default function OfferBookModal({ isOpen, onClose, groupId }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const supabase = createClient()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_image_id')
      .ilike('title', `%${searchQuery}%`)
      .limit(10)

    if (error) {
      toast.error('Failed to search books')
      return
    }

    setSearchResults(data || [])
    setIsSearching(false)
  }

  const handleOfferBook = async (bookId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be signed in to offer a book')
      return
    }

    const { error } = await (supabase.from('group_book_swaps') as any).insert([
      {
        book_id: bookId,
        group_id: groupId,
        offered_by: user.id,
        status: 'available',
      },
    ])

    if (error) {
      toast.error('Failed to offer book')
      return
    }

    toast.success('Book offered successfully')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Offer a Book for Swap</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a book..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {searchResults.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-gray-600">{book.author}</p>
              </div>
              <button
                onClick={() => handleOfferBook(book.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Offer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
