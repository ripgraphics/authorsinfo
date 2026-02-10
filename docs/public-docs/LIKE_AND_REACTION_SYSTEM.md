# Like and Reaction System (Canonical)

This document is the **single source of truth** for the like and reaction system. It describes the unified `likes` table, entity types, API and context flow, and how counts and user reactions are stored and updated.

## Engagement system (terminology)

- **Engagement system**: The full set of user actions on content: **Like** (with emoji subtypes), **Comment**, **Share**, **Bookmark**, **View**, **Follow**. Like is one engagement type among these.
- **Like**: One engagement type, implemented via the `likes` table. Each row has a **like reaction subtype** (e.g. like, love, care, haha, wow, sad, angry). "Like" is not the same as the overall reaction system—it is one reaction type; Comment, Share, Bookmark are other engagement types.
- **Like reaction subtypes**: The seven emoji types stored in `likes.like_type`. Used only for the Like engagement flow (reaction popup, quick-like).

**Config module**: All entity types, like reaction subtypes, engagement types, and count-source logic are defined in **`lib/engagement/config.ts`**. Use `ENGAGEMENT_ENTITY_TYPES`, `LIKE_REACTION_TYPES`, `ENGAGEMENT_TYPES`, `REACTION_OPTIONS_METADATA`, `isValidEntityType`, `isValidLikeReactionType`, and `getLikeCountSource` from that module; do not hardcode these values in API routes or components.

## Overview

- **Table**: `likes` (columns: `user_id`, `entity_type`, `entity_id`, `like_type`, plus `id`, `created_at`, `updated_at`, and any schema-specific fields).
- **Like reaction subtypes**: `like`, `love`, `care`, `haha`, `wow`, `sad`, `angry` (from `LIKE_REACTION_TYPES` in config).
- **Timeline posts**: For timeline/feed posts, the entity is `entity_type = 'activity'` and `entity_id` = post id (the row in `posts`).
- **Count storage**: For activities, total reaction count is stored on `posts.like_count` and kept in sync when reactions are added or removed. The API uses `getLikeCountSource(entityType)` from config to determine which table/column to update.

## Database

### `likes` table

- **Columns** (verify against live schema): `id`, `user_id`, `entity_type`, `entity_id`, `like_type`, `created_at`, `updated_at`. (Some migrations or types may reference `reaction_type`; the application uses `like_type` as the column name per migration `20260204032026_add_like_type_to_likes_table.sql`.)
- **Unique constraint**: One row per (user, entity, reaction type), e.g. `(user_id, entity_type, entity_id, like_type)`.
- **Check**: `like_type` must be one of: `like`, `love`, `care`, `haha`, `wow`, `sad`, `angry`.

### Counts for activities

- For `entity_type = 'activity'`, `entity_id` is the post id in `posts`.
- After each reaction add/remove, the reaction API updates `posts.like_count` for that post to match the current count from `likes` for that entity.

### RLS

- RLS on `likes` should allow `SELECT` for authenticated users for any `entity_type` (no dependency on an `activities` row existing). See `LIKE_SYSTEM_ISSUE_ANALYSIS.md` and `ENGAGEMENT_SYSTEM_COMPLETE_FIX.md` if issues persist.

## Data flow

### 1. UI → API → DB

1. User clicks Like (quick-like) or opens the reaction popup and selects a reaction.
2. `EnterpriseEngagementActions` / reaction popup calls `setReaction(entityId, entityType, reactionType)` from engagement context.
3. Context sends `POST /api/engagement/reaction` with `entity_type`, `entity_id`, `reaction_type`.
4. API toggles the like: if the user already has that reaction on that entity, it is removed; otherwise it is added. For `entity_type === 'activity'`, it then updates `posts.like_count` for that post.
5. API responds with `{ success, action, reaction_type, like_id, total_count, user_reaction }` so the client can update without a second request.

### 2. Engagement context (client)

- **Hydration at data layer**: When the timeline (or any list of posts) is fetched, the loader calls `batchUpdateEngagement` once per post with `entityType: 'activity'`, `entityId: post.id`, and `updates: { reactionCount: post.like_count, userReaction: post.user_reaction_type ?? null, ... }`. Cards do not seed engagement themselves.
- **After a reaction**: When the reaction API returns `total_count` and/or `user_reaction`, the context dispatches `SET_ENTITY_ENGAGEMENT` with those values so the next render uses server state.
- **Cache consistency**: When context state for a post changes (e.g. reaction count or user reaction), the feed card can call `onPostUpdated(updatedPost)` so the parent list (e.g. timeline state) can update its copy of the post.

### 3. Timeline data

- Every timeline that shows likes should return `like_count` and `user_reaction_type` per post.
- **Main timeline** (`/api/timeline`): Uses `posts` plus batch engagement counts and a lookup on `likes` with `entity_type = 'activity'` and `entity_id` in post ids to set `user_reaction_type` (and `like_type` from `likes`).
- **Author timeline** (`/api/authors/[id]/timeline`): Uses `get_entity_timeline_activities` (or equivalent) and a separate lookup on `likes` (same entity type/ids) to attach `user_reaction_type` and `is_liked`.
- Types: `FeedPost` and timeline DTOs include `like_count` and `user_reaction_type`; use these typed fields and avoid `(post as any).user_reaction_type`.

## API response shape

After `POST /api/engagement/reaction`:

- `success`: boolean  
- `action`: `'added'` | `'removed'`  
- `reaction_type`: string  
- `like_id`: string | null  
- `total_count`: number (new total for that entity; present when available)  
- `user_reaction`: string | null (current user’s reaction after the mutation, or null if removed)

## UI/UX and accessibility

- **Like button**: Clear affordance for “click to like” and “hover for more reactions”; loading state and disabled while the reaction request is in progress; ARIA labels and `aria-busy` as appropriate.
- **Reaction popup**: Keyboard-accessible (Escape to close; Enter/Space to activate options); `role="dialog"`, `aria-labelledby`; live region (`aria-live="polite"`) for “X reactions” / “You reacted with Like” so screen readers get updates.
- **Errors**: Non-technical toast and optional retry; do not change counts or user reaction on failure.

## Components

- **ReactionsModal**: “Who reacted” and reaction breakdown; reads from engagement context or server data that is updated after mutations.
- **EngagementDisplay**: Summary counts; same source as above.
- **EnterpriseEngagementActions**: Primary engagement bar (like, comment, share, bookmark, etc.); uses engagement context and reaction API.
- **EnterpriseReactionPopup**: Reaction picker; keyboard and ARIA as above.

## Legacy / other docs

The following documents are superseded or supplementary; this file is canonical for the like and reaction behavior:

- **LIKE_SYSTEM_IMPLEMENTATION_STATUS.md**: Describes an older `/api/likes` and `activity_likes`; current system uses `likes` and `/api/engagement/reaction`.
- **unified-enterprise-social-system.md**: Describes the unified entity approach; consistent with this doc.
- **REACTION_POPUP_IMPLEMENTATION_SUMMARY.md**: Reaction popup UI and behavior; consistent; some DB references may say `reaction_type` where the actual column is `like_type`.
- **ENGAGEMENT_PERSISTENCE_FIX.md**, **LIKE_SYSTEM_ISSUE_ANALYSIS.md**, **ENGAGEMENT_SYSTEM_COMPLETE_FIX.md**: RLS and engagement fixes; refer to them for RLS and count sync details.
