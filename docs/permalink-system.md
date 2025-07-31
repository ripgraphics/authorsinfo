# Permalink System

This document explains the comprehensive permalink system that allows users to create custom URLs for all entity types in the AuthorsInfo application.

## Overview

The permalink system provides custom, user-friendly URLs for all entity types:
- **Users**: `/profile/john.smith` instead of `/profile/e06cdf85-b449-4dcb-b943-068aaad8cfa3`
- **Groups**: `/groups/book-club` instead of `/groups/123e4567-e89b-12d3-a456-426614174000`
- **Events**: `/events/summer-reading-festival` instead of `/events/987fcdeb-51a2-43d1-9f12-345678901234`
- **Books**: `/books/the-great-gatsby` instead of `/books/456defab-78c9-4d2e-8f34-567890123456`
- **Authors**: `/authors/f-scott-fitzgerald` instead of `/authors/789abcde-f012-3456-7890-abcdef123456`
- **Publishers**: `/publishers/simon-schuster` instead of `/publishers/def12345-6789-abcd-ef01-234567890123`

## Features

### ✅ **Custom URLs**
- Users can create their own permalinks
- URLs are human-readable and memorable
- SEO-friendly and shareable

### ✅ **Automatic Generation**
- System generates permalinks from entity names
- Handles special characters and spaces
- Ensures uniqueness across all entity types

### ✅ **Real-time Validation**
- Checks format validity as you type
- Verifies availability instantly
- Provides helpful suggestions

### ✅ **Backward Compatibility**
- UUIDs still work for all URLs
- Automatic fallback to UUID lookup
- No breaking changes to existing links

## Database Schema

### Permalink Fields Added

```sql
-- Users table
ALTER TABLE "public"."users" 
ADD COLUMN "permalink" character varying(100) UNIQUE;

-- Groups table  
ALTER TABLE "public"."groups" 
ADD COLUMN "permalink" character varying(100) UNIQUE;

-- Events table
ALTER TABLE "public"."events" 
ADD COLUMN "permalink" character varying(100) UNIQUE;

-- Books table
ALTER TABLE "public"."books" 
ADD COLUMN "permalink" character varying(100) UNIQUE;

-- Authors table
ALTER TABLE "public"."authors" 
ADD COLUMN "permalink" character varying(100) UNIQUE;

-- Publishers table
ALTER TABLE "public"."publishers" 
ADD COLUMN "permalink" character varying(100) UNIQUE;
```

### Database Functions

#### `generate_permalink(input_text, entity_type)`
Generates a unique permalink from input text.

```sql
SELECT generate_permalink('John Smith', 'user');
-- Returns: 'john-smith' or 'john-smith-1' if taken
```

#### `validate_permalink(permalink)`
Validates if a permalink format is correct.

```sql
SELECT validate_permalink('john-smith');
-- Returns: true or false
```

#### `check_permalink_availability(permalink, entity_type, exclude_id)`
Checks if a permalink is available for a given entity type.

```sql
SELECT check_permalink_availability('john-smith', 'user', 'user-id');
-- Returns: true or false
```

#### `get_entity_by_permalink(permalink, entity_type)`
Gets entity ID by permalink and entity type.

```sql
SELECT get_entity_by_permalink('john-smith', 'user');
-- Returns: UUID or null
```

## URL Structure

### Entity Type URLs

| Entity Type | URL Pattern | Example |
|-------------|-------------|---------|
| Users | `/profile/{permalink}` | `/profile/john.smith` |
| Groups | `/groups/{permalink}` | `/groups/book-club` |
| Events | `/events/{permalink}` | `/events/summer-festival` |
| Books | `/books/{permalink}` | `/books/great-gatsby` |
| Authors | `/authors/{permalink}` | `/authors/f-scott-fitzgerald` |
| Publishers | `/publishers/{permalink}` | `/publishers/simon-schuster` |

### Fallback Support

All URLs support both permalinks and UUIDs:

```typescript
// These all work for the same user:
/profile/john.smith
/profile/john-smith
/profile/e06cdf85-b449-4dcb-b943-068aaad8cfa3
```

## Permalink Rules

### Format Requirements

- **Length**: 3-100 characters
- **Characters**: Lowercase letters, numbers, and hyphens only
- **No consecutive hyphens**: `--` is not allowed
- **No leading/trailing hyphens**: Cannot start or end with `-`
- **Reserved words**: Cannot use system reserved words

### Reserved Words

The following words are reserved and cannot be used as permalinks:

```
admin, api, auth, login, logout, register, signup, signin,
profile, settings, dashboard, help, support, about, contact,
privacy, terms, legal, blog, news, feed, search, explore,
discover, trending, popular, new, hot, top, best, featured
```

### Examples

| Input | Generated Permalink |
|-------|-------------------|
| "John Smith" | `john-smith` |
| "F. Scott Fitzgerald" | `f-scott-fitzgerald` |
| "The Great Gatsby" | `the-great-gatsby` |
| "Book Club 2024" | `book-club-2024` |
| "Summer Reading Festival" | `summer-reading-festival` |

## Implementation

### Frontend Components

#### `PermalinkSettings` Component

```tsx
import { PermalinkSettings } from '@/components/permalink-settings'

<PermalinkSettings
  entityId="user-uuid"
  entityType="user"
  currentPermalink="john-smith"
  entityName="John Smith"
/>
```

#### Permalink Utilities

```tsx
import { 
  validatePermalinkFormat,
  checkPermalinkAvailability,
  updateEntityPermalink,
  generatePermalink
} from '@/lib/permalink-utils'

// Validate format
const validation = validatePermalinkFormat('john-smith')
// Returns: { isValid: true } or { isValid: false, error: '...' }

// Check availability
const availability = await checkPermalinkAvailability('john-smith', 'user')
// Returns: { isAvailable: true } or { isAvailable: false, suggestions: [...] }

// Update permalink
const result = await updateEntityPermalink(userId, 'user', 'new-permalink')
// Returns: { success: true } or { success: false, error: '...' }

// Generate permalink
const permalink = generatePermalink('John Smith')
// Returns: 'john-smith'
```

### Backend Integration

#### Profile Page Handler

```tsx
// app/profile/[id]/page.tsx
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  // Check if ID is UUID or permalink
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

  if (isUUID) {
    // Try UUID first, then permalink
    const user = await findUserByUUID(id) || await findUserByPermalink(id)
  } else {
    // Try permalink only
    const user = await findUserByPermalink(id)
  }

  if (!user) {
    notFound()
  }

  return <ClientProfilePage user={user} />
}
```

## Usage Examples

### Setting Up Permalinks

1. **User Profile Setup**
   ```tsx
   // In user settings page
   <PermalinkSettings
     entityId={user.id}
     entityType="user"
     currentPermalink={user.permalink}
     entityName={user.name}
   />
   ```

2. **Group Creation**
   ```tsx
   // When creating a group
   const groupData = {
     name: "Book Club 2024",
     description: "A reading group",
     permalink: generatePermalink("Book Club 2024") // "book-club-2024"
   }
   ```

3. **Event Management**
   ```tsx
   // When creating an event
   const eventData = {
     title: "Summer Reading Festival",
     permalink: generatePermalink("Summer Reading Festival") // "summer-reading-festival"
   }
   ```

### URL Resolution

The system automatically resolves URLs in this order:

1. **Permalink lookup** - Check if the ID is a permalink
2. **UUID lookup** - If not found, check if it's a UUID
3. **Fallback** - Return 404 if neither works

```typescript
// Example resolution for /profile/john-smith
const user = await findUserByPermalink('john-smith') || 
             await findUserByUUID('john-smith') // If it's actually a UUID
```

## Migration Guide

### For Existing Users

1. **Automatic Permalink Generation**
   ```sql
   -- Generate permalinks for existing users
   UPDATE users 
   SET permalink = generate_permalink(name, 'user')
   WHERE permalink IS NULL;
   ```

2. **Update Existing Links**
   ```typescript
   // Update any hardcoded UUID links to use permalinks
   const user = await getUserById(uuid)
   const newUrl = `/profile/${user.permalink}`
   ```

### For New Features

1. **Add Permalink Field**
   ```sql
   ALTER TABLE your_table ADD COLUMN permalink character varying(100) UNIQUE;
   ```

2. **Update Page Handlers**
   ```typescript
   // Support both UUID and permalink in your page handlers
   const entity = await findEntityByPermalink(id) || await findEntityByUUID(id)
   ```

3. **Add Permalink Settings**
   ```tsx
   <PermalinkSettings
     entityId={entity.id}
     entityType="your-entity-type"
     currentPermalink={entity.permalink}
     entityName={entity.name}
   />
   ```

## Best Practices

### 1. **Always Validate**
   ```typescript
   const validation = validatePermalinkFormat(permalink)
   if (!validation.isValid) {
     // Show error to user
   }
   ```

### 2. **Check Availability**
   ```typescript
   const availability = await checkPermalinkAvailability(permalink, entityType)
   if (!availability.isAvailable) {
     // Show suggestions to user
   }
   ```

### 3. **Provide Suggestions**
   ```typescript
   if (!availability.isAvailable) {
     // Show availability.suggestions to user
   }
   ```

### 4. **Handle Conflicts**
   ```typescript
   // If permalink is taken, append random suffix
   const uniquePermalink = permalink + '-' + Math.random().toString(36).substring(2, 6)
   ```

### 5. **Update URLs**
   ```typescript
   // After updating permalink, update the browser URL
   window.history.replaceState({}, '', `/profile/${newPermalink}`)
   ```

## Security Considerations

### 1. **Input Validation**
- All permalinks are validated on both client and server
- SQL injection protection through parameterized queries
- XSS protection through proper encoding

### 2. **Rate Limiting**
- Permalink availability checks are rate-limited
- Update operations require authentication
- Admin functions are protected

### 3. **Reserved Words**
- System reserved words cannot be used as permalinks
- Prevents conflicts with application routes
- Maintains URL structure integrity

## Performance

### 1. **Database Indexes**
```sql
CREATE INDEX idx_users_permalink ON users(permalink);
CREATE INDEX idx_groups_permalink ON groups(permalink);
-- ... for all entity tables
```

### 2. **Caching**
- Permalink lookups are cached
- Availability checks are debounced
- Real-time validation with 500ms delay

### 3. **Optimization**
- UUID lookups are fast with primary key
- Permalink lookups use indexed columns
- Fallback logic is efficient

## Troubleshooting

### Common Issues

1. **Permalink Already Taken**
   - Use the suggestions provided
   - Try adding numbers or suffixes
   - Generate a new permalink

2. **Invalid Format**
   - Check the format rules
   - Use only lowercase letters, numbers, and hyphens
   - Ensure 3-100 characters

3. **Reserved Word**
   - Choose a different permalink
   - Add a suffix like `-user` or `-page`

4. **URL Not Updating**
   - Check browser cache
   - Verify the permalink was saved
   - Try refreshing the page

### Debug Mode

Enable debug logging to see permalink operations:

```typescript
// In development
console.log('Permalink validation:', validation)
console.log('Permalink availability:', availability)
console.log('Permalink update result:', result)
```

## Future Enhancements

### Planned Features

1. **Bulk Permalink Generation**
   - Generate permalinks for all existing entities
   - Batch processing for large datasets

2. **Permalink History**
   - Track permalink changes
   - Redirect old permalinks to new ones

3. **Custom Domains**
   - Support for custom domain permalinks
   - Brand-specific URLs

4. **Analytics**
   - Track permalink usage
   - Popular permalink patterns
   - SEO performance metrics

### API Endpoints

```typescript
// Planned API endpoints
GET /api/permalinks/validate?permalink=john-smith&type=user
GET /api/permalinks/availability?permalink=john-smith&type=user
POST /api/permalinks/update
GET /api/permalinks/suggestions?base=john&type=user
```

This permalink system provides a comprehensive, user-friendly solution for custom URLs across all entity types in the AuthorsInfo application. 