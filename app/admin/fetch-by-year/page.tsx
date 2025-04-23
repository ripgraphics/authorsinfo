"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface Book {
  title: string;
  image: string;
  authors: string[];
  date_published: string;
  publisher: string;
  pages: number;
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
  // Compute total number of pages
  const totalPages = Math.ceil(total / pageSize);
  // Compute a sliding window of up to 8 page options around current page
  const pageOptions = (() => {
    const maxOpts = 8;
    let start = Math.max(1, page - Math.floor(maxOpts / 2));
    let end = start + maxOpts - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, totalPages - maxOpts + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const handleFetch = async (newPage?: number) => {
    if (!subject.trim() || !year.trim()) {
      setError('Please enter both a subject and a publication year.');
      return;
    }
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

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Page</label>
          <input
            type="number"
            value={pageInput}
            min={1}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder={String(page)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Page Size</label>
          <input
            type="number"
            value={pageSizeInput}
            min={1}
            max={1000}
            onChange={(e) => setPageSizeInput(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder={String(pageSize)}
          />
        </div>
      </div>

      <button
        onClick={() => handleFetch()}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
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
              <select
                className="pagination-select border rounded px-2 py-1"
                value={page}
                onChange={(e) => handleFetch(Number(e.target.value))}
              >
                {pageOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button
                disabled={page * pageSize >= total || loading}
                onClick={() => handleFetch(page + 1)}
                className="pagination-btn-next px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >Next</button>
            </div>
          )}
        </div>
      )}

      <div className="results-grid mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.map((book, idx) => (
          <div key={idx} className="border rounded shadow p-4">
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-48 object-cover rounded mb-4"
            />
            <h2 className="text-lg font-semibold">{book.title}</h2>
            <p className="text-gray-600">{book.authors.join(', ')}</p>
            <p className="text-sm text-gray-500">
              {new Date(book.date_published).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">Publisher: {book.publisher}</p>
            <p className="text-sm text-gray-500">{book.pages} pages</p>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="pagination-container-bottom mt-6">
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
              <select
                className="pagination-select border rounded px-2 py-1"
                value={page}
                onChange={(e) => handleFetch(Number(e.target.value))}
              >
                {pageOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button
                disabled={page * pageSize >= total || loading}
                onClick={() => handleFetch(page + 1)}
                className="pagination-btn-next px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 