# Enterprise Engagement Components Guide

## Overview

This guide explains how to use the new enterprise-grade, reusable engagement components that have been created to replace the hardcoded modals and engagement displays in the `entity-feed-card.tsx` component. These components are designed to be used across all entities in the application, providing consistent behavior and appearance.

## Components Created

### 1. ReactionsModal (`components/enterprise/reactions-modal.tsx`)

A reusable modal component for displaying reactions/likes with enterprise-grade features.

#### Features
- **Entity-Agnostic**: Works with any entity type (posts, books, authors, etc.)
- **Customizable**: Configurable icons, colors, and behavior
- **Responsive**: Mobile-first responsive design
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Error Handling**: Built-in error states and retry functionality
- **Loading States**: Professional loading indicators

#### Props Interface

```typescript
interface ReactionsModalProps {
  isOpen: boolean                    // Controls modal visibility
  onClose: () => void               // Close handler
  entityId: string                  // ID of the entity
  entityType: string                // Type of entity (e.g., 'activity', 'book', 'author')
  reactionCount: number             // Total number of reactions
  title?: string                    // Custom modal title
  description?: string              // Custom modal description
  className?: string                // Additional CSS classes
  onUserClick?: (userId: string) => void    // User profile navigation
  onAddFriend?: (userId: string) => void    // Friend request handling
  customReactionIcon?: React.ReactNode      // Custom reaction icon
  customReactionColor?: string              // Custom reaction color gradient
  showReactionTypes?: boolean               // Show reaction type indicators
  maxReactions?: number                     // Maximum reactions to display
}
```

#### Usage Examples

**Basic Usage (Posts/Activities)**
```tsx
<ReactionsModal
  isOpen={showLikesModal}
  onClose={() => setShowLikesModal(false)}
  entityId={post.id}
  entityType="activity"
  reactionCount={post.like_count}
  onUserClick={(userId) => navigateToUserProfile(userId)}
  onAddFriend={(userId) => sendFriendRequest(userId)}
/>
```

**Customized for Books**
```tsx
<ReactionsModal
  isOpen={showBookLikesModal}
  onClose={() => setShowBookLikesModal(false)}
  entityId={book.id}
  entityType="book"
  reactionCount={book.like_count}
  title="Book Reactions"
  description="People who loved this book"
  customReactionIcon={<BookOpen className="h-5 w-5" />}
  customReactionColor="from-purple-500 to-pink-500"
  showReactionTypes={true}
/>
```

**Customized for Authors**
```tsx
<ReactionsModal
  isOpen={showAuthorLikesModal}
  onClose={() => setShowAuthorLikesModal(false)}
  entityId={author.id}
  entityType="author"
  reactionCount={author.follower_count}
  title="Followers"
  description="People following this author"
  customReactionIcon={<Users className="h-5 w-5" />}
  customReactionColor="from-blue-500 to-cyan-500"
/>
```

### 2. CommentsModal (`components/enterprise/comments-modal.tsx`)

A reusable modal component for displaying comments with enterprise-grade features.

#### Features
- **Entity-Agnostic**: Works with any entity type
- **Nested Replies**: Support for comment threads and replies
- **Real-time Updates**: Built-in refresh functionality
- **Rich Interactions**: Like, reply, and user management
- **Professional UI**: Facebook-style comment interface
- **Accessibility**: Screen reader friendly

#### Props Interface

```typescript
interface CommentsModalProps {
  isOpen: boolean                    // Controls modal visibility
  onClose: () => void               // Close handler
  entityId: string                  // ID of the entity
  entityType: string                // Type of entity
  commentCount: number              // Total number of comments
  title?: string                    // Custom modal title
  description?: string              // Custom modal description
  className?: string                // Additional CSS classes
  onUserClick?: (userId: string) => void    // User profile navigation
  onAddFriend?: (userId: string) => void    // Friend request handling
  onCommentSubmit?: (commentText: string, parentId?: string) => Promise<void>
  onCommentLike?: (commentId: string) => Promise<void>
  onCommentReply?: (commentId: string, replyText: string) => Promise<void>
  currentUserId?: string            // Current user ID for commenting
  currentUserAvatar?: string        // Current user avatar
  currentUserName?: string          // Current user name
  showReplies?: boolean             // Enable/disable reply functionality
  maxComments?: number              // Maximum comments to display
  allowCommenting?: boolean         // Enable/disable commenting
}
```

#### Usage Examples

**Basic Usage (Posts)**
```tsx
<CommentsModal
  isOpen={showCommentsModal}
  onClose={() => setShowCommentsModal(false)}
  entityId={post.id}
  entityType="activity"
  commentCount={post.comment_count}
  onUserClick={(userId) => navigateToUserProfile(userId)}
  onAddFriend={(userId) => sendFriendRequest(userId)}
  onCommentSubmit={async (commentText) => {
    await submitComment(post.id, commentText);
  }}
  onCommentLike={async (commentId) => {
    await likeComment(commentId);
  }}
  onCommentReply={async (commentId, replyText) => {
    await submitReply(commentId, replyText);
  }}
  currentUserId={user.id}
  currentUserAvatar={user.avatar_url}
  currentUserName={user.name}
/>
```

**Book Reviews (Read-Only)**
```tsx
<CommentsModal
  isOpen={showBookReviewsModal}
  onClose={() => setShowBookReviewsModal(false)}
  entityId={book.id}
  entityType="book"
  commentCount={book.review_count}
  title="Book Reviews"
  description="What readers are saying about this book"
  allowCommenting={false}
  showReplies={false}
  onUserClick={(userId) => navigateToUserProfile(userId)}
/>
```

**Author Discussion (With Replies)**
```tsx
<CommentsModal
  isOpen={showAuthorDiscussionModal}
  onClose={() => setShowAuthorDiscussionModal(false)}
  entityId={author.id}
  entityType="author"
  commentCount={author.discussion_count}
  title="Author Discussion"
  description="Join the conversation about this author"
  showReplies={true}
  maxComments={200}
  onCommentSubmit={async (commentText) => {
    await submitAuthorComment(author.id, commentText);
  }}
  currentUserId={user.id}
  currentUserAvatar={user.avatar_url}
  currentUserName={user.name}
/>
```

### 3. EngagementDisplay (`components/enterprise/engagement-display.tsx`)

A reusable component for displaying engagement counts with hover previews.

#### Features
- **Entity-Agnostic**: Works with any entity type
- **Hover Previews**: Rich hover dropdowns showing recent engagement
- **Customizable**: Configurable icons, colors, and behavior
- **Performance**: Efficient data fetching and caching
- **Responsive**: Mobile-optimized design

#### Props Interface

```typescript
interface EngagementDisplayProps {
  entityId: string                   // ID of the entity
  entityType: string                 // Type of entity
  reactionCount: number              // Number of reactions
  commentCount: number               // Number of comments
  className?: string                 // Additional CSS classes
  onReactionsClick?: () => void     // Click handler for reactions
  onCommentsClick?: () => void      // Click handler for comments
  onUserClick?: (userId: string) => void    // User profile navigation
  onAddFriend?: (userId: string) => void    // Friend request handling
  customReactionIcon?: React.ReactNode      // Custom reaction icon
  customReactionColor?: string              // Custom reaction color
  showReactionTypes?: boolean               // Show reaction type indicators
  maxPreviewItems?: number                  // Maximum preview items
  showAddFriendButtons?: boolean            // Show add friend buttons
}
```

#### Usage Examples

**Basic Usage (Posts)**
```tsx
<EngagementDisplay
  entityId={post.id}
  entityType="activity"
  reactionCount={post.like_count}
  commentCount={post.comment_count}
  onReactionsClick={() => setShowLikesModal(true)}
  onCommentsClick={() => setShowCommentsModal(true)}
  onUserClick={(userId) => navigateToUserProfile(userId)}
  onAddFriend={(userId) => sendFriendRequest(userId)}
/>
```

**Customized for Books**
```tsx
<EngagementDisplay
  entityId={book.id}
  entityType="book"
  reactionCount={book.like_count}
  commentCount={book.review_count}
  customReactionIcon={<BookOpen className="h-3.5 w-3.5" />}
  customReactionColor="from-purple-500 to-pink-500"
  onReactionsClick={() => setShowBookLikesModal(true)}
  onCommentsClick={() => setShowBookReviewsModal(true)}
  maxPreviewItems={8}
/>
```

**Customized for Authors**
```tsx
<EngagementDisplay
  entityId={author.id}
  entityType="author"
  reactionCount={author.follower_count}
  commentCount={author.discussion_count}
  customReactionIcon={<Users className="h-3.5 w-3.5" />}
  customReactionColor="from-blue-500 to-cyan-500"
  onReactionsClick={() => setShowAuthorFollowersModal(true)}
  onCommentsClick={() => setShowAuthorDiscussionModal(true)}
  showAddFriendButtons={false}
/>
```

## Migration Guide

### Before (Hardcoded in entity-feed-card.tsx)

```tsx
// Old hardcoded engagement display
<div className="engagement-reactions-display flex items-center justify-between px-4 py-2 border-b border-gray-100">
  <div className="engagement-reactions-left flex items-center gap-2">
    {post.like_count > 0 && (
      <div className="engagement-reactions-likes flex items-center gap-2 relative group">
        {/* Hardcoded like display */}
      </div>
    )}
    {post.comment_count > 0 && (
      <div className="engagement-comment-count text-sm text-gray-600 hover:text-blue-600 cursor-pointer relative group">
        {/* Hardcoded comment display */}
      </div>
    )}
  </div>
</div>

// Old hardcoded modals
{showLikesModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    {/* Hardcoded reactions modal */}
  </div>
)}

{showCommentsModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    {/* Hardcoded comments modal */}
  </div>
)}
```

### After (Reusable Components)

```tsx
// New reusable engagement display
<EngagementDisplay
  entityId={post.id}
  entityType={post.entity_type || 'activity'}
  reactionCount={post.like_count || 0}
  commentCount={post.comment_count || 0}
  onReactionsClick={() => setShowLikesModal(true)}
  onCommentsClick={() => setShowCommentsModal(true)}
  onUserClick={(userId) => navigateToUserProfile(userId)}
  onAddFriend={(userId) => sendFriendRequest(userId)}
/>

// New reusable modals
<ReactionsModal
  isOpen={showLikesModal}
  onClose={() => setShowLikesModal(false)}
  entityId={post.id}
  entityType={post.entity_type || 'activity'}
  reactionCount={post.like_count || 0}
  onUserClick={(userId) => navigateToUserProfile(userId)}
  onAddFriend={(userId) => sendFriendRequest(userId)}
/>

<CommentsModal
  isOpen={showCommentsModal}
  onClose={() => setShowCommentsModal(false)}
  entityId={post.id}
  entityType={post.entity_type || 'activity'}
  commentCount={post.comment_count || 0}
  onUserClick={(userId) => navigateToUserProfile(userId)}
  onAddFriend={(userId) => sendFriendRequest(userId)}
  onCommentSubmit={async (commentText) => await submitComment(post.id, commentText)}
  currentUserId={user.id}
  currentUserAvatar={user.avatar_url}
  currentUserName={user.name}
/>
```

## Benefits of the New Architecture

### 1. **Reusability**
- **Single Source of Truth**: All engagement logic centralized in reusable components
- **Consistent Behavior**: Same interaction patterns across all entities
- **Easy Maintenance**: Changes made once apply everywhere

### 2. **Entity Agnosticism**
- **Universal Compatibility**: Works with posts, books, authors, or any entity type
- **Flexible Configuration**: Customizable for different entity contexts
- **Scalable**: Easy to add new entity types

### 3. **Enterprise Features**
- **Professional UI**: Facebook-style design with modern aesthetics
- **Accessibility**: Screen reader friendly with proper ARIA labels
- **Performance**: Efficient data fetching and state management
- **Error Handling**: Robust error states and recovery mechanisms

### 4. **Developer Experience**
- **Type Safety**: Full TypeScript support with proper interfaces
- **Customization**: Extensive prop options for different use cases
- **Event Handling**: Flexible callback system for custom behavior
- **Documentation**: Clear interfaces and usage examples

## Implementation Examples for Different Entities

### Books
```tsx
// Book engagement display
<EngagementDisplay
  entityId={book.id}
  entityType="book"
  reactionCount={book.like_count}
  commentCount={book.review_count}
  customReactionIcon={<BookOpen className="h-3.5 w-3.5" />}
  customReactionColor="from-purple-500 to-pink-500"
  onReactionsClick={() => setShowBookLikesModal(true)}
  onCommentsClick={() => setShowBookReviewsModal(true)}
/>

// Book reactions modal
<ReactionsModal
  isOpen={showBookLikesModal}
  onClose={() => setShowBookLikesModal(false)}
  entityId={book.id}
  entityType="book"
  reactionCount={book.like_count}
  title="Book Reactions"
  description="People who loved this book"
  customReactionIcon={<BookOpen className="h-5 w-5" />}
  customReactionColor="from-purple-500 to-pink-500"
/>
```

### Authors
```tsx
// Author engagement display
<EngagementDisplay
  entityId={author.id}
  entityType="author"
  reactionCount={author.follower_count}
  commentCount={author.discussion_count}
  customReactionIcon={<Users className="h-3.5 w-3.5" />}
  customReactionColor="from-blue-500 to-cyan-500"
  onReactionsClick={() => setShowAuthorFollowersModal(true)}
  onCommentsClick={() => setShowAuthorDiscussionModal(true)}
/>

// Author followers modal
<ReactionsModal
  isOpen={showAuthorFollowersModal}
  onClose={() => setShowAuthorFollowersModal(false)}
  entityId={author.id}
  entityType="author"
  reactionCount={author.follower_count}
  title="Followers"
  description="People following this author"
  customReactionIcon={<Users className="h-5 w-5" />}
  customReactionColor="from-blue-500 to-cyan-500"
/>
```

### Photos/Albums
```tsx
// Photo engagement display
<EngagementDisplay
  entityId={photo.id}
  entityType="photo"
  reactionCount={photo.like_count}
  commentCount={photo.comment_count}
  customReactionIcon={<Camera className="h-3.5 w-3.5" />}
  customReactionColor="from-green-500 to-emerald-500"
  onReactionsClick={() => setShowPhotoLikesModal(true)}
  onCommentsClick={() => setShowPhotoCommentsModal(true)}
/>

// Photo comments modal
<CommentsModal
  isOpen={showPhotoCommentsModal}
  onClose={() => setShowPhotoCommentsModal(false)}
  entityId={photo.id}
  entityType="photo"
  commentCount={photo.comment_count}
  title="Photo Comments"
  description="What people are saying about this photo"
  customReactionIcon={<Camera className="h-5 w-5" />}
/>
```

## Best Practices

### 1. **Consistent Naming**
- Use descriptive names for modal state variables
- Follow the pattern: `show[EntityType][ModalType]Modal`
- Examples: `showBookLikesModal`, `showAuthorDiscussionModal`

### 2. **Event Handling**
- Always provide meaningful callback functions
- Handle errors gracefully in async operations
- Provide user feedback for actions

### 3. **Customization**
- Use entity-specific icons and colors for visual consistency
- Customize titles and descriptions to match the context
- Adjust behavior based on entity type (e.g., read-only for certain entities)

### 4. **Performance**
- Use appropriate `maxReactions` and `maxComments` values
- Implement proper loading states
- Consider pagination for large datasets

### 5. **Accessibility**
- Ensure proper ARIA labels are provided
- Test with screen readers
- Maintain keyboard navigation support

## Troubleshooting

### Common Issues

1. **Modal Not Opening**
   - Check that `isOpen` prop is properly set
   - Verify modal state management
   - Ensure no CSS conflicts with z-index

2. **Data Not Loading**
   - Verify API endpoint is correct
   - Check entity ID and type are valid
   - Review network requests in browser dev tools

3. **Styling Issues**
   - Check Tailwind CSS classes are available
   - Verify custom colors are valid gradient strings
   - Ensure responsive breakpoints are working

4. **TypeScript Errors**
   - Verify all required props are provided
   - Check callback function signatures
   - Ensure proper type imports

### Debug Tips

- Use browser dev tools to inspect component props
- Check console for error messages
- Verify API responses in Network tab
- Test with different entity types and data

## Conclusion

The new enterprise engagement components provide a robust, scalable foundation for handling user interactions across all entity types in the application. By using these reusable components, developers can:

- **Maintain Consistency**: Same behavior and appearance everywhere
- **Reduce Duplication**: No more copy-pasting modal code
- **Improve Maintainability**: Centralized logic and easier updates
- **Enhance User Experience**: Professional, accessible interfaces
- **Scale Efficiently**: Easy to add new entity types and features

These components follow enterprise best practices and provide a solid foundation for building engaging, interactive user experiences throughout the application.
