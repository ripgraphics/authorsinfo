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

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fetchPreview = async () => {
    setFetchingPreview(true);
    setPreviewError(null);
    setPreviewBooks([]);
    setNewIsbns([]);
    try {
      const res = await fetch('/api/isbn/preview-new');
      if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setPreviewBooks(data.books || []);
      setNewIsbns(data.newIsbns || []);
    } catch (err) {
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
      <button
        onClick={fetchPreview}
        disabled={fetchingPreview}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {fetchingPreview ? 'Fetching Preview...' : 'Preview New Books'}
      </button>
      {previewError && <p className="text-red-600 mt-4">{previewError}</p>}

      {previewBooks.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {previewBooks.map((book, idx) => (
              <div key={idx} className={`border rounded shadow p-4 ${newIsbns.includes(book.isbn10 || book.isbn || '') ? 'bg-green-100' : ''}`}>
                {(book.image || book.image_original) && (
                  <img
                    src={book.image_original || book.image}
                    alt={book.title}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                )}
                <h2 className="text-lg font-semibold">{book.title}</h2>
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
              </div>
            ))}
          </div>

          <button
            onClick={importNewBooks}
            disabled={importing}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded"
          >
            {importing ? 'Importing...' : 'Import New Books'}
          </button>
        </>
      )}

      {importResult && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Import Result</h2>
          <p>Added: {importResult.added}</p>
          <p>Duplicates: {importResult.duplicates}</p>
          <p>Errors: {importResult.errors}</p>
          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div>
              <h3 className="font-semibold">Error Details:</h3>
              <ul className="list-disc list-inside">
                {importResult.errorDetails.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {importResult.logs && importResult.logs.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold">Logs:</h3>
              <pre className="bg-gray-100 p-4 overflow-auto max-h-64 whitespace-pre-wrap">
                {importResult.logs.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 