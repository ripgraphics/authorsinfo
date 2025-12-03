"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, XCircle, Search, BookPlus, User, Building } from "lucide-react"
import {
  getDbAuthors,
  getDbPublishers,
  getBooksByAuthorName,
  getBooksByPublisherName,
  importBooksByEntity,
} from "@/app/actions/import-by-entity"
import { searchAuthors, searchPublishers } from "@/lib/isbndb"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { checkForDuplicates } from "@/app/actions/bulk-import-books"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ImportByEntityPage() {
  // State for tabs
  const [activeTab, setActiveTab] = useState<string>("author")
  const [activeSubTab, setActiveSubTab] = useState<string>("existing")

  // State for authors
  const [dbAuthors, setDbAuthors] = useState<any[]>([])
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("")
  const [selectedAuthorName, setSelectedAuthorName] = useState<string>("")
  const [authorSearchQuery, setAuthorSearchQuery] = useState<string>("")
  const [authorSearchResults, setAuthorSearchResults] = useState<string[]>([])

  // State for publishers
  const [dbPublishers, setDbPublishers] = useState<any[]>([])
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>("")
  const [selectedPublisherName, setSelectedPublisherName] = useState<string>("")
  const [publisherSearchQuery, setPublisherSearchQuery] = useState<string>("")
  const [publisherSearchResults, setPublisherSearchResults] = useState<string[]>([])

  // State for books
  const [books, setBooks] = useState<any[]>([])
  const [isbns, setIsbns] = useState<string[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [duplicates, setDuplicates] = useState<string[]>([])

  // State for loading and results
  const [loading, setLoading] = useState<boolean>(false)
  const [searching, setSearching] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Load authors and publishers on initial render
  useEffect(() => {
    const loadEntities = async () => {
      const authors = await getDbAuthors()
      const publishers = await getDbPublishers()
      setDbAuthors(authors)
      setDbPublishers(publishers)
    }

    loadEntities()
  }, [])

  // Handle author selection from dropdown
  const handleAuthorSelect = async (authorId: string) => {
    setSelectedAuthorId(authorId)
    const author = dbAuthors.find((a) => a.id === authorId)
    if (author) {
      setSelectedAuthorName(author.name)
      await loadBooksByAuthor(author.name)
    }
  }

  // Handle publisher selection from dropdown
  const handlePublisherSelect = async (publisherId: string) => {
    setSelectedPublisherId(publisherId)
    const publisher = dbPublishers.find((p) => p.id === publisherId)
    if (publisher) {
      setSelectedPublisherName(publisher.name)
      await loadBooksByPublisher(publisher.name)
    }
  }

  // Handle author search
  const handleAuthorSearch = async () => {
    if (!authorSearchQuery.trim()) return

    setSearching(true)
    try {
      const results = await searchAuthors(authorSearchQuery)
      setAuthorSearchResults(results)
    } catch (error) {
      console.error("Author search error:", error)
    } finally {
      setSearching(false)
    }
  }

  // Handle publisher search
  const handlePublisherSearch = async () => {
    if (!publisherSearchQuery.trim()) return

    setSearching(true)
    try {
      const results = await searchPublishers(publisherSearchQuery)
      setPublisherSearchResults(results)
    } catch (error) {
      console.error("Publisher search error:", error)
    } finally {
      setSearching(false)
    }
  }

  // Load books by author
  const loadBooksByAuthor = async (authorName: string) => {
    setLoading(true)
    setBooks([])
    setIsbns([])
    setSelectedBooks(new Set())

    try {
      const { books, isbns } = await getBooksByAuthorName(authorName, currentPage)
      setBooks(books)
      setIsbns(isbns)
      // Auto-select all books
      setSelectedBooks(new Set(isbns))
    } catch (error) {
      console.error("Error loading books by author:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load books by publisher
  const loadBooksByPublisher = async (publisherName: string) => {
    setLoading(true)
    setBooks([])
    setIsbns([])
    setSelectedBooks(new Set())

    try {
      const { books, isbns } = await getBooksByPublisherName(publisherName, currentPage)
      setBooks(books)
      setIsbns(isbns)
      // Auto-select all books
      setSelectedBooks(new Set(isbns))
    } catch (error) {
      console.error("Error loading books by publisher:", error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle book selection
  const toggleBookSelection = (isbn: string) => {
    const newSelection = new Set(selectedBooks)
    if (newSelection.has(isbn)) {
      newSelection.delete(isbn)
    } else {
      newSelection.add(isbn)
    }
    setSelectedBooks(newSelection)
  }

  // Select/deselect all books
  const toggleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedBooks(new Set(isbns))
    } else {
      setSelectedBooks(new Set())
    }
  }

  // Check for duplicates
  const handleCheckDuplicates = async () => {
    if (selectedBooks.size === 0) return

    setChecking(true)
    try {
      const selectedIsbns = Array.from(selectedBooks)
      const result = await checkForDuplicates(selectedIsbns)

      if (result.error) {
        console.error(result.error)
        return
      }

      setDuplicates(result.duplicates)
    } catch (error) {
      console.error("Error checking duplicates:", error)
    } finally {
      setChecking(false)
    }
  }

  // Import selected books
  const handleImport = async () => {
    if (selectedBooks.size === 0) return

    setLoading(true)
    setImportResult(null)

    try {
      const entityType = activeTab as "author" | "publisher"
      const entityName = entityType === "author" ? selectedAuthorName : selectedPublisherName
      const selectedIsbns = Array.from(selectedBooks)

      const result = await importBooksByEntity(entityType, entityName, selectedIsbns)
      setImportResult(result)
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  // Select an author from search results
  const selectAuthorFromSearch = async (authorName: string) => {
    setSelectedAuthorName(authorName)
    await loadBooksByAuthor(authorName)
  }

  // Select a publisher from search results
  const selectPublisherFromSearch = async (publisherName: string) => {
    setSelectedPublisherName(publisherName)
    await loadBooksByPublisher(publisherName)
  }

  return (
    <div className="book-page container mx-auto py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Import Books by Author or Publisher</h1>
        <p className="text-gray-500">Add all books by a specific author or publisher to your library.</p>

        <Tabs defaultValue="author" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="author">
              <User className="mr-2 h-4 w-4" />
              By Author
            </TabsTrigger>
            <TabsTrigger value="publisher">
              <Building className="mr-2 h-4 w-4" />
              By Publisher
            </TabsTrigger>
          </TabsList>

          <TabsContent value="author">
            <Card>
              <CardHeader>
                <CardTitle>Import Books by Author</CardTitle>
                <CardDescription>Select an existing author from your database or search for a new one.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="existing" onValueChange={setActiveSubTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Existing Authors</TabsTrigger>
                    <TabsTrigger value="search">Search Authors</TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing">
                    <div className="space-y-4 py-4">
                      <Select onValueChange={handleAuthorSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an author" />
                        </SelectTrigger>
                        <SelectContent>
                          {dbAuthors.map((author) => (
                            <SelectItem key={author.id} value={author.id}>
                              {author.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="search">
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search for an author..."
                          value={authorSearchQuery}
                          onChange={(e) => setAuthorSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAuthorSearch()}
                        />
                        <Button onClick={handleAuthorSearch} disabled={searching || !authorSearchQuery.trim()}>
                          {searching ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="mr-2 h-4 w-4" />
                          )}
                          Search
                        </Button>
                      </div>

                      {authorSearchResults.length > 0 ? (
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Author Name</TableHead>
                                <TableHead className="w-24">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {authorSearchResults.map((author, index) => (
                                <TableRow key={index}>
                                  <TableCell>{author}</TableCell>
                                  <TableCell>
                                    <Button size="sm" variant="outline" onClick={() => selectAuthorFromSearch(author)}>
                                      Select
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        authorSearchQuery &&
                        !searching && (
                          <div className="text-center py-4 text-gray-500">
                            No authors found. Try a different search term.
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {selectedAuthorName && (
                  <>
                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Books by {selectedAuthorName}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectAll(true)}
                            disabled={books.length === 0}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectAll(false)}
                            disabled={books.length === 0}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>

                      {loading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : books.length > 0 ? (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>ISBN</TableHead>
                                <TableHead>Publisher</TableHead>
                                <TableHead>Published</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {books.map((book) => (
                                <TableRow
                                  key={book.isbn13 || book.isbn}
                                  className="cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleBookSelection(book.isbn13 || book.isbn)}
                                >
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      checked={selectedBooks.has(book.isbn13 || book.isbn)}
                                      onChange={() => toggleBookSelection(book.isbn13 || book.isbn)}
                                      className="h-4 w-4"
                                    />
                                  </TableCell>
                                  <TableCell>{book.title}</TableCell>
                                  <TableCell>{book.isbn13 || book.isbn}</TableCell>
                                  <TableCell>{book.publisher}</TableCell>
                                  <TableCell>{book.publish_date}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        selectedAuthorName &&
                        !loading && (
                          <div className="text-center py-8 text-gray-500">No books found for this author.</div>
                        )
                      )}

                      {books.length > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {selectedBooks.size} of {books.length} books selected
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={handleCheckDuplicates}
                              disabled={checking || selectedBooks.size === 0}
                            >
                              {checking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="mr-2 h-4 w-4" />
                              )}
                              Check Duplicates
                            </Button>
                            <Button onClick={handleImport} disabled={loading || selectedBooks.size === 0}>
                              {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <BookPlus className="mr-2 h-4 w-4" />
                              )}
                              Import Selected
                            </Button>
                          </div>
                        </div>
                      )}

                      {duplicates.length > 0 && (
                        <Alert variant="default">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Duplicates Found</AlertTitle>
                          <AlertDescription>
                            {duplicates.length} ISBN(s) already exist in your library:
                            <div className="mt-2 flex flex-wrap gap-2">
                              {duplicates.map((isbn) => (
                                <Badge key={isbn} variant="outline">
                                  {isbn}
                                </Badge>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publisher">
            <Card>
              <CardHeader>
                <CardTitle>Import Books by Publisher</CardTitle>
                <CardDescription>
                  Select an existing publisher from your database or search for a new one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="existing" onValueChange={setActiveSubTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Existing Publishers</TabsTrigger>
                    <TabsTrigger value="search">Search Publishers</TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing">
                    <div className="space-y-4 py-4">
                      <Select onValueChange={handlePublisherSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a publisher" />
                        </SelectTrigger>
                        <SelectContent>
                          {dbPublishers.map((publisher) => (
                            <SelectItem key={publisher.id} value={publisher.id}>
                              {publisher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="search">
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search for a publisher..."
                          value={publisherSearchQuery}
                          onChange={(e) => setPublisherSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePublisherSearch()}
                        />
                        <Button onClick={handlePublisherSearch} disabled={searching || !publisherSearchQuery.trim()}>
                          {searching ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="mr-2 h-4 w-4" />
                          )}
                          Search
                        </Button>
                      </div>

                      {publisherSearchResults.length > 0 ? (
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Publisher Name</TableHead>
                                <TableHead className="w-24">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {publisherSearchResults.map((publisher, index) => (
                                <TableRow key={index}>
                                  <TableCell>{publisher}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => selectPublisherFromSearch(publisher)}
                                    >
                                      Select
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        publisherSearchQuery &&
                        !searching && (
                          <div className="text-center py-4 text-gray-500">
                            No publishers found. Try a different search term.
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {selectedPublisherName && (
                  <>
                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Books by {selectedPublisherName}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectAll(true)}
                            disabled={books.length === 0}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectAll(false)}
                            disabled={books.length === 0}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>

                      {loading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : books.length > 0 ? (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>ISBN</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Published</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {books.map((book) => (
                                <TableRow
                                  key={book.isbn13 || book.isbn}
                                  className="cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleBookSelection(book.isbn13 || book.isbn)}
                                >
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      checked={selectedBooks.has(book.isbn13 || book.isbn)}
                                      onChange={() => toggleBookSelection(book.isbn13 || book.isbn)}
                                      className="h-4 w-4"
                                    />
                                  </TableCell>
                                  <TableCell>{book.title}</TableCell>
                                  <TableCell>{book.isbn13 || book.isbn}</TableCell>
                                  <TableCell>{book.authors?.join(", ")}</TableCell>
                                  <TableCell>{book.publish_date}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        selectedPublisherName &&
                        !loading && (
                          <div className="text-center py-8 text-gray-500">No books found for this publisher.</div>
                        )
                      )}

                      {books.length > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {selectedBooks.size} of {books.length} books selected
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={handleCheckDuplicates}
                              disabled={checking || selectedBooks.size === 0}
                            >
                              {checking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="mr-2 h-4 w-4" />
                              )}
                              Check Duplicates
                            </Button>
                            <Button onClick={handleImport} disabled={loading || selectedBooks.size === 0}>
                              {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <BookPlus className="mr-2 h-4 w-4" />
                              )}
                              Import Selected
                            </Button>
                          </div>
                        </div>
                      )}

                      {duplicates.length > 0 && (
                        <Alert variant="default">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Duplicates Found</AlertTitle>
                          <AlertDescription>
                            {duplicates.length} ISBN(s) already exist in your library:
                            <div className="mt-2 flex flex-wrap gap-2">
                              {duplicates.map((isbn) => (
                                <Badge key={isbn} variant="outline">
                                  {isbn}
                                </Badge>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {importResult && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent>
              {importResult.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{importResult.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                      <span className="text-2xl font-bold">{importResult.added}</span>
                      <span className="text-sm text-gray-500">Books Added</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
                      <span className="text-2xl font-bold">{importResult.duplicates}</span>
                      <span className="text-sm text-gray-500">Duplicates</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                      <XCircle className="h-8 w-8 text-red-500 mb-2" />
                      <span className="text-2xl font-bold">{importResult.errors}</span>
                      <span className="text-sm text-gray-500">Errors</span>
                    </div>
                  </div>

                  {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error Details</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-5 mt-2">
                          {importResult.errorDetails.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => (window.location.href = "/books")}>
                Go to Books
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
