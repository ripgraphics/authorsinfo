"use client";

import React, { useState } from 'react';

interface Book {
  title: string;
  image: string;
  authors: string[];
  date_published: string;
  publisher: string;
  pages: number;
}

const NewBooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewBooks = async () => {
    setLoading(true);
    setError(null);
    setBooks([]);
    try {
      const response = await fetch('/api/isbn/fetch-books');
      if (!response.ok) {
        throw new Error('Failed to fetch new books');
      }
      const data = await response.json();
      setBooks(data.books);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Books</h1>
      <button
        onClick={fetchNewBooks}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Loading...' : 'Fetch New Books'}
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
};

export default NewBooksPage; 