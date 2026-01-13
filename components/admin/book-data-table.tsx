'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  ChevronDown,
  Edit,
  Eye,
  MoreHorizontal,
  Trash,
  Download,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { bulkDeleteBooks, exportBooksToCSV } from '@/app/actions/admin-books'
import { toast } from '@/hooks/use-toast'
import { getBookCoverAltText } from '@/utils/bookUtils'

interface Book {
  id: string
  title: string
  isbn13?: string
  isbn10?: string
  author?: { id: string; name: string }
  publisher?: { id: string; name: string }
  language?: string
  average_rating?: number
  cover_image?: { url: string; alt_text: string }
  [key: string]: any
}

interface BookDataTableProps {
  books: Book[]
  totalBooks: number
  page: number
  pageSize: number
  sortField: string
  sortDirection: 'asc' | 'desc'
  onPageChange: (page: number) => void
  onSortChange: (field: string, direction: 'asc' | 'desc') => void
  filterButton?: React.ReactNode
}

export function BookDataTable({
  books,
  totalBooks,
  page,
  pageSize,
  sortField,
  sortDirection,
  onPageChange,
  onSortChange,
  filterButton,
}: BookDataTableProps) {
  const router = useRouter()
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const totalPages = Math.ceil(totalBooks / pageSize)

  const handleSelectAll = () => {
    if (selectedBooks.size === books.length) {
      setSelectedBooks(new Set())
    } else {
      setSelectedBooks(new Set(books.map((book) => book.id)))
    }
  }

  const handleSelectBook = (bookId: string) => {
    const newSelected = new Set(selectedBooks)
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId)
    } else {
      newSelected.add(bookId)
    }
    setSelectedBooks(newSelected)
  }

  const handleSort = (field: string) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc'
    onSortChange(field, newDirection)
  }

  const handleDeleteSelected = async () => {
    if (selectedBooks.size === 0) return

    setIsDeleting(true)
    try {
      const result = await bulkDeleteBooks(Array.from(selectedBooks))

      if (result.success) {
        toast({
          title: 'Books deleted',
          description: `Successfully deleted ${result.count} books`,
        })
        setSelectedBooks(new Set())
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete books',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleExportSelected = async () => {
    if (selectedBooks.size === 0 && books.length === 0) return

    setIsExporting(true)
    try {
      const bookIds = selectedBooks.size > 0 ? Array.from(selectedBooks) : undefined
      const result = await exportBooksToCSV(bookIds)

      if (result.success && result.csv) {
        // Create a blob and download it
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `books-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: 'Export successful',
          description: `Exported ${result.count} books to CSV`,
        })
      } else {
        toast({
          title: 'Export failed',
          description: result.error || 'Failed to export books',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Export error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedBooks.size === 0}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedBooks.size === 0 && books.length === 0}
            onClick={handleExportSelected}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting
              ? 'Exporting...'
              : selectedBooks.size > 0
                ? 'Export Selected'
                : 'Export All'}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedBooks.size > 0 && `${selectedBooks.size} selected`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-muted' : ''}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-muted' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          {filterButton}
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={books.length > 0 && selectedBooks.size === books.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[80px]">Cover</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                  <div className="flex items-center">
                    Title
                    {sortField === 'title' && (
                      <ChevronDown
                        className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead>Author</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.length > 0 ? (
                books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBooks.has(book.id)}
                        onCheckedChange={() => handleSelectBook(book.id)}
                        aria-label={`Select ${book.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative h-12 w-8 overflow-hidden rounded-sm">
                        {book.cover_image?.url ? (
                          <Image
                            src={book.cover_image.url || '/placeholder.svg'}
                            alt={book.cover_image.alt_text || book.title}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>
                      {book.author ? (
                        <Link href={`/authors/${book.author.id}`} className="hover:underline">
                          {book.author.name}
                        </Link>
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                    <TableCell>{book.isbn13 || book.isbn10 || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/books/${book.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/books/${book.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBooks(new Set([book.id]))
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No books found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="group relative aspect-[2/3] rounded-lg border bg-card text-card-foreground shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="relative h-full w-full">
                {book.cover_image?.url ? (
                  <Image
                    src={book.cover_image.url}
                    alt={book.cover_image.alt_text || getBookCoverAltText(book.title, 'front')}
                    title={book.cover_image.alt_text || getBookCoverAltText(book.title, 'front')}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-sm font-medium text-white line-clamp-2">{book.title}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/books/${book.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/books/${book.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBooks(new Set([book.id]))
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalBooks)} of{' '}
            {totalBooks} books
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              {selectedBooks.size === 1
                ? 'the selected book'
                : `${selectedBooks.size} selected books`}{' '}
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
