import { useMemo } from 'react'

/**
 * Configuration for search field matching
 */
export interface SearchFieldConfig<T> {
  /**
   * Field name for identification
   */
  name: string
  /**
   * Function to extract the searchable text from an item
   */
  getValue: (item: T) => string | null | undefined
  /**
   * Weight/priority for this field (higher = more important)
   */
  weight?: number
  /**
   * Whether this field should be used for exact matching
   */
  exactMatch?: boolean
}

/**
 * Options for search filtering
 */
export interface UseSearchFilterOptions<T> {
  /**
   * Array of items to search
   */
  items: T[]
  /**
   * Search query string
   */
  searchValue: string
  /**
   * Configuration for which fields to search
   */
  fields: SearchFieldConfig<T>[]
  /**
   * Whether to require all words to match (default: false - matches any word)
   */
  requireAllWords?: boolean
  /**
   * Custom scoring function (optional)
   */
  customScorer?: (item: T, searchWords: string[], score: number) => number
}

/**
 * Result of search filtering
 */
export interface SearchFilterResult<T> {
  /**
   * Filtered and ranked items
   */
  filteredItems: T[]
  /**
   * Total number of matching items
   */
  totalMatches: number
}

/**
 * Enterprise-grade search filter hook that:
 * - Filters items based on search query
 * - Ranks results by relevance
 * - Supports multi-word searches
 * - Works with any data type
 *
 * @example
 * ```tsx
 * const { filteredItems } = useSearchFilter({
 *   items: books,
 *   searchValue: "envy red touch",
 *   fields: [
 *     { name: 'title', getValue: (book) => book.title, weight: 1000 },
 *     { name: 'author', getValue: (book) => book.author?.name, weight: 800 },
 *   ]
 * })
 * ```
 */
export function useSearchFilter<T>({
  items,
  searchValue,
  fields,
  requireAllWords = false,
  customScorer,
}: UseSearchFilterOptions<T>): SearchFilterResult<T> {
  const result = useMemo(() => {
    if (!searchValue.trim()) {
      return {
        filteredItems: items,
        totalMatches: items.length,
      }
    }

    // Split search into individual words and normalize
    const searchWords = searchValue
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)

    if (searchWords.length === 0) {
      return {
        filteredItems: items,
        totalMatches: items.length,
      }
    }

    const searchQuery = searchValue.toLowerCase().trim()

    // Map items with scores
    const itemsWithScores = items
      .map((item) => {
        // Extract values from all fields
        const fieldValues: Record<string, string> = {}
        fields.forEach((field) => {
          const value = field.getValue(item)
          fieldValues[field.name] = (value || '').toLowerCase()
        })

        // Combine all searchable text
        const searchableText = Object.values(fieldValues).join(' ')

        // Check if item matches search criteria
        const hasMatch = requireAllWords
          ? searchWords.every((word) => searchableText.includes(word))
          : searchWords.some((word) => searchableText.includes(word))

        if (!hasMatch) {
          return { item, score: 0 }
        }

        // Calculate relevance score
        let score = 0

        // Process each field
        fields.forEach((field) => {
          const fieldValue = fieldValues[field.name]
          const weight = field.weight || 100

          // Exact matches get highest priority
          if (field.exactMatch && fieldValue === searchQuery) {
            score += weight * 10
          }

          // Field contains exact search query
          if (fieldValue.includes(searchQuery)) {
            score += weight * 7
          }

          // Count word matches in this field
          const wordMatches = searchWords.filter((word) => fieldValue.includes(word))

          if (requireAllWords) {
            // If all words match in this field, high score
            if (wordMatches.length === searchWords.length) {
              score += weight * 5
            }
          } else {
            // Score based on number of matching words
            score += wordMatches.length * weight
          }

          // Field starts with any search word
          searchWords.forEach((word) => {
            if (fieldValue.startsWith(word)) {
              score += weight * 0.5
            }
          })
        })

        // Apply custom scorer if provided
        if (customScorer) {
          score = customScorer(item, searchWords, score)
        }

        return { item, score }
      })
      .filter((item) => item.score > 0) // Only include matching items
      .sort((a, b) => {
        // Sort by score (highest first)
        if (b.score !== a.score) {
          return b.score - a.score
        }
        // If scores are equal, maintain original order
        return 0
      })
      .map((item) => item.item) // Extract just the items

    return {
      filteredItems: itemsWithScores,
      totalMatches: itemsWithScores.length,
    }
  }, [items, searchValue, fields, requireAllWords, customScorer])

  return result
}
