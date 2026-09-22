# Facebook Blocking Parity Plan

**Owner-approved direction:** 2026-09-21  
**Status:** Phase 1 in progress  
**Source of truth:** This document tracks blocking and unblock parity. Messaging-specific work remains in `docs/MESSAGING_SYSTEM_MASTER_PLAN.md`.

## 1. Product Contract

Blocking follows Facebook's normal user-facing model:

- A block is reciprocal in effect even though storage contains one authenticated user's block row.
- Blocked users cannot discover or open one another's profiles through search, suggestions, friend lists, direct links, or user pickers.
- Blocked users cannot send friend requests, follow, tag, invite, call, or start/reopen one-to-one messaging.
- Existing one-to-one conversations and history are hidden from both participants while the block exists. Records remain stored for audit, abuse handling, and retention policy.
- Direct-message history, send, read-state, reactions, attachments, pins, calls, settings, and search fail closed with a sanitized blocked response.
- Shared public posts and mutual-group content remain governed by their own privacy and membership rules. Blocking does not remove a user from a shared group automatically.
- Unblocking restores discovery and eligibility for a new direct conversation. It does not automatically restore the old hidden one-to-one thread.
- Users can review and remove their own block relationships from Settings.

## 2. Phase Tracker

**Legend:** `[x]` complete, `[>]` in progress, `[ ]` not started.

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[x]` Wire profile Block User action to authenticated API | `COMPLETED` | `components/user-action-buttons.tsx` now confirms, calls `POST /api/users/block`, reports errors, and refreshes the profile; focused block/profile tests pass 6/6 | Add browser acceptance |
| `[x]` Add blocked-users Settings list and Unblock controls | `COMPLETED` | `/api/users/block/list` and the Privacy settings panel expose authenticated blocked users and DELETE-based unblock controls | Add browser acceptance |
| `[x]` Centralize reciprocal blocked-pair authorization check | `COMPLETED` | `lib/messaging/blocking.ts` checks both block directions; inbox, conversation creation, history, and send routes enforce it; focused suite passes 11/11 | Extend to discovery/profile routes |
| `[ ]` Hide blocked profiles from direct navigation and discovery | `NOT STARTED` | Profile pages use admin reads without a block boundary | Add profile gate and discovery filters |
| `[x]` Hide blocked direct conversations and history | `COMPLETED` | Reciprocal block helper filters direct inbox rows and rejects conversation creation/history/send with `403` blocked responses; focused suite passes 11/11 | Extend the same boundary to remaining direct actions |
| `[ ]` Preserve shared-group/public visibility rules | `NOT STARTED` | Group visibility is not yet covered by block acceptance tests | Add policy matrix and two-account tests |
| `[ ]` Complete browser acceptance with isolated accounts | `NOT STARTED` | Bob/Wendy isolated messaging is proven only after unblock | Add block, hidden profile, hidden thread, unblock, and new-thread tests |

## 3. Acceptance Matrix

| Scenario | Expected result |
| --- | --- |
| Bob blocks Wendy | Bob sees confirmation; Wendy is removed from Bob's direct discovery and inbox |
| Wendy visits Bob profile | Neutral unavailable/not-found state; no profile actions or private content |
| Bob visits Wendy profile | Same neutral unavailable state |
| Existing Bob/Wendy thread is opened | Thread is unavailable; history is not returned |
| Bob sends while blocked | HTTP `403` with a stable blocked error code; no message row is created |
| Bob and Wendy share a group | Group visibility follows group membership/privacy; direct interaction remains blocked |
| Bob unblocks Wendy | Blocked list removes Wendy; discovery can return after refresh |
| New conversation after unblock | New direct conversation may be created; old hidden thread is not silently restored |

## 4. Release Gates

- No block mutation relies on a client-supplied actor ID.
- Every private route derives the actor from the authenticated session.
- Blocked state is distinguishable from transient server failure.
- No profile, avatar, preview, notification, or search result leaks blocked private data.
- Jest route/component tests pass and two isolated browser contexts verify both sides.

## 5. Change Log

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-09-21 | Created plan and recorded Facebook-style contract | Repository baseline review |
| 2026-09-21 | Confirmed direct-message RLS denies Bob-to-Wendy while a block row exists | Live isolated Supabase probe returned `42501` |
| 2026-09-21 | Wired profile Block User action with confirmation and feedback | Diagnostics clean; focused tests pass 6/6 |
| 2026-09-22 | Added blocked-user Settings list and reciprocal direct-message enforcement | Diagnostics clean; focused blocking/messaging suite passes 11/11 |
| 2026-09-22 | Production build passed after explicit block-table row typing | Next.js build completed TypeScript, page-data collection, static generation, and finalization |
