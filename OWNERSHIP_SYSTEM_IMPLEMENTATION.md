# Ownership System Implementation for Books and Authors

## Overview

This document outlines the implementation of an ownership system for books and authors tables, allowing users to edit content they created while maintaining admin privileges for catalog management.

## Changes Made

### 1. Database Schema Changes

#### Books Table
- **Added**: `created_by` UUID field
- **Foreign Key**: `books.created_by` → `public.users.id` (ON DELETE SET NULL)
- **Index**: `idx_books_created_by` for performance
- **Default Value**: Set to user ID `e06cdf85-b449-4dcb-b943-068aaad8cfa3` for existing records

#### Authors Table
- **Added**: `created_by` UUID field
- **Foreign Key**: `authors.created_by` → `public.users.id` (ON DELETE SET NULL)
- **Index**: `idx_authors_created_by` for performance
- **Default Value**: Set to user ID `e06cdf85-b449-4dcb-b943-068aaad8cfa3` for existing records

### 2. Migration Script

**File**: `add_created_by_to_books_authors.sql`

The migration script includes:
- Safe column addition (checks if columns already exist)
- Data population for existing records
- Foreign key constraint creation
- Performance index creation
- Comprehensive verification queries
- Documentation comments

### 3. Application Logic Updates

#### Updated `canUserEditEntity` Function (`lib/auth-utils.ts`)

The function now handles ownership for books and authors:

```typescript
case 'author':
  // Check if user created the author or is admin
  const { data: author } = await supabase
    .from('authors')
    .select('created_by')
    .eq('id', entityId)
    .single()
  
  if (author?.created_by === userId) {
    return true
  }
  // Authors are catalog entities, so only creators and admins can edit
  return false

case 'book':
  // Check if user created the book or is admin
  const { data: book } = await supabase
    .from('books')
    .select('created_by')
    .eq('id', entityId)
    .single()
  
  if (book?.created_by === userId) {
    return true
  }
  // Books are catalog entities, so only creators and admins can edit
  return false
```

## Permission Matrix

| User Type | Can Edit Own Content | Can Edit Others' Content | Can Edit Catalog Items |
|-----------|---------------------|-------------------------|----------------------|
| Regular User | ✅ Yes | ❌ No | ❌ No |
| Content Creator | ✅ Yes | ❌ No | ❌ No |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes |
| Super Admin | ✅ Yes | ✅ Yes | ✅ Yes |

## Implementation Details

### Database Constraints

1. **Foreign Key Constraints**:
   - `books.created_by` → `public.users.id` (ON DELETE SET NULL)
   - `authors.created_by` → `public.users.id` (ON DELETE SET NULL)

2. **Indexes for Performance**:
   - `idx_books_created_by` on `books.created_by`
   - `idx_authors_created_by` on `authors.created_by`

3. **Data Integrity**:
   - All existing books and authors are assigned to user `e06cdf85-b449-4dcb-b943-068aaad8cfa3`
   - New records will require explicit `created_by` assignment

### Application Logic

1. **Ownership Check**: The system checks if the current user is the creator of the content
2. **Admin Override**: Admins and super admins can edit any content
3. **Catalog Protection**: Regular users cannot edit catalog items they didn't create

## Usage Examples

### Checking Edit Permissions

```typescript
import { canUserEditEntity } from '@/lib/auth-utils'

// Check if user can edit a book
const canEditBook = await canUserEditEntity(
  userId, 
  'book', 
  bookId
)

// Check if user can edit an author
const canEditAuthor = await canUserEditEntity(
  userId, 
  'author', 
  authorId
)
```

### Database Queries

```sql
-- Find all books created by a specific user
SELECT * FROM books WHERE created_by = 'user-uuid-here';

-- Find all authors created by a specific user
SELECT * FROM authors WHERE created_by = 'user-uuid-here';

-- Count books by creator
SELECT created_by, COUNT(*) as book_count 
FROM books 
GROUP BY created_by;
```

## Migration Instructions

1. **Run the Migration Script**:
   ```bash
   # Execute the migration in your Supabase SQL editor
   # Copy and paste the contents of add_created_by_to_books_authors.sql
   ```

2. **Verify the Migration**:
   - Check that all existing books and authors have `created_by` set
   - Verify foreign key constraints exist
   - Confirm indexes are created

3. **Test the Application**:
   - Log in as different user types
   - Verify edit permissions work correctly
   - Test admin override functionality

## Security Considerations

1. **Row Level Security (RLS)**: Consider implementing RLS policies if needed
2. **Audit Trail**: The `created_by` field provides an audit trail
3. **Data Protection**: Foreign key constraints prevent orphaned records

## Future Enhancements

1. **Audit Logging**: Track who modified what and when
2. **Approval Workflow**: Require admin approval for catalog changes
3. **Version History**: Track changes to catalog items
4. **Bulk Operations**: Allow admins to reassign ownership

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**: Ensure the user ID exists in `public.users`
2. **Permission Denied**: Check if the user has proper role assignments
3. **Performance Issues**: Verify indexes are created and being used

### Verification Queries

```sql
-- Check if migration was successful
SELECT 
  COUNT(*) as total_books,
  COUNT(created_by) as books_with_creator,
  COUNT(CASE WHEN created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid THEN 1 END) as books_with_specified_user
FROM books;

-- Verify foreign key constraints
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE constraint_name IN ('books_created_by_fkey', 'authors_created_by_fkey');
```

## Conclusion

This implementation provides a robust ownership system that:
- Allows content creators to edit their own work
- Maintains admin control over catalog items
- Provides proper data integrity through foreign keys
- Enables future enhancements for audit and approval workflows

The system is designed to be scalable and maintainable while providing clear separation of concerns between user-created content and catalog management. 