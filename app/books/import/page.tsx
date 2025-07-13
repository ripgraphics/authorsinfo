"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, XCircle, FileText, Search, BookPlus } from "lucide-react"
import { bulkImportBooks, checkForDuplicates } from "@/app/actions/bulk-import-books"
import { searchBooks, getLatestBooks } from "@/lib/isbndb"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ImportBooksPage() {
  const [isbnList, setIsbnList] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [latestBooks, setLatestBooks] = useState<any[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(false)
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [importResult, setImportResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setIsbnList(content)
    }
    reader.readAsText(file)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const results = await searchBooks(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLatestBooks = async () => {
    setLoading(true)
    try {
      const books = await getLatestBooks(currentPage)
      setLatestBooks(books)
      
      // Show a message if no books are returned (likely due to missing API key)
      if (books.length === 0) {
        console.warn("No latest books returned. This may be due to missing ISBNDB_API_KEY environment variable.")
      }
    } catch (error) {
      console.error("Error loading latest books:", error)
      // Don't show error to user, just log it and continue
    } finally {
      setLoading(false)
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

  const handleCheckDuplicates = async () => {
    setChecking(true)
    try {
      // Parse ISBNs from textarea
      const isbns = isbnList
        .split(/[\n,;]/)
        .map((isbn) => isbn.trim())
        .filter((isbn) => isbn.length > 0)

      if (isbns.length === 0) {
        return
      }

      const result = await checkForDuplicates(isbns)
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

  const handleImport = async () => {
    setLoading(true)
    setImportResult(null)

    try {
      let isbnsToImport: string[] = []

      if (activeTab === "manual") {
        // Parse ISBNs from textarea
        isbnsToImport = isbnList
          .split(/[\n,;]/)
          .map((isbn) => isbn.trim())
          .filter((isbn) => isbn.length > 0)
      } else {
        // Use selected books from search or latest
        isbnsToImport = Array.from(selectedBooks)
      }

      if (isbnsToImport.length === 0) {
        setImportResult({ error: "No ISBNs provided" })
        return
      }

      const result = await bulkImportBooks(isbnsToImport)
      setImportResult(result)
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="book-page container mx-auto py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Import Books</h1>
        <p className="text-gray-500">
          Add multiple books to your library at once. Your ISBNdb Basic plan allows up to 100 books per bulk import.
        </p>

        <Tabs defaultValue="manual" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="search">Search Books</TabsTrigger>
            <TabsTrigger value="latest" onClick={loadLatestBooks}>
              Latest Books
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Enter ISBN Numbers</CardTitle>
                <CardDescription>
                  Enter ISBN numbers separated by commas, spaces, or new lines. You can also upload a text file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter ISBN numbers here..."
                    className="min-h-[200px]"
                    value={isbnList}
                    onChange={(e) => setIsbnList(e.target.value)}
                  />

                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <FileText className="mr-2 h-4 w-4" />
                      Upload File
                    </Button>
                    <Input
                      type="file"
                      accept=".txt,.csv"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />

                    <Button
                      variant="secondary"
                      onClick={handleCheckDuplicates}
                      disabled={checking || isbnList.trim() === ""}
                    >
                      {checking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Check Duplicates
                    </Button>
                  </div>

                  {duplicates.length > 0 && (
                    <Alert variant="warning">
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
              </CardContent>
              <CardFooter>
                <Button onClick={handleImport} disabled={loading || isbnList.trim() === ""}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookPlus className="mr-2 h-4 w-4" />}
                  Import Books
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Search Books</CardTitle>
                <CardDescription>
                  Search for books by title, author, or ISBN and select the ones you want to import.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by title, author, or ISBN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Search
                    </Button>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>ISBN</TableHead>
                            <TableHead>Publisher</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((book) => (
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
                              <TableCell>{book.authors?.join(", ")}</TableCell>
                              <TableCell>{book.isbn13 || book.isbn}</TableCell>
                              <TableCell>{book.publisher}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    searchQuery &&
                    !loading && (
                      <div className="text-center py-8 text-gray-500">
                        No results found. Try a different search term.
                      </div>
                    )
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  {selectedBooks.size > 0 && (
                    <span className="text-sm text-gray-500">{selectedBooks.size} book(s) selected</span>
                  )}
                </div>
                <Button onClick={handleImport} disabled={loading || selectedBooks.size === 0}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookPlus className="mr-2 h-4 w-4" />}
                  Import Selected Books
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="latest">
            <Card>
              <CardHeader>
                <CardTitle>Latest Books</CardTitle>
                <CardDescription>
                  Browse the latest books added to ISBNdb and select the ones you want to import.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : latestBooks.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>ISBN</TableHead>
                          <TableHead>Publisher</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestBooks.map((book) => (
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
                            <TableCell>{book.authors?.join(", ")}</TableCell>
                            <TableCell>{book.isbn13 || book.isbn}</TableCell>
                            <TableCell>{book.publisher}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No books found from ISBNdb API.</p>
                    <p className="text-sm">This could be due to:</p>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>• API rate limiting (try again in a moment)</li>
                      <li>• Network connectivity issues</li>
                      <li>• API key restrictions</li>
                    </ul>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={loadLatestBooks}
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {latestBooks.length > 0 && (
                  <div className="flex justify-center mt-4 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPage(Math.max(1, currentPage - 1))
                        loadLatestBooks()
                      }}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPage(currentPage + 1)
                        loadLatestBooks()
                      }}
                      disabled={loading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  {selectedBooks.size > 0 && (
                    <span className="text-sm text-gray-500">{selectedBooks.size} book(s) selected</span>
                  )}
                </div>
                <Button onClick={handleImport} disabled={loading || selectedBooks.size === 0}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookPlus className="mr-2 h-4 w-4" />}
                  Import Selected Books
                </Button>
              </CardFooter>
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
