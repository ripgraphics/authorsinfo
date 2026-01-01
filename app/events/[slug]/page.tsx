import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  GlobeAltIcon,
  TicketIcon,
  BookOpenIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { getEventById } from '@/lib/events'
import EventRegistrationButton from './registration-button'
import { ClientEventPage } from './client'

export const revalidate = 1800 // Revalidate every 30 minutes

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventById(slug)

  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }

  return {
    title: `${event.title} - Event`,
    description:
      event.summary || event.description?.substring(0, 160) || 'Join this literary event',
    openGraph: (event as any).cover_image?.url
      ? {
          images: [{ url: (event as any).cover_image.url }],
        }
      : undefined,
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const eventData = await getEventById(slug)

  if (!eventData) {
    notFound()
  }

  // Set default image
  const coverImageUrl =
    (eventData as any).cover_image?.url || (eventData as any).event_image?.url || '/images/event-placeholder.jpg'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ClientEventPage
        event={eventData}
        coverImageUrl={coverImageUrl}
        params={{ slug }}
        followers={(eventData as any).followers || []}
        followersCount={(eventData as any).followers?.length || 0}
        speakers={(eventData as any).speakers || []}
        sessions={(eventData as any).sessions || []}
        books={(eventData as any).books || []}
      />
    </div>
  )
}
