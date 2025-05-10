import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
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
  XCircleIcon
} from '@heroicons/react/24/outline';
import { getEventById } from '@/lib/events';
import EventRegistrationButton from './registration-button';

export const revalidate = 1800; // Revalidate every 30 minutes

// Generate metadata for the page
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const event = await getEventById(params.slug);
  
  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }
  
  return {
    title: `${event.title} - Event`,
    description: event.summary || event.description?.substring(0, 160) || 'Join this literary event',
    openGraph: event.cover_image?.url ? {
      images: [{ url: event.cover_image.url }],
    } : undefined,
  };
}

export default async function EventPage({
  params
}: {
  params: { slug: string }
}) {
  const eventData = await getEventById(params.slug);
  
  if (!eventData) {
    notFound();
  }
  
  // Format dates
  const formattedStartDate = format(new Date(eventData.start_date), 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(new Date(eventData.start_date), 'h:mm a');
  const formattedEndTime = format(new Date(eventData.end_date), 'h:mm a');
  
  // Set default image
  const coverImageUrl = eventData.cover_image?.url || eventData.event_image?.url || '/images/event-placeholder.jpg';
  
  // Format price display
  const priceDisplay = eventData.is_free 
    ? 'Free' 
    : eventData.price 
      ? `${eventData.currency || '$'}${eventData.price}` 
      : 'Paid Event';
  
  // Determine if registration is open
  const now = new Date();
  const registrationOpens = eventData.registration_opens_at ? new Date(eventData.registration_opens_at) : null;
  const registrationCloses = eventData.registration_closes_at ? new Date(eventData.registration_closes_at) : null;
  
  const registrationNotYetOpen = registrationOpens && now < registrationOpens;
  const registrationClosed = registrationCloses && now > registrationCloses;
  const registrationActive = eventData.requires_registration && 
    !registrationNotYetOpen && 
    !registrationClosed &&
    eventData.status === 'published';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Event header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={coverImageUrl}
            alt={eventData.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
            <div className="p-6 text-white">
              <div className="flex items-center space-x-2 mb-2">
                {eventData.category && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    {eventData.category.name}
                  </span>
                )}
                <span className={`px-2 py-1 text-white text-xs rounded ${
                  eventData.format === 'virtual' ? 'bg-blue-600' : 
                  eventData.format === 'physical' ? 'bg-green-600' : 'bg-purple-600'
                }`}>
                  {eventData.format.charAt(0).toUpperCase() + eventData.format.slice(1)}
                </span>
                {eventData.featured && (
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{eventData.title}</h1>
              {eventData.subtitle && (
                <p className="mt-2 text-lg text-white">{eventData.subtitle}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Event details */}
        <div className="p-6">
          {/* Event metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1 text-base">{formattedStartDate}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ClockIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Time</h3>
                <p className="mt-1 text-base">{formattedStartTime} - {formattedEndTime}</p>
                {eventData.timezone && (
                  <p className="text-sm text-gray-500">{eventData.timezone}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              {eventData.format === 'virtual' ? (
                <GlobeAltIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              ) : (
                <MapPinIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {eventData.format === 'virtual' ? 'Virtual Platform' : 'Location'}
                </h3>
                {eventData.format === 'virtual' ? (
                  <p className="mt-1 text-base">{eventData.virtual_platform || 'Online'}</p>
                ) : eventData.location ? (
                  <div>
                    <p className="mt-1 text-base">{eventData.location.name}</p>
                    {eventData.location.city && eventData.location.state && (
                      <p className="text-sm text-gray-500">
                        {eventData.location.city}, {eventData.location.state}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-base">TBA</p>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <TicketIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Price</h3>
                <p className="mt-1 text-base font-medium">
                  {priceDisplay}
                </p>
                {eventData.requires_registration && (
                  <p className="text-sm text-gray-500">Registration required</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Registration/RSVP button */}
          {eventData.requires_registration && (
            <div className="my-6 border-t border-b border-gray-200 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Event Registration</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {registrationNotYetOpen 
                      ? `Registration opens on ${format(new Date(eventData.registration_opens_at!), 'MMMM d, yyyy')}` 
                      : registrationClosed 
                      ? 'Registration is closed' 
                      : 'Register to secure your spot'}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <EventRegistrationButton 
                    eventId={eventData.id} 
                    isActive={registrationActive}
                    status={
                      registrationNotYetOpen 
                        ? 'not-open' 
                        : registrationClosed 
                        ? 'closed' 
                        : 'open'
                    }
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Event description */}
          <div className="prose prose-blue max-w-none">
            {eventData.description ? (
              <div dangerouslySetInnerHTML={{ __html: eventData.description }} />
            ) : eventData.summary ? (
              <p>{eventData.summary}</p>
            ) : (
              <p>No description available for this event.</p>
            )}
          </div>
          
          {/* Related books */}
          {eventData.books && eventData.books.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Featured Books
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {eventData.books.map((book) => (
                  <Link href={`/books/${book.id}`} key={book.id} className="group">
                    <div className="bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md">
                      <div className="flex items-center space-x-3">
                        {book.cover_image_url && (
                          <div className="flex-shrink-0 w-16">
                            <Image
                              src={book.cover_image_url}
                              alt={book.title}
                              width={64}
                              height={96}
                              className="object-cover rounded-sm"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium group-hover:text-blue-600 line-clamp-2">{book.title}</h3>
                          {book.author_name && (
                            <p className="text-xs text-gray-600 mt-1">by {book.author_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Speakers section */}
          {eventData.speakers && eventData.speakers.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                {eventData.speakers.length === 1 ? 'Speaker' : 'Speakers'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eventData.speakers.map((speaker) => (
                  <div key={speaker.id} className="flex items-start space-x-4">
                    {speaker.headshot_url ? (
                      <div className="flex-shrink-0">
                        <Image
                          src={speaker.headshot_url}
                          alt={speaker.name}
                          width={80}
                          height={80}
                          className="rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium">{speaker.name}</h3>
                      {speaker.presentation_title && (
                        <p className="text-blue-600 font-medium mt-1">{speaker.presentation_title}</p>
                      )}
                      {speaker.bio && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-3">{speaker.bio}</p>
                      )}
                      {speaker.author && (
                        <Link 
                          href={`/authors/${speaker.author.id}`} 
                          className="text-sm mt-2 text-blue-600 hover:underline inline-flex items-center"
                        >
                          View author profile
                          <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Sessions section */}
          {eventData.sessions && eventData.sessions.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Event Schedule
              </h2>
              <div className="space-y-4">
                {eventData.sessions.map((session) => (
                  <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{session.title}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <ClockIcon className="h-4 w-4 mr-1.5" />
                          <span>
                            {format(new Date(session.start_time), 'h:mm a')} - {format(new Date(session.end_time), 'h:mm a')}
                          </span>
                        </div>
                        {session.location && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPinIcon className="h-4 w-4 mr-1.5" />
                            <span>{session.location.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {session.requires_separate_registration && (
                        <div className="mt-4 md:mt-0">
                          <button
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Register for Session
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {session.description && (
                      <p className="text-gray-600 text-sm mt-2">{session.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Event status */}
          <div className="mt-8 p-4 rounded-lg flex items-center space-x-3 bg-gray-50">
            <div>
              {eventData.status === 'published' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : eventData.status === 'cancelled' ? (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              ) : (
                <CalendarIcon className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {eventData.status === 'published' 
                  ? 'This event is confirmed' 
                  : eventData.status === 'cancelled' 
                  ? 'This event has been cancelled' 
                  : eventData.status === 'postponed'
                  ? 'This event has been postponed'
                  : 'This event is scheduled'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 