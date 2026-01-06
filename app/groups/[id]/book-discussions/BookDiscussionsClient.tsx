'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'
import StartDiscussionModal from './StartDiscussionModal'

interface Book {
  id: number
  title: string
  author: string
  cover_image_id: string | null
  average_rating: number
  review_count: number
}

interface User {
  id: string
  name: string
}

interface BookDiscussion {
  id: string
  group_id: string
  book_id: string
  title: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
  is_pinned: boolean
  books: Book
  users: User
}

interface Props {
  initialDiscussions: BookDiscussion[]
  groupId: string
  userId?: string // User ID passed from parent (for reusable component design)
}

export default function BookDiscussionsClient({ initialDiscussions, groupId, userId }: Props) {
  const [discussions, setDiscussions] = useState<BookDiscussion[]>(initialDiscussions)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const supabase = supabaseClient

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('book_discussions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussions',
          filter: `group_id=eq.${groupId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setDiscussions((prev) => [payload.new as BookDiscussion, ...prev])
            toast.success('New discussion started!')
          } else if (payload.eventType === 'DELETE') {
            setDiscussions((prev) => prev.filter((discussion) => discussion.id !== payload.old.id))
            toast.success('Discussion removed')
          } else if (payload.eventType === 'UPDATE') {
            setDiscussions((prev) =>
              prev.map((discussion) =>
                discussion.id === payload.new.id ? (payload.new as BookDiscussion) : discussion
              )
            )
            toast.success('Discussion updated')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const handleDeleteDiscussion = async (discussionId: string) => {
    const { error } = await supabase.from('discussions').delete().eq('id', discussionId)

    if (error) {
      toast.error('Failed to delete discussion')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4">
        {discussions.map((discussion) => (
          <div
            key={discussion.id}
            className={`bg-white rounded-lg shadow-md p-4 border ${
              discussion.is_pinned ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                {discussion.books.cover_image_id && (
                  <img
                    src={`/api/images/${discussion.books.cover_image_id}`}
                    alt={discussion.books.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-xs"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{discussion.title}</h3>
                  <p className="text-gray-600">Book: {discussion.books.title}</p>
                  <p className="text-gray-600">by {discussion.books.author}</p>
                  {discussion.content && <p className="mt-2 text-gray-700">{discussion.content}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Started by {discussion.users.name}</p>
                <p className="text-sm text-gray-500">{formatDate(discussion.created_at)}</p>
                <p className="text-sm text-gray-500">
                  Last updated: {formatDate(discussion.updated_at || discussion.created_at)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Discussion</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    /* Navigate to discussion */
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Discussion
                </button>
                <button
                  onClick={() => handleDeleteDiscussion(discussion.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {userId && (
        <StartDiscussionModal
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
          groupId={groupId}
          userId={userId}
        />
      )}
    </div>
  )
}
