# Activity Generation System

This document explains how the automatic activity generation system works for entity timelines.

## Overview

The system automatically creates and maintains timeline activities for various entities in the application:
- Authors
- Books
- Publishers
- User Profiles
- Groups

These activities appear on entity profile pages, providing a chronological history of important events.

## How It Works

The activity generation system consists of three main components:

1. **Database Triggers**: Automatically create activities when entities are added or updated
2. **JavaScript API**: Functions to programmatically generate activities 
3. **Admin UI**: Interface for generating activities for existing data

## Activity Types

The following activity types are supported by entity:

### Author Activities
- `author_created` - When an author profile is first created
- `author_profile_updated` - When significant changes are made to an author profile

### Book Activities
- `book_added` - When a new book is added to the database
- `rating` - When a user rates a book 
- `finished` - When a user marks a book as finished
- `added` - When a user adds a book to a shelf
- `reviewed` - When a user reviews a book

### Publisher Activities
- `publisher_created` - When a publisher profile is first created
- `publisher_updated` - When significant changes are made to a publisher profile
- `book_published` - When a new book is published by the publisher

### User Profile Activities
- `profile_created` - When a user profile is first created
- `profile_updated` - When significant changes are made to a user profile

### Group Activities
- `group_created` - When a group is first created
- `group_updated` - When significant changes are made to a group

## Database Triggers

The system uses PostgreSQL triggers to automatically generate activities when:

1. New entities are created (authors, books, publishers, profiles, groups)
2. Existing entities are updated with significant changes

The triggers are defined in `migrations/activity-triggers.sql` and can be applied to your Supabase database.

## JavaScript API

The system provides JavaScript functions for programmatically generating activities:

```typescript
// Generate activities for a specific entity
await generateAuthorActivities(authorId, adminUserId);
await generateBookActivities(bookId, adminUserId);
await generatePublisherActivities(publisherId, adminUserId);
await generateUserProfileActivities(userId, adminUserId);
await generateGroupActivities(groupId, adminUserId);

// Generate activities for all entities of a specific type
await generateAllAuthorActivities(adminUserId);
await generateAllBookActivities(adminUserId);
await generateAllPublisherActivities(adminUserId);
await generateAllUserProfileActivities(adminUserId);
await generateAllGroupActivities(adminUserId);

// Generate activities for all entity types
await generateAllActivities(adminUserId);
```

These functions are available in `lib/activity-generator.ts`.

## Admin UI

An admin interface is available for manually generating activities. This is useful for:

- Initial data population
- Ensuring all records have activities
- Regenerating activities if needed

Access the admin UI at `/admin/activities`.

## API Endpoints

The system provides the following API endpoints:

- `POST /api/admin/generate-activities` - Generate activities based on the request body

Request body format:
```json
{
  "type": "all | author | book | publisher | user | group",
  "id": "optional-specific-id"
}
```

## Activity Schema

Activities are stored in the `activities` table with the following schema:

```typescript
{
  id: string;                // UUID
  user_id: string;           // User who performed the action
  activity_type: string;     // Type of activity
  created_at: string;        // Timestamp
  book_id?: string;          // Optional book reference
  author_id?: string;        // Optional author reference
  publisher_id?: string;     // Optional publisher reference
  user_profile_id?: string;  // Optional user profile reference
  group_id?: string;         // Optional group reference
  data?: {                   // Additional activity data
    // Activity-specific fields
  }
}
```

## Implementation Notes

- Activities are automatically created for all entity types via database triggers
- For existing data, use the admin UI to generate activities
- User activities (ratings, reviews, etc.) are handled separately by the application logic

## Extending the System

To add new activity types:

1. Add a new case in the appropriate activity fetching function (e.g., `getAuthorActivities` in `app/authors/[id]/page.tsx`)
2. Add a new display component in the appropriate client component file
3. Update the database triggers if necessary

## Troubleshooting

If activities are not appearing for a specific entity:

1. Check that the entity exists in the database
2. Verify that activities exist in the `activities` table for that entity
3. Use the admin UI to regenerate activities if needed

## Entity Timeline Display

The system supports fetching and displaying timelines for each entity type:

- Authors: `app/authors/[id]/page.tsx`
- Books: `app/books/[id]/page.tsx`
- Publishers: `app/publishers/[id]/page.tsx`
- User Profiles: `app/profile/[id]/page.tsx`
- Groups: `app/groups/[id]/page.tsx`

Each entity type has its own timeline display component that renders activities in chronological order. 