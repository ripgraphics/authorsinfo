"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface Book {
  title: string;
  image: string;
  authors: string[];
  date_published: string;
  publisher: string;
  pages: number;
}

export default function FetchByTitlePage() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async (newPage = 1) => {
    setLoading(true);
    setError(null);
    setBooks([]);
    if (!query.trim()) {
      setError('Please enter a title or keyword.');
      setLoading(false);
      return;
    }
    setPage(newPage);
    try {
      const res = await fetch('/api/isbn/fetch-by-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, page: newPage, pageSize }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch books');
      }
      const data = await res.json();
      setBooks(data.books);
      setTotal(data.total || 0);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Link href="/admin/retrieve-books" className="text-blue-500 underline">
        &larr; Back to Retrieval Options
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-4">Fetch Books by Title</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Title or Keyword</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter title or keyword"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        onClick={() => handleFetch(1)}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Searching...' : 'Search Books'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {total > pageSize && (
        <div className="mt-4 flex items-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => handleFetch(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Prev</button>
          <span>Page {page} of {Math.ceil(total / pageSize)}</span>
          <button
            disabled={page * pageSize >= total}
            onClick={() => handleFetch(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Next</button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
} 