import { db } from '@/lib/db';
import { Book, Publisher } from '@/lib/db/schema';

export interface BookPublisherConnection {
  id: number;
  publisher: Publisher;
}

export interface BookWithPublisher {
  id: number;
  publisher_id: number | null;
  publishers: Publisher[];
}

export async function getBookPublisherConnections() {
  const joinTableData = await db
    .select()
    .from('book_publishers')
    .leftJoin('publishers', 'book_publishers.publisher_id', 'publishers.id')
    .then((data) => data as BookPublisherConnection[]);

  const bookData = await db
    .select()
    .from('books')
    .then((data) => data as BookWithPublisher[]);

  // Map the join table data to the books
  const booksWithPublishers = bookData.map((book) => {
    const bookPublishers = joinTableData
      .filter((connection) => connection.id === book.id)
      .map((connection) => connection.publisher);
    
    return {
      ...book,
      publishers: bookPublishers,
    };
  });

  return booksWithPublishers;
}

export async function addPublisherToBook(bookId: number, publisherId: number) {
  return db
    .insert('book_publishers')
    .values({
      book_id: bookId,
      publisher_id: publisherId,
    })
    .onConflictDoNothing();
}

export async function removePublisherFromBook(bookId: number, publisherId: number) {
  return db
    .delete('book_publishers')
    .where({
      book_id: bookId,
      publisher_id: publisherId,
    });
}

export async function getPublishersByBook(bookId: number) {
  return db
    .select()
    .from('book_publishers')
    .leftJoin('publishers', 'book_publishers.publisher_id', 'publishers.id')
    .where('book_publishers.book_id', bookId)
    .then((data) => data as BookPublisherConnection[]);
}

export async function getBooksByPublisher(publisherId: number) {
  return db
    .select()
    .from('book_publishers')
    .leftJoin('books', 'book_publishers.book_id', 'books.id')
    .where('book_publishers.publisher_id', publisherId)
    .then((data) => data as Book[]);
} 