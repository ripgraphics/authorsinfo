// Using built-in fetch and FormData provided by Next.js runtime

const ISBNDB_API_KEY = process.env.NEXT_PUBLIC_ISBNDB_API_KEY
const BASE_URL = 'https://api2.isbndb.com'

// Helper function to check if API key is available
function checkApiKey(): void {
  if (!ISBNDB_API_KEY) {
    throw new Error(
      'ISBNDB_API_KEY environment variable is not set. Please add your ISBNdb API key to your environment variables.'
    )
  }
}

// Helper function to make API requests with better error handling
async function makeApiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  checkApiKey()

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: ISBNDB_API_KEY!,
      ...options.headers,
    },
  })

  if (response.status === 403) {
    throw new Error(
      'ISBNDB API key is invalid or has expired. Please check your API key configuration.'
    )
  }

  if (response.status === 429) {
    throw new Error('ISBNDB API rate limit exceeded. Please wait before making more requests.')
  }

  return response
}

export interface Book {
  title: string
  title_long?: string
  isbn: string
  isbn13: string
  authors: string[]
  publisher: string
  publish_date: string
  date_published?: string
  image?: string
  synopsis?: string
  overview?: string
  language?: string
  pages?: number
  msrp?: number
  binding?: string
  edition?: string
  dimensions?: string
  dimensions_structured?: {
    weight?: { value: number; unit: string }
    length?: { value: number; unit: string }
    width?: { value: number; unit: string }
    height?: { value: number; unit: string }
  }
  subjects?: string[]
}

export interface Author {
  name: string
  books?: Book[]
}

export interface Publisher {
  name: string
  books?: { isbn: string }[]
}

export async function searchBooks(query: string): Promise<Book[]> {
  try {
    const response = await fetch(`${BASE_URL}/books/${query}`, {
      headers: {
        Authorization: ISBNDB_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(`ISBNDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.books || []
  } catch (error) {
    console.error('Error searching books:', error)
    return []
  }
}

// Update the getBookByISBN function to include retry logic with exponential backoff
export async function getBookByISBN(isbn: string, retries = 3, delay = 1000): Promise<Book | null> {
  try {
    if (!isbn) {
      console.error('No ISBN provided')
      return null
    }

    // Try to fetch the book data with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${BASE_URL}/book/${isbn}`, {
          headers: {
            Authorization: ISBNDB_API_KEY!,
          },
        })

        // Handle rate limiting
        if (response.status === 429) {
          console.warn(
            `Rate limit hit (attempt ${attempt + 1}/${retries + 1}), waiting before retry...`
          )

          // If we've used all our retries, throw an error
          if (attempt === retries) {
            throw new Error('Rate limit exceeded after multiple retries')
          }

          // Wait with exponential backoff before retrying
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)))
          continue
        }

        // Handle other non-200 responses
        if (!response.ok) {
          console.error(`ISBNDB API error: ${response.status}`)
          return null
        }

        // Check if the response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Invalid response format, expected JSON')
          return null
        }

        const data = await response.json()
        return data.book || null
      } catch (retryError) {
        // If this is our last retry, rethrow the error
        if (attempt === retries) {
          throw retryError
        }

        // Otherwise wait and retry
        console.warn(
          `Error fetching book (attempt ${attempt + 1}/${retries + 1}), retrying...`,
          retryError
        )
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)))
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching book:', error)
    return null
  }
}

// New function to get multiple books by ISBN (bulk)
export async function getBulkBooks(isbns: string[]): Promise<Book[]> {
  if (!isbns.length) return []

  const batchSize = 100 // Use the documented limit for Basic plan
  const books: Book[] = []

  for (let i = 0; i < isbns.length; i += batchSize) {
    const batch = isbns.slice(i, i + batchSize)
    console.debug('Sending bulk batch to ISBNdb:', batch)
    try {
      // Use the documented bulk endpoint: POST /books with { isbns: [...] }
      const res = await fetch(`${BASE_URL}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: ISBNDB_API_KEY!,
        },
        body: JSON.stringify({ isbns: batch }),
      })

      const raw = await res.text()
      console.debug('Raw bulk response:', raw)

      if (!res.ok) {
        console.error(`ISBNdb bulk error ${res.status}:`, raw)
        continue
      }

      let data: any
      try {
        data = JSON.parse(raw)
      } catch (err) {
        console.error('Failed to parse bulk JSON:', err)
        continue
      }

      // According to the API docs, the response should have: { total, requested, data: [Book objects] }
      if (data.data && Array.isArray(data.data)) {
        books.push(...data.data)
        console.debug(
          `Received ${data.data.length} books from batch (total: ${data.total}, requested: ${data.requested})`
        )
      } else {
        console.warn('Unexpected bulk response shape:', data)
      }
    } catch (err) {
      console.error('Bulk request failed:', err)
    }

    // Rate limit: 1 request per second on Basic plan
    if (i + batchSize < isbns.length) {
      await new Promise((resolve) => setTimeout(resolve, 1100))
    }
  }

  console.debug(`Successfully fetched ${books.length} books out of ${isbns.length} ISBNs`)
  return books
}

// New function to search latest books
// Since ISBNdb doesn't have a dedicated "latest books" endpoint, we search by recent publication years
// According to ISBNdb API spec: /books/{query} with column=date_published searches books in a given year
// We use the current year and previous year to get recently published books
// Optionally accepts a year parameter to search for books in a specific year
export async function getLatestBooks(page = 1, pageSize = 20, year?: number): Promise<Book[]> {
  try {
    // Check if API key is available
    if (!ISBNDB_API_KEY) {
      console.warn('ISBNDB_API_KEY not set. Latest books feature is disabled.')
      return []
    }

    // Get current year and previous year to find recently published books
    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1

    // Use provided year, or determine which year to search based on page number
    // Page 1-10: Current year (more recent)
    // Page 11+: Previous year
    const yearToSearch = year !== undefined ? year : page <= 10 ? currentYear : previousYear

    console.log(`Searching for books published in ${yearToSearch} (page ${page})`)

    // According to ISBNdb API spec:
    // - column=date_published: "Only searches books in a given year, e.g. 1998"
    // - year: "Filter books by year of publication"
    // The issue: using /books/{year} treats {year} as a search query, matching titles containing "2025"
    // Solution: Use a generic search term ("a" - a very common letter) with column=date_published
    // and year parameter. This prevents the API from searching for the year in titles.
    // We then filter client-side by actual publication date to ensure accuracy.
    const response = await makeApiRequest(
      `${BASE_URL}/books/a?page=${page}&pageSize=${pageSize}&column=date_published&year=${yearToSearch}`
    )

    const data = await response.json()
    console.log(`ISBNdb response for ${yearToSearch} (page ${page}):`, {
      total: data.total,
      booksReturned: data.books?.length || 0,
    })

    // Additional validation: Filter by actual publication date to ensure we only get books
    // published in the requested year, regardless of what the API might return
    let filteredBooks = data.books || []
    if (filteredBooks.length > 0) {
      filteredBooks = filteredBooks.filter((book: Book) => {
        const datePublished = book.date_published || book.publish_date
        if (!datePublished) return false

        try {
          const date = new Date(datePublished)
          const bookYear = date.getFullYear()
          return bookYear === yearToSearch
        } catch {
          // If date parsing fails, check if the date string contains the year
          return datePublished.includes(yearToSearch.toString())
        }
      })

      console.log(
        `After filtering by actual publication date: ${filteredBooks.length} books (from ${data.books?.length || 0} total)`
      )
    }

    // If we got results, return them
    if (filteredBooks.length > 0) {
      return filteredBooks
    }

    // If no results for current year on page 1, try previous year as fallback (only if year wasn't explicitly provided)
    if (page === 1 && yearToSearch === currentYear && year === undefined) {
      console.log(`No books found for ${currentYear}, trying ${previousYear} as fallback`)
      const fallbackResponse = await makeApiRequest(
        `${BASE_URL}/books/a?page=${page}&pageSize=${pageSize}&column=date_published&year=${previousYear}`
      )
      const fallbackData = await fallbackResponse.json()

      // Filter fallback results as well
      let fallbackBooks = fallbackData.books || []
      if (fallbackBooks.length > 0) {
        fallbackBooks = fallbackBooks.filter((book: Book) => {
          const datePublished = book.date_published || book.publish_date
          if (!datePublished) return false

          try {
            const date = new Date(datePublished)
            return date.getFullYear() === previousYear
          } catch {
            return datePublished.includes(previousYear.toString())
          }
        })
      }

      return fallbackBooks
    }

    return []
  } catch (error) {
    console.error('Error fetching latest books:', error)
    // Return empty array instead of throwing to prevent app crashes
    return []
  }
}

// New function to search authors
export async function searchAuthors(query: string, page = 1, pageSize = 20): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/authors/${query}?page=${page}&pageSize=${pageSize}`, {
      headers: {
        Authorization: ISBNDB_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(`ISBNDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.authors || []
  } catch (error) {
    console.error('Error searching authors:', error)
    return []
  }
}

// New function to get books by author
export async function getBooksByAuthor(
  authorName: string,
  page = 1,
  pageSize = 20
): Promise<Book[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/author/${encodeURIComponent(authorName)}?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: ISBNDB_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`ISBNDB API error: ${response.status}`)
    }

    const data = await response.json()

    // The API returns books nested inside the author object
    if (data.books) {
      return data.books
    } else if (data.author && data.author.books) {
      return data.author.books
    }

    return []
  } catch (error) {
    console.error('Error fetching books by author:', error)
    return []
  }
}

// New function to search publishers
export async function searchPublishers(query: string, page = 1, pageSize = 20): Promise<string[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/publishers/${query}?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: ISBNDB_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`ISBNDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.publishers || []
  } catch (error) {
    console.error('Error searching publishers:', error)
    return []
  }
}

// New function to get books by publisher
export async function getBooksByPublisher(
  publisherName: string,
  page = 1,
  pageSize = 20
): Promise<{ isbn: string }[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/publisher/${encodeURIComponent(publisherName)}?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: ISBNDB_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`ISBNDB API error: ${response.status}`)
    }

    const data = await response.json()

    // The API returns books nested inside the publisher object
    if (data.books) {
      return data.books
    } else if (data.publisher && data.publisher.books) {
      return data.publisher.books
    }

    return []
  } catch (error) {
    console.error('Error fetching books by publisher:', error)
    return []
  }
}

// New function to get full book details from a list of ISBNs
export async function getFullBookDetailsByISBNs(isbnList: string[]): Promise<Book[]> {
  return getBulkBooks(isbnList)
}
