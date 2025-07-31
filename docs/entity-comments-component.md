# EntityComments Component

## Overview

The `EntityComments` component is a reusable, enterprise-grade comment system that provides Facebook-style commenting functionality for any entity type in your application. It uses database data instead of mock data and supports threaded comments, likes, and social interactions.

## Features

- **Universal Entity Support**: Works with any entity type (photos, books, authors, publishers, users, groups, etc.)
- **Database Integration**: Uses actual database data from `photo_comments` and `comments` tables
- **Facebook-Style UI**: Mimics Facebook's comment section design and functionality
- **Threaded Comments**: Supports nested replies and comment threading
- **Real-time Interactions**: Like, comment, share, and download functionality
- **Authentication Integration**: Requires user authentication for interactions
- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Shows loading indicators while fetching data
- **Error Handling**: Comprehensive error handling with user feedback

## Database Schema

The component supports two database table structures:

### For Photos (`photo_comments` table)
```sql
CREATE TABLE photo_comments (
    id UUID PRIMARY KEY,
    photo_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES photo_comments(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE
);
```

### For Other Entities (`comments` table)
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES comments(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_hidden BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);
```

## Usage

### Basic Usage

```tsx
import { EntityComments } from '@/components/entity-comments'

function PhotoViewer({ photo }) {
  return (
    <div className="flex h-screen">
      {/* Main content */}
      <div className="flex-1">
        <img src={photo.url} alt={photo.alt_text} />
      </div>

      {/* Comments sidebar */}
      <EntityComments
        entityId={photo.id}
        entityType="photo"
        entityName={photo.user?.name || "User"}
        entityAvatar={photo.user?.avatar_url}
        entityCreatedAt={photo.created_at}
        isOwner={isOwner}
      />
    </div>
  )
}
```

### For Different Entity Types

```tsx
// For Books
<EntityComments
  entityId={book.id}
  entityType="book"
  entityName={book.title}
  entityAvatar={book.cover_url}
  entityCreatedAt={book.published_at}
  isOwner={isBookAuthor}
/>

// For Authors
<EntityComments
  entityId={author.id}
  entityType="author"
  entityName={author.name}
  entityAvatar={author.portrait_url}
  entityCreatedAt={author.created_at}
  isOwner={isAuthor}
/>

// For Publishers
<EntityComments
  entityId={publisher.id}
  entityType="publisher"
  entityName={publisher.name}
  entityAvatar={publisher.logo_url}
  entityCreatedAt={publisher.founded_date}
  isOwner={isPublisherAdmin}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entityId` | `string` | Yes | - | Unique identifier for the entity |
| `entityType` | `string` | Yes | - | Type of entity ('photo', 'book', 'author', etc.) |
| `entityName` | `string` | No | "User" | Display name for the entity |
| `entityAvatar` | `string` | No | - | Avatar/logo URL for the entity |
| `entityCreatedAt` | `string` | No | - | Creation date for the entity |
| `isOwner` | `boolean` | No | `false` | Whether current user owns the entity |
| `className` | `string` | No | `""` | Additional CSS classes |

## Component Structure

The component is structured as follows:

```
EntityComments
├── Post Header
│   ├── Entity Avatar
│   ├── Entity Name & Timestamp
│   └── Privacy Icon
├── Action Buttons
│   ├── Like Button
│   ├── Comment Button
│   ├── Share Button
│   └── Send/Download Button
├── Comments Section
│   ├── Comment List (with replies)
│   ├── Empty State (no comments)
│   └── Comment Input
│       ├── User Avatar
│       ├── Editable Input Field
│       ├── Action Buttons (emoji, GIF, etc.)
│       └── Send Button
```

## Database Integration

### Loading Comments

The component automatically loads comments based on the entity type:

- **Photos**: Uses `photo_comments` table with `photo_id` foreign key
- **Other Entities**: Uses `comments` table with `entity_id` and `entity_type` columns

### Adding Comments

Comments are added to the appropriate table based on entity type:

```typescript
// For photos
await supabase
  .from('photo_comments')
  .insert({
    photo_id: entityId,
    user_id: user.id,
    content: commentText,
    parent_id: replyToId || null
  })

// For other entities
await supabase
  .from('comments')
  .insert({
    entity_id: entityId,
    entity_type: entityType,
    user_id: user.id,
    content: commentText,
    parent_id: replyToId || null
  })
```

### Loading User Data

Comments include user information through foreign key relationships:

```typescript
// For photo comments
const { data } = await supabase
  .from('photo_comments')
  .select(`
    *,
    user:users!photo_comments_user_id_fkey(
      id,
      name,
      avatar_url
    )
  `)

// For generic comments
const { data } = await supabase
  .from('comments')
  .select(`
    *,
    user:users!comments_user_id_fkey(
      id,
      name,
      avatar_url
    )
  `)
```

## Authentication Requirements

The component requires user authentication for:

- Viewing comments (optional, but recommended)
- Adding comments
- Liking content
- Sharing content

Users must be logged in to interact with the comment system.

## Styling

The component uses Tailwind CSS classes and follows the design system:

- **Colors**: Uses theme colors (`bg-background`, `text-muted-foreground`, etc.)
- **Spacing**: Consistent spacing with Tailwind utilities
- **Typography**: Uses system font stack with appropriate sizes
- **Interactive States**: Hover, focus, and active states for buttons

## Error Handling

The component includes comprehensive error handling:

- **Network Errors**: Shows toast notifications for failed requests
- **Authentication Errors**: Prompts users to log in when required
- **Validation Errors**: Prevents invalid comment submissions
- **Loading States**: Shows loading indicators during data fetching

## Performance Considerations

- **Pagination**: Comments are loaded in batches (can be implemented)
- **Caching**: Uses React state for local comment caching
- **Optimistic Updates**: UI updates immediately for better UX
- **Debounced Input**: Comment input can be debounced to reduce API calls

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: Meets WCAG contrast requirements

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design for mobile devices
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live comments
- **Rich Text Editing**: Support for markdown and rich text
- **Media Attachments**: Support for images and videos in comments
- **Moderation Tools**: Admin controls for comment moderation
- **Analytics**: Comment engagement analytics
- **Notifications**: Comment reply notifications
- **Search**: Comment search functionality
- **Export**: Comment export capabilities

## Migration Guide

### From Mock Data

If you're currently using mock data, replace your comment section with:

```tsx
// Before (with mock data)
<div className="comments">
  {mockComments.map(comment => (
    <div key={comment.id}>{comment.content}</div>
  ))}
</div>

// After (with EntityComments)
<EntityComments
  entityId={entity.id}
  entityType={entity.type}
  entityName={entity.name}
  entityAvatar={entity.avatar}
  entityCreatedAt={entity.created_at}
  isOwner={isOwner}
/>
```

### Database Setup

Ensure your database has the required tables and relationships:

1. **For Photos**: Use existing `photo_comments` table
2. **For Other Entities**: Use existing `comments` table or create new one
3. **User Relationships**: Ensure foreign key relationships to `users` table
4. **Indexes**: Add indexes for performance on `entity_id`, `entity_type`, `created_at`

## Troubleshooting

### Database Setup Issues

If you encounter errors like "relation 'photo_comments' does not exist", you need to run the enterprise photo system migration:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `migrations/20250129_complete_enterprise_photo_system.sql`
   - Paste it into the SQL Editor
   - Execute the migration

3. **Verify Tables Created**
   - Check that the following tables exist:
     - `photo_comments`
     - `photo_likes`
     - `photo_shares`
     - `photo_tags`
     - `photo_analytics`
     - `photo_monetization`

4. **Test the Component**
   - Refresh your application
   - Try viewing a photo with comments
   - The EntityComments component should now work properly

### Common Error Messages

- **"Photo comments table not found"**: Run the enterprise photo system migration
- **"Error loading comments: {}"**: Check database connectivity and table permissions
- **"User as unknown"**: Verify user data exists in the `users` table
- **"Date not formatted correctly"**: Check the `formatDate` function implementation

### Performance Issues

- **Slow comment loading**: Add indexes on `photo_id` and `created_at` columns
- **High memory usage**: Implement pagination for large comment threads
- **Slow user data fetching**: Consider caching user information

### Security Considerations

- **Row Level Security (RLS)**: Ensure proper RLS policies are in place
- **Input validation**: Sanitize comment content before storage
- **Rate limiting**: Implement comment posting rate limits
- **Content moderation**: Add content filtering for inappropriate comments

## Examples

See `components/entity-comments-demo.tsx` for a complete example of how to use the component with different entity types. 