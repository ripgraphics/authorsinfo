# ISBN Columns Fix - Implementation Summary

## Problem
1. ISBN-10 and ISBN-13 values were being incorrectly assigned to database columns
2. ISBN-13 values could end up in `isbn10` column and vice versa
3. Books already in the system were showing in search results
4. No validation to ensure ISBN length matches the column (10 digits for ISBN-10, 13 digits for ISBN-13)

## Solution Implemented

### 1. Database Migration
**File:** `supabase/migrations/20251213122517_fix_isbn_columns_and_validation.sql`

**What it does:**
- Renames `isbn` column to `isbn10` if it exists
- Ensures both `isbn10` and `isbn13` columns exist
- Creates validation functions:
  - `normalize_isbn()` - Removes hyphens and spaces
  - `is_valid_isbn10()` - Validates ISBN-10 format (10 characters, last can be X)
  - `is_valid_isbn13()` - Validates ISBN-13 format (exactly 13 digits)
- Fixes existing data by moving ISBNs to correct columns based on length
- Adds unique indexes on both columns to prevent duplicates
- Adds column comments for documentation

**To run the migration:**
```bash
npx supabase db push --include-all
```

### 2. ISBN Utility Functions
**File:** `utils/isbnUtils.ts`

**Functions:**
- `isValidISBN10(isbn)` - Validates ISBN-10 format
- `isValidISBN13(isbn)` - Validates ISBN-13 format
- `normalizeISBN(isbn)` - Removes hyphens and spaces
- `assignISBNs(isbn, isbn13)` - Validates and assigns ISBNs to correct columns
- `extractISBNs(bookData)` - Extracts and validates ISBNs from book data object

**Key Features:**
- Validates length: ISBN-10 must be 10 characters, ISBN-13 must be 13 digits
- Returns `null` if length doesn't match (prevents wrong data in wrong column)
- Handles both hyphenated and non-hyphenated ISBNs
- Normalizes ISBNs by removing hyphens and spaces

### 3. Code Updates

**Files Updated:**
1. `lib/isbndb-data-collector.ts` - Uses `extractISBNs()` utility
2. `app/actions/add-book.ts` - Uses `extractISBNs()` utility
3. `app/actions/bulk-import-books.ts` - Uses `extractISBNs()` utility (2 locations)
4. `app/api/admin/add-book/route.ts` - Uses `extractISBNs()` utility
5. `app/api/books/check-existing/route.ts` - Normalizes ISBNs when checking
6. `app/admin/new-books/page.tsx` - Improved filtering to check both ISBN-10 and ISBN-13

**Changes:**
- All ISBN assignments now use the validation utility
- ISBNs are validated by length before assignment
- ISBN-10 (10 digits) → `isbn10` column
- ISBN-13 (13 digits) → `isbn13` column
- Invalid lengths → `null` (prevents wrong data)

### 4. Duplicate Book Filtering

**Enhanced in:**
- `app/admin/new-books/page.tsx` - `fetchBooks()` and `fetchAllPages()`
- `app/api/books/check-existing/route.ts` - Normalizes ISBNs for comparison

**How it works:**
1. Collects all ISBNs (both ISBN-10 and ISBN-13) from fetched books
2. Normalizes ISBNs (removes hyphens/spaces) for comparison
3. Checks both `isbn10` and `isbn13` columns in database
4. Filters out books where ANY ISBN matches an existing one
5. Books already in system no longer appear in search results

## Migration Steps

### Step 1: Review the Migration
```bash
# Check the migration file
cat supabase/migrations/20251213122517_fix_isbn_columns_and_validation.sql
```

### Step 2: Run the Migration
```bash
# Apply the migration
npx supabase db push --include-all
```

### Step 3: Verify the Migration
```bash
# Check migration status
npx supabase migration list

# Generate updated types
npm run types:generate
```

### Step 4: Verify Data
The migration will automatically:
- Fix existing ISBN data by moving to correct columns
- Set invalid ISBNs to NULL
- Create indexes for better performance

## Testing Checklist

- [ ] Migration runs successfully
- [ ] ISBN-10 values are in `isbn10` column
- [ ] ISBN-13 values are in `isbn13` column
- [ ] Invalid ISBNs are set to NULL
- [ ] Books already in system don't appear in search results
- [ ] New books are assigned to correct columns based on length
- [ ] Duplicate books are prevented (unique constraints work)

## Important Notes

1. **ISBN Format:**
   - ISBN-10: Exactly 10 characters (digits 0-9, last can be X)
   - ISBN-13: Exactly 13 digits (0-9 only)

2. **Validation:**
   - ISBNs are normalized (hyphens/spaces removed) before validation
   - If length doesn't match, the value is set to NULL
   - This prevents ISBN-13 in `isbn10` column and vice versa

3. **Existing Data:**
   - Migration automatically fixes existing data
   - Books with wrong ISBN assignments will be corrected
   - Invalid ISBNs will be set to NULL

4. **Performance:**
   - Unique indexes prevent duplicate books
   - Indexes on `isbn10` and `isbn13` improve query performance

## Rollback (if needed)

If you need to rollback the migration:
```bash
# Note: This will require manual SQL to revert changes
# The migration doesn't include a rollback script
```

## Related Files

- Migration: `supabase/migrations/20251213122517_fix_isbn_columns_and_validation.sql`
- Utility: `utils/isbnUtils.ts`
- Updated Code: See list above in "Code Updates" section

