'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'
import ScheduleEventModal from './ScheduleEventModal'

interface Author {
  id: string
  name: string
  bio: string
  author_image_id: string
}

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  format: string
  status: string
  virtual_meeting_url: string | null
  cover_image_id: string | null
}

interface AuthorEvent {
  id: string
  group_id: string
  author_id: string
  event_id: string
  scheduled_at: string
  events: Event
  authors: Author
}

interface Props {
  initialAuthorEvents: AuthorEvent[]
  groupId: string
}

export default function AuthorEventsClient({ initialAuthorEvents, groupId }: Props) {
  const [authorEvents, setAuthorEvents] = useState<AuthorEvent[]>(initialAuthorEvents)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const supabase = supabaseClient

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('author_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_author_events',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAuthorEvents((prev) => [...prev, payload.new as AuthorEvent])
            toast.success('New author event scheduled!')
          } else if (payload.eventType === 'DELETE') {
            setAuthorEvents((prev) => prev.filter((event) => event.id !== payload.old.id))
            toast.success('Author event removed')
          } else if (payload.eventType === 'UPDATE') {
            setAuthorEvents((prev) =>
              prev.map((event) =>
                event.id === payload.new.id ? (payload.new as AuthorEvent) : event
              )
            )
            toast.success('Author event updated')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('group_author_events').delete().eq('id', eventId)

    if (error) {
      toast.error('Failed to delete event')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {authorEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{event.events.title}</h3>
                <p className="text-gray-600">with {event.authors.name}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  event.events.status === 'upcoming'
                    ? 'bg-green-100 text-green-800'
                    : event.events.status === 'ongoing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {event.events.status.charAt(0).toUpperCase() + event.events.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">{formatDate(event.events.start_date)}</p>
              <p className="text-sm text-gray-600">Format: {event.events.format}</p>
              {event.events.virtual_meeting_url && (
                <p className="text-sm text-blue-600">
                  <a
                    href={event.events.virtual_meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Virtual Meeting
                  </a>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Event
              </button>
            </div>
          </div>
        ))}
      </div>

      <ScheduleEventModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        groupId={groupId}
      />
    </div>
  )
}
