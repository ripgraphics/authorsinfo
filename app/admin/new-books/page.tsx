"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Check, Calendar, User, Building, Hash, FileText, Star, Link as LucideLink, Download, RefreshCw, Info, AlertCircle } from 'lucide-react';
import Image from "next/image";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

interface Book {
  id?: string;
  title: string;
  title_long?: string;
  isbn: string;
  isbn13: string;
  publisher?: string;
  date_published?: string;
  authors?: string[];
  subjects?: string[];
  overview?: string;
  synopsis?: string;
  excerpt?: string;
  pages?: number;
  language?: string;
  binding?: string;
  dimensions?: string;
  msrp?: number;
  dewey_decimal?: string[];
  reviews?: string[];
  other_isbns?: Array<{ isbn: string; binding: string }>;
  related?: { type: string };
  image?: string;
  image_original?: string;
  isbndb_last_updated?: string;
  isbndb_data_version?: string;
  raw_isbndb_data?: any;
}

interface SearchResponse {
  total: number;
  books: Book[];
  searchType: string;
  year: string;
  page: number;
  pageSize: number;
}

interface ImportResponse {
  total: number;
  stored: number;
  books: Book[];
}

export default function NewBooksPage() {
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [searchType, setSearchType] = useState<'subject'>('subject');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'author'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [autoFetchAll, setAutoFetchAll] = useState(false);
  const [fetchingAllPages, setFetchingAllPages] = useState(false);
  const [allFetchedBooks, setAllFetchedBooks] = useState<Book[]>([]);

  const fetchBooks = async (targetPage?: number, accumulateResults: boolean = false) => {
    setLoading(true);
    if (accumulateResults) {
      setFetchingAllPages(true);
    }
    try {
      // Validate subject parameter
      if (!subject || subject.trim() === '') {
        throw new Error('Subject is required');
      }

      const currentPage = targetPage || page;
      const params = new URLSearchParams({
        subject: subject.trim(),
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchType: 'subject', // Explicitly set to 'subject' to avoid defaulting to 'recent'
        ...(year && year.trim() !== '' && { year: year.trim() }),
      });

      const response = await fetch(`/api/isbn/fetch-by-year?${params}`);
      if (!response.ok) {
        // Try to get the actual error message from the API response
        let errorMessage = 'Failed to fetch books';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = `Failed to fetch books: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data: SearchResponse = await response.json();
      const fetchedBooks = data.books || [];
      
      // Check which books are already in the system and filter them out
      if (fetchedBooks.length > 0) {
        const isbns = fetchedBooks.map((book) => book.isbn13 || book.isbn).filter(Boolean);
        
        if (isbns.length > 0) {
          try {
            const checkRes = await fetch('/api/books/check-existing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isbns }),
            });
            
            if (checkRes.ok) {
              const existingData = await checkRes.json();
              const existingIsbns = new Set(existingData.existingIsbns || []);
              
              // Filter out books that are already in the system
              const newBooks = fetchedBooks.filter((book) => {
                const isbn = book.isbn13 || book.isbn;
                return !isbn || !existingIsbns.has(isbn);
              });
              
              if (accumulateResults) {
                // Add to accumulated results
                setAllFetchedBooks(prev => {
                  const existingIsbns = new Set(prev.map(b => b.isbn13 || b.isbn));
                  const uniqueNewBooks = newBooks.filter(b => {
                    const isbn = b.isbn13 || b.isbn;
                    return !isbn || !existingIsbns.has(isbn);
                  });
                  return [...prev, ...uniqueNewBooks];
                });
              } else {
                setBooks(newBooks);
                setTotal(newBooks.length);
              }
              
              const filteredCount = fetchedBooks.length - newBooks.length;
              toast({
                title: "Books fetched successfully",
                description: `Found ${newBooks.length} new books${filteredCount > 0 ? ` (${filteredCount} already in system)` : ''}${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
              });
            } else {
              // If check fails, show all books
              if (accumulateResults) {
                setAllFetchedBooks(prev => [...prev, ...fetchedBooks]);
              } else {
                setBooks(fetchedBooks);
                setTotal(data.total || 0);
              }
              toast({
                title: "Books fetched successfully",
                description: `Found ${data.total} books${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
              });
            }
          } catch (checkError) {
            console.error('Error checking existing books:', checkError);
            // If check fails, show all books
            if (accumulateResults) {
              setAllFetchedBooks(prev => [...prev, ...fetchedBooks]);
            } else {
              setBooks(fetchedBooks);
              setTotal(data.total || 0);
            }
            toast({
              title: "Books fetched successfully",
              description: `Found ${data.total} books${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
            });
          }
        } else {
          if (accumulateResults) {
            setAllFetchedBooks(prev => [...prev, ...fetchedBooks]);
          } else {
            setBooks(fetchedBooks);
            setTotal(data.total || 0);
          }
          toast({
            title: "Books fetched successfully",
            description: `Found ${data.total} books${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
          });
        }
      } else {
        setBooks([]);
        setTotal(0);
        toast({
          title: "No books found",
          description: `No books found${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
        });
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error fetching books",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (accumulateResults) {
        setFetchingAllPages(false);
      }
    }
  };

  const fetchAllPages = async () => {
    if (!subject || subject.trim() === '') {
      toast({
        title: "Subject required",
        description: "Please enter a subject to search",
        variant: "destructive",
      });
      return;
    }

    setFetchingAllPages(true);
    setAllFetchedBooks([]);
    const accumulatedBooks: Book[] = [];
    
    try {
      // First, fetch page 1 to get total count
      const firstPageParams = new URLSearchParams({
        subject: subject.trim(),
        page: '1',
        pageSize: pageSize.toString(),
        searchType: 'subject',
        ...(year && year.trim() !== '' && { year: year.trim() }),
      });

      const firstResponse = await fetch(`/api/isbn/fetch-by-year?${firstPageParams}`);
      if (!firstResponse.ok) {
        throw new Error('Failed to fetch first page');
      }

      const firstData: SearchResponse = await firstResponse.json();
      const totalResults = firstData.total || 0;
      const totalPages = Math.ceil(totalResults / pageSize);

      // Process all pages
      for (let p = 1; p <= totalPages; p++) {
        const params = new URLSearchParams({
          subject: subject.trim(),
          page: p.toString(),
          pageSize: pageSize.toString(),
          searchType: 'subject',
          ...(year && year.trim() !== '' && { year: year.trim() }),
        });

        const response = await fetch(`/api/isbn/fetch-by-year?${params}`);
        if (!response.ok) {
          console.warn(`Failed to fetch page ${p}`);
          continue;
        }

        const data: SearchResponse = await response.json();
        const fetchedBooks = data.books || [];
        accumulatedBooks.push(...fetchedBooks);
        
        // Small delay to avoid overwhelming the API
        if (p < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // After all pages are fetched, check for existing books and filter
      if (accumulatedBooks.length > 0) {
        const allIsbns = accumulatedBooks.map((book) => book.isbn13 || book.isbn).filter(Boolean);
        
        if (allIsbns.length > 0) {
          const checkRes = await fetch('/api/books/check-existing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbns: allIsbns }),
          });
          
          if (checkRes.ok) {
            const existingData = await checkRes.json();
            const existingIsbns = new Set(existingData.existingIsbns || []);
            
            const finalBooks = accumulatedBooks.filter((book) => {
              const isbn = book.isbn13 || book.isbn;
              return !isbn || !existingIsbns.has(isbn);
            });
            
            setBooks(finalBooks);
            setTotal(finalBooks.length);
            setAllFetchedBooks(finalBooks);
            
            toast({
              title: "All pages fetched",
              description: `Fetched ${finalBooks.length} new books from ${totalPages} pages${subject ? ` for subject "${subject}"` : ''}${year ? ` in ${year}` : ''}`,
            });
          } else {
            setBooks(accumulatedBooks);
            setTotal(accumulatedBooks.length);
            setAllFetchedBooks(accumulatedBooks);
          }
        } else {
          setBooks(accumulatedBooks);
          setTotal(accumulatedBooks.length);
          setAllFetchedBooks(accumulatedBooks);
        }
      } else {
        setBooks([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching all pages:', error);
      toast({
        title: "Error fetching all pages",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setFetchingAllPages(false);
    }
  };

  const importSelectedBooks = async () => {
    if (selectedBooks.size === 0) {
      toast({
        title: "No books selected",
        description: "Please select at least one book to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportStats(null);

    try {
      const selectedBookList = books.filter(book => 
        selectedBooks.has(book.isbn13 || book.isbn)
      );

      const response = await fetch('/api/isbn/fetch-by-year', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isbns: selectedBookList.map(book => book.isbn13 || book.isbn),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import books');
      }

      const data: ImportResponse = await response.json();
      setImportProgress(100);
      setImportStats({
        total: data.total,
        stored: data.stored,
        success: true,
      });

      toast({
        title: "Import completed",
        description: `Successfully imported ${data.stored} out of ${data.total} books`,
      });

      // Clear selection
      setSelectedBooks(new Set());
      
      // Refresh the book list to show updated status
      await fetchBooks();
    } catch (error) {
      console.error('Error importing books:', error);
      setImportStats({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      });
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const toggleBookSelection = (isbn: string) => {
    const newSelection = new Set(selectedBooks);
    if (newSelection.has(isbn)) {
      newSelection.delete(isbn);
    } else {
      newSelection.add(isbn);
    }
    setSelectedBooks(newSelection);
  };

  const selectAllBooks = () => {
    const allIsbns = books.map(book => book.isbn13 || book.isbn);
    setSelectedBooks(new Set(allIsbns));
  };

  const clearSelection = () => {
    setSelectedBooks(new Set());
  };

  const sortedBooks = [...books].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'date':
        aValue = a.date_published || '';
        bValue = b.date_published || '';
        break;
      case 'title':
        aValue = a.title || '';
        bValue = b.title || '';
        break;
      case 'author':
        aValue = a.authors?.[0] || '';
        bValue = b.authors?.[0] || '';
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  useEffect(() => {
    if (subject.trim() !== '') {
      fetchBooks();
    }
  }, [subject, year, page, pageSize]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const truncateText = (text?: string, maxLength: number = 150) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Search Books by Subject</h1>
          <p className="text-muted-foreground">
            Search and import books by subject from ISBNdb with comprehensive data collection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => fetchBooks()}
            disabled={loading || !subject.trim()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Search
          </Button>
        </div>
      </div>

      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., physics, fiction, history"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year (Optional)</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2025"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'author') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Publication Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="outline"
              size="sm"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Progress */}
      {importing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Importing Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={importProgress} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Processing {selectedBooks.size} selected books...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importStats && (
        <Alert className={importStats.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {importStats.success ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={importStats.success ? "text-green-800" : "text-red-800"}>
            {importStats.success ? (
              `Successfully imported ${importStats.stored} out of ${importStats.total} books`
            ) : (
              `Import failed: ${importStats.error}`
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Found {total} books{subject ? ` for subject "${subject}"` : ''}{year ? ` in ${year}` : ''}
          </p>
          <Badge variant="secondary">
            Page {page} of {Math.ceil(total / pageSize)}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 border-r pr-2">
            <Label htmlFor="auto-fetch" className="flex items-center space-x-2 cursor-pointer text-sm">
              <input
                id="auto-fetch"
                type="checkbox"
                checked={autoFetchAll}
                onChange={(e) => setAutoFetchAll(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Auto-fetch all pages</span>
            </Label>
            {autoFetchAll && (
              <Button
                onClick={fetchAllPages}
                disabled={fetchingAllPages || !subject.trim()}
                variant="outline"
                size="sm"
              >
                {fetchingAllPages ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Fetching all pages...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Fetch All Pages
                  </>
                )}
              </Button>
            )}
          </div>
          <Button
            onClick={selectAllBooks}
            variant="outline"
            size="sm"
            disabled={books.length === 0}
          >
            Select All
          </Button>
          <Button
            onClick={clearSelection}
            variant="outline"
            size="sm"
            disabled={selectedBooks.size === 0}
          >
            Clear Selection
          </Button>
          <Button
            onClick={importSelectedBooks}
            disabled={selectedBooks.size === 0 || importing}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Import Selected ({selectedBooks.size})
          </Button>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sortedBooks.map((book) => {
          const isSelected = selectedBooks.has(book.isbn13 || book.isbn);
          const hasEnhancedData = book.excerpt || book.reviews || book.other_isbns || book.dewey_decimal;
          
          return (
            <Card key={book.isbn13 || book.isbn} className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
              {/* Checkbox */}
              <div className="absolute top-2 right-2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleBookSelection(book.isbn13 || book.isbn)}
                  className="h-4 w-4"
                />
              </div>

              <CardContent className="p-3 space-y-2">
                {/* Book Cover */}
                {book.image ? (
                  <div className="relative w-full aspect-[2/3] rounded overflow-hidden bg-gray-100 mb-2">
                    <Image
                      src={book.image}
                      alt={book.title || "Book cover"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 16vw"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[2/3] rounded bg-gray-100 flex items-center justify-center mb-2">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Title - Exactly 2 lines (min and max) */}
                <h3 className="text-sm font-semibold leading-[1.25rem] line-clamp-2 h-[2.5rem] overflow-hidden">
                  {book.title}
                </h3>

                {/* Author - Exactly 2 lines (min and max) */}
                {book.authors && book.authors.length > 0 && (
                  <p className="text-xs text-muted-foreground leading-[1rem] line-clamp-2 h-[2rem] overflow-hidden">
                    {book.authors.join(", ")}
                  </p>
                )}

                {/* Date */}
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(book.date_published)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {books.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {subject.trim() === '' ? (
                <p className="text-muted-foreground">Enter a subject above to search for books</p>
              ) : (
                <p className="text-muted-foreground">No books found for the selected criteria</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 