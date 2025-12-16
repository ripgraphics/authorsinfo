'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, CheckCircle } from 'lucide-react'
import { cleanSynopsis } from '@/utils/textUtils'
import { addBookFromISBNDB } from '@/app/actions/add-book'

interface BookData {
  title: string
  title_long?: string
  isbn?: string
  isbn13?: string
  authors?: string[]
  publisher?: string
  publish_date?: string
  date_published?: string
  image?: string
  image_original?: string
  synopsis?: string
  overview?: string
  excerpt?: string
  language?: string
  pages?: number
  binding?: string
  edition?: string
  dimensions?: string
  dimensions_structured?: any
  msrp?: number
  subjects?: string[]
  dewey_decimal?: string[]
  [key: string]: any
}

interface AddBookClientProps {
  isbn: string
  serverBookData?: BookData | null
  existingBook?: any
  otherBooksByAuthor?: any[]
  otherBooksByPublisher?: any[]
}

export function AddBookClient({ 
  isbn, 
  serverBookData,
  existingBook,
  otherBooksByAuthor = [],
  otherBooksByPublisher = []
}: AddBookClientProps) {
  const router = useRouter()
  const [bookData, setBookData] = useState<BookData | null>(serverBookData || null)
  const [isLoading, setIsLoading] = useState(!serverBookData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Check sessionStorage first to avoid redundant API calls
    const bookDataKey = `isbndb_book_${isbn}`
    const storedData = sessionStorage.getItem(bookDataKey)
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        setBookData(parsedData)
        setIsLoading(false)
        // Clear from sessionStorage after use
        sessionStorage.removeItem(bookDataKey)
        return
      } catch (e) {
        console.error('Failed to parse stored book data:', e)
      }
    }

    // If no stored data and no server data, we need to fetch
    if (!serverBookData && !storedData) {
      // The server should have fetched it, but if not, we could fetch here
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [isbn, serverBookData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">Add Book to Library</h1>
          <p className="text-muted-foreground mt-2">Loading book details...</p>
        </div>
      </div>
    )
  }

  if (!bookData) {
    return (
      <div className="space-y-6">
        <div className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">Add Book to Library</h1>
          <p className="text-muted-foreground mt-2">Book not found. Please try searching again.</p>
        </div>
      </div>
    )
  }

  const {
    title: bookTitle,
    title_long: bookTitleLong,
    isbn: bookIsbn,
    isbn13: bookIsbn13,
    authors: bookAuthors,
    publisher: bookPublisher,
    publish_date: bookPublishDate,
    date_published: bookDatePublished,
    image: bookImage,
    image_original: bookImageOriginal,
    synopsis: bookSynopsis,
    overview: bookOverview,
    excerpt: bookExcerpt,
    language: bookLanguage,
    pages: bookPages,
    binding: bookBinding,
    edition: bookEdition,
    dimensions: bookDimensions,
    dimensions_structured: bookDimensionsStructured,
    msrp: bookMsrp,
    subjects: bookSubjects,
    dewey_decimal: bookDeweyDecimal,
  } = bookData

  // Use image_original if available, otherwise use image
  const coverImageUrl = bookImageOriginal || bookImage
  const cleanedSynopsis = bookSynopsis ? cleanSynopsis(bookSynopsis) : null

  // Handle adding the book
  const handleAddBook = async () => {
    if (!bookData) return
    
    setIsSubmitting(true)
    try {
      const result = await addBookFromISBNDB({
        title: bookTitle,
        isbn: bookIsbn,
        isbn13: bookIsbn13,
        authors: bookAuthors,
        publisher: bookPublisher,
        publish_date: bookPublishDate || bookDatePublished,
        image: coverImageUrl,
        synopsis: bookSynopsis,
      })

      if (result.success && result.bookId) {
        router.push(`/books/${result.bookId}`)
      } else {
        alert(`Failed to add book: ${result.error || 'Unknown error'}`)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error adding book:', error)
      alert('An error occurred while adding the book')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight">Add Book to Library</h1>
        <p className="text-muted-foreground mt-2">Review the book details and add it to your library</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div>
            <Card className="overflow-hidden">
              {existingBook ? (
                (() => {
                  const coverImage: any = existingBook.cover_image
                  const coverImageUrl = Array.isArray(coverImage) ? coverImage[0]?.url : coverImage?.url
                  if (!coverImageUrl) return null
                  return (
                    <Link href={`/books/${existingBook.id}`}>
                      <div className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity">
                        <Image
                          src={coverImageUrl}
                          alt={Array.isArray(coverImage) ? coverImage[0]?.alt_text || existingBook.title : coverImage?.alt_text || existingBook.title}
                          width={400}
                          height={600}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      </div>
                    </Link>
                  )
                })()
              ) : coverImageUrl ? (
                <div className="w-full aspect-[2/3] relative">
                  <Image
                    src={coverImageUrl}
                    alt={bookTitle}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </Card>
          </div>

          {/* Book Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {existingBook ? (
                    <Link 
                      href={`/books/${existingBook.id}`}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      {existingBook.title}
                    </Link>
                  ) : (
                    bookTitleLong || bookTitle
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {existingBook?.author ? (
                  <div>
                    <h3 className="font-medium">Author</h3>
                    <Link 
                      href={`/authors/${(() => {
                        const author = existingBook.author as any
                        return Array.isArray(author) ? author[0]?.id : author?.id
                      })()}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {(() => {
                        const author = existingBook.author as any
                        return Array.isArray(author) ? author[0]?.name : author?.name
                      })()}
                    </Link>
                  </div>
                ) : bookAuthors && bookAuthors.length > 0 && (
                  <div>
                    <h3 className="font-medium">Author{bookAuthors.length > 1 ? 's' : ''}</h3>
                    <p className="text-muted-foreground">{bookAuthors.join(', ')}</p>
                  </div>
                )}

                {existingBook?.publisher ? (
                  <div>
                    <h3 className="font-medium">Publisher</h3>
                    <Link 
                      href={`/publishers/${(() => {
                        const publisher = existingBook.publisher as any
                        return Array.isArray(publisher) ? publisher[0]?.id : publisher?.id
                      })()}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {(() => {
                        const publisher = existingBook.publisher as any
                        return Array.isArray(publisher) ? publisher[0]?.name : publisher?.name
                      })()}
                    </Link>
                  </div>
                ) : bookPublisher && (
                  <div>
                    <h3 className="font-medium">Publisher</h3>
                    <p className="text-muted-foreground">{bookPublisher}</p>
                  </div>
                )}

                {(bookPublishDate || bookDatePublished) && (
                  <div>
                    <h3 className="font-medium">Publication Date</h3>
                    <p className="text-muted-foreground">{bookPublishDate || bookDatePublished}</p>
                  </div>
                )}

                {bookIsbn && (
                  <div>
                    <h3 className="font-medium">ISBN-10</h3>
                    <p className="text-muted-foreground">{bookIsbn}</p>
                  </div>
                )}

                {bookIsbn13 && (
                  <div>
                    <h3 className="font-medium">ISBN-13</h3>
                    <p className="text-muted-foreground">{bookIsbn13}</p>
                  </div>
                )}

                {bookLanguage && (
                  <div>
                    <h3 className="font-medium">Language</h3>
                    <p className="text-muted-foreground">{bookLanguage}</p>
                  </div>
                )}

                {bookPages && (
                  <div>
                    <h3 className="font-medium">Pages</h3>
                    <p className="text-muted-foreground">{bookPages}</p>
                  </div>
                )}

                {bookBinding && (
                  <div>
                    <h3 className="font-medium">Binding</h3>
                    <p className="text-muted-foreground">{bookBinding}</p>
                  </div>
                )}

                {bookEdition && (
                  <div>
                    <h3 className="font-medium">Edition</h3>
                    <p className="text-muted-foreground">{bookEdition}</p>
                  </div>
                )}

                {bookDimensions && (
                  <div>
                    <h3 className="font-medium">Dimensions</h3>
                    <p className="text-muted-foreground">{bookDimensions}</p>
                  </div>
                )}

                {bookMsrp != null && !isNaN(Number(bookMsrp)) && (
                  <div>
                    <h3 className="font-medium">MSRP</h3>
                    <p className="text-muted-foreground">${Number(bookMsrp).toFixed(2)}</p>
                  </div>
                )}

                {bookSubjects && bookSubjects.length > 0 && (
                  <div>
                    <h3 className="font-medium">Subjects</h3>
                    <p className="text-muted-foreground">{bookSubjects.join(', ')}</p>
                  </div>
                )}

                {bookDeweyDecimal && bookDeweyDecimal.length > 0 && (
                  <div>
                    <h3 className="font-medium">Dewey Decimal Classification</h3>
                    <p className="text-muted-foreground">{bookDeweyDecimal.join(', ')}</p>
                  </div>
                )}

                {bookOverview && (
                  <div>
                    <h3 className="font-medium">Overview</h3>
                    <p className="text-muted-foreground">{bookOverview}</p>
                  </div>
                )}

                {bookExcerpt && (
                  <div>
                    <h3 className="font-medium">Excerpt</h3>
                    <p className="text-muted-foreground italic">{bookExcerpt}</p>
                  </div>
                )}

                {cleanedSynopsis && (
                  <div>
                    <h3 className="font-medium">Synopsis</h3>
                    <div 
                      className="text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanedSynopsis }}
                    />
                  </div>
                )}

                {existingBook ? (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-green-800 font-medium">Book Already in System</p>
                      <p className="text-green-600 text-sm">This book is already in our system.</p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleAddBook}
                    disabled={isSubmitting}
                    className="w-full mt-4"
                  >
                    {isSubmitting ? 'Adding...' : 'Add to Library'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Books Sections */}
        {existingBook && (otherBooksByAuthor.length > 0 || otherBooksByPublisher.length > 0) && (
          <div className="space-y-8 mt-8">
            {/* Other Books by Author */}
            {otherBooksByAuthor.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Other Books by {(() => {
                    const author = existingBook.author as any
                    return Array.isArray(author) ? author[0]?.name : author?.name
                  })()}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {otherBooksByAuthor.map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-[2/3] relative">
                          {book.cover_image?.url ? (
                            <Image
                              src={book.cover_image.url}
                              alt={book.cover_image.alt_text || book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Other Books by Publisher */}
            {otherBooksByPublisher.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Other Books by {(() => {
                    const publisher = existingBook.publisher as any
                    return Array.isArray(publisher) ? publisher[0]?.name : publisher?.name
                  })()}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {otherBooksByPublisher.map((book: any) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-[2/3] relative">
                          {book.cover_image?.url ? (
                            <Image
                              src={book.cover_image.url}
                              alt={book.cover_image.alt_text || book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

