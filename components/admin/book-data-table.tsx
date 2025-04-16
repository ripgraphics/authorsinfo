"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, ChevronDown, Edit, Eye, MoreHorizontal, Trash, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { bulkDeleteBooks, exportBooksToCSV } from "@/app/actions/admin-books"
import { toast } from "@/hooks/use-toast"

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
  sortDirection: "asc" | "desc"
  onPageChange: (page: number) => void
  onSortChange: (field: string, direction: "asc" | "desc") => void
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
}: BookDataTableProps) {
  const router = useRouter()
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc"
    onSortChange(field, newDirection)
  }

  const handleDeleteSelected = async () => {
    if (selectedBooks.size === 0) return

    setIsDeleting(true)
    try {
      const result = await bulkDeleteBooks(Array.from(selectedBooks))

      if (result.success) {
        toast({
          title: "Books deleted",
          description: `Successfully deleted ${result.count} books`,
        })
        setSelectedBooks(new Set())
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete books",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
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
        const blob = new Blob([result.csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `books-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Export successful",
          description: `Exported ${result.count} books to CSV`,
        })
      } else {
        toast({
          title: "Export failed",
          description: result.error || "Failed to export books",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export error",
        description: "An unexpected error occurred",
        variant: "destructive",
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
            {isExporting ? "Exporting..." : selectedBooks.size > 0 ? "Export Selected" : "Export All"}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedBooks.size > 0 && `${selectedBooks.size} selected`}
        </div>
      </div>

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
              <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                <div className="flex items-center">
                  Title
                  {sortField === "title" && (
                    <ChevronDown
                      className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""} transition-transform`}
                    />
                  )}
                </div>
              </TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Publisher</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("average_rating")}>
                <div className="flex items-center">
                  Rating
                  {sortField === "average_rating" && (
                    <ChevronDown
                      className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""} transition-transform`}
                    />
                  )}
                </div>
              </TableHead>
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
                    <div className="relative h-12 w-8 overflow-hidden rounded">
                      {book.cover_image?.url ? (
                        <Image
                          src={book.cover_image.url || "/placeholder.svg"}
                          alt={book.cover_image.alt_text || book.title}
                          fill
                          className="object-cover"
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
                      "Unknown"
                    )}
                  </TableCell>
                  <TableCell>
                    {book.publisher ? (
                      <Link href={`/publishers/${book.publisher.id}`} className="hover:underline">
                        {book.publisher.name}
                      </Link>
                    ) : (
                      "Unknown"
                    )}
                  </TableCell>
                  <TableCell>{book.isbn13 || book.isbn10 || "N/A"}</TableCell>
                  <TableCell>
                    {book.average_rating ? (
                      <div className="flex items-center">
                        <span className="mr-1">{Number(book.average_rating).toFixed(1)}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-yellow-400"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalBooks)} of {totalBooks} books
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
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
              This action cannot be undone. This will permanently delete{" "}
              {selectedBooks.size === 1 ? "the selected book" : `${selectedBooks.size} selected books`} from the
              database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
