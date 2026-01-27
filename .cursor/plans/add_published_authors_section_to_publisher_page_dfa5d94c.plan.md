## Overview

Add a "Published Authors" section to the publisher page's About tab. Reuse the existing `ClientAuthorsList` component from `/authors` page by passing publisher-filtered authors to it.

## Enterprise-Grade Standards & Best Practices

### Principles Applied

1. **Component Reusability**: Reuse existing `ClientAuthorsList` component - no duplication
2. **Type Safety**: Use proper TypeScript types from `types/book.ts` throughout
3. **Error Handling**: Comprehensive try-catch blocks with proper error logging
4. **Performance**: Optimized queries, proper data fetching
5. **Code Organization**: Separation of concerns, reuse existing patterns
6. **Next.js Best Practices**: Server components for data fetching, proper async/await patterns
7. **Null Safety**: Proper handling of null/undefined values

## Implementation

### Files to Create/Modify

1. `app/actions/data.ts` - Add `getAuthorsByPublisherId` function
2. `app/publishers/[id]/page.tsx` - Fetch authors and pass to client component
3. `app/publishers/[id]/components/AboutSections.tsx` - Create `AuthorsSection` component that uses `ClientAuthorsList`
4. `app/publishers/[id]/client.tsx` - Add AuthorsSection to About tab

### Changes

#### 1. Create `getAuthorsByPublisherId` function

**File:** `app/actions/data.ts`

Add a new function with proper error handling and type safety:

```typescript
/**
 * Get all unique authors who have published books with a specific publisher
 * Uses book_authors join table to support multiple authors per book
 * 
 * @param publisherId - The publisher's UUID
 * @returns Array of Author objects with author_image relation
 */
export async function getAuthorsByPublisherId(publisherId: string): Promise<Author[]> {
  try {
    // Step 1: Get all book IDs for this publisher
    const { data: publisherBooks, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id')
      .eq('publisher_id', publisherId)

    if (booksError) {
      console.error('Error fetching publisher books for authors:', booksError)
      return []
    }

    if (!publisherBooks || publisherBooks.length === 0) {
      return []
    }

    const bookIds = publisherBooks.map((book: { id: string }) => book.id)

    // Step 2: Get all unique author IDs from book_authors join table
    const { data: bookAuthors, error: bookAuthorsError } = await supabaseAdmin
      .from('book_authors')
      .select('author_id')
      .in('book_id', bookIds)

    if (bookAuthorsError) {
      console.error('Error fetching book_authors for publisher:', bookAuthorsError)
      return []
    }

    if (!bookAuthors || bookAuthors.length === 0) {
      return []
    }

    // Extract unique author IDs using Set to avoid duplicates
    const authorIds = Array.from(new Set(bookAuthors.map((ba: { author_id: string }) => ba.author_id)))

    if (authorIds.length === 0) {
      return []
    }

    // Step 3: Fetch full author records with images
    const { data: authors, error: authorsError } = await supabaseAdmin
      .from('authors')
      .select(`
        *,
        author_image:author_image_id(id, url, alt_text)
      `)
      .in('id', authorIds)

    if (authorsError) {
      console.error('Error fetching authors by publisher:', authorsError)
      return []
    }

    if (!authors) {
      return []
    }

    // Map to Author type with proper type safety
    return authors.map((author: any) => ({
      id: String(author.id),
      name: author.name,
      bio: author.bio ?? undefined,
      created_at: author.created_at,
      updated_at: author.updated_at,
      author_image: author.author_image
        ? {
            id: author.author_image.id,
            url: author.author_image.url,
            alt_text: author.author_image.alt_text,
          }
        : null,
      cover_image_id: author.cover_image_id ?? undefined,
      nationality: author.nationality ?? undefined,
      website: author.website ?? undefined,
      permalink: author.permalink ?? undefined,
      birth_date: author.birth_date ?? undefined,
    })) as Author[]
  } catch (error) {
    console.error('Unexpected error fetching authors by publisher:', error)
    return []
  }
}
```

#### 2. Update Publisher Page Server Component

**File:** `app/publishers/[id]/page.tsx`

Add author fetching with proper error handling:

```typescript
import type { Author } from '@/types/book'

// ... existing code ...

export default async function PublisherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Get publisher data
  const publisher = await getPublisher(id)
  if (!publisher) {
    notFound()
  }

  // Get publisher image URLs
  const publisherImageUrl =
    publisher.publisher_image?.url || publisher.logo_url || '/placeholder.svg?height=200&width=200'
  const coverImageUrl = publisher.cover_image?.url || '/placeholder.svg?height=400&width=1200'

  // Get publisher followers
  const { followers, count: followersCount } = await getPublisherFollowers(id)

  // Get publisher books with error handling
  let books: any[] = []
  try {
    books = await getPublisherBooks(id)
  } catch (error) {
    console.error('Error fetching publisher books:', error)
    books = []
  }

  // Get total book count
  const { count: totalBooksCount } = await supabaseAdmin
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('publisher_id', id)

  // Get publisher authors with error handling
  let authors: Author[] = []
  let authorsCount = 0
  try {
    const { getAuthorsByPublisherId } = await import('@/app/actions/data')
    authors = await getAuthorsByPublisherId(id)
    authorsCount = authors.length
  } catch (error) {
    console.error('Error fetching publisher authors:', error)
    authors = []
    authorsCount = 0
  }

  return (
    <ClientPublisherPage
      publisher={publisher}
      publisherImageUrl={publisherImageUrl}
      coverImageUrl={coverImageUrl}
      params={{ id }}
      followers={followers}
      followersCount={followersCount}
      books={books}
      booksCount={totalBooksCount || 0}
      authors={authors}
      authorsCount={authorsCount}
    />
  )
}
```

#### 3. Create AuthorsSection Component

**File:** `app/publishers/[id]/components/AboutSections.tsx`

Create AuthorsSection that reuses `ClientAuthorsList` component:

```typescript
import { ClientAuthorsList } from '@/app/authors/components/ClientAuthorsList'
import type { Author } from '@/types/book'
import { Card, CardContent } from '@/components/ui/card'

// Published Authors Section
export function AuthorsSection({
  authors,
  authorsCount,
}: {
  authors?: Author[]
  authorsCount?: number
}) {
  const hasAuthors = authors && authors.length > 0
  const displayCount = authorsCount || 0

  return (
    <Card className="authors-section mb-6" id="authors">
      <div className="authors-section__header flex flex-col space-y-1.5 p-4 border-b">
        <h3 className="authors-section__title text-xl font-semibold">Published Authors</h3>
      </div>
      <CardContent className="authors-section__content p-4">
        {hasAuthors ? (
          <div className="authors-section__with-content">
            <p className="authors-section__count mb-4">
              This publisher has published {displayCount} {displayCount === 1 ? 'author' : 'authors'}.
            </p>
            <ClientAuthorsList
              initialAuthors={authors}
              initialTotalCount={displayCount}
              page={1}
              pageSize={12}
              searchValue=""
            />
          </div>
        ) : (
          <p className="authors-section__empty-message text-muted-foreground italic">
            No authors have published with this publisher yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 4. Update ClientPublisherPage Component

**File:** `app/publishers/[id]/client.tsx`

1. Add authors to interface with proper typing:

```typescript
import type { Author } from '@/types/book'

interface ClientPublisherPageProps {
  publisher: any
  coverImageUrl: string
  publisherImageUrl: string
  params: {
    id: string
  }
  followers?: any[]
  followersCount?: number
  books?: any[]
  booksCount?: number
  authors?: Author[]
  authorsCount?: number
}
```

2. Add authors to component parameters:

```typescript
export function ClientPublisherPage({
  publisher: initialPublisher,
  coverImageUrl,
  publisherImageUrl,
  params,
  followers = [],
  followersCount = 0,
  books = [],
  booksCount = 0,
  authors = [],
  authorsCount = 0,
}: ClientPublisherPageProps) {
  // ... existing code ...
}
```

3. Import AuthorsSection:

```typescript
import {
  AboutNavigation,
  OverviewSection,
  ContactSection,
  LocationSection,
  BooksSection,
  AuthorsSection,
} from './components/AboutSections'
```

4. Add AuthorsSection to About tab (after BooksSection):

```typescript
{activeTab === 'about' && (
  <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-1">
      <AboutNavigation publisherId={publisher?.id} />
    </div>
    <div className="lg:col-span-2">
      <OverviewSection publisher={publisher} onRefresh={refreshPublisherData} />
      <ContactSection publisher={publisher} onRefresh={refreshPublisherData} />
      <LocationSection publisher={publisher} onRefresh={refreshPublisherData} />
      <BooksSection
        books={books}
        booksCount={booksCount}
        onViewAllBooks={() => handleTabChange('books')}
      />
      <AuthorsSection
        authors={authors}
        authorsCount={authorsCount}
      />
    </div>
  </div>
)}
```

### Notes

- `ClientAuthorsList` already handles pagination, search, filtering, and sorting
- By passing `pageSize={12}`, it will show up to 12 authors initially
- The component handles empty states internally
- Pagination will work if there are more than 12 authors
- No need to extract or create new components - just reuse what exists

### Testing Checklist

- [ ] Publisher with multiple authors displays correctly using ClientAuthorsList
- [ ] Publisher with no authors shows empty state
- [ ] Publisher with more than 12 authors shows pagination
- [ ] Author cards link correctly to author pages
- [ ] Author images display correctly (with and without images)
- [ ] Responsive grid layout works on all screen sizes
- [ ] TypeScript types are correct throughout
- [ ] Error handling works when data fetching fails
- [ ] Component reusability verified (same component used in multiple places)