# Comment Tables Analysis - Single Source of Truth: Supabase

## Executive Summary

Based on analysis of your codebase and Supabase schema, here are the **actual comment tables** that exist and are being used:

---

## ✅ **ACTIVE COMMENT TABLES (Currently in Use)**

### 1. **`comments` Table** - PRIMARY/UNIFIED TABLE ⭐
**Status:** Active - Main unified comment table  
**Used by:** `EntityComments` component, `/api/engagement` route, `/api/comments` route  
**Purpose:** Unified comment storage for all entity types (photos, books, authors, activities, etc.)

**Columns:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, NOT NULL) - References auth.users
- `feed_entry_id` (UUID, nullable) - **LEGACY FIELD** (for backward compatibility)
- `content` (TEXT, NOT NULL) - Comment text
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `is_hidden` (BOOLEAN)
- `is_deleted` (BOOLEAN)
- `entity_type` (TEXT, nullable) - **UNIFIED FIELD**: 'photo', 'book', 'author', 'activity', 'user', etc.
- `entity_id` (UUID, nullable) - **UNIFIED FIELD**: ID of the entity being commented on
- `parent_id` (UUID, nullable) - **LEGACY** parent comment reference
- `parent_comment_id` (UUID, nullable) - Current parent comment reference for threading
- `thread_id` (UUID, nullable) - Thread identifier
- `comment_depth` (INTEGER) - Nesting depth
- `reply_count` (INTEGER) - Number of replies
- `moderation_status` (TEXT) - Moderation state
- `content_html` (TEXT, nullable) - Processed HTML version
- `mentions` (TEXT[], nullable) - Array of mentioned user IDs

**Database Functions Used:**
- `get_entity_engagement(p_entity_type, p_entity_id)` - Retrieves comments via RPC
- `add_entity_comment(p_user_id, p_entity_type, p_entity_id, p_comment_text, p_parent_comment_id)` - Creates comments via RPC

**Issues Found:**
- Component expects `comment_text` but table has `content` field
- Component expects `recent_comments` array but RPC may return different structure
- Both `parent_id` and `parent_comment_id` exist (legacy duplication)

---

### 2. **`event_comments` Table** - LEGACY/SPECIALIZED TABLE ⚠️
**Status:** Active but LEGACY - Specialized table for events only  
**Used by:** Event admin pages (`app/admin/events/[id]/page.tsx`), event-specific routes  
**Purpose:** Comments specifically for events and event sessions

**Columns:**
- `id` (UUID, PRIMARY KEY)
- `event_id` (UUID, NOT NULL) - References events table
- `session_id` (UUID, nullable) - References event_sessions table
- `user_id` (UUID, NOT NULL) - References auth.users
- `content` (TEXT, NOT NULL)
- `is_pinned` (BOOLEAN)
- `is_announcement` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Created in:** `supabase/migrations/20251227160000_alter_phase_3_community_events.sql`

**Legacy Status:** ⚠️ This table should be migrated to use the unified `comments` table with `entity_type='event'` and `entity_id=<event_id>`

---

### 3. **`group_content_comments` Table** - LEGACY/SPECIALIZED TABLE ⚠️
**Status:** Active but LEGACY - Specialized table for group content  
**Used by:** Group content API route (`app/api/groups/[id]/content-comments.ts`)  
**Purpose:** Comments on group content items

**Columns (inferred from code):**
- `content_id` (UUID) - References group content
- `group_id` (UUID) - References groups
- `body` or `content` (TEXT) - Comment text
- `created_at` (TIMESTAMPTZ)
- Additional fields may exist but not visible in types

**Legacy Status:** ⚠️ This table should be migrated to use the unified `comments` table with `entity_type='group_content'` and `entity_id=<content_id>`

---

## ❌ **LEGACY COMMENT TABLES (No Longer Exist or Should Be Removed)**

The following tables are mentioned in archived migrations and cleanup documentation but **do NOT exist in your current database schema**:

1. **`engagement_comments`** ❌
   - Referenced in: `docs/_archive/migrations_20250906_153138/20250823280000_consolidate_engagement_system.sql`
   - Status: Was created as a consolidated table but migration history shows it was never the final solution
   - **Does not exist** in current `types/database.ts`

2. **`activity_comments`** ❌
   - Referenced in: Cleanup documentation, archived migrations
   - Status: Should have been migrated to unified `comments` table
   - **Does not exist** in current schema

3. **`photo_comments`** ❌
   - Referenced in: Cleanup documentation, component documentation
   - Status: Should have been migrated to unified `comments` table with `entity_type='photo'`
   - **Does not exist** in current schema

4. **`post_comments`** ❌
   - Referenced in: `app/api/posts/engagement/route.ts` (uses this but table doesn't exist!)
   - Status: Code still references this but table doesn't exist
   - **CRITICAL ISSUE**: Code at line 175, 310, 388 in `app/api/posts/engagement/route.ts` tries to use `post_comments` table

5. **`discussion_comments`** ❌
   - Referenced in: Cleanup documentation
   - Status: Legacy table, does not exist

6. **`book_club_discussion_comments`** ❌
   - Referenced in: Cleanup documentation
   - Status: Legacy table, does not exist

---

## 🔧 **Issues with EntityComments Component**

The `EntityComments` component (`components/entity-comments.tsx`) has the following issues:

### Issue 1: Field Name Mismatch
- **Component expects:** `comment_text` (line 222)
- **Database has:** `content` field
- **Fix:** The `/api/engagement` route maps `content` to `comment_text` in response (line 161), but the mapping may be incomplete

### Issue 2: Missing Fields
- Component expects `recent_comments` array from API response
- Component expects `comment_text` but receives it from API transformation
- Component creates comments with wrong field names when adding to local state

### Issue 3: Inconsistent Parent ID Handling
- Component uses `parent_id` in some places (line 223)
- Database has both `parent_id` (legacy) and `parent_comment_id` (current)
- Database function `add_entity_comment` uses `p_parent_comment_id` parameter

---

## 📋 **Recommendations**

### 1. **Consolidate to Unified `comments` Table**
   - ✅ Keep `comments` table as the single source of truth
   - ⚠️ Migrate `event_comments` to `comments` with `entity_type='event'`
   - ⚠️ Migrate `group_content_comments` to `comments` with `entity_type='group_content'`
   - ❌ Remove references to non-existent tables (`post_comments`, `engagement_comments`, etc.)

### 2. **Fix EntityComments Component**
   - Update component to use correct field names (`content` instead of `comment_text`)
   - Ensure API route correctly transforms database fields to component expectations
   - Standardize on `parent_comment_id` instead of `parent_id`

### 3. **Database Cleanup**
   - Remove `feed_entry_id` column from `comments` table (legacy field)
   - Remove `parent_id` column from `comments` table (use only `parent_comment_id`)
   - Ensure all database functions use correct column names

### 4. **Code Cleanup**
   - Fix `app/api/posts/engagement/route.ts` - it references non-existent `post_comments` table
   - Update all references to use unified `comments` table
   - Remove references to legacy tables in code comments/documentation

---

## 🎯 **Current State Summary**

| Table Name | Status | Used By | Should Migrate To |
|------------|--------|---------|-------------------|
| `comments` | ✅ Active | EntityComments, Engagement API | Keep as primary |
| `event_comments` | ⚠️ Legacy | Event admin pages | `comments` (entity_type='event') |
| `group_content_comments` | ⚠️ Legacy | Groups API | `comments` (entity_type='group_content') |
| `engagement_comments` | ❌ Does not exist | None | N/A |
| `activity_comments` | ❌ Does not exist | None | N/A |
| `photo_comments` | ❌ Does not exist | None | N/A |
| `post_comments` | ❌ Does not exist | Posts API (ERROR!) | `comments` (entity_type='activity' or 'post') |

---

## 🔍 **Next Steps**

1. **Verify actual database schema** by running the comment audit script:
   ```bash
   node scripts/supabase-comment-audit.mjs --count
   ```

2. **Fix broken references** in `app/api/posts/engagement/route.ts` to use `comments` table

3. **Update EntityComments component** to match actual database schema

4. **Create migration plan** to consolidate `event_comments` and `group_content_comments` into unified `comments` table