# Facebook Groups Parity Plan

**Status:** Future work, not yet started  
**Dependency:** Blocking parity and the unified messaging contract must remain stable.

## 1. Product Contract

Groups should behave like Facebook Groups while preserving Authors Info's reading-community domain:

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
| `[>]` Inventory existing group pages/APIs/tables/policies | `IN PROGRESS` | Enterprise group schema and many routes exist | Produce live route/schema/policy inventory |
| `[ ]` Approve privacy and discovery matrix | `NOT STARTED` | Current routes have mixed visibility assumptions | Define public/private/hidden behavior |
| `[ ]` Complete join/request/invitation lifecycle | `NOT STARTED` | Join and invitation slices exist | Add browser acceptance for every transition |
| `[ ]` Complete role and moderation model | `NOT STARTED` | Roles and member actions exist | Add permission matrix and audit evidence |
| `[ ]` Complete feed/content parity | `NOT STARTED` | Posts, discussions, polls, and resources exist | Unify privacy, reactions, reports, media, and pagination |
| `[ ]` Complete group notifications | `NOT STARTED` | Notification infrastructure exists | Add group-specific preferences and safe previews |
| `[ ]` Complete group chat boundary | `NOT STARTED` | Messenger group channels exist | Verify member access, history policy, realtime, and block behavior |
| `[ ]` Complete responsive/accessibility acceptance | `NOT STARTED` | Individual surfaces have partial coverage | Run desktop/mobile/keyboard/screen-reader matrix |
| `[ ]` Release with two-account and moderator acceptance | `NOT STARTED` | Focused Jest coverage exists | Add persistent browser suite and evidence ledger |

## 3. Release Gates

- Live schema and RLS policies are verified before changes.
- Every group mutation has role-aware authorization and audit behavior.
- Private groups do not leak names, membership, posts, or previews to unauthorized users.
- Blocked users cannot directly interact, while shared-group visibility follows the approved group privacy contract.
- Member, moderator, and administrator workflows pass in isolated browser contexts.
