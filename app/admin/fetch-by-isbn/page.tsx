'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Book {
  title: string
  image: string
  authors: string[]
  date_published: string
  publisher: string
  pages: number
  isbn?: string
  description?: string
}

export default function FetchByIsbnPage() {
  const [isbnInput, setIsbnInput] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingBooks, setUploadingBooks] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    setBooks([])
    const isbns = isbnInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (isbns.length === 0) {
      setError('Please enter at least one ISBN.')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/isbn/fetch-by-isbn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbns }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch books')
      }
      const data = await res.json()
      setBooks(data.books)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadBook = async (book: Book, index: number) => {
    setUploadingBooks((prev) => new Set(prev).add(index))

    try {
      const bookData = {
        title: book.title,
        description: book.description || '',
        cover_image_url: book.image,
        author_names: book.authors,
        publisher_name: book.publisher,
        page_count: book.pages,
        published_date: book.date_published,
        isbn: book.isbn || '',
      }

      console.log('Sending book data to API:', bookData)

      const res = await fetch('/api/admin/add-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to upload book')
      }

      const result = await res.json()
      console.log('API Success:', result)

      toast({
        title: 'Success!',
        description: `Book "${book.title}" has been added to the system.`,
      })

      // Remove the book from the list after successful upload
      setBooks((prev) => prev.filter((_, i) => i !== index))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload book'
      console.error('Upload error:', err)
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploadingBooks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  return (
    <div className="p-6">
      <Link href="/admin/retrieve-books" className="text-blue-500 underline">
        &larr; Back to Retrieval Options
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-4">Fetch Books by ISBN</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">ISBN(s) (comma separated)</label>
        <input
          type="text"
          value={isbnInput}
          onChange={(e) => setIsbnInput(e.target.value)}
          placeholder="e.g. 9780984782857, 1423241886"
          className="w-full border rounded-sm px-3 py-2"
        />
      </div>

      <Button onClick={handleFetch} disabled={loading} className="mb-6">
        {loading ? 'Fetching...' : 'Fetch Books'}
      </Button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        {books.map((book, idx) => (
          <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image container with 2:3 aspect ratio */}
            <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
              {book.image ? (
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 16vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <h2 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3rem] leading-tight">
                {book.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-2 line-clamp-1">
                by {book.authors.join(', ')}
              </p>
              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <p>{new Date(book.date_published).toLocaleDateString()}</p>
                <p>Publisher: {book.publisher}</p>
                <p>{book.pages} pages</p>
                {book.isbn && <p>ISBN: {book.isbn}</p>}
              </div>

              <Button
                onClick={() => handleUploadBook(book, idx)}
                disabled={uploadingBooks.has(idx)}
                className="w-full"
                variant="default"
              >
                {uploadingBooks.has(idx) ? 'Adding...' : 'Add to System'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {books.length === 0 && !loading && !error && (
        <div className="text-center text-muted-foreground mt-8">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Enter ISBN(s) above and click "Fetch Books" to start</p>
        </div>
      )}
    </div>
  )
}
