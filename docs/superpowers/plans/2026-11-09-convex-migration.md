# Convex Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the authors-info platform from Supabase data layer to Convex in 6 phased steps, starting with infrastructure wiring and ending with cleanup.

**Architecture:** Convex becomes the database + API layer while Supabase Auth remains as the identity provider. Convex verifies Supabase JWTs via an internal action. Existing `/api/*` routes are preserved by proxying through `convex/http.ts`. React components use `useQuery`/`useMutation` hooks instead of direct Supabase calls.

**Tech Stack:** Next.js 16, React 19, Convex v1.49, Supabase JS v2.117, TypeScript strict mode, Tailwind CSS, shadcn/ui.

---

## Phase Overview

| Phase | What | Files Changed | Risk |
|-------|------|---------------|------|
| 0 · Infra | ConvexProvider + auth passthrough | ~8 new, 2 modified | Low |
| 1 · Core Reads | authors, books, publishers query functions | ~12 new, ~30 modified | Low |
| 2 · Writes | mutations + HTTP endpoint proxies | ~30 new, ~80 modified | Medium |
| 3 · Social | follows, friends, groups functions | ~15 new, ~25 modified | Medium |
| 4 · Realtime | replace polling with subscriptions | ~10 modified | Low |
| 5 · Cleanup | remove dead Supabase imports | ~50 removed | Low |

---

## File Structure Map

### New Files (created during migration)
```
convex/
├── client.ts                    # Browser-side Convex client instance
├── http.ts                      # HTTP router for /api/* route proxies
├── auth.ts                      # Supabase JWT verification helper
├── queries/
│   ├── authors.ts               # listAuthors, getAuthor
│   ├── books.ts                 # listBooks, getBook
│   ├── publishers.ts            # listPublishers, getPublisher
│   ├── bookAuthors.ts           # getBooksByAuthor, getAuthorsByBook
│   └── index.ts                 # barrel export
├── mutations/
│   ├── authors.ts               # createAuthor, updateAuthor, deleteAuthor
│   ├── books.ts                 # createBook, updateBook, deleteBook
│   ├── follows.ts               # followUser, unfollowUser
│   ├── groups.ts                # createGroup, updateGroup
│   └── index.ts                 # barrel export
└── actions/
    └── verify-supabase-jwt.ts   # JWT verification action
hooks/
└── useConvexAuth.ts             # Thin wrapper around Convex auth state
contexts/
└── ConvexAuthProvider.tsx       # Provider wrapping ConvexProviderWithAuth
lib/
└── convex-client.ts            # Server-side Convex client factory
```

### Modified Files (existing code updated)
```
app/layout.tsx                           # Add ConvexProvider wrapper
app/*/page.tsx                           # Replace supabaseAdmin calls with useQuery/fetchQuery
app/api/*/*.ts                           # Proxy through httpAction
app/actions/*.ts                         # Replace with Convex mutations
lib/supabase-server.ts                   # Mark as deprecated (keep for fallback)
components/client-layout.tsx             # Update if needed
```

---

## Pre-requisites Checklist

Before starting each phase, confirm:
- [ ] `npx convex dev` is running without errors
- [ ] Schema has been pushed: `npx convex deploy --arg deployment=dev`
- [ ] Environment variables set: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`

---

## Task List by Phase

### Phase 0: Infrastructure Wiring

#### Task 0.1: Create Convex Browser Client

**Files:**
- Create: `convex/client.ts`

```typescript
'use client'
import { ConvexReactClient } from 'convex/react'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL environment variable')
}

export const convex = new ConvexReactClient(convexUrl)
```

- [ ] Step 1: Create the file above
- [ ] Step 2: Verify no TypeScript errors in isolation
- [ ] Step 3: Commit

#### Task 0.2: Create ConvexAuth Context Wrapper

**Files:**
- Create: `contexts/ConvexAuthProvider.tsx`

This wraps `ConvexProviderWithAuth` from `convex/react`. It provides:
- `isLoading`: whether auth state is being resolved
- `isAuthenticated`: whether user has a valid Supabase session
- `user`: the Supabase user object passed through
- `fetchAccessToken`: function to get Convex access token for authenticated requests

- [ ] Step 1: Read `convex/_generated/ai/guidelines.md` lines 40-60 for auth guidelines
- [ ] Step 2: Create the provider component following the pattern in the skill docs
- [ ] Step 3: Export `{ useConvexAuth }` hook from same file
- [ ] Step 4: Run `tsc --noEmit` to check types
- [ ] Step 5: Commit

#### Task 0.3: Wire ConvexProvider into Root Layout

**Files:**
- Modify: `app/layout.tsx`

Add `<ConvexAuthProvider>` around existing providers. Keep all existing providers intact.

- [ ] Step 1: Import `ConvexAuthProvider` from `@/contexts/ConvexAuthProvider`
- [ ] Step 2: Insert `<ConvexAuthProvider>` between `<ThemeProvider>` and `<UserProvider>`
- [ ] Step 3: Run `npm run build` — verify zero errors
- [ ] Step 4: Commit

#### Task 0.4: Create JWT Verification Action

**Files:**
- Create: `convex/actions/verify-supabase-jwt.ts`

This internal action receives a Supabase JWT and verifies it against Supabase's public key. On success, returns the decoded user ID. Used by auth flow to establish Convex identity.

- [ ] Step 1: Read Supabase docs on JWT verification (public key at `https://<project>.supabase.co/auth/v1/keys`)
- [ ] Step 2: Implement `internalAction` that validates JWT signature using `jsonwebtoken` or native WebCrypto
- [ ] Step 3: Return `{ userId: string, email: string }` on success
- [ ] Step 4: Test with a sample token
- [ ] Step 5: Commit

#### Task 0.5: Create useConvexAuth Hook

**Files:**
- Create: `hooks/useConvexAuth.ts`

Thin wrapper that:
1. Calls existing `useAuth()` from `@/hooks/useAuth`
2. If authenticated, exchanges Supabase JWT for Convex session via `verifySupabaseJwt` action
3. Returns merged state compatible with existing consumers

- [ ] Step 1: Import existing `useAuth` hook
- [ ] Step 2: Add Convex token exchange logic
- [ ] Step 3: Ensure backward compatibility with current return shape `{ user, loading }`
- [ ] Step 4: Run type check
- [ ] Step 5: Commit

---

### Phase 1: Core Read Paths

#### Task 1.1: Create Authors Query Functions

**Files:**
- Create: `convex/queries/authors.ts`

Queries to implement:
```typescript
export const listAuthors = query({
  args: { search?: v.string(), limit?: v.number() },
  handler(ctx, ctx.runQuery(api.authors.listAuthors, {}))
})

export const getAuthor = query({
  args: { id: v.id('authors') },
  handler(ctx, id) => ctx.db.get(id)
})
```

Also add a paginated version for admin tables:
```typescript
export const listAuthorsPaginated = query({
  args: { paginationOpts: paginationOptsValidator, search?: v.string() },
  handler(ctx, opts, search?) => ctx.db.query('authors').paginate(opts)
})
```

- [ ] Step 1: Create file with imports from `./_generated/server` and `./_generated/api`
- [ ] Step 2: Implement `getAuthor` (simple lookup)
- [ ] Step 3: Implement `listAuthors` (filtered list)
- [ ] Step 4: Implement `listAuthorsPaginated` (for admin)
- [ ] Step 5: Run `npx convex dev --once` to validate schema
- [ ] Step 6: Commit

#### Task 1.2: Create Books Query Functions

**Files:**
- Create: `convex/queries/books.ts`

Queries to implement:
```typescript
export const getBook = query({
  args: { id: v.id('books') },
  handler(ctx, id) => ctx.db.get(id)
})

export const listBooks = query({
  args: { publisherId?: v.string(), isbn13?: v.string() },
  handler(ctx, { publisherId, isbn13 }) {
    let q = ctx.db.query('books')
    if (publisherId) q = q.withIndex('by_publisher', (q) => q.eq('publisherId', publisherId))
    if (isbn13) q = q.withIndex('by_isbn13', (q) => q.eq('isbn13', isbn13))
    return q.collect()
  }
})
```

- [ ] Step 1: Create file with proper imports
- [ ] Step 2: Implement `getBook`
- [ ] Step 3: Implement `listBooks`
- [ ] Step 4: Deploy and test
- [ ] Step 5: Commit

#### Task 1.3: Create Publishers Query Functions

**Files:**
- Create: `convex/queries/publishers.ts`

```typescript
export const listPublishers = query({
  args: {},
  handler(ctx) {
    return ctx.db.query('publishers').order('name').collect()
  }
})

export const getPublisher = query({
  args: { id: v.id('publishers') },
  handler(ctx, id) => ctx.db.get(id)
})
```

- [ ] Step 1: Create and implement
- [ ] Step 2: Deploy
- [ ] Step 3: Commit

#### Task 1.4: Create BookAuthors Query Functions

**Files:**
- Create: `convex/queries/bookAuthors.ts`

```typescript
export const getBooksByAuthor = query({
  args: { authorId: v.string() },
  handler(ctx, { authorId }) {
    return ctx.db
      .query('book_authors')
      .withIndex('by_author', (q) => q.eq('authorId', authorId))
      .collect()
  }
})

export const getAuthorsByBook = query({
  args: { bookId: v.string() },
  handler(ctx, { bookId }) {
    return ctx.db
      .query('book_authors')
      .withIndex('by_book', (q) => q.eq('bookId', bookId))
      .collect()
  }
})
```

- [ ] Step 1: Create and implement
- [ ] Step 2: Deploy
- [ ] Step 3: Commit

#### Task 1.5: Replace Author Page Data Fetching

**Files:**
- Modify: `app/authors/[id]/page.tsx`

Replace the current `getAuthor()` and `getAuthorBooks()` functions to call Convex queries instead of Supabase.

Current pattern:
```typescript
const { data: author } = await supabaseAdmin.from('authors').select('*').eq('id', id).single()
```

New pattern (server component):
```typescript
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

const author = await fetchQuery(ctx, api.authors.getAuthor, { id })
const bookRefs = await fetchQuery(ctx, api.bookAuthors.getBooksByAuthor, { authorId: id })
```

- [ ] Step 1: Import `fetchQuery` from `convex/nextjs`
- [ ] Step 2: Replace `getAuthor()` to use `fetchQuery(api.authors.getAuthor, { id })`
- [ ] Step 3: Replace `getAuthorBooks()` to use `fetchQuery(api.bookAuthors.getBooksByAuthor, { authorId: id })`
- [ ] Step 4: Run `npm run build` to verify
- [ ] Step 5: Commit

#### Task 1.6: Replace Admin Authors Route Handler

**Files:**
- Modify: `app/api/admin/authors/route.ts`

Convert from direct Supabase call to Convex proxy:

```typescript
import { httpAction, HttpActions } from '@/convex/_generated/server'
import { api } from '@/convex/_generated/api'

export async function GET(request: NextRequest) {
  // ... extract params ...
  const result = await httpAction(async (ctx) => {
    return await ctx.runQuery(api.authors.listAuthors, { search, limit })
  })
  return NextResponse.json(result)
}
```

- [ ] Step 1: Replace import from `@/lib/supabase/server` to Convex imports
- [ ] Step 2: Wrap query in `httpAction`
- [ ] Step 3: Test with curl or browser
- [ ] Step 4: Commit

#### Task 1.7: Repeat Pattern for Remaining Core Pages

Apply Tasks 1.5-1.6 patterns to these pages/routes:
- `app/authors/[id]/edit/page.tsx`
- `app/books/[id]/page.tsx`
- `app/books/[id]/edit/page.tsx`
- `app/publishers/[id]/page.tsx`
- `app/publishers/[id]/edit/page.tsx`
- `app/api/admin/books/[id]/route.ts`
- `app/api/admin/books/route.ts`
- `app/api/admin/publishers/route.ts`

**Priority order:**
1. Pages that render on homepage/navigation (highest traffic)
2. Edit/create pages (write-heavy)
3. Admin analytics pages (lower priority)

- [ ] Step 1: Pick next page/route from list
- [ ] Step 2: Identify all Supabase calls in file
- [ ] Step 3: Replace with Convex query/mutation calls
- [ ] Step 4: Test build passes
- [ ] Step 5: Commit each file separately
- [ ] Step 6: Repeat until all core read paths migrated

---

### Phase 2: Write Paths

#### Task 2.1: Create Author Mutations

**Files:**
- Create: `convex/mutations/authors.ts`

```typescript
export const createAuthor = mutation({
  args: { name: v.string(), bio?: v.string() },
  handler(ctx, args) {
    return ctx.db.insert('authors', {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
})

export const updateAuthor = mutation({
  args: { id: v.id('authors'), ...updateFields },
  handler(ctx, args) {
    const { id, ...updates } = args
    return ctx.db.patch(id, { ...updates, updatedAt: Date.now() })
  }
})

export const deleteAuthor = mutation({
  args: { id: v.id('authors') },
  handler(ctx, args) {
    return ctx.db.delete(args.id)
  }
})
```

- [ ] Step 1: Create file with all three mutations
- [ ] Step 2: Deploy and test with `npx convex run`
- [ ] Step 3: Commit

#### Task 2.2: Create Book Mutations

**Files:**
- Create: `convex/mutations/books.ts`

Implement create/update/delete for books with all relevant fields.

- [ ] Step 1: Review existing server actions in `app/actions/add-book.ts` for field list
- [ ] Step 2: Create matching mutations
- [ ] Step 3: Deploy and test
- [ ] Step 4: Commit

#### Task 2.3: Convert Server Actions to Convex Mutations

**Files:**
- Modify: Each file in `app/actions/*.ts`

Pattern:
```typescript
// BEFORE
import { supabaseAdmin } from '@/lib/supabase/server'
export async function myServerAction(formData) {
  const { data } = await supabaseAdmin.from('table').insert(...)
}

// AFTER
'use server'
import { mutate } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export async function myServerAction(formData) {
  await mutate(api.books.createBook, { /* fields */ })
}
```

- [ ] Step 1: Start with high-priority actions: add-book, edit-book
- [ ] Step 2: Replace supabaseAdmin calls with Convex mutate()
- [ ] Step 3: Test the action flows work end-to-end
- [ ] Step 4: Commit each batch
- [ ] Step 5: Continue through remaining action files

#### Task 2.4: Convert API Routes to HTTP Proxies

**Files:**
- Modify: All files in `app/api/**/*.ts`

Every API route becomes a thin wrapper around a Convex `httpAction`:

```typescript
// app/api/admin/books/route.ts
import { httpAction } from '@/convex/_generated/server'
import { api } from '@/convex/_generated/api'

export async function POST(request: Request) {
  return httpAction(async (ctx) => {
    const body = await request.json()
    const result = await ctx.runMutation(api.books.createBook, body)
    return Response.json(result)
  })
}
```

- [ ] Step 1: Start with admin API routes (higher priority for data integrity)
- [ ] Step 2: For each route, identify the Convex mutation to call
- [ ] Step 3: Wrap in httpAction, preserve response format
- [ ] Step 4: Test each route with Postman or curl
- [ ] Step 5: Commit batches of related routes together

---

### Phase 3: Social Features

#### Task 3.1: Create Follow/Mute Mutations

**Files:**
- Create: `convex/mutations/follows.ts`

```typescript
export const followUser = mutation({
  args: { targetUserId: v.string() },
  handler(ctx, args) {
    const identity = ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')
    return ctx.db.insert('follows', {
      followerId: identity.tokenIdentifier,
      followingId: args.targetUserId,
      createdAt: Date.now(),
    })
  }
})

export const unfollowUser = mutation({
  args: { targetUserId: v.string() },
  handler(ctx, args) {
    const identity = ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')
    const follows = ctx.db
      .query('follows')
      .withIndex('by_follower_following', (q) =>
        q.eq('followerId', identity.tokenIdentifier).eq('followingId', args.targetUserId)
      )
      .first()
    if (follows) return ctx.db.delete(follows._id)
  }
})
```

- [ ] Step 1: Implement with auth checks
- [ ] Step 2: Deploy
- [ ] Step 3: Commit

#### Task 3.2: Create Group Mutations

**Files:**
- Create: `convex/mutations/groups.ts`

Create/update/delete groups with ownership checks.

- [ ] Step 1: Review existing group server actions for field list
- [ ] Step 2: Create matching mutations
- [ ] Step 3: Deploy
- [ ] Step 4: Commit

#### Task 3.3: Convert Social API Routes

Convert the social feature API routes to use Convex mutations via httpAction proxies.

Target files:
- `app/api/follow/route.ts`
- `app/api/friends/route.ts`
- `app/api/friends/pending/route.ts`
- `app/api/groups/[id]/route.ts`
- `app/api/groups/route.ts`

- [ ] Step 1: Start with follow/unfollow endpoints
- [ ] Step 2: Migrate friend request endpoints
- [ ] Step 3: Migrate group management endpoints
- [ ] Step 4: Test each flow
- [ ] Step 5: Commit

---

### Phase 4: Realtime Improvements

#### Task 4.1: Replace Notification Polling with Subscriptions

**Files:**
- Modify: `components/real-time-notifications.tsx`

Current implementation uses `setInterval(checkForNewNotifications, 10000)`. Replace with Convex subscription:

```typescript
const notifications = useQuery(api.notifications.listMyNotifications, { limit: 20 })
useEffect(() => {
  // Show toast for new notifications
}, [notifications])
```

- [ ] Step 1: Create `api.notifications.listMyNotifications` query in Convex
- [ ] Step 2: Update component to use `useQuery` instead of setInterval
- [ ] Step 3: Remove polling interval
- [ ] Step 4: Test real-time updates work
- [ ] Step 5: Commit

#### Task 4.2: Add Realtime to Other Polling Components

Find and replace other interval-based polling patterns with Convex subscriptions:
- Unread message counts
- Group member counts
- Reading challenge progress

Search for `setInterval` in components to find targets.

- [ ] Step 1: Audit all `setInterval` usages in components/
- [ ] Step 2: Prioritize user-facing realtime features
- [ ] Step 3: Implement Convex subscriptions for each
- [ ] Step 4: Commit

---

### Phase 5: Cleanup

#### Task 5.1: Remove Unused Supabase Imports

Scan for remaining Supabase data client imports and remove or convert them.

```bash
grep -r "from.*lib/supabase" app/ --include="*.ts" --include="*.tsx"
```

For each match:
- If still used by another feature, keep
- If only used for data access, replace with Convex equivalent or remove import

- [ ] Step 1: Run grep to find remaining imports
- [ ] Step 2: Categorize by usage
- [ ] Step 3: Remove unused imports
- [ ] Step 4: Update `lib/supabase-server.ts` JSDoc to mark deprecated
- [ ] Step 5: Commit

#### Task 5.2: Update Documentation

Update project documentation to reference Convex as primary backend:
- README.md
- docs/README_START_HERE.md
- AGENTS.md

- [ ] Step 1: Update architecture diagram to show Convex
- [ ] Step 2: Document env vars needed for Convex
- [ ] Step 3: Update deployment guide
- [ ] Step 4: Commit

#### Task 5.3: Optional — Remove Supabase Packages

After full verification, consider removing:
- `@supabase/supabase-js`
- `@supabase/ssr`
- `@supabase/auth-helpers-nextjs`

Only do this after confirming no production traffic depends on Supabase connections.

- [ ] Step 1: Monitor error logs for 1 week post-migration
- [ ] Step 2: If clean, remove packages
- [ ] Step 3: Run `npm install` and `npm run build` to verify
- [ ] Step 4: Commit

---

## Testing Strategy

### Unit Tests
Each Convex function file should have a corresponding test:
```
convex/queries/__tests__/authors.test.ts
convex/mutations/__tests__/books.test.ts
```

Use `convex-test` for testing Convex functions in isolation.

### Integration Tests
Run existing Playwright E2E tests after each phase:
```bash
npm run test:e2e
```

### Manual Verification Checklist
After completing each phase:
- [ ] Homepage loads correctly
- [ ] Author detail page shows correct data
- [ ] Book detail page shows correct data
- [ ] Admin tables load and paginate
- [ ] Create/edit forms submit successfully
- [ ] Follow/unfollow works
- [ ] Notifications update in real-time
- [ ] No console errors in browser DevTools

---

## Environment Variables

Ensure these are set in Vercel/production:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://incredible-dotterel-39.authorsinfo.convex.cloud
CONVEX_DEPLOYMENT=incredible-dotterel-39.authorsinfo

# Supabase (keep for auth)
NEXT_PUBLIC_SUPABASE_URL=https://adccinsmmmocxeylisbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---

## Rollback Plan

If issues arise:
1. Revert git commits phase-by-phase
2. Convex data remains untouched (read-only from app perspective until cutover)
3. Supabase connection strings remain valid throughout
4. Feature flags can toggle between backends if needed

---

## Success Metrics

Phase complete when:
- [ ] `npm run build` passes with 0 errors
- [ ] `npm run lint` passes (or warnings are pre-existing)
- [ ] All targeted pages load correctly in browser
- [ ] E2E tests pass
- [ ] No Supabase data clients called in migrated files

Migration complete when:
- [ ] Zero Supabase data calls remain in production code
- [ ] All 254 tables accessible via Convex queries
- [ ] Auth flows work end-to-end
- [ ] Realtime features functioning
- [ ] Performance metrics unchanged or improved
