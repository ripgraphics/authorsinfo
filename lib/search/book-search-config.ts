import { SearchFieldConfig } from '@/lib/hooks/use-search-filter'

/**
 * Book type for search
 */
export interface SearchableBook {
  id: string
  title?: string | null
  author?: { name?: string | null } | string | null
  publisher?: { name?: string | null } | null
  isbn?: string | null
  isbn10?: string | null
  isbn13?: string | null
  synopsis?: string | null
  overview?: string | null
  description?: string | null
  [key: string]: any
}

/**
 * Search field configuration for books
 * Defines which fields to search and their relative importance
 */
export const bookSearchFields: SearchFieldConfig<SearchableBook>[] = [
  {
    name: 'title',
    getValue: (book) => book.title || null,
    weight: 1000,
    exactMatch: true,
  },
  {
    name: 'author',
    getValue: (book) => {
      if (typeof book.author === 'string') return book.author
      return book.author?.name || null
    },
    weight: 800,
    exactMatch: true,
  },
  {
    name: 'publisher',
    getValue: (book) => book.publisher?.name || null,
    weight: 200,
  },
  {
    name: 'isbn',
    getValue: (book) => [book.isbn, book.isbn10, book.isbn13].filter(Boolean).join(' ') || null,
    weight: 150,
  },
  {
    name: 'description',
    getValue: (book) => [book.synopsis, book.overview, book.description].filter(Boolean).join(' ') || null,
    weight: 100,
  },
]

/**
 * Custom scorer for books that adds extra logic for author grouping
 */
export function bookSearchScorer(
  book: SearchableBook,
  searchWords: string[],
  baseScore: number
): number {
  let score = baseScore
  const authorName = typeof book.author === 'string' 
    ? book.author.toLowerCase() 
    : (book.author?.name || '').toLowerCase()
  const title = (book.title || '').toLowerCase()

  // Check if all words match in author (for grouping same author's books)
  const allWordsInAuthor = searchWords.every(word => authorName.includes(word))
  if (allWordsInAuthor) {
    score += 2000 // Bonus for grouping same author's books
  }

  // Check if author matches multiple words (extra boost)
  const authorWordMatches = searchWords.filter(word => authorName.includes(word))
  if (authorWordMatches.length >= 2) {
    score += 1500
  }

  // All words in title gets extra boost
  const allWordsInTitle = searchWords.every(word => title.includes(word))
  if (allWordsInTitle) {
    score += 1000
  }

  return score
}

