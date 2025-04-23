"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuthorOption {
  id?: number;
  name: string;
  source: 'db' | 'external';
}

interface Book {
  title: string;
  image: string;
  authors: string[];
  date_published: string;
  publisher: string;
  pages: number;
}

export default function FetchByAuthorPage() {
  const [authorQuery, setAuthorQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AuthorOption[]>([]);
  const [selectedAuthorName, setSelectedAuthorName] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch author suggestions from local DB and external ISBNdb on query change
  useEffect(() => {
    if (!authorQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const [dbRes, extRes] = await Promise.all([
          fetch(`/api/db/authors?search=${encodeURIComponent(authorQuery)}`).then((r) => r.json()),
          fetch(`/api/isbn/search-authors?q=${encodeURIComponent(authorQuery)}`).then((r) => r.json()),
        ]);
        // Map DB suggestions
        const dbOpts: AuthorOption[] = (dbRes.authors || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          source: 'db',
        }));
        // Map external suggestions
        const extOpts: AuthorOption[] = (extRes.authors || []).map((name: string) => ({
          name,
          source: 'external',
        }));
        // Filter out duplicates (by name)
        const filteredExt = extOpts.filter(
          (e) => !dbOpts.some((d) => d.name.toLowerCase() === e.name.toLowerCase())
        );
        setSuggestions([...dbOpts, ...filteredExt]);
      } catch (err) {
        console.error('Error fetching author suggestions:', err);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [authorQuery]);

  const handleFetch = async (newPage = 1) => {
    if (!selectedAuthorName) {
      setError('Please select an author');
      return;
    }
    setLoading(true);
    setError(null);
    setBooks([]);
    setPage(newPage);
    try {
      const res = await fetch('/api/isbn/fetch-by-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: selectedAuthorName, page: newPage, pageSize }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch books');
      }
      const data = await res.json();
      setBooks(data.books || []);
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
      <h1 className="text-2xl font-bold mt-4 mb-4">Fetch Books by Author</h1>

      <div className="mb-4 relative">
        <label className="block mb-1 font-medium">Search Author</label>
        <input
          type="text"
          value={authorQuery}
          onChange={(e) => {
            setAuthorQuery(e.target.value);
            setSelectedAuthorName('');
          }}
          placeholder="Type author name"
          className="w-full border rounded px-3 py-2"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded w-full max-h-60 overflow-auto mt-1">
            {suggestions.map((auth) => (
              <li
                key={auth.id}
                onClick={() => {
                  setSelectedAuthorName(auth.name);
                  setAuthorQuery(auth.name);
                  setSuggestions([]);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {auth.name} (#{auth.id})
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => handleFetch(1)}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Fetching...' : 'Fetch Books'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      <div className="mt-4 flex items-center gap-4">
        <button
          disabled={page <= 1 || loading}
          onClick={() => handleFetch(page - 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >Prev</button>
        <span>Page {page}</span>
        <button
          disabled={books.length < pageSize || loading}
          onClick={() => handleFetch(page + 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >Next</button>
      </div>

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