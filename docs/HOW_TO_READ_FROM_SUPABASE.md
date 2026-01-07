# How to Read Directly from Supabase

## Table of Contents
1. [Why Read Directly from Supabase](#why-read-directly-from-supabase)
2. [Basic Query Patterns](#basic-query-patterns)
3. [Joining Related Tables](#joining-related-tables)
4. [Filtering and Ordering](#filtering-and-ordering)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Real-World Examples](#real-world-examples)
8. [Common Patterns](#common-patterns)

---

## Why Read Directly from Supabase

### Benefits

1. **Single Source of Truth**: Supabase is your database - querying it directly ensures you always get the most up-to-date data
2. **Performance**: Direct queries are faster than filtering client-side from pre-fetched arrays
3. **Fresh Data**: Each query fetches current data, avoiding stale information
4. **Efficiency**: Only fetch what you need, when you need it
5. **Consistency**: Follows enterprise-grade best practices

### When to Use Direct Queries

✅ **DO** use direct Supabase queries when:
- You need specific filtered data (e.g., books with `status = 'in_progress'`)
- Data changes frequently and must be current
- You're building server-side components (Next.js Server Components)
- You need to join multiple related tables
- Performance is critical

❌ **DON'T** use direct queries when:
- You already have the data in props/state and filtering is sufficient
- The data is static and won't change
- You're doing simple client-side filtering on small datasets

---

## Basic Query Patterns

### 1. Simple Select Query

```typescript
import { supabaseAdmin } from '@/lib/supabase/server'

// Fetch all records from a table
const { data, error } = await supabaseAdmin
  .from('books')
  .select('*')

if (error) {
  console.error('Error fetching books:', error)
  return []
}

return data || []
```

### 2. Select Specific Columns

```typescript
// Only fetch the columns you need
const { data, error } = await supabaseAdmin
  .from('books')
  .select('id, title, author_id, cover_image_id')
```

### 3. Single Record Query

```typescript
// Fetch a single record by ID
const { data, error } = await supabaseAdmin
  .from('books')
  .select('id, title')
  .eq('id', bookId)
  .single() // Returns a single object instead of an array

if (error) {
  console.error('Book not found:', error)
  return null
}

return data
```

### 4. Filtered Query

```typescript
// Fetch books with specific status
const { data, error } = await supabaseAdmin
  .from('reading_progress')
  .select('id, book_id, status, progress_percentage')
  .eq('user_id', userId)
  .eq('status', 'in_progress')
```

---

## Joining Related Tables

### Basic Join Syntax

Supabase uses a special syntax for joins within the `select()` method:

```typescript
// Join a related table
const { data, error } = await supabaseAdmin
  .from('books')
  .select(`
    id,
    title,
    authors(id, name)  // Join authors table
  `)
```

### Foreign Key Joins

When you have a foreign key relationship, you can reference it directly:

```typescript
// Join via foreign key
const { data, error } = await supabaseAdmin
  .from('books')
  .select(`
    id,
    title,
    cover_image_id,
    cover_image:images!books_cover_image_id_fkey(url, alt_text)
  `)
```

**Syntax Explanation:**
- `cover_image:images` - Alias the joined table as `cover_image`
- `!books_cover_image_id_fkey` - Reference the foreign key constraint name
- `(url, alt_text)` - Select specific columns from the joined table

### Multiple Joins

```typescript
// Join multiple related tables
const { data, error } = await supabaseAdmin
  .from('books')
  .select(`
    id,
    title,
    authors(id, name),
    publishers(id, name),
    cover_image:images!books_cover_image_id_fkey(url, alt_text)
  `)
```

### Junction Table Joins

For many-to-many relationships (junction tables):

```typescript
// Join through a junction table (book_authors)
const { data, error } = await supabaseAdmin
  .from('book_authors')
  .select(`
    book_id,
    authors (
      id,
      name
    )
  `)
  .in('book_id', bookIds)
```

---

## Filtering and Ordering

### Common Filter Methods

```typescript
// Equality filter
.eq('status', 'in_progress')

// Not equal
.neq('status', 'completed')

// In array
.in('id', [id1, id2, id3])

// Greater than / Less than
.gt('progress_percentage', 50)
.lt('progress_percentage', 100)

// Range
.gte('created_at', startDate)
.lte('created_at', endDate)

// Text search (case-insensitive)
.ilike('title', '%fantasy%')

// Is null / Is not null
.is('deleted_at', null)
.not('deleted_at', 'is', null)

// Multiple conditions (AND)
.eq('user_id', userId)
.eq('status', 'in_progress')
```

### Ordering

```typescript
// Order by a column
.order('updated_at', { ascending: false })

// Order by multiple columns
.order('status', { ascending: true })
.order('updated_at', { ascending: false })
```

### Limiting Results

```typescript
// Limit number of results
.limit(10)

// Pagination with range
.range(0, 9)  // First 10 records (0-9)
.range(10, 19)  // Next 10 records (10-19)
```

### Complete Filter Example

```typescript
const { data, error } = await supabaseAdmin
  .from('reading_progress')
  .select('id, book_id, status, progress_percentage, updated_at')
  .eq('user_id', userId)
  .eq('status', 'in_progress')
  .order('updated_at', { ascending: false })
  .limit(5)
```

---

## Error Handling

### Basic Error Handling Pattern

```typescript
let result: any[] = []

try {
  const { data, error } = await supabaseAdmin
    .from('table_name')
    .select('*')
    .eq('column', value)

  if (error) {
    console.error('Error fetching data:', error)
    result = [] // Return empty array on error
  } else if (data && data.length > 0) {
    result = data
  } else {
    console.log('No data found')
    result = []
  }
} catch (err) {
  console.error('Unexpected error:', err)
  result = []
}

return result
```

### Comprehensive Error Handling

```typescript
async function fetchCurrentlyReadingBooks(userId: string) {
  let currentlyReadingBooks: any[] = []
  
  try {
    // Step 1: Fetch reading progress
    const { data: readingProgress, error: progressError } = await supabaseAdmin
      .from('reading_progress')
      .select('id, book_id, progress_percentage, updated_at')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (progressError) {
      console.error('Error fetching reading progress:', progressError)
      return [] // Early return on error
    }

    if (!readingProgress || readingProgress.length === 0) {
      console.log('No currently reading books found')
      return []
    }

    // Step 2: Get book IDs
    const bookIds = readingProgress
      .map((rp: any) => rp.book_id)
      .filter(Boolean)

    if (bookIds.length === 0) {
      return []
    }

    // Step 3: Fetch books
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id, title, cover_image_id')
      .in('id', bookIds)

    if (booksError) {
      console.error('Error fetching books:', booksError)
      return []
    }

    // Step 4: Transform and return
    // ... transformation logic ...

  } catch (error) {
    console.error('Unexpected error in fetchCurrentlyReadingBooks:', error)
    return []
  }

  return currentlyReadingBooks
}
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
// ✅ GOOD: Proper error handling
const { data, error } = await supabaseAdmin
  .from('books')
  .select('*')

if (error) {
  console.error('Error:', error)
  return []
}

// ❌ BAD: No error handling
const { data } = await supabaseAdmin.from('books').select('*')
return data // Could be undefined!
```

### 2. Select Only What You Need

```typescript
// ✅ GOOD: Select specific columns
.select('id, title, author_id')

// ❌ BAD: Select everything
.select('*')
```

### 3. Use Joins Instead of Multiple Queries

```typescript
// ✅ GOOD: Single query with join
const { data } = await supabaseAdmin
  .from('books')
  .select(`
    id,
    title,
    authors(id, name)
  `)

// ❌ BAD: Multiple sequential queries
const book = await getBook(id)
const author = await getAuthor(book.author_id)
```

### 4. Use Maps for Data Transformation

```typescript
// ✅ GOOD: Use Map for efficient lookups
const booksMap = new Map<string, any>()
books.forEach((book: any) => {
  booksMap.set(book.id, book)
})

// Later, access by ID
const book = booksMap.get(bookId)

// ❌ BAD: Array.find() in loops (O(n²) complexity)
books.find(b => b.id === bookId)
```

### 5. Filter at Database Level

```typescript
// ✅ GOOD: Filter in query
.eq('status', 'in_progress')
.eq('user_id', userId)

// ❌ BAD: Fetch all, filter client-side
const allBooks = await fetchAllBooks()
const filtered = allBooks.filter(b => b.status === 'in_progress')
```

### 6. Use Appropriate Limits

```typescript
// ✅ GOOD: Limit results
.limit(10)

// ❌ BAD: Fetch unlimited records
// (Could cause performance issues)
```

### 7. Order Results Meaningfully

```typescript
// ✅ GOOD: Order by relevant column
.order('updated_at', { ascending: false })

// ❌ BAD: No ordering (unpredictable results)
```

---

## Real-World Examples

### Example 1: Fetch Currently Reading Books

This example demonstrates fetching books with status filtering, joins, and data transformation:

```typescript
// From app/profile/[id]/page.tsx

// Fetch currently reading books directly from Supabase
let currentlyReadingBooks: any[] = []

try {
  // Step 1: Fetch reading progress entries with status = 'in_progress'
  const { data: currentlyReadingProgress, error: currentlyReadingError } = 
    await supabaseAdmin
      .from('reading_progress')
      .select('id, book_id, progress_percentage, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(5)

  if (currentlyReadingError) {
    console.error('Error fetching currently reading progress:', currentlyReadingError)
    currentlyReadingBooks = []
  } else if (currentlyReadingProgress && currentlyReadingProgress.length > 0) {
    // Step 2: Get all book IDs
    const currentlyReadingBookIds = currentlyReadingProgress
      .map((rp: any) => rp.book_id)
      .filter(Boolean)

    if (currentlyReadingBookIds.length === 0) {
      currentlyReadingBooks = []
    } else {
      // Step 3: Fetch books with cover images (using foreign key join)
      const { data: currentlyReadingBooksFromDb, error: booksError } =
        await supabaseAdmin
          .from('books')
          .select(`
            id,
            title,
            cover_image_id,
            cover_image:images!books_cover_image_id_fkey(url, alt_text)
          `)
          .in('id', currentlyReadingBookIds)

      if (booksError) {
        console.error('Error fetching currently reading books:', booksError)
        currentlyReadingBooks = []
      } else if (currentlyReadingBooksFromDb && currentlyReadingBooksFromDb.length > 0) {
        // Step 4: Create maps for efficient lookups
        const booksMap = new Map<string, any>()
        currentlyReadingBooksFromDb.forEach((book: any) => {
          booksMap.set(book.id, book)
        })

        const progressMap = new Map<string, number | null>()
        currentlyReadingProgress.forEach((rp: any) => {
          if (rp.book_id) {
            progressMap.set(rp.book_id, rp.progress_percentage)
          }
        })

        // Step 5: Fetch authors through junction table
        const authorMap = new Map<string, any>()
        const { data: bookAuthors, error: authorsError } = await supabaseAdmin
          .from('book_authors')
          .select(`
            book_id,
            authors (
              id,
              name
            )
          `)
          .in('book_id', currentlyReadingBookIds)

        if (!authorsError && bookAuthors) {
          bookAuthors.forEach((ba: any) => {
            if (ba.authors && !authorMap.has(ba.book_id)) {
              authorMap.set(ba.book_id, ba.authors)
            }
          })
        }

        // Step 6: Transform data to match component expectations
        currentlyReadingBooks = currentlyReadingProgress
          .map((rp: any) => {
            const book = booksMap.get(rp.book_id)
            if (!book || !book.id) {
              return null
            }

            const author = authorMap.get(book.id) || null
            const progress_percentage = progressMap.get(book.id) || null

            return {
              id: book.id,
              title: book.title,
              coverImageUrl: book.cover_image?.url || null,
              progress_percentage: progress_percentage,
              author: author
                ? {
                    id: author.id,
                    name: author.name,
                  }
                : null,
            }
          })
          .filter(Boolean) // Remove null entries
      }
    }
  }
} catch (currentlyReadingError) {
  console.error('Error fetching currently reading books:', currentlyReadingError)
  currentlyReadingBooks = []
}

return currentlyReadingBooks
```

### Example 2: Fetch Books with Related Data

```typescript
// Fetch books with authors and cover images
const { data: books, error } = await supabaseAdmin
  .from('books')
  .select(`
    id,
    title,
    cover_image_id,
    cover_image:images!books_cover_image_id_fkey(url, alt_text),
    book_authors (
      authors (
        id,
        name
      )
    )
  `)
  .limit(20)

if (error) {
  console.error('Error fetching books:', error)
  return []
}

// Transform the data
const transformedBooks = books?.map((book: any) => ({
  id: book.id,
  title: book.title,
  coverImageUrl: book.cover_image?.url || null,
  authors: book.book_authors?.map((ba: any) => ba.authors) || [],
})) || []

return transformedBooks
```

### Example 3: Complex Filtering with Multiple Conditions

```typescript
// Fetch reading progress with multiple filters
const { data, error } = await supabaseAdmin
  .from('reading_progress')
  .select(`
    id,
    book_id,
    status,
    progress_percentage,
    updated_at,
    books (
      id,
      title,
      cover_image:images!books_cover_image_id_fkey(url)
    )
  `)
  .eq('user_id', userId)
  .in('status', ['in_progress', 'completed'])
  .gte('progress_percentage', 0)
  .lte('progress_percentage', 100)
  .order('updated_at', { ascending: false })
  .limit(50)

if (error) {
  console.error('Error:', error)
  return []
}

return data || []
```

---

## Common Patterns

### Pattern 1: Fetch → Transform → Return

```typescript
async function fetchAndTransform() {
  // 1. Fetch from Supabase
  const { data, error } = await supabaseAdmin
    .from('table')
    .select('*')
    .eq('column', value)

  if (error) return []

  // 2. Transform data
  const transformed = data?.map(item => ({
    id: item.id,
    // ... transform fields
  })) || []

  // 3. Return transformed data
  return transformed
}
```

### Pattern 2: Multi-Step Query with Maps

```typescript
async function fetchWithRelatedData() {
  // Step 1: Fetch main data
  const { data: mainData } = await supabaseAdmin
    .from('table1')
    .select('id, foreign_key_id')

  const ids = mainData?.map(item => item.foreign_key_id) || []

  // Step 2: Fetch related data
  const { data: relatedData } = await supabaseAdmin
    .from('table2')
    .select('id, name')
    .in('id', ids)

  // Step 3: Create maps
  const relatedMap = new Map()
  relatedData?.forEach(item => {
    relatedMap.set(item.id, item)
  })

  // Step 4: Combine data
  return mainData?.map(item => ({
    ...item,
    related: relatedMap.get(item.foreign_key_id),
  })) || []
}
```

### Pattern 3: Error Handling with Fallbacks

```typescript
async function fetchWithFallback() {
  let result: any[] = []

  try {
    const { data, error } = await supabaseAdmin
      .from('table')
      .select('*')

    if (error) {
      console.error('Error:', error)
      result = [] // Fallback to empty array
    } else {
      result = data || []
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    result = [] // Fallback to empty array
  }

  return result
}
```

---

## Summary

### Key Takeaways

1. **Always query Supabase directly** when you need specific, filtered data
2. **Use joins** to fetch related data in a single query
3. **Handle errors** properly with fallbacks
4. **Select only needed columns** for better performance
5. **Use Maps** for efficient data lookups and transformations
6. **Filter at the database level** rather than client-side
7. **Order and limit** results appropriately

### Quick Reference

```typescript
// Basic query
const { data, error } = await supabaseAdmin
  .from('table')
  .select('columns')
  .eq('column', value)
  .order('column', { ascending: false })
  .limit(10)

// With join
.select(`
  id,
  title,
  related_table(id, name)
`)

// Error handling
if (error) {
  console.error('Error:', error)
  return []
}

return data || []
```

---

## Additional Resources

- [Supabase JavaScript Client Documentation](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Query Builder](https://supabase.com/docs/reference/javascript/select)
- [PostgreSQL Joins Guide](https://www.postgresql.org/docs/current/tutorial-join.html)

---

**Last Updated:** January 2025  
**Author:** Development Team  
**Version:** 1.0

