/**
 * Utility functions for ISBN validation and assignment
 * 
 * ISBN-10: 10 digits (can include X as last character)
 * ISBN-13: 13 digits
 */

/**
 * Validates if a string is a valid ISBN-10 format
 * @param isbn - The ISBN string to validate
 * @returns true if valid ISBN-10 format
 */
export function isValidISBN10(isbn: string | null | undefined): boolean {
  if (!isbn) return false;
  // Remove hyphens and spaces
  const cleaned = isbn.replace(/[-\s]/g, '');
  // ISBN-10 should be exactly 10 characters, last can be X
  return /^[0-9]{9}[0-9X]$/.test(cleaned);
}

/**
 * Validates if a string is a valid ISBN-13 format
 * @param isbn - The ISBN string to validate
 * @returns true if valid ISBN-13 format
 */
export function isValidISBN13(isbn: string | null | undefined): boolean {
  if (!isbn) return false;
  // Remove hyphens and spaces
  const cleaned = isbn.replace(/[-\s]/g, '');
  // ISBN-13 should be exactly 13 digits
  return /^[0-9]{13}$/.test(cleaned);
}

/**
 * Normalizes an ISBN by removing hyphens and spaces
 * @param isbn - The ISBN string to normalize
 * @returns Normalized ISBN or null if invalid
 */
export function normalizeISBN(isbn: string | null | undefined): string | null {
  if (!isbn) return null;
  return isbn.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Validates and assigns ISBNs to the correct columns
 * ISBN-10 (10 digits) -> isbn10
 * ISBN-13 (13 digits) -> isbn13
 * If length doesn't match, returns null for that field
 * 
 * @param isbn - The ISBN string (could be ISBN-10 or ISBN-13)
 * @param isbn13 - Optional separate ISBN-13 value
 * @returns Object with isbn10 and isbn13 properly assigned
 */
export function assignISBNs(
  isbn?: string | null,
  isbn13?: string | null
): { isbn10: string | null; isbn13: string | null } {
  let isbn10: string | null = null;
  let isbn13Value: string | null = null;

  // Process the main isbn field
  if (isbn) {
    const normalized = normalizeISBN(isbn);
    if (normalized) {
      if (isValidISBN10(normalized)) {
        isbn10 = normalized;
      } else if (isValidISBN13(normalized)) {
        isbn13Value = normalized;
      }
      // If neither valid, both remain null
    }
  }

  // Process the separate isbn13 field (takes precedence if provided)
  if (isbn13) {
    const normalized = normalizeISBN(isbn13);
    if (normalized && isValidISBN13(normalized)) {
      isbn13Value = normalized;
    }
  }

  return {
    isbn10,
    isbn13: isbn13Value,
  };
}

/**
 * Extracts ISBN-10 and ISBN-13 from a book data object
 * Handles various field names that might contain ISBNs
 * 
 * @param bookData - Book data object that might contain ISBN fields
 * @returns Object with isbn10 and isbn13 properly assigned
 */
export function extractISBNs(bookData: {
  isbn?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  [key: string]: any;
}): { isbn10: string | null; isbn13: string | null } {
  // Try isbn10 and isbn13 fields first
  const isbn10FromField = bookData.isbn10 ? normalizeISBN(bookData.isbn10) : null;
  const isbn13FromField = bookData.isbn13 ? normalizeISBN(bookData.isbn13) : null;

  // If we have valid ISBNs from dedicated fields, use them
  if (isbn10FromField && isValidISBN10(isbn10FromField)) {
    if (isbn13FromField && isValidISBN13(isbn13FromField)) {
      return {
        isbn10: isbn10FromField,
        isbn13: isbn13FromField,
      };
    }
    // Only ISBN-10 found in dedicated field
    return {
      isbn10: isbn10FromField,
      isbn13: null,
    };
  }

  if (isbn13FromField && isValidISBN13(isbn13FromField)) {
    return {
      isbn10: null,
      isbn13: isbn13FromField,
    };
  }

  // Fall back to generic isbn field
  return assignISBNs(bookData.isbn, bookData.isbn13);
}

