'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  Check,
  Calendar,
  User,
  Building,
  Hash,
  FileText,
  Star,
  Link as LucideLink,
  Download,
  RefreshCw,
  Info,
  AlertCircle,
} from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'

interface Book {
  id?: string
  title: string
  title_long?: string
  isbn: string
  isbn13: string
  publisher?: string
  date_published?: string
  authors?: string[]
  subjects?: string[]
  overview?: string
  synopsis?: string
  excerpt?: string
  pages?: number
  language?: string
  binding?: string
  dimensions?: string
  msrp?: number
  dewey_decimal?: string[]
  reviews?: string[]
  other_isbns?: Array<{ isbn: string; binding: string }>
  related?: { type: string }
  image?: string
  image_original?: string
  isbndb_last_updated?: string
  isbndb_data_version?: string
  raw_isbndb_data?: any
}

interface SearchResponse {
  total: number
  books: Book[]
  searchType: string
  year: string
  page: number
  pageSize: number
}

interface ImportResponse {
  total?: number
  stored?: number
  added?: number
  books?: Book[]
  duplicates?: number
  errors?: number
  errorDetails?: string[]
}

export default function NewBooksPage() {
  const [subject, setSubject] = useState('')
  const [year, setYear] = useState('')
  const [searchType, setSearchType] = useState<'subject'>('subject')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState<any>(null)
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'author'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [autoFetchAll, setAutoFetchAll] = useState(false)
  const [fetchingAllPages, setFetchingAllPages] = useState(false)
  const [allFetchedBooks, setAllFetchedBooks] = useState<Book[]>([])
  const [maxPagesToFetch, setMaxPagesToFetch] = useState(10) // Default to 10 pages max
  const [apiTotal, setApiTotal] = useState(0) // Store the actual API total

  const fetchBooks = async (targetPage?: number, accumulateResults: boolean = false) => {
    setLoading(true)
    if (accumulateResults) {
      setFetchingAllPages(true)
    }
    try {
      // Validate subject parameter
      if (!subject || subject.trim() === '') {
        throw new Error('Subject is required')
      }

      const currentPage = targetPage || page
      const params = new URLSearchParams({
        subject: subject.trim(),
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchType: 'subject', // Explicitly set to 'subject' to avoid defaulting to 'recent'
        ...(year && year.trim() !== '' && { year: year.trim() }),
      })

      const response = await fetch(`/api/isbn/fetch-by-year?${params}`)
      if (!response.ok) {
        // Try to get the actual error message from the API response
        let errorMessage = 'Failed to fetch books'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = `Failed to fetch books: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data: SearchResponse = await response.json()
      const fetchedBooks = data.books || []

      // Check which books are already in the system and filter them out
      if (fetchedBooks.length > 0) {
        // Collect all ISBNs (both ISBN-10 and ISBN-13) from fetched books
        const isbns: string[] = []
        fetchedBooks.forEach((book) => {
          if (book.isbn13) isbns.push(book.isbn13)
          if (book.isbn) isbns.push(book.isbn)
        })

        if (isbns.length > 0) {
          try {
            const checkRes = await fetch('/api/books/check-existing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isbns }),
            })

            if (checkRes.ok) {
              const existingData = await checkRes.json()
              const existingIsbns = new Set(existingData.existingIsbns || [])

              // Filter out books that are already in the system
              const newBooks = fetchedBooks.filter((book) => {
                // Check both ISBN-10 and ISBN-13
                const isbn10 =
                  book.isbn && /^[0-9X]{10}$/.test(book.isbn.replace(/[-\s]/g, ''))
                    ? book.isbn.replace(/[-\s]/g, '')
                    : null
                const isbn13 =
                  book.isbn13 && /^[0-9]{13}$/.test(book.isbn13.replace(/[-\s]/g, ''))
                    ? book.isbn13.replace(/[-\s]/g, '')
                    : null
                // Also check if the generic isbn field is actually an ISBN-13
                const isbnAsIsbn13 =
                  book.isbn && /^[0-9]{13}$/.test(book.isbn.replace(/[-\s]/g, ''))
                    ? book.isbn.replace(/[-\s]/g, '')
                    : null

                // Return false (filter out) if any ISBN matches an existing one
                return !(
                  (isbn10 && existingIsbns.has(isbn10)) ||
                  (isbn13 && existingIsbns.has(isbn13)) ||
                  (isbnAsIsbn13 && existingIsbns.has(isbnAsIsbn13))
                )
              })

              if (accumulateResults) {
                // Add to accumulated results
                setAllFetchedBooks((prev) => {
                  // Create set of all ISBNs from previous books
                  const existingIsbns = new Set<string>()
                  prev.forEach((b) => {
                    if (b.isbn13) existingIsbns.add(b.isbn13.replace(/[-\s]/g, ''))
                    if (b.isbn) {
                      const normalized = b.isbn.replace(/[-\s]/g, '')
                      existingIsbns.add(normalized)
                    }
                  })

                  const uniqueNewBooks = newBooks.filter((b) => {
                    const isbn10 =
                      b.isbn && /^[0-9X]{10}$/.test(b.isbn.replace(/[-\s]/g, ''))
                        ? b.isbn.replace(/[-\s]/g, '')
                        : null
                    const isbn13 =
                      b.isbn13 && /^[0-9]{13}$/.test(b.isbn13.replace(/[-\s]/g, ''))
                        ? b.isbn13.replace(/[-\s]/g, '')
                        : null
                    const isbnAsIsbn13 =
                      b.isbn && /^[0-9]{13}$/.test(b.isbn.replace(/[-\s]/g, ''))
                        ? b.isbn.replace(/[-\s]/g, '')
                        : null

                    return !(
                      (isbn10 && existingIsbns.has(isbn10)) ||
                      (isbn13 && existingIsbns.has(isbn13)) ||
                      (isbnAsIsbn13 && existingIsbns.has(isbnAsIsbn13))
                    )
                  })
                  return [...prev, ...uniqueNewBooks]
                })
              } else {
                setBooks(newBooks)
                setTotal(data.total || 0)
                setApiTotal(data.total || 0) // Store API total
              }

              const filteredCount = fetchedBooks.length - newBooks.length
              toast({
                title: 'Books fetched successfully',
                description: `Found ${newBooks.length} new books${filteredCount > 0 ? ` (${filteredCount} already in system)` : ''}${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
              })
            } else {
              // If check fails, show all books
              if (accumulateResults) {
                setAllFetchedBooks((prev) => [...prev, ...fetchedBooks])
              } else {
                setBooks(fetchedBooks)
                setTotal(data.total || 0)
                setApiTotal(data.total || 0) // Store API total
              }
              toast({
                title: 'Books fetched successfully',
                description: `Found ${data.total} books${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
              })
            }
          } catch (checkError) {
            console.error('Error checking existing books:', checkError)
            // If check fails, show all books
            if (accumulateResults) {
              setAllFetchedBooks((prev) => [...prev, ...fetchedBooks])
            } else {
              setBooks(fetchedBooks)
              setTotal(data.total || 0)
            }
            toast({
              title: 'Books fetched successfully',
              description: `Found ${data.total} books${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
            })
          }
        } else {
          if (accumulateResults) {
            setAllFetchedBooks((prev) => [...prev, ...fetchedBooks])
          } else {
            setBooks(fetchedBooks)
            setTotal(data.total || 0)
            setApiTotal(data.total || 0) // Store API total
          }
          toast({
            title: 'Books fetched successfully',
            description: `Found ${data.total} books${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
          })
        }
      } else {
        setBooks([])
        setTotal(0)
        toast({
          title: 'No books found',
          description: `No books found${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
        })
      }
    } catch (error) {
      console.error('Error fetching books:', error)
      toast({
        title: 'Error fetching books',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      if (accumulateResults) {
        setFetchingAllPages(false)
      }
    }
  }

  const fetchAllPages = async () => {
    if (!subject || subject.trim() === '') {
      toast({
        title: 'Subject required',
        description: 'Please enter a subject to search',
        variant: 'destructive',
      })
      return
    }

    // Warn user about API limits
    const MAX_PAGES = 50 // Maximum pages to fetch (prevents exceeding daily API limits)
    const MAX_BOOKS = 5000 // Maximum books to fetch per day

    setFetchingAllPages(true)
    setAllFetchedBooks([])
    const accumulatedBooks: Book[] = []
    let consecutiveErrors = 0
    const MAX_CONSECUTIVE_ERRORS = 5 // Stop after 5 consecutive errors
    let pagesFetched = 0 // Track how many pages we actually fetched

    try {
      // First, fetch page 1 to get total count
      const firstPageParams = new URLSearchParams({
        subject: subject.trim(),
        page: '1',
        pageSize: pageSize.toString(),
        searchType: 'subject',
        ...(year && year.trim() !== '' && { year: year.trim() }),
      })

      const firstResponse = await fetch(`/api/isbn/fetch-by-year?${firstPageParams}`)
      if (!firstResponse.ok) {
        if (firstResponse.status === 403) {
          throw new Error(
            'ISBNdb API daily limit exceeded (403). Please try again tomorrow or upgrade your API plan.'
          )
        }
        throw new Error('Failed to fetch first page')
      }

      const firstData: SearchResponse = await firstResponse.json()
      const totalResults = firstData.total || 0
      setApiTotal(totalResults) // Store the actual API total
      const maxPages = Math.min(maxPagesToFetch, MAX_PAGES) // Use user-selected max pages
      const totalPages = Math.min(Math.ceil(totalResults / pageSize), maxPages)
      const estimatedBooks = totalPages * pageSize

      // Store first page books
      const firstPageBooks = firstData.books || []
      accumulatedBooks.push(...firstPageBooks)

      // Warn if this will fetch a lot of books
      if (estimatedBooks > MAX_BOOKS) {
        const confirmed = window.confirm(
          `This will fetch approximately ${estimatedBooks} books (${totalPages} pages). ` +
            `This may exceed your daily API limit. Continue anyway?`
        )
        if (!confirmed) {
          setFetchingAllPages(false)
          return
        }
      }

      toast({
        title: 'Fetching all pages',
        description: `Fetching up to ${totalPages} pages (max ${MAX_PAGES} pages to prevent API limit issues)`,
      })

      // Process remaining pages with strict limits (start from page 2 since we already have page 1)
      for (let p = 2; p <= totalPages && accumulatedBooks.length < MAX_BOOKS; p++) {
        const params = new URLSearchParams({
          subject: subject.trim(),
          page: p.toString(),
          pageSize: pageSize.toString(),
          searchType: 'subject',
          ...(year && year.trim() !== '' && { year: year.trim() }),
        })

        let retries = 2 // Reduced retries to fail faster
        let success = false

        while (retries > 0 && !success) {
          const response = await fetch(`/api/isbn/fetch-by-year?${params}`)

          if (response.status === 403) {
            // Daily limit exceeded - stop immediately
            throw new Error(
              'ISBNdb API daily limit exceeded (403). Please try again tomorrow or upgrade your API plan.'
            )
          }

          if (response.status === 429) {
            // Rate limited - wait much longer and retry
            const retryAfter = response.headers.get('Retry-After')
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000 // Wait 60 seconds by default
            console.warn(`Rate limited on page ${p}. Waiting ${waitTime / 1000}s before retry...`)
            toast({
              title: 'Rate limited',
              description: `Waiting ${waitTime / 1000} seconds before continuing...`,
              variant: 'default',
            })
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            retries--
            continue
          }

          if (!response.ok) {
            console.warn(`Failed to fetch page ${p}: ${response.status} ${response.statusText}`)
            consecutiveErrors++
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(
                `Too many consecutive errors (${consecutiveErrors}). Stopping to prevent further API usage.`
              )
            }
            retries--
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds on error
            }
            continue
          }

          const data: SearchResponse = await response.json()
          const fetchedBooks = data.books || []
          accumulatedBooks.push(...fetchedBooks)
          consecutiveErrors = 0 // Reset error counter on success
          success = true
          pagesFetched = p // Track successful page fetch
        }

        if (!success) {
          console.error(`Failed to fetch page ${p} after all retries`)
          consecutiveErrors++
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            throw new Error(`Too many consecutive errors. Stopping to prevent further API usage.`)
          }
        }

        // Longer delay to avoid overwhelming the API (2 seconds minimum, more for bulk operations)
        if (p < totalPages && accumulatedBooks.length < MAX_BOOKS) {
          const delay = 2000 // 2 seconds between pages
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      // API route already filters out existing books, so we just need to deduplicate within accumulated set
      if (accumulatedBooks.length > 0) {
        // Deduplicate books within accumulated set (in case same book appears on multiple pages)
        const seenIsbns = new Set<string>()
        const finalBooks = accumulatedBooks.filter((book) => {
          const isbn10 =
            book.isbn && /^[0-9X]{10}$/.test(book.isbn.replace(/[-\s]/g, ''))
              ? book.isbn.replace(/[-\s]/g, '')
              : null
          const isbn13 =
            book.isbn13 && /^[0-9]{13}$/.test(book.isbn13.replace(/[-\s]/g, ''))
              ? book.isbn13.replace(/[-\s]/g, '')
              : null
          const isbnAsIsbn13 =
            book.isbn && /^[0-9]{13}$/.test(book.isbn.replace(/[-\s]/g, ''))
              ? book.isbn.replace(/[-\s]/g, '')
              : null

          // Check if we've seen this ISBN before in accumulated set
          const key = isbn13 || isbnAsIsbn13 || isbn10
          if (key && seenIsbns.has(key)) {
            return false // Duplicate within accumulated set
          }
          if (key) seenIsbns.add(key)
          return true
        })

        // Store all fetched books (already filtered by API, just deduplicated)
        setAllFetchedBooks(finalBooks)
        // Reset to page 1 and show first page
        setPage(1)
        const firstPageBooks = finalBooks.slice(0, pageSize)
        setBooks(firstPageBooks)
        // Set total to actual API total, not accumulated books count
        setTotal(apiTotal || finalBooks.length)

        toast({
          title: 'All pages fetched',
          description: `Fetched ${finalBooks.length} new books from ${pagesFetched} pages${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}. Use pagination to browse through all books.`,
        })
      } else {
        setBooks([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Error fetching all pages:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      // Set books we've collected so far
      if (accumulatedBooks.length > 0) {
        setAllFetchedBooks(accumulatedBooks)
        setPage(1)
        const firstPageBooks = accumulatedBooks.slice(0, pageSize)
        setBooks(firstPageBooks)
        setTotal(apiTotal || accumulatedBooks.length)
      }

      toast({
        title: 'Error fetching all pages',
        description:
          errorMessage.includes('403') || errorMessage.includes('daily limit')
            ? `${errorMessage} You've fetched ${accumulatedBooks.length} books so far.`
            : errorMessage,
        variant: 'destructive',
      })
    } finally {
      setFetchingAllPages(false)
    }
  }

  const importSelectedBooks = async () => {
    if (selectedBooks.size === 0) {
      toast({
        title: 'No books selected',
        description: 'Please select at least one book to import',
        variant: 'destructive',
      })
      return
    }

    setImporting(true)
    setImportProgress(0)
    setImportStats(null)

    try {
      // Get selected books from current view (already have all ISBNdb data)
      const selectedBookList = books.filter((book) => selectedBooks.has(book.isbn13 || book.isbn))

      // CRITICAL: Send book objects directly - NO additional ISBNdb API calls needed
      // All data is already in the book objects from the search results
      const response = await fetch('/api/books/import-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          books: selectedBookList, // Send complete book objects with all data
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import books')
      }

      const data: ImportResponse = await response.json()
      setImportProgress(100)
      setImportStats({
        total: data.total || selectedBookList.length,
        stored: data.added || data.stored || 0,
        success: true,
      })

      toast({
        title: 'Import completed',
        description: `Successfully imported ${data.added || data.stored || 0} out of ${data.total || selectedBookList.length} books`,
      })

      // Clear selection
      setSelectedBooks(new Set())

      // Refresh the book list to show updated status
      await fetchBooks()
    } catch (error) {
      console.error('Error importing books:', error)
      setImportStats({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      })
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  const toggleBookSelection = (isbn: string) => {
    const newSelection = new Set(selectedBooks)
    if (newSelection.has(isbn)) {
      newSelection.delete(isbn)
    } else {
      newSelection.add(isbn)
    }
    setSelectedBooks(newSelection)
  }

  const selectAllBooks = () => {
    const allIsbns = books.map((book) => book.isbn13 || book.isbn)
    setSelectedBooks(new Set(allIsbns))
  }

  const clearSelection = () => {
    setSelectedBooks(new Set())
  }

  const sortedBooks = [...books].sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortBy) {
      case 'date':
        aValue = a.date_published || ''
        bValue = b.date_published || ''
        break
      case 'title':
        aValue = a.title || ''
        bValue = b.title || ''
        break
      case 'author':
        aValue = a.authors?.[0] || ''
        bValue = b.authors?.[0] || ''
        break
      default:
        return 0
    }

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue)
    } else {
      return bValue.localeCompare(aValue)
    }
  })

  // Clear allFetchedBooks when subject or year changes
  useEffect(() => {
    setAllFetchedBooks([])
    setPage(1)
  }, [subject, year])

  // Use allFetchedBooks for pagination if available, otherwise fetch from API
  useEffect(() => {
    if (allFetchedBooks.length > 0) {
      // Paginate through allFetchedBooks
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const pageBooks = allFetchedBooks.slice(startIndex, endIndex)
      setBooks(pageBooks)
    } else if (subject.trim() !== '') {
      // Fetch from API if we don't have allFetchedBooks
      fetchBooks()
    }
  }, [page, pageSize, allFetchedBooks]) // Removed subject and year to prevent conflicts

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const truncateText = (text?: string, maxLength: number = 150) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Search Books by Subject</h1>
          <p className="text-muted-foreground">
            Search and import books by subject from ISBNdb with comprehensive data collection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => fetchBooks()}
            disabled={loading || !subject.trim()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Search
          </Button>
        </div>
      </div>

      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., physics, fiction, history"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year (Optional)</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2025"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value))
                  setAllFetchedBooks([]) // Clear allFetchedBooks when pageSize changes
                  setPage(1) // Reset to page 1
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {autoFetchAll && (
              <div className="space-y-2">
                <Label htmlFor="maxPages">Max Pages to Fetch</Label>
                <Input
                  id="maxPages"
                  type="number"
                  value={maxPagesToFetch}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 10
                    setMaxPagesToFetch(Math.min(Math.max(1, value), 50)) // Clamp between 1 and 50
                  }}
                  min="1"
                  max="50"
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum {maxPagesToFetch} pages (max 50 to prevent API limits)
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                value={sortBy}
                onValueChange={(value: 'date' | 'title' | 'author') => setSortBy(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Publication Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="outline"
              size="sm"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Progress */}
      {importing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Importing Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={importProgress} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Processing {selectedBooks.size} selected books...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importStats && (
        <Alert
          className={
            importStats.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }
        >
          {importStats.success ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={importStats.success ? 'text-green-800' : 'text-red-800'}>
            {importStats.success
              ? `Successfully imported ${importStats.stored} out of ${importStats.total} books`
              : `Import failed: ${importStats.error}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            {allFetchedBooks.length > 0 ? (
              <>
                Showing {allFetchedBooks.length} fetched books
                {subject ? ` for subject "${subject}"` : ''}
                {year ? ` in ${year}` : ''} (Total available: {apiTotal || total})
              </>
            ) : (
              <>
                Found {total} books{subject ? ` for subject "${subject}"` : ''}
                {year ? ` in ${year}` : ''}
              </>
            )}
          </p>
          <Badge variant="secondary">
            Page {page} of{' '}
            {allFetchedBooks.length > 0
              ? Math.ceil(allFetchedBooks.length / pageSize)
              : Math.ceil(total / pageSize)}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 border-r pr-2">
            <Label
              htmlFor="auto-fetch"
              className="flex items-center space-x-2 cursor-pointer text-sm"
            >
              <input
                id="auto-fetch"
                type="checkbox"
                checked={autoFetchAll}
                onChange={(e) => setAutoFetchAll(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Auto-fetch all pages</span>
            </Label>
            {autoFetchAll && (
              <>
                <Button
                  onClick={fetchAllPages}
                  disabled={fetchingAllPages || !subject.trim() || allFetchedBooks.length > 0}
                  variant="outline"
                  size="sm"
                >
                  {fetchingAllPages ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Fetching all pages...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Fetch All Pages
                    </>
                  )}
                </Button>
                {allFetchedBooks.length > 0 && (
                  <Button
                    onClick={() => {
                      setAllFetchedBooks([])
                      setPage(1)
                      fetchBooks(1)
                    }}
                    variant="outline"
                    size="sm"
                    title="Clear fetched books and return to single-page mode"
                  >
                    Clear Fetched
                  </Button>
                )}
              </>
            )}
          </div>
          <Button
            onClick={selectAllBooks}
            variant="outline"
            size="sm"
            disabled={books.length === 0}
          >
            Select All
          </Button>
          <Button
            onClick={clearSelection}
            variant="outline"
            size="sm"
            disabled={selectedBooks.size === 0}
          >
            Clear Selection
          </Button>
          <Button
            onClick={importSelectedBooks}
            disabled={selectedBooks.size === 0 || importing}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Import Selected ({selectedBooks.size})
          </Button>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sortedBooks.map((book, index) => {
          const isbn = book.isbn13 || book.isbn
          const uniqueKey = `${isbn}-${index}-${book.title?.slice(0, 20) || ''}`
          const isSelected = selectedBooks.has(isbn)
          const hasEnhancedData =
            book.excerpt || book.reviews || book.other_isbns || book.dewey_decimal

          return (
            <Card
              key={uniqueKey}
              className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Checkbox */}
              <div className="absolute top-2 right-2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleBookSelection(isbn)}
                  className="h-4 w-4"
                />
              </div>

              <CardContent className="p-3 space-y-2">
                {/* Book Cover */}
                {book.image ? (
                  <div className="relative w-full aspect-[2/3] rounded-sm overflow-hidden bg-gray-100 mb-2">
                    <Image
                      src={book.image}
                      alt={book.title || 'Book cover'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 16vw"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[2/3] rounded-sm bg-gray-100 flex items-center justify-center mb-2">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Title - Exactly 2 lines (min and max) */}
                <h3 className="text-sm font-semibold leading-[1.25rem] line-clamp-2 h-[2.5rem] overflow-hidden">
                  {book.title}
                </h3>

                {/* Author - Exactly 2 lines (min and max) */}
                {book.authors && book.authors.length > 0 && (
                  <p className="text-xs text-muted-foreground leading-[1rem] line-clamp-2 h-[2rem] overflow-hidden">
                    {book.authors.join(', ')}
                  </p>
                )}

                {/* Date */}
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(book.date_published)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {((allFetchedBooks.length > 0 && allFetchedBooks.length > pageSize) ||
        (allFetchedBooks.length === 0 && total > pageSize)) && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of{' '}
            {allFetchedBooks.length > 0
              ? Math.ceil(allFetchedBooks.length / pageSize)
              : Math.ceil(total / pageSize)}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={
              page >=
              (allFetchedBooks.length > 0
                ? Math.ceil(allFetchedBooks.length / pageSize)
                : Math.ceil(total / pageSize))
            }
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {books.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {subject.trim() === '' ? (
                <p className="text-muted-foreground">Enter a subject above to search for books</p>
              ) : (
                <p className="text-muted-foreground">No books found for the selected criteria</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
