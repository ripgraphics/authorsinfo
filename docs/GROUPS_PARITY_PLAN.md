# Groups Parity Plan

**Status:** Future work, not yet started  
**Dependency:** Blocking parity and the unified messaging contract must remain stable.

## 1. Product Contract

Groups should provide familiar community behavior while preserving Authors Info's reading-community domain:

- Public, private, and hidden group privacy with explicit join/visibility rules.
- Group discovery, search, recommendations, invitations, join requests, approval, decline, leave, and rejoin behavior.
- Durable roles and permissions: member, moderator, administrator, creator, and suspended/removed states.
- Group feed with posts, comments, reactions, media, polls, announcements, pinned content, reporting, moderation queue, and edit/delete rules.
- Member directory with privacy-aware profiles, mutual context, search, role badges, moderation actions, and block enforcement.
- Group notifications with per-group controls, mentions, announcements, join events, moderation actions, and quiet hours.
- Group chat remains a separate Messenger conversation kind when private chat semantics apply; feed discussions remain moderated community content.
- Group events, guides, files, rules, resources, book lists, and reading challenges remain group-owned objects with consistent authorization.

## 2. Phase Tracker

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[>]` Inventory existing group pages/APIs/tables/policies | `IN PROGRESS` | Enterprise group schema and many routes exist; group detail reads and Messenger channel routes are present; legacy members endpoint now redirects to canonical membership-gated Messenger members route | Produce live route/schema/policy inventory |
| `[>]` Approve privacy and discovery matrix | `IN PROGRESS` | Live RLS now permits private-group member reads only to active members and self; public groups remain readable | Complete public/private/hidden browser matrix |
| `[>]` Complete join/request/invitation lifecycle | `IN PROGRESS` | Invitation creation rejects reciprocal-blocked known invitees in both the service action/helper and live RLS; focused invitation suite passes 17/17; existing accept/decline/cancel lifecycle remains | Add browser acceptance for every transition |
| `[ ]` Complete role and moderation model | `NOT STARTED` | Roles and member actions exist | Add permission matrix and audit evidence |
| `[ ]` Complete feed/content parity | `NOT STARTED` | Posts, discussions, polls, and resources exist | Unify privacy, reactions, reports, media, and pagination |
| `[ ]` Complete group notifications | `NOT STARTED` | Notification infrastructure exists | Add group-specific preferences and safe previews |
| `[>]` Complete group chat boundary | `IN PROGRESS` | Messenger group channels and member reads enforce active membership; legacy member API redirects canonically; per-user mute/archive settings are authorized; channel settings expose the immutable `retained_moderated` history policy; focused settings/chat coverage passes 20/20; live parity users can read the shared group member list; a browser block check preserved shared member visibility (`200`) while direct history/read-state returned `403` | Verify isolated two-account lifecycle, member removal, history policy, realtime, and block behavior |
| `[ ]` Complete responsive/accessibility acceptance | `NOT STARTED` | Individual surfaces have partial coverage | Run desktop/mobile/keyboard/screen-reader matrix |
| `[ ]` Release with two-account and moderator acceptance | `NOT STARTED` | Focused Jest coverage exists | Add persistent browser suite and evidence ledger |

## 3. Release Gates

- Live schema and RLS policies are verified before changes.
- Every group mutation has role-aware authorization and audit behavior.
- Private groups do not leak names, membership, posts, or previews to unauthorized users.
- Blocked users cannot directly interact, while shared-group visibility follows the approved group privacy contract.
- Member, moderator, and administrator workflows pass in isolated browser contexts.

## 4. Blocking Boundary Acceptance

The blocking system must not globally remove shared-group content. The approved behavior requires:

- A blocked user cannot direct-message, follow, invite, tag, or call the other user through a group.
- Both users may remain members of a shared group until the group owner/moderator removes or suspends one of them.
- Public group content remains governed by group visibility and post privacy.
- Private-group content remains visible only to authorized members; blocking alone does not grant or revoke membership.
- Group member lists and mentions must hide or neutralize the blocked user where the approved group privacy matrix requires it.

**Current evidence:** direct messaging, user follows, friend requests, mentions, notifications, feeds, and timelines enforce reciprocal blocks. The canonical group member and group-chat routes require active membership, so suspended or removed members cannot read the member list or chat history; focused route coverage passes 20/20. Group membership/content acceptance remains future work and is intentionally not marked complete.

**Two-account evidence:** Bob Brown and Wendy Wilson were seeded as active members of `Messenger Parity Test Group` (`5b26a768-1e80-4dd1-b2c3-9c2f4b947a11`). Isolated browser contexts for both users returned `200` from the canonical Messenger member route and included both users in the shared member list.

**2026-09-23 final-source browser evidence:** Disposable parity users Bob (`890b03c3-68bc-4796-b5b7-5aab24a49c97`) and Wendy (`bf585414-0816-44a0-8152-80e58d778382`) were active members of the same public group. An authenticated Bob browser session returned `200` from `/api/messages/group/5b26a768-1e80-4dd1-b2c3-9c2f4b947a11/members` and included both users. After Bob blocked Wendy, the group member route remained `200`, while `/api/messages/direct/366cc0a6-b0fd-410b-8a67-f2636b477fdf` and its `/read-state` route returned `403` with `Conversation access denied`. The fresh disposable-thread unblock restoration run became unstable during repeated auth traffic and is not counted as passing evidence.

**2026-09-23 local continuation:** `group-chat.test.ts` and `group-members-compatibility.test.ts` passed 20/20. A fresh browser acceptance could not authenticate because `/login` reported `Database Users (0)` in the current environment; no new browser pass is claimed until test accounts are available.
