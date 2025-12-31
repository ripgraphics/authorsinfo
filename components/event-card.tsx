import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import type { Event } from '@/types/database'

type EventCardProps = {
  event: Event
  className?: string
  isCompact?: boolean
}

export default function EventCard({ event, className = '', isCompact = false }: EventCardProps) {
  const formattedStartDate = event.start_date
    ? format(new Date(event.start_date), 'MMM d, yyyy')
    : 'TBD'
  const formattedStartTime = event.start_date ? format(new Date(event.start_date), 'h:mm a') : ''

  // Format for showing the event date range
  let dateDisplay = formattedStartDate
  if (event.end_date && event.start_date !== event.end_date) {
    const formattedEndDate = format(new Date(event.end_date), 'MMM d, yyyy')
    dateDisplay = `${formattedStartDate} - ${formattedEndDate}`
  }

  // Default image if none provided
  const imageUrl =
    event.cover_image?.url || event.event_image?.url || '/images/event-placeholder.jpg'

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <Link href={`/events/${event.slug || event.id}`}>
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {event.featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-sm">
              Featured
            </div>
          )}
          {event.format && (
            <div
              className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded-sm text-white ${
                event.format === 'virtual'
                  ? 'bg-blue-600'
                  : event.format === 'physical'
                    ? 'bg-green-600'
                    : 'bg-purple-600'
              }`}
            >
              {event.format.charAt(0).toUpperCase() + event.format.slice(1)}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/events/${event.slug || event.id}`}>
          <h3 className="text-xl font-semibold line-clamp-2 hover:underline">{event.title}</h3>
        </Link>

        {!isCompact && event.summary && (
          <p className="text-gray-600 mt-2 line-clamp-2 text-sm">{event.summary}</p>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-1.5" />
            <span>{dateDisplay}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-1.5" />
            <span>{formattedStartTime}</span>
            {event.end_date && event.start_date !== event.end_date && (
              <span> - {format(new Date(event.end_date), 'h:mm a')}</span>
            )}
          </div>

          {event.location?.name && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-1.5" />
              <span className="line-clamp-1">{event.location.name}</span>
            </div>
          )}

          {event.max_attendees > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <UsersIcon className="h-4 w-4 mr-1.5" />
              <span>Limited to {event.max_attendees} attendees</span>
            </div>
          )}
        </div>

        {!isCompact && (
          <div className="mt-4 flex justify-between items-center">
            {event.is_free ? (
              <span className="text-green-600 font-medium">Free Event</span>
            ) : (
              <span className="text-blue-600 font-medium">
                {event.price ? `${event.currency || '$'}${event.price}` : 'Paid Event'}
              </span>
            )}

            <Link
              href={`/events/${event.slug || event.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Details →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
