"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Check } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addBooks } from './actions';

interface Book {
  title: string;
  image: string;
  authors: string[];
  date_published: string;
  publisher: string;
  pages: number;
  isbn13?: string;
  isbn?: string;
  // Additional fields for enhanced functionality
  synopsis?: string;
  overview?: string;
  binding?: string;
  edition?: string;
  dimensions?: string;
  msrp?: string;
  subjects?: string[];
  language?: string;
}

// ImportResult type for tracking import feedback
interface ImportResult {
  added: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
}

// Create a reusable BookCard component with enhanced functionality
function BookCard({ 
  book, 
  isSelected, 
  onSelect, 
  isInSystem, 
  isDisabled 
}: { 
  book: Book;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  isInSystem: boolean;
  isDisabled: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Detect image aspect ratio on mount
  useEffect(() => {
    const imgObj = new Image();
    imgObj.src = book.image;
    imgObj.onload = () => {
      const ratio = imgObj.naturalWidth / imgObj.naturalHeight;
      if (ratio >= 0.8 && ratio <= 1.2) {
        setShowOverlay(true);
      }
    };
  }, [book.image]);

  return (
    <div className={`book-card border rounded-lg shadow-lg bg-white overflow-hidden relative ${isInSystem ? 'opacity-60' : ''}`}>
      {/* Selection indicator */}
      <div className="absolute top-2 left-2 z-20">
        {isInSystem ? (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        ) : (
          <input
            type="checkbox"
            className="w-5 h-5"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            disabled={isDisabled}
          />
        )}
      </div>

      {/* In System Badge */}
      {isInSystem && (
        <div className="absolute top-2 right-2 z-20">
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            In System
          </span>
        </div>
      )}

      <div
        className="book-card-image-wrapper relative mb-4"
        style={
          showOverlay
            ? { aspectRatio: '2 / 3', backgroundImage: `url(${book.image})`, backgroundSize: '200%', backgroundPosition: 'center' }
            : { aspectRatio: '2 / 3' }
        }
      >
        {showOverlay && (
          <div className="book-card-image-bg absolute inset-0 backdrop-blur-lg backdrop-brightness-95"></div>
        )}
        <img
          src={book.image}
          alt={book.title}
          className={`book-card-image-foreground relative h-full w-full ${showOverlay ? 'object-contain z-10' : 'object-cover'}`}
        />
      </div>
      <div className="book-card-content p-4">
        <h2 className="book-card-title text-lg font-semibold mb-1">{book.title}</h2>
        <p className="book-card-authors text-gray-600 mb-1">{book.authors.join(', ')}</p>
        <p className="book-card-date text-sm text-gray-500 mb-1">{new Date(book.date_published).toLocaleDateString()}</p>
        <p className="book-card-publisher text-sm text-gray-500 mb-1">Publisher: {book.publisher}</p>
        <p className="book-card-pages text-sm text-gray-500">{book.pages} pages</p>
      </div>
    </div>
  );
}

export default function FetchByYearPage() {
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [pageInput, setPageInput] = useState('');
  const [pageSizeInput, setPageSizeInput] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced selection tracking
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [booksInSystem, setBooksInSystem] = useState<Set<string>>(new Set());
  const [checkingSystem, setCheckingSystem] = useState(false);
  
  // Import feedback states
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Compute total number of pages
  const totalPages = Math.ceil(total / pageSize);
  // Generate full page options from 1 to totalPages
  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Check which books are already in the system
  const checkBooksInSystem = async (bookList: Book[]) => {
    if (bookList.length === 0) return;
    
    setCheckingSystem(true);
    try {
      const isbns = bookList.map(book => book.isbn13 || book.isbn).filter(Boolean);
      const res = await fetch('/api/books/check-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbns }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setBooksInSystem(new Set(data.existingIsbns || []));
      }
    } catch (error) {
      console.error('Error checking books in system:', error);
    } finally {
      setCheckingSystem(false);
    }
  };

  const handleFetch = async (newPage?: number) => {
    if (!subject.trim() || !year.trim()) {
      setError('Please enter both a subject and a publication year.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setBooks([]);
    setSelectedBooks([]);
    setBooksInSystem(new Set());
    
    // Determine requested page and pageSize
    let pageParam: number;
    if (newPage !== undefined) {
      pageParam = newPage;
    } else if (pageInput.trim()) {
      const p = parseInt(pageInput.trim(), 10);
      pageParam = isNaN(p) || p < 1 ? page : p;
    } else {
      pageParam = page;
    }
    
    let pageSizeParam: number;
    if (pageSizeInput.trim()) {
      const ps = parseInt(pageSizeInput.trim(), 10);
      pageSizeParam = isNaN(ps) || ps < 1 || ps > 1000 ? pageSize : ps;
    } else {
      pageSizeParam = pageSize;
    }
    
    setPage(pageParam);
    setPageSize(pageSizeParam);
    
    try {
      const res = await fetch('/api/isbn/fetch-by-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), year: year.trim(), page: pageParam, pageSize: pageSizeParam }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch books');
      }
      
      const data = await res.json();
      const fetchedBooks = data.books || [];
      setBooks(fetchedBooks);
      setTotal(data.total || 0);
      
      // Check which books are already in the system
      await checkBooksInSystem(fetchedBooks);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced import with book objects
  const handleImport = async () => {
    if (selectedBooks.length === 0) return;
    
    setImportError(null);
    setImportResult(null);
    setImporting(true);
    
    try {
      const res = await fetch('/api/books/import-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: selectedBooks }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      
      setImportResult(data as ImportResult);
      setSelectedBooks([]);
      
      // Refresh book status after import
      await refreshBookStatus();
      
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  };

  // Refresh book status after import
  const refreshBookStatus = async () => {
    if (books.length === 0) return;
    
    setCheckingSystem(true);
    try {
      const isbns = books.map(book => book.isbn13 || book.isbn).filter(Boolean);
      const res = await fetch('/api/books/check-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbns }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const newBooksInSystem = new Set(data.existingIsbns || []);
        setBooksInSystem(newBooksInSystem);
        
        // Remove newly imported books from selection
        setSelectedBooks(prev => prev.filter(book => {
          const isbn = book.isbn13 || book.isbn;
          return !isbn || !newBooksInSystem.has(isbn);
        }));
      }
    } catch (error) {
      console.error('Error refreshing book status:', error);
    } finally {
      setCheckingSystem(false);
    }
  };

  // Handle book selection
  const handleBookSelect = (book: Book, selected: boolean) => {
    if (selected) {
      setSelectedBooks(prev => [...prev, book]);
    } else {
      setSelectedBooks(prev => prev.filter(b => b !== book));
    }
  };

  // Select all available books (not in system)
  const selectAllAvailable = () => {
    const availableBooks = books.filter(book => {
      const isbn = book.isbn13 || book.isbn;
      return isbn && !booksInSystem.has(isbn);
    });
    setSelectedBooks(availableBooks);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedBooks([]);
  };

  // Calculate counts
  const availableBooks = books.filter(book => {
    const isbn = book.isbn13 || book.isbn;
    return isbn && !booksInSystem.has(isbn);
  });
  
  const booksInSystemCount = books.filter(book => {
    const isbn = book.isbn13 || book.isbn;
    return isbn && booksInSystem.has(isbn);
  }).length;

  return (
    <div className="p-6">
      <Link href="/admin/retrieve-books" className="text-blue-500 underline">
        &larr; Back to Retrieval Options
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-4 flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        Fetch Books by Publication Date
      </h1>

      {/* Filter inputs: Subject and Year side-by-side */}
      <div className="filter-controls grid grid-cols-2 gap-4 mb-4">
        <div className="filter-subject">
          <label className="filter-label block mb-1 font-medium" htmlFor="subject">Subject</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. fiction"
            className="filter-input-subject w-full border rounded px-3 py-2"
          />
        </div>
        <div className="filter-year">
          <label className="filter-label block mb-1 font-medium" htmlFor="year">Publication Year</label>
          <input
            id="year"
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2025"
            className="filter-input-year w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="filter-pagination-controls grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="filter-label block mb-1 font-medium" htmlFor="pageInput">Page</label>
          <input
            id="pageInput"
            type="number"
            value={pageInput}
            min={1}
            onChange={(e) => setPageInput(e.target.value)}
            className="filter-input-page w-full border rounded px-3 py-2"
            placeholder={String(page)}
          />
        </div>
        <div>
          <label className="filter-label block mb-1 font-medium" htmlFor="pageSizeInput">Page Size</label>
          <input
            id="pageSizeInput"
            type="number"
            value={pageSizeInput}
            min={1}
            max={1000}
            onChange={(e) => setPageSizeInput(e.target.value)}
            className="filter-input-page-size w-full border rounded px-3 py-2"
            placeholder={String(pageSize)}
          />
        </div>
      </div>

      <button
        onClick={() => handleFetch()}
        disabled={loading}
        className="btn-fetch-books px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Fetching...' : 'Fetch Books'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {total > 0 && (
        <div className="pagination-container-top mt-6">
          <p className="pagination-summary text-sm text-muted-foreground mb-2">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} books.
          </p>
          {total > pageSize && (
            <div className="pagination-controls-top flex items-center gap-4">
              <button
                disabled={page <= 1 || loading}
                onClick={() => handleFetch(page - 1)}
                className="pagination-btn-prev px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >Prev</button>
              <span className="pagination-info">Page {page} of {totalPages}</span>
              <Select value={String(page)} onValueChange={(val) => handleFetch(Number(val))}>
                <SelectTrigger className="pagination-select-trigger border rounded px-2 py-1 w-20">
                  <SelectValue placeholder={String(page)} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {pageOptions.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                disabled={page * pageSize >= total || loading}
                onClick={() => handleFetch(page + 1)}
                className="pagination-btn-next px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* Selection controls */}
      {books.length > 0 && (
        <div className="selection-controls mt-4 mb-4 flex items-center gap-4">
          <div className="selection-info text-sm text-gray-600">
            {selectedBooks.length} of {availableBooks.length} available books selected ({booksInSystemCount} already in system)
          </div>
          <button
            onClick={selectAllAvailable}
            disabled={availableBooks.length === 0}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
          >
            Select All Available
          </button>
          <button
            onClick={clearSelection}
            disabled={selectedBooks.length === 0}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm disabled:opacity-50"
          >
            Clear Selection
          </button>
          {checkingSystem && (
            <span className="text-sm text-gray-500">Updating status...</span>
          )}
        </div>
      )}

      <div className="results-grid mt-6 grid grid-cols-1 md:grid-cols-6 gap-6">
        {books.map((book, idx) => {
          const isbn = book.isbn13 || book.isbn;
          const isInSystem = isbn ? booksInSystem.has(isbn) : false;
          const isSelected = selectedBooks.includes(book);
          
          return (
            <div key={isbn || idx} className="book-item relative">
              <BookCard 
                book={book}
                isSelected={isSelected}
                onSelect={(selected) => handleBookSelect(book, selected)}
                isInSystem={isInSystem}
                isDisabled={isInSystem}
              />
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <div className="pagination-container-bottom border-t pt-4 mt-6">
          <p className="pagination-summary text-sm text-muted-foreground mb-2">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} books.
          </p>
          {total > pageSize && (
            <div className="pagination-controls-bottom flex items-center gap-4">
              <button
                disabled={page <= 1 || loading}
                onClick={() => handleFetch(page - 1)}
                className="pagination-btn-prev px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >Prev</button>
              <span className="pagination-info">Page {page} of {totalPages}</span>
              <Select value={String(page)} onValueChange={(val) => handleFetch(Number(val))}>
                <SelectTrigger className="pagination-select-trigger border rounded px-2 py-1 w-20">
                  <SelectValue placeholder={String(page)} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {pageOptions.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                disabled={page * pageSize >= total || loading}
                onClick={() => handleFetch(page + 1)}
                className="pagination-btn-next px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* Import controls */}
      {selectedBooks.length > 0 && (
        <div className="import-controls mt-6 mb-4">
          <button
            type="button"
            onClick={handleImport}
            className="btn-import-selection px-4 py-2 bg-green-600 text-white rounded"
            disabled={importing}
          >
            {importing ? 'Importing...' : `Import ${selectedBooks.length} Selected Books`}
          </button>
        </div>
      )}

      {/* Display import feedback */}
      {importResult && (
        <div className="import-feedback mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Import Complete</h3>
          <p className="text-green-700">
            Added {importResult.added}, skipped {importResult.duplicates} duplicates, errors: {importResult.errors}.
          </p>
          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div className="mt-2">
              <h4 className="font-medium text-red-800">Errors:</h4>
              <ul className="list-disc ml-4 text-red-700">
                {importResult.errorDetails.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {importError && (
        <div className="import-error mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Import Error</h3>
          <p className="text-red-700">{importError}</p>
        </div>
      )}
    </div>
  );
} 