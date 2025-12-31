import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  groupId: string
  userId: string // User ID passed from parent (no hardcoded values)
}

export default function StartDiscussionModal({ isOpen, onClose, groupId, userId }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [discussionDetails, setDiscussionDetails] = useState({
    title: '',
    description: '',
  })
  const supabase = createClient()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_image_id, average_rating, review_count')
      .ilike('title', `%${searchQuery}%`)
      .limit(10)

    if (error) {
      toast.error('Failed to search books')
      return
    }

    setSearchResults(data || [])
    setIsSearching(false)
  }

  const handleStartDiscussion = async () => {
    if (!selectedBook || !discussionDetails.title) {
      toast.error('Please fill in all required fields')
      return
    }

    const { error } = await (supabase.from('book_discussions') as any).insert([
      {
        group_id: groupId,
        book_id: selectedBook.id,
        title: discussionDetails.title,
        description: discussionDetails.description,
        created_by: userId,
        status: 'active',
        is_pinned: false,
      },
    ])

    if (error) {
      toast.error('Failed to start discussion')
      return
    }

    toast.success('Discussion started successfully')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Start a Book Discussion</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Book Search */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Book</h3>
            <div className="flex gap-2 mb-4">
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

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedBook?.id === book.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="flex items-center gap-3">
                    {book.cover_image_id && (
                      <img
                        src={`/api/images/${book.cover_image_id}`}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded-sm"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold">{book.title}</h4>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discussion Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Discussion Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={discussionDetails.title}
                  onChange={(e) =>
                    setDiscussionDetails((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter discussion title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={discussionDetails.description}
                  onChange={(e) =>
                    setDiscussionDetails((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter discussion description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartDiscussion}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Discussion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
