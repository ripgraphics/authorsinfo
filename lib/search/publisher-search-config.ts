import { SearchFieldConfig } from '@/lib/hooks/use-search-filter'

/**
 * Publisher type for search
 */
export interface SearchablePublisher {
  id: string
  name?: string | null
  description?: string | null
  [key: string]: any
}

/**
 * Search field configuration for publishers
 */
export const publisherSearchFields: SearchFieldConfig<SearchablePublisher>[] = [
  {
    name: 'name',
    getValue: (publisher) => publisher.name || null,
    weight: 1000,
    exactMatch: true,
  },
  {
    name: 'description',
    getValue: (publisher) => publisher.description || null,
    weight: 100,
  },
]

/**
 * Custom scorer for publishers
 */
export function publisherSearchScorer(
  publisher: SearchablePublisher,
  searchWords: string[],
  baseScore: number
): number {
  let score = baseScore
  const name = (publisher.name || '').toLowerCase()

  // All words in name gets extra boost
  const allWordsInName = searchWords.every(word => name.includes(word))
  if (allWordsInName) {
    score += 1000
  }

  return score
}

