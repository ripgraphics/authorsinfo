# Convex Migration - Phase 2 Plan

## Current Status (Phase 1 Complete)
✅ Core pages migrated to Convex:
- `/` (Home)
- `/books/[id]` (Book detail)
- `/authors/[id]` (Author detail)
- `/publishers/[id]` (Publisher detail)
- `/books` (Book listing)
- `/authors` (Author listing)
- `/publishers` (Publisher listing)

## Phase 2: High-Priority User Pages

### Priority 1: Content Creation & Discovery
| Page | Supabase Usage | Convex Queries Needed |
|------|---------------|----------------------|
| `/books/add` | Create book, fetch authors, publishers | `createBook`, `listAuthors`, `listPublishers` |
| `/discussions` | List discussions with pagination | `listDiscussions`, `getDiscussionCount` |
| `/discussions/[id]` | Discussion detail, comments | `getDiscussion`, `getComments` |
| `/groups/[id]` | Group detail, members, books | `getGroup`, `getGroupMembers`, `getGroupBooks` |

### Priority 2: User Profiles & Social
| Page | Supabase Usage | Convex Queries Needed |
|------|---------------|----------------------|
| `/profile/[id]` | User profile, books, friends, reading progress | `getUser`, `getUserBooks`, `getUserFriends`, `getReadingProgress` |
| `/profile` | Current user profile | `getCurrentUser` |
| `/messages` | Direct messages | `getConversations`, `getMessages` |

### Priority 3: Content Management
| Page | Supabase Usage | Convex Queries Needed |
|------|---------------|----------------------|
| `/photos` | Photo listing | `listPhotos` |
| `/photos/[id]` | Photo detail | `getPhoto` |
| `/books/[id]/edit` | Edit book | `updateBook` |

### Priority 4: Admin (Lower Priority)
| Page | Supabase Usage | Convex Queries Needed |
|------|---------------|----------------------|
| `/admin/*` | Various admin functions | Admin-specific queries |

## Available Convex Queries (from function-spec)
- `queries/books`: getBook, getBookDetails, listBooks, getBooksByAuthorId, getBooksByPublisherId, getBookCountByAuthorId, getBookCountByPublisherId, getAuthorsByPublisherId, getPublisherAuthorCount
- `queries/authors`: getAuthor, listAuthors, listAuthorsPaginated
- `queries/publishers`: getPublisher, listPublishers
- `queries/bookAuthors`: getAuthorsByBook, getAuthorsByBookId, getBooksByAuthor, getBooksByAuthorId
- `queries/groups`: getGroup, getGroupMembers, getGroupBooks, getUserPrivacySettings
- `queries/users`: getUser, getProfile, getUserBooks, getUserFriends, getUserFollowers, getUserStats, listUsers, getCurrentlyReadingBooksForUser
- `queries/readingProgress`: getReadingProgressByBook, getReadingProgressByAuthor, getCurrentlyReadingBooks
- `queries/reviews`: getReviewsByBook
- `queries/follows`: getFollowers, getFollowersCount, checkFollowStatus
- `queries/friends`: getFriends, getMutualFriendsCount, checkFriendship, checkFollowing
- `queries/activities`: getAlbums, getAuthorActivities
- `queries/events`: listEvents, getEventRegistrations

## Missing Queries to Create
1. `queries/discussions.ts` - listDiscussions, getDiscussion, getComments
2. `queries/photos.ts` - listPhotos, getPhoto
3. `queries/messages.ts` - getConversations, getMessages
4. `queries/books.ts` - createBook, updateBook (mutations)
5. `queries/groups.ts` - createGroup, updateGroup (mutations)

## Next Steps
1. Create missing query files
2. Add wrapper functions in `lib/convex-server.ts`
3. Add server actions in `app/actions/data.ts`
4. Migrate pages one by one
5. Test each page after migration