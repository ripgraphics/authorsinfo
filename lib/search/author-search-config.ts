import { SearchFieldConfig } from '@/lib/hooks/use-search-filter'

/**
 * Author type for search
 */
export interface SearchableAuthor {
  id: string
  name?: string | null
  bio?: string | null
  description?: string | null
  [key: string]: any
}

/**
 * Search field configuration for authors
 */
export const authorSearchFields: SearchFieldConfig<SearchableAuthor>[] = [
  {
    name: 'name',
    getValue: (author) => author.name || null,
    weight: 1000,
    exactMatch: true,
  },
  {
    name: 'bio',
    getValue: (author) => author.bio || null,
    weight: 200,
  },
  {
    name: 'description',
    getValue: (author) => author.description || null,
    weight: 100,
  },
]

/**
 * Custom scorer for authors
 */
export function authorSearchScorer(
  author: SearchableAuthor,
  searchWords: string[],
  baseScore: number
): number {
  let score = baseScore
  const name = (author.name || '').toLowerCase()

  // All words in name gets extra boost
  const allWordsInName = searchWords.every((word) => name.includes(word))
  if (allWordsInName) {
    score += 1000
  }

  return score
}
