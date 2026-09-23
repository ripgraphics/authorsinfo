# Blocking Parity Plan

**Owner-approved direction:** 2026-09-21  
**Status:** Phase 1 in progress  
**Source of truth:** This document tracks blocking and unblock parity. Messaging-specific work remains in `docs/MESSAGING_SYSTEM_MASTER_PLAN.md`.

## 1. Product Contract

Blocking follows the approved normal user-facing model:

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
| `[x]` Centralize reciprocal blocked-pair authorization check | `COMPLETED` | `lib/messaging/blocking.ts` checks both block directions; live Supabase RLS now protects direct conversations, messages, and read state; blocks have unique pair and no-self constraints | Extend to remaining interaction surfaces |
| `[x]` Hide blocked profiles from direct navigation and discovery | `COMPLETED` | `/profile/[id]` returns neutral `notFound()` before profile data assembly; friend lists, suggestions, user follows, friend requests, mention search, bulk hover data, user tag previews, source-user notifications, authenticated feeds, and user timelines enforce both block directions; focused suites pass; isolated Bob/Wendy feed/timeline acceptance passed | Audit group/public-content rules |
| `[x]` Hide blocked direct conversations and history | `COMPLETED` | Reciprocal block helper filters direct inbox rows and rejects conversation creation/history/send with `403` blocked responses; focused suite passes 11/11 | Extend the same boundary to remaining direct actions |
| `[>]` Preserve shared-group/public visibility rules | `IN PROGRESS` | Live Supabase RLS gates event participants/private-group members; group invitation service/helper and RLS reject reciprocal-blocked known users; focused invitation suite passes 17/17; 2026-09-23 browser check kept shared group members at `200` while blocked direct history/read-state returned `403` | Complete isolated two-account shared-group acceptance |
| `[x]` Complete browser acceptance with isolated accounts | `COMPLETED` | Isolated Bob/Wendy contexts verified block `200`, blocked-list visibility, reciprocal history `403 blocked_user`, neutral blocked profile shell without profile content, unblock `200`, and restored conversation eligibility | Extend acceptance to shared-group/public-content rules |

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
| 2026-09-21 | Created plan and recorded the approved contract | Repository baseline review |
| 2026-09-21 | Confirmed direct-message RLS denies Bob-to-Wendy while a block row exists | Live isolated Supabase probe returned `42501` |
| 2026-09-21 | Wired profile Block User action with confirmation and feedback | Diagnostics clean; focused tests pass 6/6 |
| 2026-09-22 | Added blocked-user Settings list and reciprocal direct-message enforcement | Diagnostics clean; focused blocking/messaging suite passes 11/11 |
| 2026-09-22 | Production build passed after explicit block-table row typing | Next.js build completed TypeScript, page-data collection, static generation, and finalization |
| 2026-09-22 | Added reciprocal profile and friend-list blocking gates | Diagnostics clean; focused blocking/discovery suite passes 15/15 |
| 2026-09-22 | Added reciprocal friend-suggestion filtering and stale-accept protection | Diagnostics clean; focused blocking/discovery suite passes 12/12 |
| 2026-09-22 | Validated discovery slice after handler-scope correction | Focused tests pass 12/12; production build compiles successfully |
| 2026-09-22 | Added reciprocal block guards to user follows, friend requests, and pending requests | Diagnostics clean; focused interaction suite passes 15/15 |
| 2026-09-22 | Added reciprocal block filtering to user mention search | Diagnostics clean; focused blocking/messaging suite passes 15/15 |
| 2026-09-22 | Added reciprocal block filtering to bulk hover data and user tag previews | Diagnostics clean; focused blocking/messaging suite passes 15/15 |
| 2026-09-22 | Completed isolated Bob/Wendy blocking acceptance | Block/list `200`; both history requests `403 blocked_user`; blocked profile rendered neutral shell; unblock and conversation restore `200` |
| 2026-09-22 | Added reciprocal block filtering to source-user notifications | Diagnostics clean; focused notification/blocking suite passes 15/15 |
| 2026-09-22 | Added reciprocal block filtering to authenticated feeds and user timelines | Diagnostics clean; focused feed/notification suite passes 15/15 |
| 2026-09-22 | Completed isolated Bob/Wendy feed and timeline acceptance | Bob feed omitted Wendy; Wendy feed omitted Bob; Bob timeline for Wendy returned zero activities; unblock returned `200` |
| 2026-09-22 | Applied live Supabase RLS migration for event participants and private group members | Live policy verification shows `event_participants_select_privacy` and `group_members_select_privacy`; migration completed successfully |
| 2026-09-22 | Applied live Supabase blocking RLS migration | Live verification shows unique `blocks_user_blocked_user_unique`, `blocks_cannot_self_block`, reciprocal `is_blocked_between` policies on direct conversations/messages/read state; focused suite passes 24/24 |
| 2026-09-22 | Applied live reciprocal block guard to group invitations | Service action blocks UUID/email-known users in either direction; live `group_invitations_recipient_insert` policy verified; focused invitation/blocking suite passes 14/14 |
| 2026-09-22 | Extracted and tested reciprocal group invitation block guard | `lib/messaging/group-invitation-blocking.ts`; unblocked, blocked, and lookup-failure cases covered; focused suite passes 17/17 |
| 2026-09-22 | Completed isolated shared-group member acceptance | Bob and Wendy were seeded in the public `Messenger Parity Test Group`; both member-list requests returned `200` with shared members; direct messaging remained blocked during the block check |
| 2026-09-23 | Revalidated shared-group blocking boundary against final source | Disposable Bob session read the live group member route with `200`; block mutation returned `200`; the same session continued to read shared members with `200`; canonical direct history and read-state both returned `403 Conversation access denied`; focused parity suites passed 15/15 and production build passed |
