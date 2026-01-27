import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import EntityAvatar from '@/components/entity-avatar'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { db } from '@/lib/db'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { InteractiveControls } from './components/InteractiveControls'
import { PublishersListWrapper } from './components/PublishersListWrapper'

interface Publisher {
  id: number
  name: string
  country_id: number | null
  country_details?: {
    id: number
    name: string
    code: string
  }
  founded_year?: number
  logo_url?: string
  publisher_image?: {
    url: string
  }
}

interface Country {
  id: number
  name: string
  code: string
}

interface QueryResponse<T> {
  data: T[]
  count: number | null
}

interface PublishersPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    location?: string
    sort?: string
  }>
}

// Function to detect the location field in the publishers table
async function detectLocationField() {
  try {
    // Get a sample publisher to examine its structure
    const publishers = await db.query<Publisher>(
      'publishers',
      {},
      {
        ttl: 3600, // Cache for 1 hour
        cacheKey: 'sample_publisher',
        limit: 1,
        select:
          '*, publisher_image:publisher_image_id(id, url, alt_text), country_details:country_id(id, name, code)',
      }
    )

    if (!Array.isArray(publishers) || publishers.length === 0) {
      console.error('No sample publisher found')
      return null
    }

    // Check if country_id exists in the publisher object
    if ('country_id' in publishers[0] && publishers[0].country_id !== null) {
      console.log('Detected location field: country_id')
      return 'country_id'
    }

    console.log('No location field found in publishers table')
    return null
  } catch (error) {
    console.error('Error detecting location field:', error)
    return null
  }
}

async function getUniqueLocations() {
  try {
    // Detect the location field
    const locationField = await detectLocationField()

    if (!locationField) {
      console.log('No location field found in publishers table')
      return []
    }

    // Use the detected field to fetch unique locations with country details
    const publishers = await db.query<Publisher>(
      'publishers',
      { [locationField]: { not: 'is', value: null } },
      {
        ttl: 3600, // Cache for 1 hour
        cacheKey: `unique_locations_${locationField}`,
        orderBy: { [locationField]: 'asc' },
        select:
          '*, publisher_image:publisher_image_id(id, url, alt_text), country_details:country_id(id, name, code)',
      }
    )

    if (!Array.isArray(publishers)) {
      return []
    }

    // Extract unique locations with country details
    const uniqueLocations = Array.from(
      new Set(
        publishers
          .map((item) => item.country_details)
          .filter((country): country is Country => country !== null)
          .map((country) => country.id.toString())
      )
    )

    return uniqueLocations
  } catch (error) {
    console.error('Error fetching locations:', error)
    return []
  }
}

async function PublishersList({
  page,
  search,
  location,
  sort,
}: {
  page: number
  search?: string
  location?: string
  sort?: string
}) {
  const pageSize = 24

  // Build the query - apply location filter server-side if provided
  const query = {
    ...(location && location !== 'all' && { country_id: location }),
  }

  // Fetch all publishers (or large subset) for client-side filtering
  const publishers = await db.query<Publisher>('publishers', query, {
    ttl: 300, // Cache for 5 minutes
    cacheKey: `publishers_all:${JSON.stringify({ location })}`,
    limit: 1000, // Fetch up to 1000 publishers for client-side filtering
    select:
      '*, publisher_image:publisher_image_id(id, url, alt_text), country_details:country_id(id, name, code)',
  })

  if (!Array.isArray(publishers)) {
    return {
      publishers: [],
      totalCount: 0,
      pageSize: 24,
    }
  }

  // Get total count for initial pagination calculation
  const countResponse = await db.query<Publisher>('publishers', query, {
    ttl: 300, // Cache for 5 minutes
    cacheKey: `publishers_count:${JSON.stringify({ location })}`,
    count: true,
  })

  const totalCount = ('count' in countResponse && countResponse.count) || 0

  // Return publishers data to be passed to client component for instant filtering
  return {
    publishers,
    totalCount,
    pageSize: 24,
  }
}

async function PublishersListContent({
  page,
  search,
  location,
  sort,
}: {
  page: number
  search?: string
  location?: string
  sort?: string
}) {
  const { publishers, totalCount, pageSize } = await PublishersList({
    page,
    search,
    location,
    sort,
  })

  return (
    <PublishersListWrapper
      initialPublishers={publishers}
      initialTotalCount={totalCount}
      page={page}
      pageSize={pageSize}
      location={location}
      sort={sort}
      initialSearch={search}
    />
  )
}

export default async function PublishersPage({ searchParams }: PublishersPageProps) {
  // Get all required data first
  const [locationsList, params] = await Promise.all([getUniqueLocations(), searchParams])

  const page = params?.page ? parseInt(params.page) : 1
  const search = params?.search
  const location = params?.location
  const sort = params?.sort

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Publishers</h1>
        <p className="text-muted-foreground mt-2">
          Browse and discover publishers from our collection.
        </p>
      </div>
      <InteractiveControls
        locations={locationsList}
        search={search}
        location={location}
        sort={sort}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <PublishersListContent page={page} search={search} location={location} sort={sort} />
      </Suspense>
    </div>
  )
}
