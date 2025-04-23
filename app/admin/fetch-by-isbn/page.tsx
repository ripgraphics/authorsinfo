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

export default function FetchByIsbnPage() {
  const [isbnInput, setIsbnInput] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setBooks([]);
    const isbns = isbnInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (isbns.length === 0) {
      setError('Please enter at least one ISBN.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/isbn/fetch-by-isbn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbns }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch books');
      }
      const data = await res.json();
      setBooks(data.books);
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
      <h1 className="text-2xl font-bold mt-4 mb-4">Fetch Books by ISBN</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">ISBN(s) (comma separated)</label>
        <input
          type="text"
          value={isbnInput}
          onChange={(e) => setIsbnInput(e.target.value)}
          placeholder="e.g. 9780984782857, 1423241886"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Fetching...' : 'Fetch Books'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

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