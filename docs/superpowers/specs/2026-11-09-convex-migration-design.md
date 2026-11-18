# Design: Migrate App Data Layer from Supabase to Convex

**Date:** 2026-11-09  
**Status:** Draft — awaiting approval  
**Scope:** Full-stack migration; data already migrated (254 tables, 16,332 rows)

---

## Background

Convex is configured with the complete Supabase dataset already imported.  
254 tables exist in `convex/schema.ts` (using permissive `v.any()` validators) and hold all 16,332 rows.  
790+ Supabase imports remain in 452 files across `app/`, `lib/`, and test files.  
The app currently serves exclusively through Supabase REST + SSR cookies.

---

## Goals

1. Replace the Supabase data layer with Convex so every page, route handler, and server action reads/writes from Convex.
2. Keep Supabase Auth (user sessions, cookies) to avoid rebuilding authentication; Convex operates under Supabase identity.
3. Add real-time reactivity where it matters (notifications, unread counts, live updates) — Convex's built-in subscription model replaces manual polling.
4. Zero breaking changes to the user-visible UI or API surface.
5. Leave Supabase as a cold backup; do not delete anything until the Convex migration is fully verified.

---

## Non-goals

- Full Convex Auth migration (kept for phase 2, if ever).
- Removing Supabase packages entirely (left for post-migration cleanup).
- Migrating Redis-backed caching (separate effort).
- Replacing the existing file-upload path unless Cloudinary integration needs overhaul.

---

## Architecture Decision: How queries work after migration

Supabase pattern (current):

```typescript
const { data } = await supabaseAdmin.from('authors').select('*').eq('id', authorId)
```

Convex equivalent — one query function per table + common filter shape:

```typescript
// convex/authors.ts
export const listAuthors = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  handler(ctx) {
    return ctx.db.query('authors')
      .order('name')
      .paginate({ pageSize: opts.limit ?? 100 })
  }
})
```

Client-side call:

```typescript
const authors = useQuery(api.authors.listAuthors, { search })
```

Key differences from Supabase:
- No chained `.select(...).eq(...)`: each query is a named function.
- Pagination uses native Convex `.paginate()`.
- String-table-name calls (`supabaseAdmin.from('books')`) are replaced by generated-function calls.

---

## Phased Migration Plan

### Phase 0 — Infra wiring (lowest risk, immediate win)

**What:**  
Wrap the root layout with `ConvexProvider` / `ConvexAuthProvider`. Install the Convex client and generate a thin `useUser()` hook backed by Supabase session tokens sent to Convex as opaque identity.

**Files changed:**
- `app/layout.tsx` — add `<ConvexProvider client={client}>`
- New `convex/client.ts` — creates the browser-side Convex instance
- New `hooks/useConvexUser.ts` — thin wrapper around Supabase `useUser()` + Convex auth token passthrough

**Decision:** Use `useAuth()` from `@/hooks/useAuth` (already exists). On login, exchange the Supabase JWT for a Convex token via an internal `mutation` that verifies the Supabase session. This keeps auth entirely on Supabase while Convex trusts the session.

**Estimated scope:** ~5–8 new files, <100 lines changed in existing files.

---

### Phase 1 — Core read paths (authors, books, publishers)

**Priority:** These power the top pages and the admin tables.

**Convex functions created:**
| Table | Functions |
|---|---|
| `authors` | `listAuthors(search?, limit?)`, `getAuthor(id)` |
| `books` | `listBooks(filters?)`, `getBook(id)` |
| `publishers` | `listPublishers()`, `getPublisher(id)` |
| `bookAuthors` | `getBooksByAuthor(authorId)`, `getAuthorsByBook(bookId)` |

**Migration pattern per page:**
1. Create the Convex function.
2. Replace `supabaseAdmin.from(X)` call in the server component/server action with `fetchQuery(api.X.funcName, args)`.
3. For client components that fetch their own data, switch to `useQuery(api.X.funcName, args)`.

**Estimated scope:** ~10–12 new `convex/*.ts` files; 30–40 existing files updated.

---

### Phase 2 — Write paths (server actions + API routes)

Every mutation endpoint in `app/actions/` and `app/api/*/route.ts` is converted to either:
- A `mutation` in Convex (for server actions), or
- An HTTP endpoint in `convex/http.ts` (for external-facing APIs that must keep their `/api/*` paths for existing clients).

**Strategy:** Keep external API routes at the same paths but proxy them through `httpAction`. Existing URLs don't change. Internally, the route handler calls the Convex mutation instead of hitting Supabase directly.

**Example transformation — `app/api/admin/authors/route.ts`:**

```typescript
// BEFORE
import { supabaseAdmin } from '@/lib/supabase/server'
const { data } = await supabaseAdmin.from('authors')...

// AFTER
import { api } from '@/convex/_generated/api'
import { httpAction, HttpActions } from '@/convex/_generated/server'

// Inside httpAction handler:
const result = await ctx.runQuery(api.authors.listAuthors, { search, limit })
return NextResponse.json(result)
```

---

### Phase 3 — Social features (follows, friends, groups, chat)

This is the most complex area. Convex is strong here natively (presence, presence events, subscriptions).

**Convex functions needed:**
- `follows/listByUser`, `follows/follow`, `follows/unfollow`
- `friends/pending`, `friends/respond`
- `groups/getById`, `groups/create`, `groups/update`
- Messaging: Convex has built-in support via its messaging component (`@convex-dev/chat`) or custom implementation using realtime channels.

**Design note:** Chat messages, reactions, read receipts should ideally be migrated to Convex's native real-time store rather than being polled. This is higher value but also highest complexity. Flagged as Phase 3b.

---

### Phase 4 — Realtime improvements

Replace interval-based polling (`setInterval(checkForNewNotifications, 10000)`) with Convex subscriptions (`useSubscription` / `useQuery` with auto-revalidation).

The current `RealTimeNotifications` component polls every 10 seconds. After this phase it will reactively update when new notifications appear in Convex.

Other targets: unread badge counters, live group member counts, reading challenge progress bars.

---

### Phase 5 — Cleanup

- Remove Supabase client init code no longer used.
- Delete `lib/supabase-server.ts` adapter functions once all callers are migrated.
- Update docs, README, `.agent` skill files to reference Convex instead of Supabase.
- Optional: remove `@supabase/supabase-js` and `@supabase/ssr` from `package.json`.

---

## Authentication Strategy (detailed)

Keep Supabase as the identity provider. On every request, extract the Supabase JWT cookie and pass it as the `Authorization` header to Convex `httpAction` handlers. Inside Convex, verify the JWT against Supabase's public key (available at the Supabase project URL).

Convex `ctx.auth.getUserIdentity()` will contain the decoded Supabase user object. Use `tokenIdentifier` (the Supabase user ID) as the canonical user key in all tables.

This avoids having to implement session management twice and lets us reuse the existing `useAuth()` hook unchanged.

---

## File Uploads

The app currently uses both Supabase Storage and Cloudinary. Cloudinary is the primary cover-image path (see code comment "ONLY from Cloudinary").  

**Decision:** Retain Cloudinary for image upload/storage. Convert the few remaining Supabase Storage writes to Cloudinary SDK calls. Convex supports file storage natively (`v.id('_storage')`), but since Cloudinary is already integrated, there's no urgency to adopt Convex storage yet.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Convex function timeout on large queries | Add pagination to all list endpoints; never return >200 records unpaginated |
| Schema mismatch between Convex `v.any()` and typed server expectations | Build typed wrapper functions in `convex/queries.ts`; keep tables permissive |
| Concurrent mutations race (e.g., follow/unfollow) | Use Convex transactions; nested mutations roll back on error |
| Supabase RLS policies no longer apply | All writes go through Convex functions, which enforce access control server-side |
| Dev vs prod URL drift | Pin `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` in Vercel env vars from day one |

---

## Success Criteria

- [ ] All 452 files that import Supabase data clients are updated or removed
- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] All existing page routes render identically (visual parity check via Playwright E2E)
- [ ] Notifications reflect within <1 second of creation (no more 10s polling)
- [ ] Admin CRUD operations succeed through Convex mutations
- [ ] Supabase remains readable as backup (no destructive drops)

---

## Implementation Order Recommendation

1. **Phase 0** (infra) — do first, enable testing
2. **Phase 1** (read core) — authors, books, publishers, bookAuthors
3. **Phase 2** (writes) — admin actions and API routes
4. **Phase 3** (social) — follows, friends, groups
5. **Phase 4** (realtime) — replace polling with subscriptions
6. **Phase 5** (cleanup) — remove dead Supabase code

After Phase 2 the app is functionally served by Convex. Phases 3–5 are polish and decommissioning.
