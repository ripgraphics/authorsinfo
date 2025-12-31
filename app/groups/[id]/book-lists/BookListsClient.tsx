'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Reorder } from 'framer-motion'
import { toast } from 'react-hot-toast'
import AddBookModal from './AddBookModal'
import BookListAnalytics from './BookListAnalytics'

interface Book {
  id: string
  title: string
  author: string
  cover_image_id: string
}

interface BookListItem {
  id: string
  book_id: string
  books: Book
  votes: number
}

interface BookList {
  id: string
  title: string
  description: string
  created_by: string
  group_book_list_items: BookListItem[]
}

interface Props {
  initialBookLists: BookList[]
  groupId: string
}

export default function BookListsClient({ initialBookLists, groupId }: Props) {
  const [bookLists, setBookLists] = useState<BookList[]>(initialBookLists)
  const [isCreating, setIsCreating] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false)
  const supabase = createClient()

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('book_lists_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_book_lists',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookLists((prev) => [payload.new as BookList, ...prev])
            toast.success('New book list created!')
          } else if (payload.eventType === 'DELETE') {
            setBookLists((prev) => prev.filter((list) => list.id !== payload.old.id))
            toast.success('Book list deleted')
          } else if (payload.eventType === 'UPDATE') {
            setBookLists((prev) =>
              prev.map((list) => (list.id === payload.new.id ? (payload.new as BookList) : list))
            )
            toast.success('Book list updated')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return

    const { error } = await (supabase.from('group_book_lists') as any).insert([
      {
        title: newListTitle,
        group_id: groupId,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ])

    if (error) {
      toast.error('Failed to create list')
    } else {
      setNewListTitle('')
      setIsCreating(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    const { error } = await supabase.from('group_book_lists').delete().eq('id', listId)

    if (error) {
      toast.error('Failed to delete list')
    }
  }

  const handleVote = async (listId: string, bookId: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      toast.error('Please sign in to vote')
      return
    }

    const { error } = await (supabase.from('group_book_list_votes') as any).upsert({
      list_id: listId,
      book_id: bookId,
      user_id: userId,
      group_id: groupId,
    })

    if (error) {
      toast.error('Failed to vote')
    } else {
      toast.success('Vote recorded!')
    }
  }

  const handleReorder = async (reorderedLists: BookList[]) => {
    setBookLists(reorderedLists)
    // Here you could implement server-side reordering if needed
  }

  return (
    <div className="space-y-8">
      {isCreating ? (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="Enter list title"
            className="w-full p-2 border rounded-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateList}
              className="bg-blue-600 text-white px-4 py-2 rounded-sm hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="bg-gray-200 px-4 py-2 rounded-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-sm hover:bg-blue-700"
        >
          Create New List
        </button>
      )}

      <Reorder.Group axis="y" values={bookLists} onReorder={handleReorder}>
        {bookLists.map((list) => (
          <Reorder.Item
            key={list.id}
            value={list}
            className="bg-white p-6 rounded-lg shadow-sm mb-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{list.title}</h2>
                <p className="text-gray-600">{list.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedListId(list.id)
                    setIsAddBookModalOpen(true)
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded-sm hover:bg-green-700"
                >
                  Add Book
                </button>
                <button
                  onClick={() => handleDeleteList(list.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {list.group_book_list_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-sm"
                  >
                    <div className="flex items-center gap-4">
                      {item.books.cover_image_id && (
                        <img
                          src={`/api/books/cover/${item.books.cover_image_id}`}
                          alt={item.books.title}
                          className="w-12 h-16 object-cover rounded-sm"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{item.books.title}</h3>
                        <p className="text-sm text-gray-600">{item.books.author}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVote(list.id, item.book_id)}
                      className="flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-sm hover:bg-blue-200"
                    >
                      <span>↑</span>
                      <span>{item.votes || 0}</span>
                    </button>
                  </div>
                ))}
              </div>

              <BookListAnalytics listId={list.id} groupId={groupId} />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {isAddBookModalOpen && selectedListId && (
        <AddBookModal
          listId={selectedListId}
          groupId={groupId}
          onClose={() => {
            setIsAddBookModalOpen(false)
            setSelectedListId(null)
          }}
          onBookAdded={() => {
            // Refresh the list data
            const fetchList = async () => {
              const { data } = await supabase
                .from('group_book_lists')
                .select(
                  `
                  *,
                  group_book_list_items (
                    *,
                    books (
                      id,
                      title,
                      author,
                      cover_image_id
                    )
                  )
                `
                )
                .eq('id', selectedListId)
                .single()

              if (data) {
                setBookLists((prev) =>
                  prev.map((list) => (list.id === selectedListId ? data : list))
                )
              }
            }
            fetchList()
          }}
        />
      )}
    </div>
  )
}
