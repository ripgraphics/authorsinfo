import { searchBooks } from '@/lib/isbndb'
import { getRecentBooks, getRecentAuthors, getRecentPublishers } from '../actions/data'
import { SearchResults } from './components/SearchResults'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    type?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const type = params.type || 'books'

  // Fetch data for search
  let books: any[] = []
  let authors: any[] = []
  let publishers: any[] = []
  let isbndbBooks: any[] = []

  if (query) {
    // Search in ISBNDB
    if (type === 'books' || type === 'all') {
      isbndbBooks = await searchBooks(query)
    }

    // Fetch recent items from database (will be filtered client-side)
    books = await getRecentBooks(100) // Fetch more for client-side filtering
    authors = await getRecentAuthors(100)
    publishers = await getRecentPublishers(100)
  }

  return (
    <SearchResults
      initialBooks={books}
      initialAuthors={authors}
      initialPublishers={publishers}
      isbndbBooks={isbndbBooks}
      initialQuery={query}
      initialType={type}
    />
  )
}
