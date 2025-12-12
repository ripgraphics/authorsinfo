# Unified Enterprise Social System

## Overview

The Unified Enterprise Social System provides a single, scalable solution for social features across all entity types in the platform. Instead of creating separate tables for each entity type (photo_comments, book_comments, author_comments, etc.), we use a unified approach with entity_type and entity_id fields.

## Architecture Comparison

### ❌ Entity-Specific Approach (Current)
```sql
-- Separate tables for each entity type
photo_comments, photo_likes, photo_shares, photo_bookmarks, photo_tags
book_comments, book_likes, book_shares, book_bookmarks, book_tags
author_comments, author_likes, author_shares, author_bookmarks, author_tags
publisher_comments, publisher_likes, publisher_shares, publisher_bookmarks, publisher_tags
```

### ✅ Unified Enterprise Approach (Recommended)
```sql
-- Single unified tables for all entities
comments (entity_type, entity_id)
likes (entity_type, entity_id)
shares (entity_type, entity_id)
bookmarks (entity_type, entity_id)
tags (entity_type, entity_id)
```

## Benefits of Unified Approach

### 1. **Scalability**
- **Add new entity types** without creating new tables
- **Single codebase** handles all entities
- **Easier maintenance** and extension
- **Consistent API** across all entity types

### 2. **Performance**
- **Fewer tables** to manage and index
- **Better query optimization** with unified indexes
- **Simpler joins** and relationships
- **Reduced database complexity**

### 3. **Development Efficiency**
- **One component** (`EntityComments`) works for all entities
- **Reusable business logic** across entity types
- **Easier testing** with unified data structure
- **Consistent user experience**

### 4. **Data Consistency**
- **Same features** across all entities
- **Unified moderation** and content policies
- **Consistent analytics** and reporting
- **Standardized data format**

## Database Schema

### Unified Comments Table
```sql
CREATE TABLE "public"."comments" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL, -- photo, book, author, publisher, group, event, etc.
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID REFERENCES "public"."comments"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "content_html" TEXT, -- Processed HTML version
    "mentions" UUID[], -- Array of mentioned user IDs
    "like_count" INTEGER DEFAULT 0,
    "reply_count" INTEGER DEFAULT 0,
    "is_edited" BOOLEAN DEFAULT FALSE,
    "is_pinned" BOOLEAN DEFAULT FALSE,
    "is_hidden" BOOLEAN DEFAULT FALSE,
    "moderation_status" VARCHAR(20) DEFAULT 'approved',
    "sentiment_score" DECIMAL(3,2), -- AI sentiment analysis
    "language" VARCHAR(10),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "edited_at" TIMESTAMP WITH TIME ZONE,
    "ip_address" INET,
    "user_agent" TEXT,
    UNIQUE("entity_type", "entity_id", "user_id", "parent_id", "created_at")
);
```

### Unified Likes Table
```sql
CREATE TABLE "public"."likes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "like_type" VARCHAR(20) DEFAULT 'like', -- like, love, wow, laugh, angry, sad
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "ip_address" INET,
    "user_agent" TEXT,
    UNIQUE("entity_type", "entity_id", "user_id", "like_type")
);
```

### Unified Shares Table
```sql
CREATE TABLE "public"."shares" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID,
    "share_type" VARCHAR(50) NOT NULL, -- facebook, twitter, instagram, whatsapp, email, link, embed, download
    "platform_data" JSONB, -- Platform-specific data
    "referrer_url" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Unified Bookmarks Table
```sql
CREATE TABLE "public"."bookmarks" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "collection_name" VARCHAR(255), -- User can organize bookmarks into collections
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("entity_type", "entity_id", "user_id")
);
```

### Unified Tags Table
```sql
CREATE TABLE "public"."tags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "tagged_entity_type" VARCHAR(50) NOT NULL, -- user, book, publisher, author, group, event, character, location
    "tagged_entity_id" UUID NOT NULL,
    "tagged_entity_name" VARCHAR(255) NOT NULL,
    "x_position" DECIMAL(5,2), -- Percentage position (for visual tags)
    "y_position" DECIMAL(5,2),
    "width" DECIMAL(5,2) DEFAULT 0,
    "height" DECIMAL(5,2) DEFAULT 0,
    "confidence_score" DECIMAL(3,2), -- AI confidence if auto-tagged
    "tagged_by" UUID, -- User who created the tag
    "verified_by" UUID, -- User who verified the tag
    "is_verified" BOOLEAN DEFAULT FALSE,
    "is_auto_generated" BOOLEAN DEFAULT FALSE,
    "visibility" VARCHAR(20) DEFAULT 'public', -- public, friends, private
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Indexes

### Optimized Indexes for Queries
```sql
-- Comments indexes
CREATE INDEX idx_comments_entity ON "public"."comments"(entity_type, entity_id, created_at);
CREATE INDEX idx_comments_user ON "public"."comments"(user_id, created_at);
CREATE INDEX idx_comments_parent ON "public"."comments"(parent_id) WHERE parent_id IS NOT NULL;

-- Likes indexes
CREATE INDEX idx_likes_entity ON "public"."likes"(entity_type, entity_id, created_at);
CREATE INDEX idx_likes_user ON "public"."likes"(user_id, created_at);

-- Shares indexes
CREATE INDEX idx_shares_entity ON "public"."shares"(entity_type, entity_id, created_at);
CREATE INDEX idx_shares_user ON "public"."shares"(user_id, created_at);

-- Bookmarks indexes
CREATE INDEX idx_bookmarks_entity ON "public"."bookmarks"(entity_type, entity_id, created_at);
CREATE INDEX idx_bookmarks_user ON "public"."bookmarks"(user_id, created_at);

-- Tags indexes
CREATE INDEX idx_tags_entity ON "public"."tags"(entity_type, entity_id);
CREATE INDEX idx_tags_tagged_entity ON "public"."tags"(tagged_entity_type, tagged_entity_id);
CREATE INDEX idx_tags_user ON "public"."tags"(tagged_by, created_at);
```

## Usage Examples

### EntityComments Component
```typescript
// Works for any entity type
<EntityComments
  entityId="photo-123"
  entityType="photo"
  entityName="Beautiful Sunset"
  entityAvatar="/sunset.jpg"
  entityCreatedAt="2025-01-15T10:30:00Z"
  isOwner={true}
/>

<EntityComments
  entityId="book-456"
  entityType="book"
  entityName="The Great Gatsby"
  entityAvatar="/book-cover.jpg"
  entityCreatedAt="2025-01-15T10:30:00Z"
  isOwner={false}
/>

<EntityComments
  entityId="author-789"
  entityType="author"
  entityName="F. Scott Fitzgerald"
  entityAvatar="/author-photo.jpg"
  entityCreatedAt="2025-01-15T10:30:00Z"
  isOwner={false}
/>
```

### Database Queries
```sql
-- Get all comments for a photo
SELECT * FROM comments 
WHERE entity_type = 'photo' AND entity_id = 'photo-123'
ORDER BY created_at DESC;

-- Get all likes for a book
SELECT * FROM likes 
WHERE entity_type = 'book' AND entity_id = 'book-456'
ORDER BY created_at DESC;

-- Get all bookmarks for an author
SELECT * FROM bookmarks 
WHERE entity_type = 'author' AND entity_id = 'author-789'
ORDER BY created_at DESC;

-- Get all tags for a publisher
SELECT * FROM tags 
WHERE entity_type = 'publisher' AND entity_id = 'publisher-101'
ORDER BY created_at DESC;
```

## Helper Functions

### Get Entity Social Stats
```sql
CREATE OR REPLACE FUNCTION get_entity_social_stats(
    p_entity_type VARCHAR(50),
    p_entity_id UUID
)
RETURNS TABLE(
    comment_count BIGINT,
    like_count BIGINT,
    share_count BIGINT,
    bookmark_count BIGINT,
    tag_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "public"."comments" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."likes" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."shares" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."bookmarks" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."tags" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id);
END;
$$ LANGUAGE plpgsql;
```

### Check User Engagement
```sql
CREATE OR REPLACE FUNCTION has_user_liked_entity(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM "public"."likes" 
        WHERE entity_type = p_entity_type 
        AND entity_id = p_entity_id 
        AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### From Entity-Specific to Unified
```sql
-- Migrate photo comments to unified comments
INSERT INTO "public"."comments" (
    entity_type, entity_id, user_id, parent_id, content, 
    content_html, mentions, like_count, reply_count, is_edited, 
    is_pinned, is_hidden, moderation_status, sentiment_score, 
    language, created_at, updated_at, edited_at, ip_address, user_agent
)
SELECT 
    'photo' as entity_type,
    photo_id as entity_id,
    user_id,
    parent_id,
    content,
    content_html,
    mentions,
    like_count,
    reply_count,
    is_edited,
    is_pinned,
    is_hidden,
    moderation_status,
    sentiment_score,
    language,
    created_at,
    updated_at,
    edited_at,
    ip_address,
    user_agent
FROM "public"."photo_comments";

-- Similar migrations for likes, shares, bookmarks, and tags...
```

## Security & Row Level Security (RLS)

### Comments Policies
```sql
-- Users can view public comments
CREATE POLICY "Users can view public comments" ON "public"."comments"
    FOR SELECT USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert their own comments" ON "public"."comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON "public"."comments"
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON "public"."comments"
    FOR DELETE USING (auth.uid() = user_id);
```

## Analytics & Reporting

### Cross-Entity Analytics
```sql
-- Get top commented entities across all types
SELECT 
    entity_type,
    entity_id,
    COUNT(*) as comment_count
FROM comments 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY entity_type, entity_id
ORDER BY comment_count DESC
LIMIT 10;

-- Get user engagement across all entity types
SELECT 
    user_id,
    entity_type,
    COUNT(*) as engagement_count
FROM (
    SELECT user_id, entity_type FROM comments
    UNION ALL
    SELECT user_id, entity_type FROM likes
    UNION ALL
    SELECT user_id, entity_type FROM shares
) engagement
GROUP BY user_id, entity_type
ORDER BY engagement_count DESC;
```

## Benefits Summary

| Aspect | Entity-Specific | Unified Enterprise |
|--------|----------------|-------------------|
| **Scalability** | ❌ New tables per entity | ✅ Single tables for all |
| **Maintenance** | ❌ High complexity | ✅ Low complexity |
| **Performance** | ❌ Multiple table queries | ✅ Optimized unified queries |
| **Development** | ❌ Duplicate code | ✅ Reusable components |
| **Consistency** | ❌ Inconsistent features | ✅ Consistent experience |
| **Analytics** | ❌ Fragmented data | ✅ Unified reporting |
| **Security** | ❌ Multiple policies | ✅ Single policy set |
| **Testing** | ❌ Complex test setup | ✅ Simple unified tests |

## Conclusion

The Unified Enterprise Social System provides a **scalable, maintainable, and efficient** solution for social features across all entity types. It eliminates the need for entity-specific tables while providing consistent functionality and better performance.

**Key Advantages:**
- ✅ **Single codebase** for all social features
- ✅ **Consistent user experience** across entities
- ✅ **Better performance** with optimized indexes
- ✅ **Easier maintenance** and development
- ✅ **Scalable architecture** for future growth
- ✅ **Unified analytics** and reporting

This approach follows enterprise best practices and provides a solid foundation for the platform's social features. 