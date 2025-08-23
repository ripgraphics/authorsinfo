// Request deduplication and caching utilities

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface RequestState<T> {
  promise: Promise<T> | null
  timestamp: number
}

// Global cache store
const cache = new Map<string, CacheEntry<any>>()

// Global request deduplication store
const activeRequests = new Map<string, RequestState<any>>()

/**
 * Creates a deduplicated and cached request function
 * @param key Unique key for this request
 * @param fetcher Function that performs the actual request
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns Promise with the result
 */
export async function deduplicatedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Check cache first
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`📦 Cache hit for: ${key}`)
    return cached.data
  }

  // Check if there's an active request
  const active = activeRequests.get(key)
  if (active && active.promise && Date.now() - active.timestamp < 30000) { // 30 second request timeout
    console.log(`🔄 Returning active request for: ${key}`)
    return active.promise
  }

  // Create new request
  console.log(`🚀 Creating new request for: ${key}`)
  const promise = fetcher().then(result => {
    // Cache the result
    cache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl
    })
    
    // Remove from active requests
    activeRequests.delete(key)
    
    return result
  }).catch(error => {
    // Remove from active requests on error
    activeRequests.delete(key)
    throw error
  })

  // Store active request
  activeRequests.set(key, {
    promise,
    timestamp: Date.now()
  })

  return promise
}

/**
 * Clears cache for a specific key
 * @param key Cache key to clear
 */
export function clearCache(key: string): void {
  cache.delete(key)
  activeRequests.delete(key)
}

/**
 * Clears all cache
 */
export function clearAllCache(): void {
  cache.clear()
  activeRequests.clear()
}

/**
 * Gets cache statistics
 */
export function getCacheStats() {
  return {
    cacheSize: cache.size,
    activeRequests: activeRequests.size,
    cacheKeys: Array.from(cache.keys()),
    activeRequestKeys: Array.from(activeRequests.keys())
  }
}

/**
 * Creates a debounced function
 * @param func Function to debounce
 * @param wait Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Creates a throttled function
 * @param func Function to throttle
 * @param limit Throttle limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
