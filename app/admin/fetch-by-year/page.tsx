"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
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
}

// ImportResult type for tracking import feedback
interface ImportResult {
  added: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
}

// Create a reusable BookCard component
function BookCard({ book }: { book: Book }) {
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
    <div className="book-card border rounded-lg shadow-lg bg-white overflow-hidden">
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
  // Track which ISBNs are selected for import
  const [selectedIsbns, setSelectedIsbns] = useState<string[]>([]);
  // Preview JSON data of the selected books without importing
  const [previewData, setPreviewData] = useState<Book[] | null>(null);
  // Import feedback states
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  // Compute total number of pages
  const totalPages = Math.ceil(total / pageSize);
  // Generate full page options from 1 to totalPages
  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleFetch = async (newPage?: number) => {
    if (!subject.trim() || !year.trim()) {
      setError('Please enter both a subject and a publication year.');
      return;
    }
    // Clear previous preview when fetching new data
    setPreviewData(null);
    setLoading(true);
    setError(null);
    setBooks([]);
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
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle import via API and show feedback
  const handleImport = async () => {
    setImportError(null);
    setImportResult(null);
    setImporting(true);
    try {
      const res = await fetch('/api/books/import-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbns: selectedIsbns }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult(data as ImportResult);
      // clear selection if desired
      setSelectedIsbns([]);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  };

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

      <div className="results-grid mt-6 grid grid-cols-1 md:grid-cols-6 gap-6">
        {books.map((book, idx) => {
          const isbnKey = book.isbn13 || book.isbn || String(idx);
          return (
            <div key={isbnKey} className="book-item relative">
              <input
                type="checkbox"
                className="select-book absolute top-2 left-2 z-20"
                checked={selectedIsbns.includes(isbnKey)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIsbns((prev) => [...prev, isbnKey]);
                  } else {
                    setSelectedIsbns((prev) => prev.filter((i) => i !== isbnKey));
                  }
                }}
              />
              <BookCard book={book} />
            </div>
          )
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

      <div className="import-preview-actions mb-4 flex gap-2">
        {/* Preview Selected Books */}
        <button
          type="button"
          onClick={() => {
            const preview = books.filter((book, idx) => {
              const key = book.isbn13 || book.isbn || String(idx);
              return selectedIsbns.includes(key);
            });
            setPreviewData(preview);
          }}
          className="btn-preview px-4 py-2 bg-yellow-500 text-white rounded"
          disabled={selectedIsbns.length === 0}
        >Preview Selected Books</button>
        {/* Import Selected Books */}
        <button
          type="button"
          onClick={handleImport}
          className="btn-import-selection px-4 py-2 bg-green-600 text-white rounded"
          disabled={selectedIsbns.length === 0 || importing}
        >
          {importing ? 'Importing...' : 'Import Selected Books'}
        </button>
      </div>
      {/* Display import feedback */}
      {importResult && (
        <div className="import-feedback mb-4">
          <p>
            Added {importResult.added}, skipped {importResult.duplicates} duplicates, errors: {importResult.errors}.
          </p>
          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <ul className="list-disc ml-4">
              {importResult.errorDetails.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {importError && <p className="text-red-600 mb-4">{importError}</p>}

      {/* Render preview JSON if set */}
      {previewData && (
        <div className="preview-container mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Preview Selected Books Data</h3>
          <pre className="overflow-auto text-sm whitespace-pre-wrap">
            {JSON.stringify(previewData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 