"use client";

import React, { useState } from 'react';

interface PreviewBook {
  title: string;
  title_long?: string;
  image?: string;
  image_original?: string;
  authors: string[];
  date_published: string;
  publisher: string;
  pages: number;
  dimensions?: string;
  edition?: string;
  msrp?: number;
  dimensions_structured?: { weight?: { value: number; unit: string } };
  isbn10?: string;
  isbn?: string;
}

interface ImportResult {
  added: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
  logs?: string[];
}

export default function NewBooksPage() {
  const [previewBooks, setPreviewBooks] = useState<PreviewBook[]>([]);
  const [newIsbns, setNewIsbns] = useState<string[]>([]);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fetchPreview = async () => {
    setFetchingPreview(true);
    setPreviewError(null);
    setPreviewMessage(null);
    setPreviewBooks([]);
    setNewIsbns([]);
    
    try {
      console.log('Fetching preview from /api/isbn/preview-new...');
      const res = await fetch('/api/isbn/preview-new');
      console.log('Response status:', res.status);
      
      if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
      
      const data = await res.json();
      console.log('Preview data:', data);
      
      setPreviewBooks(data.books || []);
      setNewIsbns(data.newIsbns || []);
      
      if (data.message) {
        setPreviewMessage(data.message);
      }
      
      if (!data.books || data.books.length === 0) {
        setPreviewMessage('No preview books available. The new_books.json file is not present or empty.');
      }
    } catch (err) {
      console.error('Error fetching preview:', err);
      setPreviewError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFetchingPreview(false);
    }
  };

  const importNewBooks = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/isbn/import-all');
      if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
      const data: ImportResult = await res.json();
      setImportResult(data);
    } catch (err) {
      setImportResult({ added: 0, duplicates: 0, errors: 1, errorDetails: [err instanceof Error ? err.message : 'Unknown error'], logs: [] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Books Preview</h1>
      <p className="text-gray-600 mb-4">
        Preview and import new books from the static book list. This feature requires a new_books.json file to be present.
      </p>
      
      <button
        onClick={fetchPreview}
        disabled={fetchingPreview}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {fetchingPreview ? 'Fetching Preview...' : 'Preview New Books'}
      </button>
      
      {previewError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 font-semibold">Error:</p>
          <p className="text-red-600">{previewError}</p>
        </div>
      )}
      
      {previewMessage && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-600">{previewMessage}</p>
        </div>
      )}

      {previewBooks.length > 0 && (
        <>
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">
              Preview Books ({previewBooks.length} books, {newIsbns.length} new)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {previewBooks.map((book, idx) => (
                <div key={idx} className={`border rounded shadow p-4 ${newIsbns.includes(book.isbn10 || book.isbn || '') ? 'bg-green-100' : 'bg-gray-50'}`}>
                  {(book.image || book.image_original) && (
                    <img
                      src={book.image_original || book.image}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                  )}
                  <h3 className="text-lg font-semibold">{book.title}</h3>
                  {book.title_long && (
                    <p className="text-gray-600 italic">{book.title_long}</p>
                  )}
                  <p className="text-gray-600">{book.authors.join(', ')}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(book.date_published).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">Publisher: {book.publisher}</p>
                  <p className="text-sm text-gray-500">{book.pages} pages</p>
                  {book.dimensions && (
                    <p className="text-sm text-gray-500">Dimensions: {book.dimensions}</p>
                  )}
                  {book.dimensions_structured?.weight && (
                    <p className="text-sm text-gray-500">
                      Weight: {book.dimensions_structured.weight.value} {book.dimensions_structured.weight.unit}
                    </p>
                  )}
                  {book.edition && (
                    <p className="text-sm text-gray-500">Edition: {book.edition}</p>
                  )}
                  {book.msrp !== undefined && (
                    <p className="text-sm text-gray-500">MSRP: ${book.msrp}</p>
                  )}
                  {newIsbns.includes(book.isbn10 || book.isbn || '') && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded">
                      New Book
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={importNewBooks}
              disabled={importing || newIsbns.length === 0}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${newIsbns.length} New Books`}
            </button>
          </div>
        </>
      )}

      {importResult && (
        <div className="mt-6 p-4 bg-gray-50 border rounded">
          <h2 className="text-xl font-semibold mb-2">Import Result</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{importResult.added}</p>
              <p className="text-sm text-gray-600">Added</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</p>
              <p className="text-sm text-gray-600">Duplicates</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
          </div>
          
          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-red-600">Error Details:</h3>
              <ul className="list-disc list-inside text-sm">
                {importResult.errorDetails.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          
          {importResult.logs && importResult.logs.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Logs:</h3>
              <pre className="bg-white p-4 overflow-auto max-h-64 whitespace-pre-wrap text-sm border rounded">
                {importResult.logs.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 