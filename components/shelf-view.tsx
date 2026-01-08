'use client';

/**
 * ShelfView Component
 * Display books in a shelf with grid layout and pagination
 */

import React, { useEffect, useState } from 'react';
import { useShelfStore } from '@/lib/stores/shelf-store';
import { UUID } from 'crypto';
import { BookCard } from './book-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShelfViewProps {
  shelfId: UUID;
  editable?: boolean;
}

export function ShelfView({ shelfId, editable = true }: ShelfViewProps) {
  const { shelvesByIdData, shelvesByIdLoading, fetchShelfById, removeBookFromShelf } = useShelfStore();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchShelfById(shelfId);
  }, [shelfId, fetchShelfById]);

  const handleRemoveBook = async (bookId: string) => {
    setIsRemoving(bookId);
    try {
      await removeBookFromShelf(shelfId, bookId as UUID);
      toast.success('Book removed from shelf');
      // Refresh shelf data
      fetchShelfById(shelfId);
    } catch (error) {
      toast.error('Failed to remove book');
    } finally {
      setIsRemoving(null);
    }
  };

  const shelf = shelvesByIdData[shelfId];
  const isLoading = shelvesByIdLoading[shelfId];
  const books = shelf?.books || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!shelf) {
    return <div className="text-center py-8 text-muted-foreground">Shelf not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {shelf.icon && <span className="text-xl">{shelf.icon}</span>}
          {shelf.name}
        </h3>
        {shelf.description && (
          <p className="text-sm text-muted-foreground mt-1">{shelf.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
        </p>
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No books in this shelf yet</p>
          <p className="text-xs text-muted-foreground mt-2">
            Add books to organize your collection
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {books.map((book: any) => {
              const readingProgress = book.readingProgress

              return (
                <div key={book.id} className="group relative">
                  <BookCard
                    id={book.id}
                    title={book.title}
                    coverImageUrl={book.cover_url}
                    readingProgress={readingProgress}
                  />
                  {editable && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      onClick={() => handleRemoveBook(book.id)}
                      disabled={isRemoving === book.id}
                    >
                      {isRemoving === book.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  );
}
