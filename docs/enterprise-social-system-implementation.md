# ENTERPRISE SOCIAL SYSTEM IMPLEMENTATION

## Overview

This document outlines the complete implementation of the enterprise-grade unified social system for the AuthorsInfo platform. The system provides comments, likes, shares, bookmarks, and tags for all entity types (photos, books, authors, publishers, etc.) with comprehensive auditing and moderation capabilities.

## Database Schema

### Core Social Tables

#### 1. Comments Table (`public.comments`)
```sql
CREATE TABLE "public"."comments" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(50) NOT NULL, -- photo, book, author, etc.
    "entity_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" UUID, -- For threaded comments
    "is_hidden" BOOLEAN DEFAULT false,
    "is_deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 2. Likes Table (`public.likes`)
```sql
CREATE TABLE "public"."likes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE("user_id", "entity_type", "entity_id")
);
```

#### 3. Shares Table (`public.shares`)
```sql
CREATE TABLE "public"."shares" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "share_type" VARCHAR(50) DEFAULT 'standard',
    "share_platform" VARCHAR(50),
    "share_url" TEXT,
    "share_text" TEXT,
    "is_public" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE("user_id", "entity_type", "entity_id")
);
```

#### 4. Bookmarks Table (`public.bookmarks`)
```sql
CREATE TABLE "public"."bookmarks" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "bookmark_folder" VARCHAR(100) DEFAULT 'default',
    "notes" TEXT,
    "tags" TEXT[],
    "is_private" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE("user_id", "entity_type", "entity_id")
);
```

#### 5. Entity Tags Table (`public.entity_tags`)
```sql
CREATE TABLE "public"."entity_tags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "tag_name" VARCHAR(100) NOT NULL,
    "tag_category" VARCHAR(50),
    "tag_color" VARCHAR(7),
    "created_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "is_verified" BOOLEAN DEFAULT false,
    "usage_count" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE("entity_type", "entity_id", "tag_name")
);
```

#### 6. Comment Reactions Table (`public.comment_reactions`)
```sql
CREATE TABLE "public"."comment_reactions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "comment_id" UUID NOT NULL REFERENCES "public"."comments"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "reaction_type" VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry', 'care')),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE("comment_id", "user_id", "reaction_type")
);
```

### Audit & Moderation Tables

#### 7. Social Audit Log (`public.social_audit_log`)
```sql
CREATE TABLE "public"."social_audit_log" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "target_id" UUID,
    "action_details" JSONB DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 8. Content Flags (`public.content_flags`)
```sql
CREATE TABLE "public"."content_flags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "flagged_by" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "content_type" VARCHAR(50) NOT NULL,
    "content_id" UUID NOT NULL,
    "flag_reason" VARCHAR(100) NOT NULL,
    "flag_details" TEXT,
    "moderation_status" VARCHAR(20) DEFAULT 'pending',
    "moderated_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "moderation_notes" TEXT,
    "moderated_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE("flagged_by", "content_type", "content_id")
);
```

#### 9. Moderation Queue (`public.moderation_queue`)
```sql
CREATE TABLE "public"."moderation_queue" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "content_type" VARCHAR(50) NOT NULL,
    "content_id" UUID NOT NULL,
    "priority" VARCHAR(20) DEFAULT 'normal',
    "flag_count" INTEGER DEFAULT 1,
    "first_flagged_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "last_flagged_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending',
    "assigned_to" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "assigned_at" TIMESTAMP WITH TIME ZONE,
    "resolved_at" TIMESTAMP WITH TIME ZONE,
    "resolution_action" VARCHAR(50),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE("content_type", "content_id")
);
```

## Key Features

### 1. Unified Entity System
- All social features work with any entity type (photo, book, author, publisher, etc.)
- Uses `entity_type` and `entity_id` columns for universal compatibility
- Single component (`EntityComments`) works across all entities

### 2. Threaded Comments
- Support for nested replies using `parent_id`
- Hierarchical display in UI
- Proper loading and display of comment threads

### 3. Social Actions
- **Likes**: Toggle like status with real-time updates
- **Shares**: Track sharing across platforms
- **Bookmarks**: Personal bookmarking with folders and notes
- **Tags**: Entity tagging with categories and colors
- **Reactions**: Facebook-style reactions on comments

### 4. Enterprise Auditing
- Automatic logging of all social actions
- IP address and user agent tracking
- Session tracking for security analysis
- JSONB action details for flexible metadata

### 5. Content Moderation
- Flagging system for inappropriate content
- Moderation queue with priority levels
- Admin tools for content review
- Resolution tracking and notes

### 6. Performance Optimizations
- Comprehensive indexing on all lookup columns
- Efficient queries using entity_type/entity_id combinations
- Pagination support for large datasets
- Optimized joins for user data

## Component Usage

### EntityComments Component

```tsx
import EntityComments from '@/components/entity-comments'

// For Photos
<EntityComments
  entityId={photo.id}
  entityType="photo"
  entityName={photo.user?.name || "User"}
  entityAvatar={photo.user?.avatar_url}
  entityCreatedAt={photo.created_at}
  isOwner={isOwner}
/>

// For Books
<EntityComments
  entityId={book.id}
  entityType="book"
  entityName={book.title}
  entityAvatar={book.cover_url}
  entityCreatedAt={book.published_date}
  isOwner={isOwner}
/>

// For Authors
<EntityComments
  entityId={author.id}
  entityType="author"
  entityName={author.name}
  entityAvatar={author.avatar_url}
  entityCreatedAt={author.created_at}
  isOwner={isOwner}
/>
```

## Database Queries

### Load Comments for Entity
```typescript
const { data: comments } = await supabase
  .from('comments')
  .select('*')
  .eq('entity_type', entityType)
  .eq('entity_id', entityId)
  .is('parent_id', null)
  .eq('is_deleted', false)
  .eq('is_hidden', false)
  .order('created_at', { ascending: true })
```

### Add Comment
```typescript
const { data, error } = await supabase
  .from('comments')
  .insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    content: commentText,
    parent_id: parentId || null
  })
```

### Toggle Like
```typescript
// Check if liked
const { data: existingLike } = await supabase
  .from('likes')
  .select('id')
  .eq('user_id', userId)
  .eq('entity_type', entityType)
  .eq('entity_id', entityId)
  .single()

if (existingLike) {
  // Unlike
  await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
} else {
  // Like
  await supabase
    .from('likes')
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId
    })
}
```

### Flag Content
```typescript
const { data, error } = await supabase
  .rpc('flag_content', {
    p_flagged_by: userId,
    p_content_type: 'comment',
    p_content_id: commentId,
    p_flag_reason: 'inappropriate',
    p_flag_details: 'Contains offensive language'
  })
```

## Helper Functions

### Get Entity Social Stats
```typescript
const { data } = await supabase
  .rpc('get_entity_social_stats', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_user_id: userId
  })
```

### Log Social Action
```typescript
const { data } = await supabase
  .rpc('log_social_action', {
    p_user_id: userId,
    p_action_type: 'comment_added',
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_target_id: commentId,
    p_action_details: { content: commentText }
  })
```

## Analytics Views

### Social Activity Analytics
```sql
SELECT 
    DATE(created_at) as activity_date,
    action_type,
    entity_type,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users
FROM "public"."social_audit_log"
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(created_at), action_type, entity_type
```

### Moderation Analytics
```sql
SELECT 
    flag_reason,
    content_type,
    COUNT(*) as flag_count,
    AVG(EXTRACT(EPOCH FROM (moderated_at - created_at)) / 3600) as avg_resolution_time_hours
FROM "public"."content_flags"
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY flag_reason, content_type
```

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only see their own flags and bookmarks
- Admins have broader access for moderation
- Audit logs are protected but accessible to admins

### Data Validation
- Check constraints on action types and status values
- Unique constraints prevent duplicate actions
- Foreign key constraints maintain data integrity

## Performance Considerations

### Indexes
- Composite indexes on (entity_type, entity_id) for fast lookups
- Indexes on user_id for personal data queries
- Indexes on created_at for time-based queries
- GIN indexes on JSONB and array columns

### Query Optimization
- Use specific entity_type/entity_id combinations
- Implement pagination for large datasets
- Cache frequently accessed data
- Use materialized views for complex analytics

## Migration Strategy

### From Old Schema
1. Add `entity_type` and `entity_id` columns to existing tables
2. Populate new columns from existing foreign keys
3. Update application code to use new schema
4. Remove old foreign key columns after validation

### Backward Compatibility
- Maintain support for old schema during transition
- Gradual migration of existing data
- Feature flags for new vs old functionality

## Monitoring and Maintenance

### Health Checks
- Monitor query performance on social tables
- Track audit log growth and retention
- Monitor moderation queue response times
- Alert on unusual activity patterns

### Data Retention
- Archive old audit logs after retention period
- Clean up resolved moderation cases
- Maintain active indexes for performance
- Regular vacuum and analyze operations

## Future Enhancements

### Planned Features
1. **AI-Powered Moderation**: Automatic content filtering
2. **Advanced Analytics**: Predictive engagement modeling
3. **Real-time Notifications**: WebSocket-based updates
4. **Content Recommendations**: ML-based suggestions
5. **Advanced Reactions**: Custom reaction sets per entity type

### Scalability Improvements
1. **Sharding**: Partition tables by entity_type
2. **Caching**: Redis for frequently accessed data
3. **CDN Integration**: Optimize media delivery
4. **Microservices**: Split social features into separate services

## Troubleshooting

### Common Issues

#### 1. Comments Not Loading
- Check entity_type and entity_id values
- Verify user permissions and RLS policies
- Check for soft-deleted comments (is_deleted = true)

#### 2. Like Count Incorrect
- Verify like records exist in database
- Check for duplicate likes (should be prevented by unique constraint)
- Ensure proper error handling in toggle functions

#### 3. Audit Log Missing
- Verify triggers are properly installed
- Check RLS policies allow audit log insertion
- Monitor for trigger errors in database logs

#### 4. Moderation Queue Issues
- Check flag_content function permissions
- Verify content_flags table exists and is accessible
- Monitor for constraint violations

### Debug Queries

```sql
-- Check comment counts by entity
SELECT entity_type, entity_id, COUNT(*) as comment_count
FROM comments 
WHERE is_deleted = false 
GROUP BY entity_type, entity_id
ORDER BY comment_count DESC;

-- Check like counts by entity
SELECT entity_type, entity_id, COUNT(*) as like_count
FROM likes 
GROUP BY entity_type, entity_id
ORDER BY like_count DESC;

-- Check recent social activity
SELECT action_type, entity_type, COUNT(*) as action_count
FROM social_audit_log
WHERE created_at >= now() - INTERVAL '24 hours'
GROUP BY action_type, entity_type
ORDER BY action_count DESC;

-- Check moderation queue status
SELECT status, priority, COUNT(*) as queue_count
FROM moderation_queue
GROUP BY status, priority
ORDER BY queue_count DESC;
```

## Conclusion

The enterprise social system provides a robust, scalable foundation for social features across all entity types. With comprehensive auditing, moderation, and analytics capabilities, it supports both current needs and future growth of the platform.

The unified approach eliminates code duplication and provides consistent user experience across all content types, while the enterprise-grade features ensure security, performance, and maintainability. 