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
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [searchType, setSearchType] = useState<'recent' | 'year'>('recent');
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

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year,
        page: page.toString(),
        pageSize: pageSize.toString(),
        searchType,
      });

      const response = await fetch(`/api/isbn/fetch-by-year?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data: SearchResponse = await response.json();
      setBooks(data.books || []);
      setTotal(data.total || 0);
      
      toast({
        title: "Books fetched successfully",
        description: `Found ${data.total} books for ${data.searchType === 'recent' ? 'recent publications in' : ''} ${data.year}`,
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error fetching books",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    fetchBooks();
  }, [year, searchType, page, pageSize]);

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
          <h1 className="text-3xl font-bold">Latest Books from ISBNdb</h1>
          <p className="text-muted-foreground">
            Discover and import the newest books with comprehensive data collection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={fetchBooks}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={(value: 'recent' | 'year') => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent Publications</SelectItem>
                  <SelectItem value="year">Specific Year</SelectItem>
                </SelectContent>
              </Select>
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
            Found {total} books for {searchType === 'recent' ? 'recent publications in' : ''} {year}
          </p>
          <Badge variant="secondary">
            Page {page} of {Math.ceil(total / pageSize)}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedBooks.map((book) => {
          const isSelected = selectedBooks.has(book.isbn13 || book.isbn);
          const hasEnhancedData = book.excerpt || book.reviews || book.other_isbns || book.dewey_decimal;
          
          return (
            <Card key={book.isbn13 || book.isbn} className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {book.title}
                    </CardTitle>
                    {book.title_long && book.title_long !== book.title && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {truncateText(book.title_long, 100)}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(book.date_published)}</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleBookSelection(book.isbn13 || book.isbn)}
                    className="ml-2 h-4 w-4"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Authors */}
                {book.authors && book.authors.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {book.authors.map((author, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {author}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publisher */}
                {book.publisher && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{book.publisher}</span>
                  </div>
                )}

                {/* ISBNs */}
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm space-y-1">
                    {book.isbn13 && <div>ISBN-13: {book.isbn13}</div>}
                    {book.isbn && <div>ISBN-10: {book.isbn}</div>}
                  </div>
                </div>

                {/* Enhanced Data Indicators */}
                {hasEnhancedData && (
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <div className="flex flex-wrap gap-1">
                      {book.excerpt && <Badge variant="secondary" className="text-xs">Excerpt</Badge>}
                      {book.reviews && book.reviews.length > 0 && <Badge variant="secondary" className="text-xs">Reviews</Badge>}
                      {book.other_isbns && book.other_isbns.length > 0 && <Badge variant="secondary" className="text-xs">Variants</Badge>}
                      {book.dewey_decimal && book.dewey_decimal.length > 0 && <Badge variant="secondary" className="text-xs">Dewey</Badge>}
                    </div>
                  </div>
                )}

                {/* Overview/Synopsis */}
                {(book.overview || book.synopsis) && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Description</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {truncateText(book.overview || book.synopsis, 120)}
                    </p>
                  </div>
                )}

                {/* Excerpt */}
                {book.excerpt && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Excerpt</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {truncateText(book.excerpt, 100)}
                    </p>
                  </div>
                )}

                {/* Reviews */}
                {book.reviews && book.reviews.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Reviews ({book.reviews.length})</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {truncateText(book.reviews[0], 80)}
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {book.pages && (
                    <div>Pages: {book.pages}</div>
                  )}
                  {book.language && (
                    <div>Language: {book.language}</div>
                  )}
                  {book.binding && (
                    <div>Binding: {book.binding}</div>
                  )}
                  {book.msrp && (
                    <div>MSRP: ${book.msrp}</div>
                  )}
                </div>

                {/* Subjects */}
                {book.subjects && book.subjects.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Subjects:</span>
                    <div className="flex flex-wrap gap-1">
                      {book.subjects.slice(0, 3).map((subject, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {book.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{book.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Dewey Decimal */}
                {book.dewey_decimal && book.dewey_decimal.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Dewey Decimal:</span>
                    <div className="flex flex-wrap gap-1">
                      {book.dewey_decimal.slice(0, 2).map((dewey, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {dewey}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other ISBNs */}
                {book.other_isbns && book.other_isbns.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Other Formats:</span>
                    <div className="flex flex-wrap gap-1">
                      {book.other_isbns.slice(0, 2).map((variant, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {variant.binding} ({variant.isbn})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
              <p className="text-muted-foreground">No books found for the selected criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 