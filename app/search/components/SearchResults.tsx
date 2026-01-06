'use client'

import { useState } from 'react'
import { useSearchFilter } from '@/lib/hooks/use-search-filter'
import { bookSearchFields, bookSearchScorer, SearchableBook } from '@/lib/search/book-search-config'
import {
  authorSearchFields,
  authorSearchScorer,
  SearchableAuthor,
} from '@/lib/search/author-search-config'
import {
  publisherSearchFields,
  publisherSearchScorer,
  SearchablePublisher,
} from '@/lib/search/publisher-search-config'
import { ReusableSearch } from '@/components/ui/reusable-search'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, User, Building, Plus, Loader2 } from 'lucide-react'
import { bulkAddBooksFromSearch } from '@/app/actions/bulk-add-books-from-search'
import { useToast } from '@/hooks/use-toast'

interface SearchResultsProps {
  initialBooks: any[]
  initialAuthors: any[]
  initialPublishers: any[]
  isbndbBooks: any[]
  initialQuery: string
  initialType: string
}

export function SearchResults({
  initialBooks,
  initialAuthors,
  initialPublishers,
  isbndbBooks,
  initialQuery,
  initialType,
}: SearchResultsProps) {
  const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialType)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // Filter books using the robust search system
  const { filteredItems: filteredBooks } = useSearchFilter<SearchableBook>({
    items: initialBooks as SearchableBook[],
    searchValue: searchQuery,
    fields: bookSearchFields,
    requireAllWords: false,
    customScorer: bookSearchScorer,
  })

  // Filter authors using the robust search system
  const { filteredItems: filteredAuthors } = useSearchFilter<SearchableAuthor>({
    items: initialAuthors as SearchableAuthor[],
    searchValue: searchQuery,
    fields: authorSearchFields,
    requireAllWords: false,
    customScorer: authorSearchScorer,
  })

  // Filter publishers using the robust search system
  const { filteredItems: filteredPublishers } = useSearchFilter<SearchablePublisher>({
    items: initialPublishers as SearchablePublisher[],
    searchValue: searchQuery,
    fields: publisherSearchFields,
    requireAllWords: false,
    customScorer: publisherSearchScorer,
  })

  return (
    <div className="space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
        <p className="text-muted-foreground mt-2">
          {searchQuery
            ? `Showing results for "${searchQuery}"`
            : 'Enter a search term to find books, authors, and publishers'}
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl">
        <ReusableSearch
          placeholder="Search books, authors, publishers..."
          paramName="q"
          basePath="/search"
          updateUrl={true}
          onSearchChange={handleSearchChange}
        />
      </div>

      {searchQuery ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="authors">Authors</TabsTrigger>
            <TabsTrigger value="publishers">Publishers</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-8">
            {/* ISBNDB Results */}
            {isbndbBooks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">ISBNDB Results</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {isbndbBooks.slice(0, 4).map((book, index) => (
                    <Link
                      key={index}
                      href={`/books/add?isbn=${book.isbn13 || book.isbn}`}
                      className="block relative group"
                    >
                      <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                        <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                          {book.image ? (
                            <Image
                              src={book.image || '/placeholder.svg'}
                              alt={book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 text-center">
                          <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                        </div>
                      </Card>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Library
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Books */}
            {filteredBooks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Books</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {filteredBooks.slice(0, 4).map((book) => (
                    <Link href={`/books/${book.id}`} key={book.id} className="block">
                      <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                        <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                          {book.cover_image_url ? (
                            <Image
                              src={book.cover_image_url || '/placeholder.svg'}
                              alt={book.title || 'Book'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 text-center">
                          <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
                {filteredBooks.length > 4 && (
                  <div className="text-center mt-4">
                    <Button variant="outline" onClick={() => setActiveTab('books')}>
                      View All Books ({filteredBooks.length})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Authors */}
            {filteredAuthors.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Authors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {filteredAuthors.slice(0, 4).map((author) => (
                    <Link href={`/authors/${author.id}`} key={author.id} className="block">
                      <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                        <div className="relative aspect-square w-full">
                          {author.author_image?.url ? (
                            <Image
                              src={author.author_image.url}
                              alt={author.author_image.alt_text || author.name || 'Author'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <User className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 text-center">
                          <h3 className="font-medium text-sm line-clamp-1">{author.name}</h3>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
                {filteredAuthors.length > 4 && (
                  <div className="text-center mt-4">
                    <Button variant="outline" onClick={() => setActiveTab('authors')}>
                      View All Authors ({filteredAuthors.length})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Publishers */}
            {filteredPublishers.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Publishers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {filteredPublishers.slice(0, 4).map((publisher) => (
                    <Link href={`/publishers/${publisher.id}`} key={publisher.id} className="block">
                      <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                        <div className="relative aspect-[3/2] w-full">
                          {(publisher as any).publisher_image?.url ? (
                            <Image
                              src={(publisher as any).publisher_image.url || '/placeholder.svg'}
                              alt={publisher.name || 'Publisher'}
                              fill
                              className="object-contain p-4"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Building className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 text-center">
                          <h3 className="font-medium text-sm line-clamp-1">{publisher.name}</h3>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
                {filteredPublishers.length > 4 && (
                  <div className="text-center mt-4">
                    <Button variant="outline" onClick={() => setActiveTab('publishers')}>
                      View All Publishers ({filteredPublishers.length})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isbndbBooks.length === 0 &&
              filteredBooks.length === 0 &&
              filteredAuthors.length === 0 &&
              filteredPublishers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                </div>
              )}
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            {isbndbBooks.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedBooks.size === isbndbBooks.length && isbndbBooks.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBooks(new Set(isbndbBooks.map((_, i) => i)))
                      } else {
                        setSelectedBooks(new Set())
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedBooks.size} of {isbndbBooks.length} selected
                  </span>
                </div>
                <Button
                  onClick={async () => {
                    if (selectedBooks.size === 0) {
                      toast({
                        title: 'No books selected',
                        description: 'Please select at least one book to add',
                        variant: 'destructive',
                      })
                      return
                    }
                    setIsAdding(true)
                    try {
                      const selectedBookData = Array.from(selectedBooks).map(
                        (index) => isbndbBooks[index]
                      )
                      const result = await bulkAddBooksFromSearch(selectedBookData)

                      if (result.success) {
                        toast({
                          title: 'Books added successfully',
                          description: `Successfully added ${result.added} book${result.added !== 1 ? 's' : ''}${result.duplicates > 0 ? ` (${result.duplicates} duplicate${result.duplicates !== 1 ? 's' : ''} skipped)` : ''}`,
                        })
                        // Clear selection
                        setSelectedBooks(new Set())
                        // Refresh the page to show updated results
                        window.location.reload()
                      } else {
                        toast({
                          title: 'Failed to add books',
                          description: result.errorDetails.join(', '),
                          variant: 'destructive',
                        })
                      }
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'An error occurred while adding books',
                        variant: 'destructive',
                      })
                      console.error('Error adding books:', error)
                    } finally {
                      setIsAdding(false)
                    }
                  }}
                  disabled={isAdding || selectedBooks.size === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Selected ({selectedBooks.size})
                    </>
                  )}
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {isbndbBooks.map((book, index) => {
                const isSelected = selectedBooks.has(index)

                return (
                  <div key={`isbndb-${index}`} className="block relative group">
                    <Card
                      className={`overflow-hidden h-full transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedBooks)
                            if (checked) {
                              newSelected.add(index)
                            } else {
                              newSelected.delete(index)
                            }
                            setSelectedBooks(newSelected)
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                        {book.image ? (
                          <Image
                            src={book.image || '/placeholder.svg'}
                            alt={book.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                      </div>
                    </Card>
                  </div>
                )
              })}

              {filteredBooks.map((book) => (
                <Link href={`/books/${book.id}`} key={book.id} className="block">
                  <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                    <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                      {book.cover_image_url ? (
                        <Image
                          src={book.cover_image_url || '/placeholder.svg'}
                          alt={book.title || 'Book'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-center">
                      <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                    </div>
                  </Card>
                </Link>
              ))}

              {isbndbBooks.length === 0 && filteredBooks.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No books found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="authors" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredAuthors.length > 0 ? (
                filteredAuthors.map((author) => (
                  <Link href={`/authors/${author.id}`} key={author.id} className="block">
                    <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                      <div className="relative aspect-square w-full">
                        {author.author_image?.url ? (
                          <Image
                            src={author.author_image.url}
                            alt={author.author_image.alt_text || author.name || 'Author'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <User className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-medium text-sm line-clamp-1">{author.name}</h3>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No authors found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="publishers" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredPublishers.length > 0 ? (
                filteredPublishers.map((publisher) => (
                  <Link href={`/publishers/${publisher.id}`} key={publisher.id} className="block">
                    <Card className="overflow-hidden h-full transition-transform hover:scale-105">
                      <div className="relative aspect-[3/2] w-full">
                        {(publisher as any).publisher_image?.url ? (
                          <Image
                            src={(publisher as any).publisher_image.url || '/placeholder.svg'}
                            alt={publisher.name || 'Publisher'}
                            fill
                            className="object-contain p-4"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Building className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-medium text-sm line-clamp-1">{publisher.name}</h3>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No publishers found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Enter a search term to find books, authors, and publishers
          </p>
        </div>
      )}
    </div>
  )
}
