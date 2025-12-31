'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertCircle,
  BookOpen,
  Search,
  User,
  X,
  CheckCircle2,
  RefreshCw,
  Loader2,
  BookX,
  UserX,
  BookCheck,
  Users,
} from 'lucide-react'
import {
  connectAuthorToBook,
  createAuthor,
  disconnectAuthorFromBook,
  getBookAuthorConnections,
  lookupBookByISBN,
  searchDatabaseAuthors,
  batchProcessBooksWithoutAuthors,
  cleanupAuthorData,
} from '@/app/actions/admin-book-authors'
import { importNewestBooks } from '@/app/actions/bulk-import-books'

// Helper function to safely truncate IDs
function truncateId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return 'N/A'
  const strId = String(id)
  return strId.length > 8 ? `${strId.substring(0, 8)}...` : strId
}

interface Book {
  id: string | number
  title: string
  isbn10?: string
  isbn13?: string
  cover_image?: {
    id: string
    url: string
    alt_text?: string
  }
}

interface Author {
  id: string // UUID
  name: string
  bio?: string
}

interface BookAuthorConnection {
  id: string // UUID
  authorId: string | null // UUID
  authorName: string
}

interface BatchProcessState {
  isProcessing: boolean
  progress: number
  total: number
  processed: number
  failed: number
  currentBook: string | null
  errors: string[]
  completed: boolean
}

interface Stats {
  booksWithoutAuthors: number
  authorsWithoutBooks: number
  booksWithMultipleAuthors: number
  totalBooks: number
  totalAuthors: number
}

interface BookAuthorConnectionsClientProps {
  initialBooks: Book[]
  totalBooks: number
  initialPage: number
  initialPageSize: number
  stats: Stats
}

export function BookAuthorConnectionsClient({
  initialBooks,
  totalBooks,
  initialPage,
  initialPageSize,
  stats,
}: BookAuthorConnectionsClientProps) {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Author[]>([])
  const [connections, setConnections] = useState<BookAuthorConnection[]>([])
  const [activeTab, setActiveTab] = useState('search')
  const [newAuthorName, setNewAuthorName] = useState('')
  const [newAuthorBio, setNewAuthorBio] = useState('')
  const [isbnLookup, setIsbnLookup] = useState('')
  const [isbnResults, setIsbnResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Batch processing state
  const [batchState, setBatchState] = useState<BatchProcessState>({
    isProcessing: false,
    progress: 0,
    total: 0,
    processed: 0,
    failed: 0,
    currentBook: null,
    errors: [],
    completed: false,
  })

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    router.push(`/admin/book-author-connections?page=${newPage}&pageSize=${pageSize}`)
  }

  // Open dialog to manage book-author connections
  const handleManageConnections = async (book: Book) => {
    setSelectedBook(book)
    setIsDialogOpen(true)
    setError(null)
    setSuccess(null)
    setSearchQuery('')
    setSearchResults([])
    setIsbnLookup('')
    setIsbnResults(null)
    setActiveTab('search')

    try {
      setIsLoading(true)
      const { connections, error } = await getBookAuthorConnections(String(book.id))
      if (error) {
        setError(error)
      } else {
        setConnections(connections as BookAuthorConnection[])
      }
    } catch (err) {
      setError('Failed to load connections')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Search for authors
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      const { authors, error } = await searchDatabaseAuthors(searchQuery)
      if (error) {
        setError(error)
      } else {
        setSearchResults(authors)
      }
    } catch (err) {
      setError('Search failed')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Connect author to book
  const handleConnectAuthor = async (authorId: string) => {
    if (!selectedBook) return

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      const { success, error } = await connectAuthorToBook(String(selectedBook.id), authorId)
      if (error) {
        setError(error)
      } else if (success) {
        setSuccess('Author connected successfully')
        // Refresh connections
        const { connections } = await getBookAuthorConnections(String(selectedBook.id))
        setConnections(connections as BookAuthorConnection[])
      }
    } catch (err) {
      setError('Failed to connect author')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Disconnect author from book
  const handleDisconnectAuthor = async (authorId: string) => {
    if (!selectedBook) return

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      const { success, error } = await disconnectAuthorFromBook(String(selectedBook.id), authorId)
      if (error) {
        setError(error)
      } else if (success) {
        setSuccess('Author disconnected successfully')
        // Refresh connections
        const { connections } = await getBookAuthorConnections(String(selectedBook.id))
        setConnections(connections as BookAuthorConnection[])
      }
    } catch (err) {
      setError('Failed to disconnect author')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new author
  const handleCreateAuthor = async () => {
    if (!newAuthorName.trim()) {
      setError('Author name is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      const { author, error } = await createAuthor({
        name: newAuthorName,
        bio: newAuthorBio || undefined,
      })
      if (error) {
        setError(error)
      } else if (author) {
        setSuccess(`Author "${author.name}" created successfully`)
        setNewAuthorName('')
        setNewAuthorBio('')
        // Connect the new author to the book
        if (selectedBook) {
          await handleConnectAuthor(author.id)
        }
      }
    } catch (err) {
      setError('Failed to create author')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Look up book by ISBN
  const handleIsbnLookup = async () => {
    if (!isbnLookup.trim()) {
      setError('ISBN is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      const { book, error } = await lookupBookByISBN(isbnLookup)
      if (error) {
        setError(error)
      } else if (book) {
        setIsbnResults(book)
        setSuccess('Book found in ISBNDB')
      }
    } catch (err) {
      setError('ISBN lookup failed')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Batch process books without authors
  const handleBatchProcess = async () => {
    setError(null)
    setSuccess(null)

    let totalProcessed = 0
    let totalFailed = 0
    let errors: string[] = []

    while (totalProcessed < stats.booksWithoutAuthors) {
      // Reset batch state for each batch
      setBatchState((prev) => ({
        ...prev,
        isProcessing: true,
        progress: 0,
        total: Math.min(20, stats.booksWithoutAuthors - totalProcessed),
        processed: 0,
        failed: 0,
        currentBook: null,
        errors: [],
        completed: false,
      }))

      try {
        // Start batch processing
        const result = await batchProcessBooksWithoutAuthors(20)

        if (result.success) {
          totalProcessed += result.processed
          totalFailed += result.errors ? result.errors.length : 0
          errors = [...errors, ...(result.errors || [])]

          setBatchState((prev) => ({
            ...prev,
            processed: totalProcessed,
            failed: totalFailed,
            errors,
            completed: totalProcessed >= stats.booksWithoutAuthors,
            progress: (totalProcessed / stats.booksWithoutAuthors) * 100,
          }))

          setSuccess(`Processed ${totalProcessed} books successfully`)

          // If all books are processed, break the loop
          if (totalProcessed >= stats.booksWithoutAuthors) {
            break
          }

          // Delay before starting the next batch
          await new Promise((resolve) => setTimeout(resolve, 5000))
        } else {
          setBatchState((prev) => ({
            ...prev,
            failed: 1,
            errors: [result.error || 'Unknown error'],
            completed: true,
          }))

          setError(result.error || 'Batch processing failed')
          break
        }
      } catch (err) {
        setBatchState((prev) => ({
          ...prev,
          failed: 1,
          errors: [String(err)],
          completed: true,
        }))

        setError(`Batch processing failed: ${String(err)}`)
        console.error(err)
        break
      }
    }

    // Final state update after all batches
    setBatchState((prev) => ({
      ...prev,
      isProcessing: false,
      completed: true,
    }))

    // Refresh the page to show updated data after a short delay
    setTimeout(() => {
      router.refresh()
    }, 2000)
  }

  // Update progress during batch processing
  useEffect(() => {
    if (batchState.isProcessing && !batchState.completed) {
      const timer = setInterval(() => {
        setBatchState((prev) => {
          // Increment progress slowly to give a sense of activity
          const newProgress = Math.min(prev.progress + 0.5, 99)
          return { ...prev, progress: newProgress }
        })
      }, 500)

      return () => clearInterval(timer)
    }
  }, [batchState.isProcessing, batchState.completed])

  // Clean up author data
  const handleCleanup = async () => {
    if (!confirm('This will clear all author connections. Are you sure you want to proceed?')) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      const { success, error } = await cleanupAuthorData()
      if (error) {
        setError(error)
      } else if (success) {
        setSuccess('Author data cleaned up successfully')
        // Refresh the page to show updated state
        router.refresh()
      }
    } catch (err) {
      setError('Failed to clean up author data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(totalBooks / pageSize)

  // Calculate percentages for stats
  const booksWithAuthorsPercent =
    stats.totalBooks > 0
      ? Math.round(((stats.totalBooks - stats.booksWithoutAuthors) / stats.totalBooks) * 100)
      : 0

  const authorsWithBooksPercent =
    stats.totalAuthors > 0
      ? Math.round(((stats.totalAuthors - stats.authorsWithoutBooks) / stats.totalAuthors) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Book-Author Connections</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleCleanup}
            disabled={isLoading || batchState.isProcessing}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cleaning...
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                Clean Up Author Data
              </>
            )}
          </Button>
          <Button
            onClick={handleBatchProcess}
            disabled={isLoading || batchState.isProcessing}
            className="flex items-center gap-2"
          >
            {batchState.isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Process Books Without Authors
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookX className="h-4 w-4 text-red-500" />
              Books Without Authors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.booksWithoutAuthors}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.booksWithoutAuthors > 0
                ? `${stats.booksWithoutAuthors} of ${stats.totalBooks} books need authors`
                : 'All books have authors'}
            </div>
            <Progress
              value={booksWithAuthorsPercent}
              className={`h-2 mt-2 ${booksWithAuthorsPercent < 80 ? 'bg-amber-500' : 'bg-green-500'}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Authors Without Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.authorsWithoutBooks}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.authorsWithoutBooks > 0
                ? `${stats.authorsWithoutBooks} of ${stats.totalAuthors} authors have no books`
                : 'All authors have books'}
            </div>
            <Progress
              value={authorsWithBooksPercent}
              className={`h-2 mt-2 ${authorsWithBooksPercent < 80 ? 'bg-amber-500' : 'bg-green-500'}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookCheck className="h-4 w-4 text-green-500" />
              Total Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.totalBooks > 0
                ? `${stats.totalBooks - stats.booksWithoutAuthors} books have authors (${booksWithAuthorsPercent}%)`
                : 'No books in database'}
            </div>
            <Progress
              value={booksWithAuthorsPercent}
              className={`h-2 mt-2 ${booksWithAuthorsPercent < 80 ? 'bg-amber-500' : 'bg-green-500'}`}
            />
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Books With Multiple Authors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.booksWithMultipleAuthors}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.booksWithMultipleAuthors > 0
                ? `${stats.booksWithMultipleAuthors} books have more than one author`
                : 'No books with multiple authors'}
            </div>
            {stats.booksWithMultipleAuthors > 0 && (
              <Button
                variant="link"
                className="absolute bottom-2 right-2 p-0 h-auto text-xs"
                onClick={() => router.push('/admin/books-with-multiple-authors')}
              >
                View all →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Batch Processing Status Card */}
      {(batchState.isProcessing || batchState.completed) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {batchState.completed ? 'Processing Complete' : 'Processing Books Without Authors'}
            </CardTitle>
            <CardDescription>
              {batchState.completed
                ? `Processed ${batchState.processed} books, ${batchState.failed} failed`
                : 'This may take several minutes due to API rate limits'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(batchState.progress)}%</span>
              </div>
              <Progress value={batchState.progress} className="h-2" />
            </div>

            {batchState.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 text-yellow-800">Warnings/Errors</h4>
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 max-h-32 overflow-y-auto">
                  <ul className="text-xs text-yellow-800 space-y-1">
                    {batchState.errors.slice(0, 5).map((err, i) => (
                      <li key={i} className="truncate">
                        {err}
                      </li>
                    ))}
                    {batchState.errors.length > 5 && (
                      <li>...and {batchState.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {batchState.completed && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() =>
                  setBatchState((prev) => ({ ...prev, completed: false, isProcessing: false }))
                }
              >
                Dismiss
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Books Without Authors</CardTitle>
          <CardDescription>
            Connect authors to books that currently don't have any author information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>ISBN-10</TableHead>
                <TableHead>ISBN-13</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No books found without authors
                  </TableCell>
                </TableRow>
              ) : (
                books.map((book) => (
                  <TableRow key={String(book.id)}>
                    <TableCell className="font-mono">{truncateId(book.id)}</TableCell>
                    <TableCell>{book.title || 'Untitled'}</TableCell>
                    <TableCell>{book.isbn10 || '—'}</TableCell>
                    <TableCell>{book.isbn13 || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageConnections(book)}
                      >
                        Manage Authors
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-center py-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Dialog for managing book-author connections */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Authors for Book</DialogTitle>
            <DialogDescription>
              {selectedBook?.title || 'Untitled'} (ID: {selectedBook?.id})
            </DialogDescription>
          </DialogHeader>

          {/* Book details */}
          <div className="flex items-start gap-4 mb-4">
            {selectedBook?.cover_image?.url && (
              <img
                src={selectedBook.cover_image.url || '/placeholder.svg'}
                alt={selectedBook.title || 'Book cover'}
                className="w-20 h-auto object-cover rounded-md"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{selectedBook?.title}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                <div className="text-muted-foreground">ISBN-10:</div>
                <div>{selectedBook?.isbn10 || '—'}</div>
                <div className="text-muted-foreground">ISBN-13:</div>
                <div>{selectedBook?.isbn13 || '—'}</div>
              </div>
            </div>
          </div>

          {/* Current connections */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Authors</h3>
            {connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No authors connected to this book</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {connections.map((conn) => (
                  <Badge key={conn.id} className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {conn.authorName}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 p-0"
                      onClick={() =>
                        conn.authorId && handleDisconnectAuthor(conn.authorId.toString())
                      }
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Error and success messages */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200 mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Tabs for different ways to add authors */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="search">Search Authors</TabsTrigger>
              <TabsTrigger value="create">Create Author</TabsTrigger>
              <TabsTrigger value="isbn">ISBN Lookup</TabsTrigger>
            </TabsList>

            {/* Search existing authors */}
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search authors by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 ? (
                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((author) => (
                        <TableRow key={author.id}>
                          <TableCell>{author.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConnectAuthor(author.id)}
                              disabled={isLoading}
                            >
                              Connect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : searchQuery && !isLoading ? (
                <p className="text-sm text-muted-foreground">
                  No authors found matching "{searchQuery}"
                </p>
              ) : null}
            </TabsContent>

            {/* Create new author */}
            <TabsContent value="create" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="author-name">Author Name</Label>
                  <Input
                    id="author-name"
                    placeholder="Enter author name"
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="author-bio">Author Bio (Optional)</Label>
                  <Input
                    id="author-bio"
                    placeholder="Enter author bio"
                    value={newAuthorBio}
                    onChange={(e) => setNewAuthorBio(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateAuthor} disabled={isLoading || !newAuthorName.trim()}>
                  Create Author
                </Button>
              </div>
            </TabsContent>

            {/* ISBN lookup */}
            <TabsContent value="isbn" className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter ISBN-10 or ISBN-13..."
                    value={isbnLookup}
                    onChange={(e) => setIsbnLookup(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIsbnLookup()}
                  />
                </div>
                <Button
                  onClick={handleIsbnLookup}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Lookup
                </Button>
              </div>

              {isbnResults && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{isbnResults.title}</CardTitle>
                    {isbnResults.publisher && (
                      <CardDescription>{isbnResults.publisher}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isbnResults.authors && isbnResults.authors.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Authors:</h4>
                        <ul className="list-disc pl-5 text-sm">
                          {isbnResults.authors.map((author: string, i: number) => (
                            <li key={i}>{author}</li>
                          ))}
                        </ul>
                        <div className="mt-4 pt-2 border-t text-sm text-muted-foreground">
                          To add these authors, create them using the "Create Author" tab.
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No author information available
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ImportBooksButton() {
  const handleImport = async () => {
    try {
      await importNewestBooks()
      alert('Books imported successfully!')
    } catch (error) {
      console.error('Error importing books:', error)
      alert('Failed to import books.')
    }
  }

  return (
    <button onClick={handleImport} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-sm">
      Import Latest Books
    </button>
  )
}
