import { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { getPublicEvents, getEventCategories } from '@/lib/events';
import EventCard from '@/components/event-card';

export const metadata: Metadata = {
  title: 'Events | Book Platform',
  description: 'Discover and join book-related events, author meetups, and reading groups.',
};

export const revalidate = 3600; // Revalidate every hour

export default async function EventsPage({ searchParams: searchParamsPromise }: { searchParams?: any }) {
  const searchParams = await searchParamsPromise;
  const page = Number(searchParams?.page) || 1;
  const limit = 12;
  const category = searchParams?.category || '';
  const search = searchParams?.search || '';
  
  const eventsPromise = getPublicEvents(page, limit, search, category);
  const categoriesPromise = getEventCategories();
  
  const [{ data: events, count }, categories] = await Promise.all([
    eventsPromise,
    categoriesPromise,
  ]);
  
  const totalPages = Math.ceil((count || 0) / limit);
  
  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-2">Discover and join book-related events, author meetups, and reading groups.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filter sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/events" 
                  className={`text-sm ${!category ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}
                >
                  All Events
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link 
                    href={`/events?category=${cat.id}`}
                    className={`text-sm ${category === cat.id ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="border-t border-gray-200 my-4 pt-4">
              <h2 className="text-lg font-semibold mb-4">Search Events</h2>
              <form action="/events" method="get">
                {category && <input type="hidden" name="category" value={category} />}
                <div className="flex items-center">
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search events..."
                    className="px-3 py-2 border border-gray-300 rounded-l-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-2 rounded-r-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Events grid */}
        <div className="flex-1">
          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">
                {search || category 
                  ? 'Try adjusting your search or category filters.'
                  : 'There are no upcoming events at the moment.'}
              </p>
              {(search || category) && (
                <Link 
                  href="/events" 
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View All Events
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="inline-flex items-center justify-center space-x-2">
                    {page > 1 && (
                      <Link
                        href={`/events?page=${page - 1}${category ? `&category=${category}` : ''}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-l-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Previous
                      </Link>
                    )}
                    {page}
                    {page < totalPages && (
                      <Link
                        href={`/events?page=${page + 1}${category ? `&category=${category}` : ''}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-r-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}