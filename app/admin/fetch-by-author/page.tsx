'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { BookOpen, Check } from 'lucide-react'
import Image from 'next/image'

interface AuthorOption {
  id?: string
  name: string
  source: 'db' | 'external'
}

interface Book {
  title: string
  image: string
  authors: string[]
  date_published: string
  publisher: string
  pages: number
  isbn?: string
  isbn13?: string
  isInSystem?: boolean // Add flag to track if book is already in system
}

export default function FetchByAuthorPage() {
  const [authorQuery, setAuthorQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AuthorOption[]>([])
  const [selectedAuthorName, setSelectedAuthorName] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const pageSize = 100
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<any>(null)

  // Function to refresh book status (check which books are in system)
  const refreshBookStatus = async () => {
    if (books.length === 0) return

    const isbns = books.map((book: Book) => book.isbn13 || book.isbn).filter(Boolean)

    if (isbns.length === 0) return

    setRefreshingStatus(true)
    try {
      const checkRes = await fetch('/api/books/check-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbns }),
      })

      if (checkRes.ok) {
        const existingData = await checkRes.json()
        const existingIsbns = new Set(existingData.existingIsbns || [])

        // Update books with new status
        const updatedBooks = books.map((book: Book) => ({
          ...book,
          isInSystem: existingIsbns.has(book.isbn13 || book.isbn),
        }))

        setBooks(updatedBooks)

        // Clear any selections for books that are now in the system
        const currentSelection = new Set(selectedBooks)
        updatedBooks.forEach((book, idx) => {
          if (book.isInSystem) {
            const bookKey = `${book.title}-${book.authors.join('-')}-${idx}`
            currentSelection.delete(bookKey)
          }
        })
        setSelectedBooks(currentSelection)
      }
    } catch (error) {
      console.error('Error refreshing book status:', error)
    } finally {
      setRefreshingStatus(false)
    }
  }

  // Fetch author suggestions from local DB and external ISBNdb on query change
  useEffect(() => {
    if (!authorQuery.trim()) {
      setSuggestions([])
      return
    }
    const handler = setTimeout(async () => {
      try {
        const [dbRes, extRes] = await Promise.all([
          fetch(`/api/db/authors?search=${encodeURIComponent(authorQuery)}`).then((r) => r.json()),
          fetch(`/api/isbn/search-authors?q=${encodeURIComponent(authorQuery)}`).then((r) =>
            r.json()
          ),
        ])
        // Map DB suggestions
        const dbOpts: AuthorOption[] = (dbRes.authors || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          source: 'db',
        }))
        // Map external suggestions
        const extOpts: AuthorOption[] = (extRes.authors || []).map((name: string) => ({
          name,
          source: 'external',
        }))
        // Filter out duplicates (by name)
        const filteredExt = extOpts.filter(
          (e) => !dbOpts.some((d) => d.name.toLowerCase() === e.name.toLowerCase())
        )
        setSuggestions([...dbOpts, ...filteredExt])
      } catch (err) {
        console.error('Error fetching author suggestions:', err)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [authorQuery])

  const handleFetch = async (newPage = 1) => {
    if (!selectedAuthorName) {
      setError('Please select an author')
      return
    }
    setLoading(true)
    setError(null)
    setBooks([])
    setSelectedBooks(new Set())
    setImportResult(null)
    setPage(newPage)
    try {
      const res = await fetch('/api/isbn/fetch-by-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: selectedAuthorName, page: newPage, pageSize }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch books')
      }
      const data = await res.json()
      const fetchedBooks = data.books || []

      // Check which books are already in the system
      if (fetchedBooks.length > 0) {
        const isbns = fetchedBooks.map((book: Book) => book.isbn13 || book.isbn).filter(Boolean)

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

              // Mark books that are already in the system
              const booksWithStatus = fetchedBooks.map((book: Book) => ({
                ...book,
                isInSystem: existingIsbns.has(book.isbn13 || book.isbn),
              }))

              setBooks(booksWithStatus)
            } else {
              setBooks(fetchedBooks)
            }
          } catch (checkError) {
            console.error('Error checking existing books:', checkError)
            setBooks(fetchedBooks)
          }
        } else {
          setBooks(fetchedBooks)
        }
      } else {
        setBooks(fetchedBooks)
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleBookSelection = (bookKey: string) => {
    // Find the book to check if it's already in the system
    const bookIndex = parseInt(bookKey.split('-').pop() || '0')
    const book = books[bookIndex]

    // Don't allow selection of books already in the system
    if (book?.isInSystem) {
      return
    }

    const newSelection = new Set(selectedBooks)
    if (newSelection.has(bookKey)) {
      newSelection.delete(bookKey)
    } else {
      newSelection.add(bookKey)
    }
    setSelectedBooks(newSelection)
  }

  const selectAllBooks = () => {
    // Only select books that are not already in the system
    const availableBookKeys = books
      .map((book, idx) => ({ book, key: `${book.title}-${book.authors.join('-')}-${idx}` }))
      .filter(({ book }) => !book.isInSystem)
      .map(({ key }) => key)
    setSelectedBooks(new Set(availableBookKeys))
  }

  const deselectAllBooks = () => {
    setSelectedBooks(new Set())
  }

  const importSelectedBooks = async () => {
    if (selectedBooks.size === 0) {
      setError('Please select at least one book to import')
      return
    }

    setImporting(true)
    setError(null)
    setImportResult(null)

    try {
      // Get the selected books (filter out any that are already in system)
      const selectedBookKeys = Array.from(selectedBooks)
      const booksToImport = selectedBookKeys
        .map((key) => {
          const parts = key.split('-')
          const idx = parts.pop()
          return books[parseInt(idx || '0')]
        })
        .filter((book) => book && !book.isInSystem)

      console.log('Books to import:', booksToImport)

      if (booksToImport.length === 0) {
        setError('No valid books found for import.')
        return
      }

      // Import the books directly (send book objects instead of just ISBNs)
      const res = await fetch('/api/books/import-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: booksToImport }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to import books')
      }

      const result = await res.json()
      console.log('Import result:', result)
      setImportResult(result)

      // Clear selection after successful import
      setSelectedBooks(new Set())

      // Refresh the book status to show newly imported books as "In System"
      if (result.added > 0) {
        await refreshBookStatus()
      }
    } catch (err) {
      console.error('Import error:', err)
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred during import')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-4">
      <Link href="/admin/retrieve-books" className="text-blue-500 underline">
        &larr; Back to Retrieval Options
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-4">Fetch Books by Author</h1>

      <div className="mb-4 relative">
        <label className="block mb-1 font-medium">Search Author</label>
        <input
          type="text"
          value={authorQuery}
          onChange={(e) => {
            setAuthorQuery(e.target.value)
            setSelectedAuthorName('')
          }}
          placeholder="Type author name"
          className="w-full border rounded-sm px-3 py-2"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded-sm w-full max-h-60 overflow-auto mt-1">
            {suggestions.map((auth, index) => (
              <li
                key={auth.id || `external-${auth.name}-${index}`}
                onClick={() => {
                  setSelectedAuthorName(auth.name)
                  setAuthorQuery(auth.name)
                  setSuggestions([])
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {auth.name} {auth.id && `(#${auth.id})`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => handleFetch(1)}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Fetching...' : 'Fetch Books'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {books.length > 0 && (
        <>
          <div className="mt-4 flex items-center gap-4">
            <button
              disabled={page <= 1 || loading}
              onClick={() => handleFetch(page - 1)}
              className="px-3 py-1 bg-gray-200 rounded-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span>Page {page}</span>
            <button
              disabled={books.length < pageSize || loading}
              onClick={() => handleFetch(page + 1)}
              className="px-3 py-1 bg-gray-200 rounded-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedBooks.size} of {books.filter((book) => !book.isInSystem).length} available
              books selected
              {books.filter((book) => book.isInSystem).length > 0 && (
                <span className="ml-2 text-green-600">
                  ({books.filter((book) => book.isInSystem).length} already in system)
                </span>
              )}
              {refreshingStatus && (
                <span className="ml-2 text-blue-600 text-xs">Updating status...</span>
              )}
            </span>
            <button
              onClick={selectAllBooks}
              className="px-3 py-1 bg-green-200 text-green-800 rounded-sm hover:bg-green-300"
            >
              Select All Available
            </button>
            <button
              onClick={deselectAllBooks}
              className="px-3 py-1 bg-red-200 text-red-800 rounded-sm hover:bg-red-300"
            >
              Deselect All
            </button>
            <button
              onClick={importSelectedBooks}
              disabled={selectedBooks.size === 0 || importing}
              className="px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 disabled:opacity-50"
            >
              {importing
                ? 'Importing...'
                : `Import ${selectedBooks.size} Selected Book${selectedBooks.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}

      {importResult && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-sm">
          <h3 className="text-lg font-semibold mb-2">Import Result</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{importResult.added || 0}</p>
              <p className="text-sm text-gray-600">Added</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{importResult.duplicates || 0}</p>
              <p className="text-sm text-gray-600">Duplicates</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{importResult.errors || 0}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
          </div>
          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-600">Error Details:</h4>
              <ul className="list-disc list-inside text-sm">
                {importResult.errorDetails.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {importResult.logs && importResult.logs.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Logs:</h4>
              <pre className="bg-white p-4 overflow-auto max-h-64 whitespace-pre-wrap text-sm border rounded-sm">
                {importResult.logs.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {books.map((book, idx) => {
          const bookKey = `${book.title}-${book.authors.join('-')}-${idx}`
          const isSelected = selectedBooks.has(bookKey)
          const isInSystem = book.isInSystem

          return (
            <div
              key={bookKey}
              className={`relative transition-transform hover:scale-105 ${
                !isInSystem ? 'cursor-pointer' : ''
              }`}
              onClick={() => !isInSystem && toggleBookSelection(bookKey)}
            >
              <Card
                className={`overflow-hidden h-full ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${isInSystem ? 'opacity-75' : ''}`}
              >
                {/* Image container with 2:3 aspect ratio */}
                <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                  {book.image ? (
                    <Image src={book.image} alt={book.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Checkbox/Checkmark overlay */}
                  <div className="absolute top-2 left-2">
                    {isInSystem ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBookSelection(bookKey)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2"
                      />
                    )}
                  </div>

                  {/* "In System" badge */}
                  {isInSystem && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-sm">
                      In System
                    </div>
                  )}
                </div>

                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    by {book.authors.join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(book.date_published).getFullYear()}
                  </p>
                  <p className="text-xs text-muted-foreground">{book.pages} pages</p>
                  {(book.isbn || book.isbn13) && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      ISBN: {book.isbn13 || book.isbn}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
