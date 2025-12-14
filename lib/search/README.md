# Reusable Search System

This directory contains a fully reusable search system that can be used anywhere in the application.

## Components

### 1. `ReusableSearch` Component
Location: `components/ui/reusable-search.tsx`

A fully reusable search input component with:
- Instant results on every keystroke
- Continuous typing without interruption
- Delayed URL updates to prevent Server Component re-renders
- Focus preservation

**Usage:**
```tsx
import { ReusableSearch } from '@/components/ui/reusable-search'

<ReusableSearch
  paramName="search"
  placeholder="Search books..."
  debounceMs={300}
  onSearchChange={(value) => {
    // Handle instant search updates
    window.dispatchEvent(new CustomEvent('searchValueUpdate', { detail: value }))
  }}
/>
```

### 2. `useSearchFilter` Hook
Location: `lib/hooks/use-search-filter.ts`

A generic search filter hook that works with any data type.

**Usage:**
```tsx
import { useSearchFilter } from '@/lib/hooks/use-search-filter'

const { filteredItems } = useSearchFilter({
  items: myItems,
  searchValue: "search query",
  fields: [
    { name: 'title', getValue: (item) => item.title, weight: 1000 },
    { name: 'author', getValue: (item) => item.author, weight: 800 },
  ],
  requireAllWords: false, // Match any word
  customScorer: (item, searchWords, score) => {
    // Add custom scoring logic
    return score
  }
})
```

### 3. Search Configurations
Location: `lib/search/`

Pre-configured search setups for different entity types:
- `book-search-config.ts` - Configuration for books

**Creating a new search configuration:**

1. Create a new config file (e.g., `author-search-config.ts`):
```tsx
import { SearchFieldConfig } from '@/lib/hooks/use-search-filter'

export interface SearchableAuthor {
  id: string
  name?: string
  bio?: string
  // ... other fields
}

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
    weight: 100,
  },
]
```

2. Use it in your component:
```tsx
import { useSearchFilter } from '@/lib/hooks/use-search-filter'
import { authorSearchFields, SearchableAuthor } from '@/lib/search/author-search-config'

const { filteredItems } = useSearchFilter<SearchableAuthor>({
  items: authors,
  searchValue: searchQuery,
  fields: authorSearchFields,
})
```

## Complete Example

Here's how to use the full search system in a new component:

```tsx
'use client'

import { useState } from 'react'
import { ReusableSearch } from '@/components/ui/reusable-search'
import { useSearchFilter } from '@/lib/hooks/use-search-filter'
import { bookSearchFields, bookSearchScorer, SearchableBook } from '@/lib/search/book-search-config'

export function MySearchableList({ items }: { items: SearchableBook[] }) {
  const [searchValue, setSearchValue] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // Dispatch event for other components if needed
    window.dispatchEvent(new CustomEvent('searchValueUpdate', { detail: value }))
  }

  const { filteredItems } = useSearchFilter<SearchableBook>({
    items,
    searchValue,
    fields: bookSearchFields,
    requireAllWords: false,
    customScorer: bookSearchScorer,
  })

  return (
    <div>
      <ReusableSearch
        placeholder="Search..."
        onSearchChange={handleSearchChange}
      />
      <ul>
        {filteredItems.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Features

- ✅ Works with any data type
- ✅ Configurable field weights
- ✅ Custom scoring functions
- ✅ Multi-word search support
- ✅ Exact match prioritization
- ✅ Instant results (no debounce on filtering)
- ✅ URL synchronization (debounced)
- ✅ Focus preservation
- ✅ TypeScript support

