import Link from 'next/link'
import { CalendarDaysIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { getFeaturedEvents } from '@/lib/events'
import EventCard from './event-card'
import { cn } from '@/lib/utils'

export default async function FeaturedEvents() {
  const events = await getFeaturedEvents(3)

  if (!events || events.length === 0) {
    return null
  }

  return (
    <section className={cn('featured-events', 'py-12 bg-gray-50')}>
      <div className={cn('featured-events__container', 'container mx-auto px-4 max-w-6xl')}>
        <div
          className={cn(
            'featured-events__header',
            'flex flex-col md:flex-row md:items-center justify-between mb-8'
          )}
        >
          <div className={cn('featured-events__title-wrapper', 'flex items-center')}>
            <CalendarDaysIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className={cn('featured-events__title', 'text-2xl font-bold text-gray-900')}>
              Upcoming Events
            </h2>
          </div>
          <Link
            href="/events"
            className={cn(
              'featured-events__view-all-link',
              'text-blue-600 hover:text-blue-800 font-medium flex items-center mt-2 md:mt-0'
            )}
          >
            View all events
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div
          className={cn(
            'featured-events__grid',
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          )}
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {events.length === 0 && (
          <div className={cn('featured-events__empty-state', 'text-center py-12')}>
            <p className={cn('featured-events__empty-message', 'text-gray-600')}>
              No upcoming events at the moment.
            </p>
            <Link
              href="/events/create"
              className={cn(
                'featured-events__create-link',
                'mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
              )}
            >
              Create an Event
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
