'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  BookOpen,
  User,
  Building,
  Image as ImageIcon,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Database,
  FileText,
  Users,
  Star,
  Calendar,
  Globe,
  Hash,
  Tag,
} from 'lucide-react'
import { AdminBookEditor } from './admin-book-editor'
import { AdminBookDetails } from './admin-book-details'
import { AdminBookActions } from './admin-book-actions'

interface Book {
  id: string
  title: string
  isbn10?: string
  isbn13?: string
  publication_date?: string
  language?: string
  pages?: number
  average_rating?: number
  review_count?: number
  featured?: boolean
  created_at: string
  updated_at?: string
  cover_image_url?: string
  original_image_url?: string
  author?: {
    id: string
    name: string
    author_image?: {
      url: string
    }
  }
  publisher?: {
    id: string
    name: string
    publisher_image?: {
      url: string
      alt_text?: string
    }
  }
  binding_type?: {
    id: string
    name: string
  }
  format_type?: {
    id: string
    name: string
  }
  status?: {
    id: string
    name: string
  }
}

interface BookFilter {
  title?: string
  author?: string
  publisher?: string
  isbn?: string
  language?: string
  publishedYear?: string
  format?: string
  binding?: string
  minRating?: number
  maxRating?: number
  status?: string
  featured?: boolean
}

interface AdminBooksManagerProps {}

export function AdminBooksManager({}: AdminBooksManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [totalBooks, setTotalBooks] = useState(0)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Filters
  const [filters, setFilters] = useState<BookFilter>({
    title: searchParams?.get('title') || '',
    author: searchParams?.get('author') || '',
    publisher: searchParams?.get('publisher') || '',
    isbn: searchParams?.get('isbn') || '',
    language: searchParams?.get('language') || '',
    publishedYear: searchParams?.get('publishedYear') || '',
    format: searchParams?.get('format') || '',
    binding: searchParams?.get('binding') || '',
    minRating: searchParams?.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    maxRating: searchParams?.get('maxRating') ? Number(searchParams.get('maxRating')) : undefined,
    status: searchParams?.get('status') || '',
    featured: searchParams?.get('featured') === 'true',
  })

  // Sort
  const [sortField, setSortField] = useState(searchParams?.get('sort') || 'created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    (searchParams?.get('direction') as 'asc' | 'desc') || 'desc'
  )

  // Fetch books
  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('pageSize', pageSize.toString())
      params.append('sort', sortField)
      params.append('direction', sortDirection)

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/admin/books?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setBooks(data.books)
        setTotalBooks(data.total)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch books',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch books',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load books on mount and when filters change
  useEffect(() => {
    fetchBooks()
  }, [currentPage, pageSize, sortField, sortDirection, filters])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    params.append('page', currentPage.toString())
    params.append('pageSize', pageSize.toString())
    params.append('sort', sortField)
    params.append('direction', sortDirection)

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    router.push(`/admin/books?${params.toString()}`)
  }, [currentPage, pageSize, sortField, sortDirection, filters, router])

  // Handle filter changes
  const handleFilterChange = (key: keyof BookFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle book actions
  const handleEditBook = (book: Book) => {
    setSelectedBook(book)
    setIsEditorOpen(true)
  }

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book)
    setIsDetailsOpen(true)
  }

  const handleBookActions = (book: Book) => {
    setSelectedBook(book)
    setIsActionsOpen(true)
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Book deleted successfully',
        })
        fetchBooks() // Refresh the list
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete book',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete book',
        variant: 'destructive',
      })
    }
  }

  const totalPages = Math.ceil(totalBooks / pageSize)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Books Management</h2>
          <p className="text-muted-foreground">
            {totalBooks} total books • Page {currentPage} of {totalPages}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
          <Button variant="outline" onClick={() => router.push('/books/import')}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={fetchBooks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Search by title..."
                value={filters.title || ''}
                onChange={(e) => handleFilterChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Author</label>
              <Input
                placeholder="Search by author..."
                value={filters.author || ''}
                onChange={(e) => handleFilterChange('author', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Publisher</label>
              <Input
                placeholder="Search by publisher..."
                value={filters.publisher || ''}
                onChange={(e) => handleFilterChange('publisher', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ISBN</label>
              <Input
                placeholder="Search by ISBN..."
                value={filters.isbn || ''}
                onChange={(e) => handleFilterChange('isbn', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select
                value={filters.language || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('language', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select
                value={filters.format || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('format', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All formats</SelectItem>
                  <SelectItem value="hardcover">Hardcover</SelectItem>
                  <SelectItem value="paperback">Paperback</SelectItem>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="audiobook">Audiobook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rating Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.minRating || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'minRating',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.maxRating || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'maxRating',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Featured</label>
              <Select
                value={filters.featured?.toString() || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'featured',
                    value === 'true' ? true : value === 'false' ? false : undefined
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All books" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All books</SelectItem>
                  <SelectItem value="true">Featured only</SelectItem>
                  <SelectItem value="false">Not featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Books</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="average_rating">Rating</SelectItem>
                  <SelectItem value="review_count">Reviews</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse"
                >
                  <div className="w-16 h-24 bg-gray-200 rounded-sm"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-sm w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded-sm w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or add a new book.
              </p>
              <Button onClick={() => setIsEditorOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Cover Image */}
                  <div className="relative w-16 h-24 flex-shrink-0">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center rounded-sm">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate">{book.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {book.author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="truncate">{book.author.name}</span>
                            </div>
                          )}
                          {book.publisher && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span className="truncate">{book.publisher.name}</span>
                            </div>
                          )}
                          {book.publication_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(book.publication_date).getFullYear()}</span>
                            </div>
                          )}
                          {book.language && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>{book.language}</span>
                            </div>
                          )}
                          {book.pages && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{book.pages} pages</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-2 mt-2">
                          {book.featured && <Badge variant="secondary">Featured</Badge>}
                          {book.average_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{book.average_rating.toFixed(1)}</span>
                              {book.review_count && (
                                <span className="text-xs text-muted-foreground">
                                  ({book.review_count})
                                </span>
                              )}
                            </div>
                          )}
                          {book.format_type && (
                            <Badge variant="outline">{book.format_type.name}</Badge>
                          )}
                          {book.binding_type && (
                            <Badge variant="outline">{book.binding_type.name}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(book)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditBook(book)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleBookActions(book)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(page)
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modals */}
      {selectedBook && (
        <>
          <AdminBookEditor
            book={selectedBook}
            open={isEditorOpen}
            onOpenChange={setIsEditorOpen}
            onSave={() => {
              setIsEditorOpen(false)
              fetchBooks()
            }}
          />

          <AdminBookDetails
            book={selectedBook}
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
          />

          <AdminBookActions
            book={selectedBook}
            open={isActionsOpen}
            onOpenChange={setIsActionsOpen}
            onDelete={() => {
              setIsActionsOpen(false)
              handleDeleteBook(selectedBook.id)
            }}
            onEdit={() => {
              setIsActionsOpen(false)
              setIsEditorOpen(true)
            }}
          />
        </>
      )}
    </div>
  )
}
