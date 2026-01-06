import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  groupId: string
}

export default function ScheduleEventModal({ isOpen, onClose, groupId }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null)
  const [eventDetails, setEventDetails] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    format: 'virtual',
    virtual_meeting_url: '',
  })
  const supabase = createClient()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    const { data, error } = await supabase
      .from('authors')
      .select('id, name, bio, author_image_id')
      .ilike('name', `%${searchQuery}%`)
      .limit(10)

    if (error) {
      toast.error('Failed to search authors')
      return
    }

    setSearchResults(data || [])
    setIsSearching(false)
  }

  const handleScheduleEvent = async () => {
    if (
      !selectedAuthor ||
      !eventDetails.title ||
      !eventDetails.start_date ||
      !eventDetails.end_date
    ) {
      toast.error('Please fill in all required fields')
      return
    }

    // First create the event
    const { data: event, error: eventError } = await (supabase.from('events') as any)
      .insert([
        {
          ...eventDetails,
          status: 'upcoming',
          group_id: groupId,
        },
      ])
      .select()
      .single()

    if (eventError) {
      toast.error('Failed to create event')
      return
    }

    // Then create the author event association
    const { error: authorEventError } = await (supabase.from('group_author_events') as any).insert([
      {
        group_id: groupId,
        author_id: selectedAuthor.id,
        event_id: event.id,
        scheduled_at: eventDetails.start_date,
      },
    ])

    if (authorEventError) {
      toast.error('Failed to schedule author event')
      return
    }

    toast.success('Author event scheduled successfully')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Schedule Author Event</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Author Search */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Author</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for an author..."
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
              {searchResults.map((author) => (
                <div
                  key={author.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedAuthor?.id === author.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedAuthor(author)}
                >
                  <h4 className="font-semibold">{author.name}</h4>
                  <p className="text-sm text-gray-600">{author.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Event Details</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={eventDetails.title}
                onChange={(e) => setEventDetails((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Event Title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={eventDetails.description}
                onChange={(e) =>
                  setEventDetails((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Event Description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={eventDetails.start_date}
                    onChange={(e) =>
                      setEventDetails((prev) => ({ ...prev, start_date: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={eventDetails.end_date}
                    onChange={(e) =>
                      setEventDetails((prev) => ({ ...prev, end_date: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={eventDetails.format}
                onChange={(e) => setEventDetails((prev) => ({ ...prev, format: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="virtual">Virtual</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {eventDetails.format === 'virtual' && (
                <input
                  type="url"
                  value={eventDetails.virtual_meeting_url}
                  onChange={(e) =>
                    setEventDetails((prev) => ({ ...prev, virtual_meeting_url: e.target.value }))
                  }
                  placeholder="Virtual Meeting URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
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
              onClick={handleScheduleEvent}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
