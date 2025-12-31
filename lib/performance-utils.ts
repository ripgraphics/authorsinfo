/**
 * Performance optimization utilities for batch database operations
 * Replaces N+1 query patterns with efficient batch operations
 * 
 * Usage:
 *   import { batchFetchByIds, batchUpsertEntities } from '@/lib/performance-utils'
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Batch fetch multiple records by ID, handling chunking for large datasets
 * 
 * @example
 * const authors = await batchFetchByIds(supabase, 'authors', authorIds)
 * 
 * @param client - Supabase client instance
 * @param table - Table name
 * @param ids - Array of IDs to fetch
 * @param select - Columns to select (default: 'id')
 * @param chunkSize - Process in chunks to avoid URL length limits (default: 100)
 * @returns Array of fetched records
 */
export async function batchFetchByIds<T extends { id: string | number }>(
  client: SupabaseClient,
  table: string,
  ids: (string | number)[],
  select: string = '*',
  chunkSize: number = 100
): Promise<T[]> {
  if (ids.length === 0) {
    return []
  }

  const results: T[] = []

  // Process in chunks to avoid URL length limits
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const { data, error } = await client
      .from(table)
      .select(select)
      .in('id', chunk)

    if (error) {
      throw new Error(`Failed to batch fetch from ${table}: ${error.message}`)
    }

    if (data) {
      results.push(...(data as unknown as T[]))
    }
  }

  return results
}

/**
 * Batch fetch records by a string field (e.g., name, email)
 * Useful for finding entities by name before creating them
 * 
 * @example
 * const existingAuthors = await batchFetchByField(
 *   supabase,
 *   'authors',
 *   'name',
 *   ['Author 1', 'Author 2', 'Author 3']
 * )
 * 
 * @param client - Supabase client instance
 * @param table - Table name
 * @param field - Field to match on
 * @param values - Array of values to search for
 * @param select - Columns to select (default: '*')
 * @param chunkSize - Process in chunks (default: 50)
 * @returns Array of fetched records with matched values
 */
export async function batchFetchByField<T>(
  client: SupabaseClient,
  table: string,
  field: string,
  values: string[],
  select: string = '*',
  chunkSize: number = 50
): Promise<T[]> {
  if (values.length === 0) {
    return []
  }

  const results: T[] = []

  // Process in chunks
  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize)
    const { data, error } = await client
      .from(table)
      .select(select)
      .in(field, chunk)

    if (error) {
      throw new Error(`Failed to batch fetch from ${table} by ${field}: ${error.message}`)
    }

    if (data) {
      results.push(...(data as unknown as T[]))
    }
  }

  return results
}

/**
 * Batch upsert entities, creating missing ones
 * Reduces "check if exists, if not create" to single batch operation
 * 
 * @example
 * const authors = await batchUpsertByField(
 *   supabase,
 *   'authors',
 *   'name',
 *   ['Author 1', 'Author 2'],
 *   (name) => ({ name, created_at: new Date().toISOString() })
 * )
 * 
 * @param client - Supabase client instance
 * @param table - Table name
 * @param uniqueField - Field that uniquely identifies the entity
 * @param values - Array of values to upsert
 * @param mapToRecord - Function to map value to full record object
 * @param select - Columns to select in response (default: '*')
 * @returns Array of all entities (existing + newly created)
 */
export async function batchUpsertByField<T extends Record<string, any>>(
  client: SupabaseClient,
  table: string,
  uniqueField: string,
  values: string[],
  mapToRecord: (value: string) => Record<string, any>,
  select: string = '*'
): Promise<T[]> {
  if (values.length === 0) {
    return []
  }

  // Step 1: Fetch existing entities
  const existing = await batchFetchByField<T>(
    client,
    table,
    uniqueField,
    values,
    select
  )

  // Step 2: Determine which entities need creation
  const existingMap = new Map(
    existing.map((item) => [item[uniqueField as keyof T], item])
  )
  const missingValues = values.filter((value) => !existingMap.has(value as unknown as T[keyof T]))

  if (missingValues.length === 0) {
    return existing
  }

  // Step 3: Batch insert missing entities
  const recordsToInsert = missingValues.map(mapToRecord)
  const { data: newRecords, error } = await client
    .from(table)
    .insert(recordsToInsert)
    .select(select)

  if (error) {
    throw new Error(`Failed to batch insert into ${table}: ${error.message}`)
  }

  // Step 4: Return combined results
  return [...existing, ...(newRecords as unknown as T[])]
}

/**
 * Create an efficient lookup map from batch fetch results
 * Reduces repeated iterations over fetched data
 * 
 * @example
 * const authors = await batchFetchByIds(supabase, 'authors', authorIds)
 * const authorMap = createLookupMap(authors, 'id')
 * const author = authorMap.get('author-123')
 * 
 * @param records - Array of records to index
 * @param keyField - Field to use as map key
 * @returns Map for O(1) lookups
 */
export function createLookupMap<T extends Record<string, any>>(
  records: T[],
  keyField: keyof T
): Map<string | number, T> {
  const map = new Map<string | number, T>()
  for (const record of records) {
    map.set(record[keyField], record)
  }
  return map
}

/**
 * Batch process items with a database operation, respecting rate limits
 * Useful for large bulk operations that need to avoid overwhelming the database
 * 
 * @example
 * await batchProcess(
 *   books,
 *   async (bookBatch) => {
 *     await supabase.from('books').insert(bookBatch)
 *   },
 *   50 // process 50 at a time
 * )
 * 
 * @param items - Items to process
 * @param processor - Async function to process each batch
 * @param batchSize - Number of items per batch
 * @returns Array of results from processor
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R>,
  batchSize: number = 50
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const result = await processor(batch)
    results.push(result)
  }

  return results
}

/**
 * Identify unique values in a collection, useful for deduplication
 * before batch operations
 * 
 * @example
 * const uniqueAuthorNames = deduplicateByField(books, b => b.author)
 * 
 * @param items - Items to deduplicate
 * @param getField - Function to extract field value
 * @returns Array of unique values
 */
export function deduplicateByField<T>(
  items: T[],
  getField: (item: T) => string
): string[] {
  return [...new Set(items.map(getField))]
}

/**
 * Transform batch fetch results into a dictionary for easy lookup
 * while preserving data structure
 * 
 * @example
 * const authorsByName = transformToDict(authors, 'name')
 * const author = authorsByName['Stephen King']
 * 
 * @param records - Array of records
 * @param keyField - Field to use as key
 * @returns Dictionary object for lookups
 */
export function transformToDict<T extends Record<string, any>>(
  records: T[],
  keyField: keyof T
): Record<string | number, T> {
  const dict: Record<string | number, T> = {}
  for (const record of records) {
    dict[record[keyField]] = record
  }
  return dict
}

/**
 * Chunk an array into smaller subarrays
 * Useful for processing large datasets in manageable pieces
 * 
 * @example
 * const chunks = chunkArray(items, 100)
 * for (const chunk of chunks) {
 *   await processChunk(chunk)
 * }
 * 
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Check if a batch operation would exceed practical limits
 * Helps decide if batching is appropriate
 * 
 * @param itemCount - Number of items to process
 * @param estimatedBytesPerItem - Estimated bytes per item
 * @param maxUrlLength - Max URL length (default: 2000 for most servers)
 * @returns True if batch is safe, false if should chunk
 */
export function isBatchSafe(
  itemCount: number,
  estimatedBytesPerItem: number = 50,
  maxUrlLength: number = 2000
): boolean {
  const totalBytes = itemCount * estimatedBytesPerItem
  return totalBytes < maxUrlLength
}

/**
 * Get statistics about batch operation efficiency
 * Use for monitoring and optimization
 * 
 * @example
 * const stats = getBatchStats(100, 5, 2000)
 * // { originalQueries: 100, optimizedQueries: 5, reduction: 95 }
 * 
 * @param originalCount - Original number of queries/operations
 * @param optimizedCount - Number after batching
 * @param performanceMs - Time taken in milliseconds
 * @returns Statistics object
 */
export function getBatchStats(
  originalCount: number,
  optimizedCount: number,
  performanceMs: number
): {
  originalQueries: number
  optimizedQueries: number
  reduction: number
  reductionPercent: number
  timeMs: number
  queriesPerMs: number
} {
  return {
    originalQueries: originalCount,
    optimizedQueries: optimizedCount,
    reduction: originalCount - optimizedCount,
    reductionPercent: Math.round(((originalCount - optimizedCount) / originalCount) * 100),
    timeMs: performanceMs,
    queriesPerMs: performanceMs > 0 ? optimizedCount / performanceMs : 0,
  }
}

/**
 * Type-safe batch operation with error collection
 * Continues processing even if individual items fail
 * 
 * @example
 * const results = await batchOperationWithErrors(
 *   books,
 *   async (book) => await insertBook(book),
 *   10
 * )
 * console.log(`Succeeded: ${results.successful.length}, Failed: ${results.failed.length}`)
 * 
 * @param items - Items to process
 * @param operation - Async operation to perform on each item
 * @param batchSize - Size of each batch
 * @returns Object with successful and failed results
 */
export async function batchOperationWithErrors<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 50
): Promise<{
  successful: { item: T; result: R }[]
  failed: { item: T; error: Error }[]
}> {
  const successful: { item: T; result: R }[] = []
  const failed: { item: T; error: Error }[] = []

  const chunks = chunkArray(items, batchSize)

  for (const chunk of chunks) {
    const promises = chunk.map(async (item) => {
      try {
        const result = await operation(item)
        successful.push({ item, result })
      } catch (error) {
        failed.push({
          item,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    })

    // Execute batch in parallel
    await Promise.all(promises)
  }

  return { successful, failed }
}

/**
 * Merge multiple batch results into a single collection
 * Useful when using Promise.all with multiple batch operations
 * 
 * @example
 * const [authors, publishers] = await Promise.all([
 *   batchFetchByIds(supabase, 'authors', authorIds),
 *   batchFetchByIds(supabase, 'publishers', publisherIds)
 * ])
 * 
 * @param results - Array of batch results to merge
 * @returns Flattened array
 */
export function mergeBatchResults<T>(results: T[][]): T[] {
  return results.flat()
}
