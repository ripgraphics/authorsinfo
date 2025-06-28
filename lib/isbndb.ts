// Using built-in fetch and FormData provided by Next.js runtime

const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY
const BASE_URL = "https://api2.isbndb.com"

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
    console.error("Error searching books:", error)
    return []
  }
}

// Update the getBookByISBN function to include retry logic with exponential backoff
export async function getBookByISBN(isbn: string, retries = 3, delay = 1000): Promise<Book | null> {
  try {
    if (!isbn) {
      console.error("No ISBN provided")
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
          console.warn(`Rate limit hit (attempt ${attempt + 1}/${retries + 1}), waiting before retry...`)

          // If we've used all our retries, throw an error
          if (attempt === retries) {
            throw new Error("Rate limit exceeded after multiple retries")
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
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Invalid response format, expected JSON")
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
        console.warn(`Error fetching book (attempt ${attempt + 1}/${retries + 1}), retrying...`, retryError)
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)))
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching book:", error)
    return null
  }
}

// New function to get multiple books by ISBN (bulk)
export async function getBulkBooks(isbns: string[]): Promise<Book[]> {
  if (!isbns.length) return [];

  const batchSize = 100; // Use the documented limit for Basic plan
  const books: Book[] = [];

  for (let i = 0; i < isbns.length; i += batchSize) {
    const batch = isbns.slice(i, i + batchSize);
    console.debug('Sending bulk batch to ISBNdb:', batch);
    try {
      // Use the documented bulk endpoint: POST /books with { isbns: [...] }
      const res = await fetch(`${BASE_URL}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: ISBNDB_API_KEY!,
        },
        body: JSON.stringify({ isbns: batch }),
      });
      
      const raw = await res.text();
      console.debug('Raw bulk response:', raw);
      
      if (!res.ok) {
        console.error(`ISBNdb bulk error ${res.status}:`, raw);
        continue;
      }
      
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse bulk JSON:', err);
        continue;
      }
      
      // According to the API docs, the response should have: { total, requested, data: [Book objects] }
      if (data.data && Array.isArray(data.data)) {
        books.push(...data.data);
        console.debug(`Received ${data.data.length} books from batch (total: ${data.total}, requested: ${data.requested})`);
      } else {
        console.warn('Unexpected bulk response shape:', data);
      }
    } catch (err) {
      console.error('Bulk request failed:', err);
    }
    
    // Rate limit: 1 request per second on Basic plan
    if (i + batchSize < isbns.length) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }
  
  console.debug(`Successfully fetched ${books.length} books out of ${isbns.length} ISBNs`);
  return books;
}

// New function to search latest books
export async function getLatestBooks(page = 1, pageSize = 20): Promise<Book[]> {
  try {
    // Sort by newest books (this is an approximation since ISBNdb doesn't have a direct "latest books" endpoint)
    // We'll search with an empty query and sort by date if possible
    const response = await fetch(`${BASE_URL}/books/?page=${page}&pageSize=${pageSize}`, {
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
    console.error("Error fetching latest books:", error)
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
    console.error("Error searching authors:", error)
    return []
  }
}

// New function to get books by author
export async function getBooksByAuthor(authorName: string, page = 1, pageSize = 20): Promise<Book[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/author/${encodeURIComponent(authorName)}?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: ISBNDB_API_KEY!,
        },
      },
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
    console.error("Error fetching books by author:", error)
    return []
  }
}

// New function to search publishers
export async function searchPublishers(query: string, page = 1, pageSize = 20): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/publishers/${query}?page=${page}&pageSize=${pageSize}`, {
      headers: {
        Authorization: ISBNDB_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(`ISBNDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.publishers || []
  } catch (error) {
    console.error("Error searching publishers:", error)
    return []
  }
}

// New function to get books by publisher
export async function getBooksByPublisher(publisherName: string, page = 1, pageSize = 20): Promise<{ isbn: string }[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/publisher/${encodeURIComponent(publisherName)}?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: ISBNDB_API_KEY!,
        },
      },
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
    console.error("Error fetching books by publisher:", error)
    return []
  }
}

// New function to get full book details from a list of ISBNs
export async function getFullBookDetailsByISBNs(isbnList: string[]): Promise<Book[]> {
  return getBulkBooks(isbnList)
}
