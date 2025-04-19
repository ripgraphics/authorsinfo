/**
 * Database Schema Reference
 *
 * This file contains the complete database schema for the Authors Info project.
 * It can be referenced in future conversations to understand the database structure.
 */

export interface TableColumn {
  name: string
  type: string
  description?: string
}

export interface TableSchema {
  name: string
  description?: string
  columns: TableColumn[]
}

export const databaseSchema: TableSchema[] = [
  {
    name: "authors",
    description: "Stores information about book authors",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "text", description: "Author's full name" },
      { name: "bio", type: "text", description: "Author's biography" },
      { name: "featured", type: "boolean", description: "Whether the author is featured" },
      { name: "birth_date", type: "date", description: "Author's date of birth" },
      { name: "nationality", type: "text", description: "Author's nationality" },
      { name: "website", type: "text", description: "Author's website URL" },
      { name: "author_image_id", type: "integer", description: "Reference to author's profile image" },
      { name: "cover_image_id", type: "integer", description: "Reference to author's cover image" },
      { name: "author_gallery_id", type: "integer", description: "Reference to author's gallery" },
      { name: "twitter_handle", type: "text", description: "Author's Twitter handle" },
      { name: "facebook_handle", type: "text", description: "Author's Facebook handle" },
      { name: "instagram_handle", type: "text", description: "Author's Instagram handle" },
      { name: "goodreads_url", type: "text", description: "Author's Goodreads profile URL" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
      { name: "photo_url", type: "text", description: "Legacy field for author's photo URL" },
    ],
  },
  {
    name: "books",
    description: "Stores information about books",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "title", type: "text", description: "Book title" },
      { name: "isbn", type: "text", description: "ISBN (International Standard Book Number)" },
      { name: "isbn13", type: "text", description: "ISBN-13 format" },
      { name: "isbn10", type: "text", description: "ISBN-10 format" },
      { name: "author_id", type: "integer", description: "Reference to primary author (foreign key to authors.id)" },
      { name: "publisher_id", type: "integer", description: "Reference to publisher (foreign key to publishers.id)" },
      { name: "publish_date", type: "date", description: "Publication date" },
      { name: "publication_date", type: "date", description: "Alternative publication date field" },
      { name: "cover_image_id", type: "integer", description: "Reference to book cover image" },
      { name: "original_image_url", type: "text", description: "Original cover image URL" },
      { name: "cover_image_url", type: "text", description: "Processed cover image URL" },
      { name: "synopsis", type: "text", description: "Book synopsis/summary" },
      { name: "overview", type: "text", description: "Book overview" },
      { name: "page_count", type: "integer", description: "Number of pages" },
      { name: "pages", type: "integer", description: "Alternative field for number of pages" },
      { name: "genre", type: "text", description: "Book genre" },
      { name: "language", type: "text", description: "Book language" },
      { name: "average_rating", type: "numeric", description: "Average rating" },
      { name: "format", type: "text", description: "Book format (e.g., hardcover, paperback)" },
      { name: "binding", type: "text", description: "Book binding type" },
      { name: "edition", type: "text", description: "Book edition" },
      { name: "price", type: "numeric", description: "Book price" },
      { name: "list_price", type: "numeric", description: "List price" },
      { name: "series", type: "text", description: "Book series name" },
      { name: "series_number", type: "integer", description: "Position in series" },
      { name: "dimensions", type: "text", description: "Physical dimensions" },
      { name: "weight", type: "text", description: "Book weight" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "publishers",
    description: "Stores information about book publishers",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "text", description: "Publisher name" },
      { name: "website", type: "text", description: "Publisher website URL" },
      { name: "founded_year", type: "integer", description: "Year the publisher was founded" },
      { name: "email", type: "text", description: "Publisher contact email" },
      { name: "phone", type: "text", description: "Publisher contact phone" },
      { name: "address_line1", type: "text", description: "Address line 1" },
      { name: "address_line2", type: "text", description: "Address line 2" },
      { name: "city", type: "text", description: "City" },
      { name: "state", type: "text", description: "State/Province" },
      { name: "postal_code", type: "text", description: "Postal/ZIP code" },
      { name: "country", type: "text", description: "Country name" },
      { name: "country_id", type: "integer", description: "Reference to countries table" },
      { name: "about", type: "text", description: "About the publisher" },
      { name: "cover_image_id", type: "integer", description: "Reference to publisher cover image" },
      { name: "publisher_image_id", type: "integer", description: "Reference to publisher logo/image" },
      { name: "publisher_gallery_id", type: "integer", description: "Reference to publisher gallery" },
      { name: "featured", type: "boolean", description: "Whether the publisher is featured" },
      { name: "logo_url", type: "text", description: "Publisher logo URL" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "users",
    description: "Stores user account information",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "username", type: "text", description: "User's username" },
      { name: "email", type: "text", description: "User's email address" },
      { name: "full_name", type: "text", description: "User's full name" },
      { name: "avatar_url", type: "text", description: "User's avatar image URL" },
      { name: "bio", type: "text", description: "User's biography" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "reviews",
    description: "Stores book reviews by users",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "user_id", type: "integer", description: "Reference to user (foreign key to users.id)" },
      { name: "book_id", type: "integer", description: "Reference to book (foreign key to books.id)" },
      { name: "rating", type: "integer", description: "Rating value (typically 1-5)" },
      { name: "content", type: "text", description: "Review content" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "reading_statuses",
    description: "Tracks users' reading status for books",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "user_id", type: "integer", description: "Reference to user (foreign key to users.id)" },
      { name: "book_id", type: "integer", description: "Reference to book (foreign key to books.id)" },
      { name: "status", type: "text", description: "Reading status (want_to_read, currently_reading, read)" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "reading_challenges",
    description: "Stores users' reading challenges",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "user_id", type: "integer", description: "Reference to user (foreign key to users.id)" },
      { name: "year", type: "integer", description: "Challenge year" },
      { name: "target_books", type: "integer", description: "Target number of books to read" },
      { name: "books_read", type: "integer", description: "Number of books read so far" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "bookshelves",
    description: "Stores user-created bookshelves",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "user_id", type: "integer", description: "Reference to user (foreign key to users.id)" },
      { name: "name", type: "text", description: "Bookshelf name" },
      { name: "is_public", type: "boolean", description: "Whether the bookshelf is public" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "bookshelf_books",
    description: "Junction table connecting bookshelves to books",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "bookshelf_id", type: "integer", description: "Reference to bookshelf (foreign key to bookshelves.id)" },
      { name: "book_id", type: "integer", description: "Reference to book (foreign key to books.id)" },
      { name: "added_at", type: "timestamp with time zone", description: "When the book was added to the bookshelf" },
    ],
  },
  {
    name: "countries",
    description: "Stores country information",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "code", type: "text", description: "Country code (ISO)" },
      { name: "name", type: "text", description: "Country name" },
    ],
  },
  {
    name: "images",
    description: "Stores image metadata",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "url", type: "text", description: "Image URL" },
      { name: "alt_text", type: "text", description: "Alternative text for accessibility" },
      { name: "img_type_id", type: "integer", description: "Reference to image type" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "image_types",
    description: "Defines types of images (e.g., cover, profile, gallery)",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "text", description: "Image type name" },
      { name: "description", type: "text", description: "Image type description" },
    ],
  },
  {
    name: "reading_progress",
    description: "Tracks users' reading progress for books",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "user_id", type: "integer", description: "Reference to user (foreign key to users.id)" },
      { name: "book_id", type: "integer", description: "Reference to book (foreign key to books.id)" },
      { name: "pages_read", type: "integer", description: "Number of pages read" },
      { name: "percentage_complete", type: "numeric", description: "Percentage of book completed" },
      { name: "current_page", type: "integer", description: "Current page" },
      { name: "start_date", type: "date", description: "When the user started reading" },
      { name: "finish_date", type: "date", description: "When the user finished reading" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
      { name: "updated_at", type: "timestamp with time zone", description: "Record update timestamp" },
    ],
  },
  {
    name: "binding_types",
    description: "Defines book binding types",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "text", description: "Binding type name" },
      { name: "description", type: "text", description: "Binding type description" },
    ],
  },
  {
    name: "format_types",
    description: "Defines book format types",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "text", description: "Format type name" },
      { name: "description", type: "text", description: "Format type description" },
    ],
  },
  {
    name: "book_genres",
    description: "Defines book genres",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "text", description: "Genre name" },
      { name: "description", type: "text", description: "Genre description" },
    ],
  },
  {
    name: "user_roles",
    description: "Defines user roles for access control",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "text", description: "Role name" },
      { name: "description", type: "text", description: "Role description" },
    ],
  },
  {
    name: "book_authors",
    description: "Junction table connecting books to authors (many-to-many)",
    columns: [
      { name: "id", type: "integer", description: "Primary key (SERIAL)" },
      { name: "book_id", type: "integer", description: "Reference to book (foreign key to books.id)" },
      { name: "author_id", type: "integer", description: "Reference to author (foreign key to authors.id)" },
      { name: "created_at", type: "timestamp with time zone", description: "Record creation timestamp" },
    ],
  },
]

/**
 * Helper function to get a table schema by name
 */
export function getTableSchema(tableName: string): TableSchema | undefined {
  return databaseSchema.find((table) => table.name === tableName)
}

/**
 * Helper function to check if a column exists in a table
 */
export function columnExistsInTable(tableName: string, columnName: string): boolean {
  const table = getTableSchema(tableName)
  if (!table) return false
  return table.columns.some((column) => column.name === columnName)
}
