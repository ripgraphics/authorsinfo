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
  const typedEvent = event as any
  const formattedStartDate = typedEvent.start_date
    ? format(new Date(typedEvent.start_date), 'MMM d, yyyy')
    : 'TBD'
  const formattedStartTime = typedEvent.start_date ? format(new Date(typedEvent.start_date), 'h:mm a') : ''

  // Format for showing the event date range
  let dateDisplay = formattedStartDate
  if (typedEvent.end_date && typedEvent.start_date !== typedEvent.end_date) {
    const formattedEndDate = format(new Date(typedEvent.end_date), 'MMM d, yyyy')
    dateDisplay = `${formattedStartDate} - ${formattedEndDate}`
  }

  // Default image if none provided
  const imageUrl =
    typedEvent.cover_image?.url || typedEvent.event_image?.url || '/images/event-placeholder.jpg'

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <Link href={`/events/${typedEvent.slug || event.id}`}>
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={typedEvent.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {typedEvent.featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-sm">
              Featured
            </div>
          )}
          {typedEvent.format && (
            <div
              className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded-sm text-white ${
                typedEvent.format === 'virtual'
                  ? 'bg-blue-600'
                  : typedEvent.format === 'physical'
                    ? 'bg-green-600'
                    : 'bg-purple-600'
              }`}
            >
              {typedEvent.format.charAt(0).toUpperCase() + typedEvent.format.slice(1)}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/events/${typedEvent.slug || event.id}`}>
          <h3 className="text-xl font-semibold line-clamp-2 hover:underline">{typedEvent.title}</h3>
        </Link>

        {!isCompact && typedEvent.summary && (
          <p className="text-gray-600 mt-2 line-clamp-2 text-sm">{typedEvent.summary}</p>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-1.5" />
            <span>{dateDisplay}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-1.5" />
            <span>{formattedStartTime}</span>
            {typedEvent.end_date && typedEvent.start_date !== typedEvent.end_date && (
              <span> - {format(new Date(typedEvent.end_date), 'h:mm a')}</span>
            )}
          </div>

          {typedEvent.location?.name && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-1.5" />
              <span className="line-clamp-1">{typedEvent.location.name}</span>
            </div>
          )}

          {typedEvent.max_attendees > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <UsersIcon className="h-4 w-4 mr-1.5" />
              <span>Limited to {typedEvent.max_attendees} attendees</span>
            </div>
          )}
        </div>

        {!isCompact && (
          <div className="mt-4 flex justify-between items-center">
            {typedEvent.is_free ? (
              <span className="text-green-600 font-medium">Free Event</span>
            ) : (
              <span className="text-blue-600 font-medium">
                {typedEvent.price ? `${typedEvent.currency || '$'}${typedEvent.price}` : 'Paid Event'}
              </span>
            )}

            <Link
              href={`/events/${typedEvent.slug || event.id}`}
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
