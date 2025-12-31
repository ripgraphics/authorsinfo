'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'
import OfferBookModal from './OfferBookModal'

interface Book {
  id: string
  title: string
  author: string
  cover_image_id: string
}

interface BookSwap {
  id: string
  book_id: string
  group_id: string
  offered_by: string
  accepted_by: string | null
  status: 'available' | 'accepted' | 'completed' | 'cancelled'
  created_at: string
  accepted_at: string | null
  books: Book
  offered_by_user: { name: string }
  accepted_by_user: { name: string } | null
}

interface Props {
  initialBookSwaps: BookSwap[]
  groupId: string
}

export default function BookSwapsClient({ initialBookSwaps, groupId }: Props) {
  const [bookSwaps, setBookSwaps] = useState<BookSwap[]>(initialBookSwaps)
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const supabase = supabaseClient

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('book_swaps_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_book_swaps',
          filter: `group_id=eq.${groupId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setBookSwaps((prev) => [payload.new as BookSwap, ...prev])
            toast.success('New book swap offer available!')
          } else if (payload.eventType === 'DELETE') {
            setBookSwaps((prev) => prev.filter((swap) => swap.id !== payload.old.id))
            toast.success('Book swap offer removed')
          } else if (payload.eventType === 'UPDATE') {
            setBookSwaps((prev) =>
              prev.map((swap) => (swap.id === payload.new.id ? (payload.new as BookSwap) : swap))
            )
            toast.success('Book swap status updated')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const handleAcceptSwap = async (swapId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be signed in to accept a swap')
      return
    }

    const { error } = await (supabase.from('group_book_swaps') as any)
      .update({
        status: 'accepted',
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', swapId)

    if (error) {
      toast.error('Failed to accept swap')
    }
  }

  const handleCompleteSwap = async (swapId: string) => {
    const { error } = await (supabase.from('group_book_swaps') as any)
      .update({ status: 'completed' })
      .eq('id', swapId)

    if (error) {
      toast.error('Failed to complete swap')
    }
  }

  const handleCancelSwap = async (swapId: string) => {
    const { error } = await (supabase.from('group_book_swaps') as any)
      .update({ status: 'cancelled' })
      .eq('id', swapId)

    if (error) {
      toast.error('Failed to cancel swap')
    }
  }

  const handleDeleteSwap = async (swapId: string) => {
    const { error } = await supabase.from('group_book_swaps').delete().eq('id', swapId)

    if (error) {
      toast.error('Failed to delete swap')
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookSwaps.map((swap) => (
          <div key={swap.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{swap.books.title}</h3>
                <p className="text-gray-600">{swap.books.author}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  swap.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : swap.status === 'accepted'
                      ? 'bg-blue-100 text-blue-800'
                      : swap.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                }`}
              >
                {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">Offered by: {swap.offered_by_user.name}</p>
              {swap.accepted_by_user && (
                <p className="text-sm text-gray-600">Accepted by: {swap.accepted_by_user.name}</p>
              )}
              <p className="text-sm text-gray-600">
                Offered on: {new Date(swap.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              {swap.status === 'available' && (
                <button
                  onClick={() => handleAcceptSwap(swap.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Accept Swap
                </button>
              )}
              {swap.status === 'accepted' && (
                <button
                  onClick={() => handleCompleteSwap(swap.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Swap
                </button>
              )}
              {swap.status === 'available' && (
                <button
                  onClick={() => handleCancelSwap(swap.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              )}
              {swap.status === 'available' && (
                <button
                  onClick={() => handleDeleteSwap(swap.id)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <OfferBookModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        groupId={groupId}
      />
    </div>
  )
}
