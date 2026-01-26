# Enterprise Tagging System Documentation

## Overview

The Enterprise Tagging System is a comprehensive, Facebook-style tagging solution that supports user mentions, entity mentions, hashtags, locations, collaborators, and taxonomy tags across all entities in the application.

## Features

- **User Mentions**: Tag users with `@username` syntax
- **Entity Mentions**: Tag authors, books, groups, and events with `@Entity Name` syntax
- **Hashtags**: Create and use topic tags with `#hashtag` syntax
- **Location Tags**: Tag content with locations
- **Collaborator Tags**: Tag collaborators for shared content
- **Taxonomy Tags**: Admin-managed category tags
- **Autocomplete**: Real-time search and suggestions
- **Notifications**: Automatic notifications for mentions
- **Analytics**: Comprehensive tag usage analytics
- **Backward Compatibility**: Syncs with existing `hashtags` and `mentions` arrays

## Architecture

### Database Schema

#### Core Tables

1. **`tags`**: Canonical tag records
   - `id`: UUID primary key
   - `name`: Display name
   - `slug`: URL-friendly identifier
   - `type`: `user`, `entity`, `topic`, `collaborator`, `location`, `taxonomy`
   - `status`: `active`, `archived`, `blocked`, `pending`
   - `metadata`: JSONB for additional data (entity_id, coordinates, etc.)
   - `usage_count`: Cached count of taggings

2. **`tag_aliases`**: Synonyms and redirects
   - Links alternative names to canonical tags
   - Supports tag merging and normalization

3. **`taggings`**: Polymorphic join table
   - Links tags to any entity (posts, comments, messages, photos, etc.)
   - Stores position data for inline mentions
   - Tracks context (post, comment, message, photo, etc.)

4. **`tag_policies`**: Tagging constraints
   - Per-entity policies (opt-out, block lists, approval requirements)
   - Controls who can tag and what tags are allowed

5. **`tag_audit_log`**: Compliance and moderation
   - Complete audit trail of all tag operations
   - Tracks creates, updates, deletes, blocks, merges

### API Endpoints

#### `GET /api/tags/search`
Search tags across all types with autocomplete.

**Query Parameters:**
- `q`: Search query (required)
- `types`: Comma-separated list of tag types to search
- `entityTypes`: Comma-separated list of entity types (author, book, group, event)
- `limit`: Maximum results (default: 20, max: 50)

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Tag Name",
      "slug": "tag-slug",
      "type": "user|entity|topic|...",
      "avatarUrl": "url",
      "sublabel": "Additional info",
      "usageCount": 42
    }
  ],
  "type": "tags|users|entities"
}
```

#### `POST /api/tags/create`
Create a new tag (typically for taxonomy or topic tags).

**Body:**
```json
{
  "name": "Tag Name",
  "type": "topic|taxonomy|location",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "tag": {
    "id": "uuid",
    "name": "Tag Name",
    "type": "topic"
  }
}
```

#### `POST /api/tags/taggings`
Create taggings for an entity (can parse from content or use explicit tags).

**Body:**
```json
{
  "content": "Text with @mentions and #hashtags",
  "tags": [
    {
      "name": "Tag Name",
      "type": "user|entity|topic",
      "entityId": "uuid",
      "entityType": "user|author|book|...",
      "position": { "start": 0, "end": 10 }
    }
  ],
  "entityType": "post",
  "entityId": "uuid",
  "context": "post|comment|message|photo|activity"
}
```

**Response:**
```json
{
  "success": true,
  "taggingsCreated": 3
}
```

#### `GET /api/tags/taggings`
Get taggings for an entity.

**Query Parameters:**
- `entityType`: Type of entity (required)
- `entityId`: ID of entity (required)
- `context`: Filter by context (optional)

**Response:**
```json
{
  "taggings": [
    {
      "id": "uuid",
      "tag_id": "uuid",
      "context": "post",
      "position_start": 0,
      "position_end": 10,
      "created_at": "timestamp",
      "tags": {
        "id": "uuid",
        "name": "Tag Name",
        "slug": "tag-slug",
        "type": "user",
        "usage_count": 42
      }
    }
  ]
}
```

## Usage

### Frontend Components

#### TagInput Component

```tsx
import { TagInput } from '@/components/tags/tag-input'

<TagInput
  value={content}
  onChange={setContent}
  onTagsChange={(tags) => console.log('Tags:', tags)}
  allowMentions={true}
  allowHashtags={true}
  allowEntities={true}
  placeholder="Write something..."
/>
```

#### TagDisplay Component

```tsx
import { TagDisplay } from '@/components/tags/tag-display'

<TagDisplay
  name="John Doe"
  slug="john-doe"
  type="user"
  avatarUrl="/avatar.jpg"
/>
```

#### TagAndCollaborateView

The existing `TagAndCollaborateView` component has been updated to use the new tag search API automatically.

### Backend Services

#### Tag Parsing

```typescript
import { extractMentions, extractHashtags, extractAllTags } from '@/lib/tags/tag-parser'

const text = "Check out @JohnDoe and #awesomebook"
const mentions = extractMentions(text) // [{ name: "JohnDoe", type: "user", ... }]
const hashtags = extractHashtags(text) // [{ name: "awesomebook", type: "topic", ... }]
const allTags = extractAllTags(text) // Combined array
```

#### Tag Service

```typescript
import { searchTags, findOrCreateTag, createTaggings } from '@/lib/tags/tag-service'

// Search tags
const results = await searchTags("john", ["user"], 10)

// Find or create tag
const tagId = await findOrCreateTag("John Doe", "user", { entity_id: userId })

// Create taggings
await createTaggings(
  [tagId],
  "post",
  postId,
  "post",
  userId,
  [{ start: 0, end: 10 }]
)
```

#### Notifications

```typescript
import { notifyMentionedUsers } from '@/lib/tags/tag-notifications'

// Notify mentioned users (also handled automatically by database trigger)
await notifyMentionedUsers("post", postId, "post", userId, content)
```

## Integration with Existing Systems

### Post Creation

The post creation API (`/api/posts/create`) automatically:
1. Parses mentions and hashtags from content
2. Creates or finds tags
3. Creates taggings
4. Syncs `hashtags` array in posts table (backward compatibility)
5. Triggers mention notifications

### Comment Creation

Comments can be tagged by:
1. Parsing content for mentions
2. Calling `/api/tags/taggings` with `context: "comment"`
3. The system automatically syncs `mentions` array in comments table

### Message Tagging

Group and event chat messages can be tagged similarly:
1. Parse message content
2. Create taggings with `context: "message"`
3. Notifications are sent automatically

## Analytics

### Available Views

1. **`tag_analytics_top_tags`**: Most used tags
2. **`tag_analytics_trending`**: Tags trending in the last 7 days
3. **`tag_analytics_by_context`**: Tag usage by context and type
4. **`tag_analytics_most_mentioned_users`**: Most mentioned users

### Example Queries

```sql
-- Get top 10 tags
SELECT * FROM tag_analytics_top_tags LIMIT 10;

-- Get trending tags
SELECT * FROM tag_analytics_trending ORDER BY recent_count DESC LIMIT 20;

-- Get tag usage by context
SELECT * FROM tag_analytics_by_context;
```

## Policies and Moderation

### Tag Policies

Tag policies allow fine-grained control over tagging:

```sql
-- Disable user mentions for a user
INSERT INTO tag_policies (entity_type, entity_id, allow_user_mentions)
VALUES ('user', 'user-uuid', false);

-- Block specific tags for a group
INSERT INTO tag_policies (entity_type, entity_id, blocked_tag_ids)
VALUES ('group', 'group-uuid', ARRAY['tag-uuid-1', 'tag-uuid-2']);
```

### Audit Log

All tag operations are logged in `tag_audit_log`:

```sql
-- View recent tag operations
SELECT * FROM tag_audit_log 
ORDER BY created_at DESC 
LIMIT 100;
```

## Best Practices

1. **Tag Normalization**: Always use `findOrCreateTag` to avoid duplicates
2. **Position Tracking**: Include position data for inline mentions to enable proper rendering
3. **Notification Deduplication**: The system automatically prevents duplicate notifications
4. **Performance**: Use the cached `usage_count` for sorting and filtering
5. **Privacy**: Respect tag policies and user opt-outs
6. **Moderation**: Review `tag_audit_log` regularly for compliance

## Migration Notes

The tagging system maintains backward compatibility:
- `posts.hashtags` array is synced from taggings
- `comments.mentions` array is synced from taggings
- Existing code using these arrays continues to work

## Future Enhancements

- Tag suggestions based on content analysis
- Tag following/subscriptions
- Tag-based content discovery
- Advanced tag analytics and insights
- Tag moderation tools
- Tag merging and deduplication UI
