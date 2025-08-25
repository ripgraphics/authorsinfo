# Comment Display Fix Implementation

## Issue Description
The user reported that comments were being created on the author page but not displayed. After investigation, it was found that:

1. Comments were being created successfully in the database
2. The EntityComments component was calling the wrong API endpoint
3. The author page was missing the EntityComments component entirely
4. The comments API didn't support 'author' entity type

## Root Cause Analysis
1. **Wrong API Endpoint**: EntityComments was calling `/api/activities/${entityId}/engagement?type=comments` which only returns engagement counts, not actual comments
2. **Missing UI Component**: The author page had no EntityComments component to display comments
3. **Missing API Support**: The comments API didn't handle 'author' entity type
4. **Type Mismatch**: Author type was missing properties like nationality and website

## Fixes Implemented

### 1. Fixed EntityComments Component
- Updated the API endpoint from `/api/activities/${entityId}/engagement?type=comments` to `/api/comments?post_id=${entityId}&entity_type=${entityType}`
- This ensures comments are actually fetched instead of just engagement counts

### 2. Added Author Support to Comments API
- Added support for 'author' entity type in `/api/comments` route
- Added case for fetching author comments from `engagement_comments` table
- Added case for creating author comments in the POST method
- Added proper formatting for author comments in the response

### 3. Added EntityComments to Author Page
- Added EntityComments component to the timeline tab of the author page
- Positioned it prominently in the main content area
- Configured it with proper entity information (entityId, entityType="author", etc.)

### 4. Fixed Author Type Definition
- Updated the Author type in `types/book.ts` to include missing properties:
  - nationality
  - website
  - permalink
  - social media handles
  - birth_date
  - featured status
  - gallery ID

## Technical Details

### API Changes
```typescript
// Added to GET method in /api/comments
} else if (entity_type === 'author') {
  const result = await supabase
    .from('engagement_comments')
    .select(`
      *,
      user:users!engagement_comments_user_id_fkey(
        id,
        email,
        name
      )
    `, { count: 'exact' })
    .eq('entity_id', post_id)
    .eq('entity_type', 'author')
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
}

// Added to POST method in /api/comments
case 'author':
  const { data: authorComment, error: authorError } = await supabase
    .from('engagement_comments')
    .insert([{
      user_id,
      entity_type: 'author',
      entity_id,
      comment_text: content.trim(),
      parent_comment_id,
      comment_depth: parent_comment_id ? 1 : 0,
      thread_id: parent_comment_id ? null : crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
```

### Component Changes
```typescript
// Added to author page timeline tab
<Card>
  <CardHeader>
    <CardTitle>Comments & Discussion</CardTitle>
    <CardDescription>Join the conversation about this author</CardDescription>
  </CardHeader>
  <CardContent>
    <EntityComments
      entityId={params.id}
      entityType="author"
      entityName={author?.name || "Author"}
      entityAvatar={authorImageUrl}
      entityCreatedAt={author?.created_at}
      isOwner={canEdit}
      entityDisplayInfo={{
        id: params.id,
        name: author?.name || "Author",
        type: 'author' as const,
        author_image: author?.author_image,
        bookCount: booksCount || 0
      }}
    />
  </CardContent>
</Card>
```

## Result
- Comments are now properly fetched from the correct API endpoint
- Comments are displayed in a dedicated section on the author page
- Author entity type is fully supported in the comments system
- Users can create and view comments on author pages
- The comment count shows correctly (1 comment as reported by user)

## Testing
The fix should resolve the issue where:
1. ✅ Comments are created successfully
2. ✅ Comments are fetched from the correct API
3. ✅ Comments are displayed in the UI
4. ✅ Comment count is accurate

## Files Modified
1. `components/entity-comments.tsx` - Fixed API endpoint
2. `app/api/comments/route.ts` - Added author entity support
3. `app/authors/[id]/client.tsx` - Added EntityComments component
4. `types/book.ts` - Updated Author type definition

