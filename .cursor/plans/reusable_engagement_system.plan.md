---
name: ""
overview: ""
todos: []
isProject: false
---

# Reusable, Enterprise-Grade Engagement and Like System

## Overview

Make the like and engagement system fully reusable with no hardcoding: introduce a single source of truth for entity types, engagement types (Like, Comment, Share, Bookmark, etc.), and like-reaction subtypes; abstract count storage per entity type; and align documentation and UI so "Like" is clearly one part of the broader reaction/engagement system.

---

## Mandatory: Testing and Verification (No Assumptions, Facts Only)

Per AGENTS.md Post-Edit Verification and user requirement: **all code must be fully tested; report only actual test results—no assumptions.**

### Verification commands (must be run and output reported)

1. **Build**: `npm run build`
  - Must complete with exit code 0. Report any TypeScript or build errors.
2. **Lint**: `npm run lint` (or project equivalent, e.g. `next lint`)
  - Must pass. Report any ESLint errors or warnings.
3. **Unit tests**: `npm run test`
  - Run full Jest suite. Report: total tests, passed, failed, skipped. If any test fails, report the test name and failure message. Do not state "tests pass" without running the command and capturing output.
4. **E2E tests**: `npm run test:e2e`
  - Run Playwright E2E. Report: passed/failed, and any failing spec names and errors. If E2E is skipped (e.g. no engagement specs), state that explicitly.

### Test coverage for this feature

- **Add unit tests** for the new engagement config module (`lib/engagement/config.ts`):  
  - `isValidEntityType()` for valid/invalid values.  
  - `isValidLikeReactionType()` for all 7 valid types and invalid strings.  
  - `getLikeCountSource()` returns expected shape for `activity` and null (or expected) for other entity types.
- **Add or extend tests** for the reaction API if feasible (e.g. validation rejects invalid `reaction_type` when called with config-driven validation).
- **E2E**: Add or run an E2E scenario that exercises the like/reaction flow on a timeline (e.g. open feed, click like, verify count or state). If none exists, implement at least one critical path and run it; report actual pass/fail.

### Completion summary requirement

- **Do not** state that code "works" or "is verified" without having run the above commands.
- **Do** report: "Build: [pass/fail and any errors]. Lint: [pass/fail]. Unit tests: [N passed, M failed] with [list of failures if any]. E2E: [pass/fail] with [failures if any]."
- If any command fails, fix or document the failure before marking the task complete.

---

## 1. Terminology (canonical)

- **Engagement system**: The full set of user actions on content: **Like** (with emoji subtypes), **Comment**, **Share**, **Bookmark**, **View**, **Follow**.
- **Like**: One engagement type. Implemented via the `likes` table; each row has a **like reaction subtype** (e.g. like, love, care, haha, wow, sad, angry). "Like" is not the same as the overall reaction system—it is one reaction type among others (Share, Bookmark, Comment are other reaction/engagement types).
- **Like reaction subtypes**: The seven emoji types stored in `likes.like_type`. Used only for the Like engagement flow (reaction popup, quick-like).

---

## 2. Current hardcoding to remove


| Location                                                              | Current hardcoding                                                           | Change                                          |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `app/api/engagement/reaction/route.ts`                                | `validReactionTypes` array; `entity_type === 'activity'`; `posts.like_count` | Use shared config; count-source abstraction     |
| `contexts/engagement-context.tsx`                                     | `EntityType` union; `ReactionType` union                                     | Import from shared engagement config            |
| `components/enterprise/enterprise-reaction-popup.tsx`                 | `REACTION_OPTIONS` array (7 types)                                           | Build from config; optional overrides via props |
| `components/entity-feed-card.tsx`                                     | `getEngagement(post.id, 'activity')`; `entityType="activity"`                | Use `post.entity_type` or prop                  |
| `app/api/timeline/route.ts`, `app/api/authors/[id]/timeline/route.ts` | `.eq('entity_type', 'activity')` in likes lookup                             | Use entity type from request/context            |
| Reaction route                                                        | Updating `posts.like_count` when `entity_type === 'activity'`                | Use config: getLikeCountSource(entityType)      |


---

## 3. Single source of truth: engagement config

**New module**: `lib/engagement/config.ts`

- **Entity types**: Export `ENGAGEMENT_ENTITY_TYPES` and `isValidEntityType(s: string)`.
- **Like reaction subtypes** (the 7): Export `LIKE_REACTION_TYPES` (const array) and `isValidLikeReactionType(s: string)`.
- **Engagement types**: Export `ENGAGEMENT_TYPES` (e.g. like, comment, share, bookmark, view, follow).
- **Count storage**: Export `getLikeCountSource(entityType: string): { table: string; column: string } | null`. For `activity` return `{ table: 'posts', column: 'like_count' }`; others `null` or extend later.
- Types (`EntityType`, `ReactionType`) derived from these constants.

---

## 4. API and context

- **Reaction route**: Use `isValidLikeReactionType` and `getLikeCountSource`; validate with config; update denormalized count only when getLikeCountSource is non-null.
- **Engagement context**: Import types and constants from config; no duplicated literals.
- **Timeline/API routes**: Use request/context `entity_type` in likes lookup, not literal `'activity'`.

---

## 5. Components (reusable)

- **EntityFeedCard**: Use `post.entity_type` (or prop) for getEngagement and EnterpriseEngagementActions.
- **EnterpriseEngagementActions**: Already receives entityType; no inference or override; optional config overrides for future reuse.
- **EnterpriseReactionPopup**: Build options from config; optional prop to override/extend.

---

## 6. Documentation

- Single canonical doc (extend or rename LIKE_AND_REACTION_SYSTEM.md): engagement system, Like as one type, like reaction subtypes, Comment/Share/Bookmark as other types, config module reference. Legacy/superseded section.

---

## 7. Implementation order

1. Add `lib/engagement/config.ts` and **unit tests** for it.
2. Update reaction API to use config; add/run any API tests.
3. Update engagement context from config.
4. Update entity-feed-card and timeline/API routes (entity_type from data/request).
5. Update EnterpriseReactionPopup from config.
6. Consolidate documentation.
7. UI/UX Pro pass; run **build, lint, unit tests, E2E** and report **actual output** (facts only).

---

## 8. Definition of done

- Config module exists and is tested (unit tests added and passing).
- No literal `'activity'` or reaction-type arrays in API/context; single source in config.
- Build passes, lint passes, unit tests run and results reported, E2E run and results reported (or E2E skip documented).
- Completion summary states only facts from actual test output; no assumptions.

