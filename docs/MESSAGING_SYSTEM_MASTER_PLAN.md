# Unified Messaging System Master Plan

**Owner-approved architecture:** 2026-09-17  
**Status:** Phase 3 in progress; Phases 0-2 partially complete; Phases 4-7 not started  
**Source of truth:** This document is the only active messaging implementation plan.

## 1. Product Contract

Authors Info will provide one Facebook/Messenger-style messaging product:

- `/messages` is the unified Messenger inbox.
- `/messages/direct/[id]` opens a direct conversation in the same Messenger shell.
- Messenger group conversations use the same rail, message list, composer, unread state, read state, realtime lifecycle, and message actions as direct conversations.
- Community/group discussion pages remain separate only when they represent feed-style discussions, announcements, event channels, or moderated entity channels rather than private Messenger conversations.
- No second legacy inbox, duplicate composer, duplicate message list, or competing unread system may remain user-facing.

This is a functional parity target. Completion requires executable evidence for each accepted workflow; visual similarity alone is not completion.

## 1A. Facebook Messenger Desktop Parity Contract

Facebook desktop web Messenger is the primary interaction reference. The global launcher, profile Message actions, full-page Messenger route, minimized conversation bubbles, and group Messenger entry points are presentation variants of one workspace and must preserve the following behavior:

| Surface | Required behavior |
| --- | --- |
| Global chat launcher | Opens the Messenger inbox/recent-conversations view. It must not choose or reopen an arbitrary conversation. |
| Minimized conversation bubble | Reopens the specific minimized conversation, including its unread badge. |
| Profile/entity Message button | Resolves the authorized target, creates or reuses the direct conversation, and opens that specific thread. Entity IDs must never be sent as user IDs. |
| Inbox conversation row | Selects that conversation and opens its thread without creating a duplicate conversation. |
| Full-page Messenger route | Shows the inbox rail, selected thread, details/actions surface, unread state, read state, realtime updates, and responsive mobile list/thread navigation. |
| Thread header/menu | Provides participant identity, presence/connection state, calls where supported, details, and conversation actions. |
| Message actions | Supports the accepted action contract: reactions, copy, edit/delete where authorized, report, reply, forward, pin, mentions, and delete-for-self once its per-user storage contract exists. |
| Conversation actions | Supports mark unread, mute, archive, block, restrict, report, and request workflows with authenticated persistence and explicit permission states. |
| Composer | Supports drafts, typing, send failure/retry, attachments/media adapters, and approved GIF/sticker/emoji capabilities. |
| Realtime/history | Reconciles persisted history after reconnect, paginates with cursors, deduplicates events, preserves optimistic state safely, and exposes recoverable failures. |
| Mobile | Shows the inbox list first, switches to a selected thread, and returns with Back; controls remain keyboard and screen-reader accessible. |

**Launcher invariant:** `Open chat` means “open Messenger inbox”; only an explicit conversation selection, profile Message action, direct deep link, or minimized conversation bubble may open a specific thread.

## 2. Non-Negotiable Design Rules

- One canonical conversation domain and one canonical Messenger workspace.
- Direct, Messenger group, event, and managed-entity conversations have explicit typed conversation kinds.
- Containers own authentication, fetching, mutations, realtime, and error recovery.
- Presentational components receive typed props and callbacks. They do not hardcode routes, identities, conversation IDs, or API calls.
- Realtime is an update signal, not the durable source of truth. Reconnect reconciles persisted history and cursors.
- Server handlers derive actor identity from authentication. Client-supplied sender IDs and role claims are rejected.
- Private conversation data is never copied into logs, analytics, notifications, or generic browser persistence as plaintext.
- Database and file removal happens only after consumer, live-schema, data, policy, and deployment verification.

## 3. Current Baseline

### Existing canonical or reusable pieces

- `components/floating-chat.tsx`: current stateful direct Messenger surface and full-page composition.
- `components/conversation-rail.tsx`: conversation selection, search, filters, previews, timestamps, and unread badges.
- `components/conversation-header.tsx`: themed participant header and call/minimize/close controls.
- `components/direct-message-list.tsx`: shared direct-message rendering, timestamps, read receipts, and typing display.
- `components/chat-composer.tsx`: shared growing composer and per-conversation drafts.
- `components/participant-details-panel.tsx`: desktop details column.
- `app/api/messages/direct/**`: authenticated direct conversation, history, send, read state, reactions, attachments, search, reporting, and message actions.
- `app/messages/direct/[id]/page.tsx`: full-page Messenger route.
- `app/api/groups/[id]/chat/**`: authenticated moderated group-channel APIs and read/reaction state.

### Legacy or competing surface still present

- `app/messages/page.tsx` now renders only the canonical full-page Messenger workspace; legacy mixed inbox sections were removed.
- Group discussion UI and Messenger conversation UI are not yet represented by one typed conversation contract.
- `FloatingChat` still contains container logic and presentation composition in one file; extraction is planned after the inbox route is unified.
- Direct conversation previews are returned by one bounded authoritative server-side batch query; client-side per-conversation preview enrichment requests were removed.

### Known verification baseline

- The production build passed after the unified inbox route change and conversation-preview changes on 2026-09-17.
- Editor diagnostics are clean for `floating-chat.tsx` and `conversation-rail.tsx`.
- Targeted ESLint invocation is currently blocked by the repository's `eslint-config-next/core-web-vitals` module-resolution error; this is tracked separately from source diagnostics.
- Real two-account direct-message acceptance testing remains required.

## 4. Target Architecture

### Conversation domain

Every Messenger item must resolve to a typed record:

```text
conversation
  id
  kind: direct | messenger_group | event | managed_entity
  title/avatar/participants
  latest_message_preview/latest_message_at
  unread/read cursor
  membership and permission state
  privacy mode: private_e2ee | moderated
```

Direct conversations retain their current participant-pair identity. Messenger group conversations must have durable membership, roles, invitations, leave/remove behavior, title/avatar metadata, and history policy. Event and managed-entity channels remain moderated unless a separate approved privacy design says otherwise.

### Canonical UI

The shared Messenger workspace owns:

- Conversation rail and search/filter state
- Selected conversation and mobile list/thread navigation
- Header, participant/group details, and conversation actions
- Message history, pagination, date separators, reactions, replies, editing, deletion, and receipts
- Composer, drafts, attachments, typing, send retry, and offline/reconnect states
- Unread aggregation and notification synchronization

The launcher and full-page route are presentation variants of the same workspace, not separate implementations.

## 5. Route Migration

| Route | Target behavior | Status |
| --- | --- | --- |
| `[x]` `/messages` | Unified Messenger inbox with no legacy group/direct split | COMPLETED for route migration; parity work in progress |
| `[>]` `/messages/direct/[id]` | Same Messenger shell with selected direct conversation | IN PROGRESS |
| `[x]` `/messages/direct` | Compatibility entry point into unified Messenger inbox | COMPLETED |
| `[>]` `/messages/group/[id]` | Same Messenger shell with selected Messenger group conversation | IN PROGRESS: canonical redirect and group-to-channel resolution implemented; authorized live session acceptance remains |
| `[>]` Group discussion routes | Separate community/entity discussion product where applicable | IN PROGRESS: classification pending |
| `[>]` Global chat launcher | Opens the Messenger inbox in compact presentation; minimized bubbles reopen their specific thread | IN PROGRESS: Maya authenticated inbox live-verified with Recent chats, Friends, Archived, and two private conversations; selecting an empty private conversation rendered the thread and Mark unread/Block/Mute/Archive actions without retry error; parity actions remain |

Backward-compatible links may remain temporarily, but they must resolve into the canonical workspace and must not render a second message system.

## 6. Phase Tracker

**Checkbox legend:** `[x]` completed, `[>]` in progress, `[ ]` not started. The checkbox at the start of every item is the quick visual status marker; the `Status` column contains the same state in words.

### Phase 0: Documentation and Baseline — PARTIALLY COMPLETE

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[x]` Approve unified Messenger architecture and migration order | `COMPLETED` | Owner approval recorded 2026-09-17 | None |
| `[x]` Create this master plan as the active source of truth | `COMPLETED` | This document is the only active messaging plan | Keep updating every item here |
| `[x]` Remove superseded messaging documents from the active docs tree | `COMPLETED` | Five overlapping docs removed; history remains in Git | None |
| `[>]` Inventory messaging routes, components, APIs, migrations, tables, policies, triggers, realtime, and storage | `IN PROGRESS` | Partial route/API/component inventory completed | Finish live schema and storage inventory |
| `[>]` Establish build, lint, Jest, and focused browser baselines | `IN PROGRESS` | Production build passes; current focused parity suite passes 54/54; `npm run lint` now completes with 0 errors and 33,401 existing warnings after adapting the legacy Next config through FlatCompat | Reduce warning baseline separately; keep focused checks green |
| `[x]` Record live-schema and migration-history risks | `COMPLETED` | Risks recorded in Sections 8-9 and change log | Update when new evidence appears |

**Exit evidence:** one plan, one status ledger, complete consumer inventory, and a verified deletion register.

### Phase 1: Canonical Inbox and Route Unification — PARTIALLY COMPLETE

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[x]` Replace old `/messages` page with canonical full-page Messenger workspace | `COMPLETED` | Browser route renders unified rail/workspace | None |
| `[>]` Preserve direct-conversation deep links and selected-conversation behavior | `IN PROGRESS` | `/messages/direct/[id]` exists; `/messages/direct` redirects to `/messages` | Complete live deep-link and selection verification |
| `[x]` Add no-selection Messenger inbox state | `COMPLETED` | Empty state renders inside Messenger shell | None |
| `[x]` Remove old mixed inbox sections | `COMPLETED` | Legacy group/direct cards and friend section removed | None |
| `[x]` Ensure launcher, `/messages`, and direct route use one workspace contract | `COMPLETED` | `/messages` now bypasses `PageContainer`, fills `calc(100vh - 4rem)` below the header, and suppresses both global/header launchers; live DOM reports zero `Open chat` buttons on `/messages` | Verify across authenticated browser contexts |
| `[x]` Add focused route/component verification | `COMPLETED` | Browser smoke check; expanded focused messaging suite passes 44/44 | Add persistent two-account E2E coverage |

**Exit evidence:** `/messages` has one Messenger rail and one workspace; no legacy inbox sections or duplicate direct-message entry points remain. Browser verification passed; expanded focused messaging suite passes 44/44. Live two-account verification remains open.

### Phase 2: Unified Conversation Domain — PARTIALLY COMPLETE

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[x]` Define typed direct and Messenger-group conversation adapters | `COMPLETED` | `lib/messaging/conversation-types.ts`; focused tests pass | None |
| `[x]` Return direct latest previews through one bounded query | `COMPLETED` | Direct API batch preview query; no client N+1 fetch | None |
| `[x]` Add normalized group metadata to group inbox response | `COMPLETED` | Group API returns kind/title/preview/timestamp | None |
| `[x]` Define normalized message adapters and migrate renderer | `COMPLETED` | `lib/messaging/message-types.ts` and shared list migration | None |
| `[x]` Connect group history, send, read state, and realtime | `COMPLETED` | Existing authorized group APIs wired into workspace | Live two-account verification |
| `[x]` Show group titles and unread counts in rail/header | `COMPLETED` | Shared rail/header integration | None |
| `[x]` Add authenticated group-member retrieval and presentation | `COMPLETED` | Scoped members route and details panel | None |
| `[x]` Add leave/remove boundary and self-leave UI | `COMPLETED` | DELETE member route and details action | Add live member transition test |
| `[x]` Replace invitation placeholder with permission-aware creation | `COMPLETED` | POST invitations route and friend invite controls | None |
| `[x]` Implement invitation accept/decline/cancel lifecycle | `COMPLETED` | PATCH/DELETE lifecycle route; tests pass | None |
| `[x]` Add pending invitations and inbox accept/decline controls | `COMPLETED` | Pending route and `MessengerInvitationList` | Add browser acceptance test |
| `[>]` Complete group conversation creation, roles, avatars, and history policy | `IN PROGRESS` | Transport and membership slices exist; per-member mute/archive settings and authorized role assignment are live; the canonical group inbox now carries channel description, group cover-image avatar URL, explicit `moderated` privacy mode, and the live-verified `retained_moderated` history policy; new groups now receive a canonical non-event `General` channel through a live-verified trigger; live acceptance remains incomplete | Add explicit history policy controls and complete live group acceptance |
| `[>]` Keep moderated community channels separate by conversation kind/privacy | `IN PROGRESS` | Kind field exists; full event/entity classification incomplete | Finish route and schema classification |
| `[>]` Add authorization tests for every kind and membership transition | `IN PROGRESS` | `__tests__/group-chat.test.ts` now passes 18/18 with active, nonmember, suspended, event-channel, forged-sender, malformed, cross-origin, and DB-error cases; full direct/group transition matrix remains incomplete | Add direct/group membership mutation and realtime authorization cases |

### Cross-Entity Messaging Coverage — IN PROGRESS

Messaging targets are entities plus an authorized human recipient or managed inbox. An entity must never be treated as a fake user account. Each row below tracks page-level discovery, authorization, routing, and acceptance separately.

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[x]` Define fail-closed entity target contract | `COMPLETED` | `lib/messaging/entity-targets.ts`; focused tests pass 3/3 | None |
| `[x]` Centralize user MessageButton navigation on canonical Messenger routes | `COMPLETED` | `lib/messaging/routes.ts`; route/entity tests pass 7/7; MessageButton no longer hardcodes route | None |
| `[x]` Author pages: prevent unsafe entity-ID messaging | `COMPLETED` | Shared header hides author Message actions without an explicit recipient; schema has no author owner/representative field | None until ownership model is approved |
| `[ ]` Author pages: resolve authorized owner/representative and expose Message action | `NOT STARTED` | No owner/representative/managed-inbox field exists in the generated author schema | Approve and implement author representation/delegation model |
| `[x]` Publisher pages: prevent unsafe entity-ID messaging | `COMPLETED` | Shared header hides publisher Message actions without an explicit recipient; schema has no publisher owner/representative field | None until ownership model is approved |
| `[ ]` Publisher pages: resolve authorized owner/representative and expose Message action | `NOT STARTED` | No owner/representative/managed-inbox field exists in the generated publisher schema | Approve and implement publisher representation/delegation model |
| `[x]` Book pages: prevent unsafe entity-ID messaging | `COMPLETED` | Shared header hides book Message actions without an explicit recipient; books reference author/publisher records, not users | None until ownership model is approved |
| `[ ]` Book pages: route messages to book owner/representative or managed inbox | `NOT STARTED` | No book owner/representative/managed-inbox field exists in the generated book schema | Define owner/managed-inbox source and permission policy |
| `[x]` Event pages: resolve event creator and platform admins as message targets | `COMPLETED` | Authenticated `/api/messages/entity/event/[id]/targets` returns deduplicated owner/admin targets and denies unrelated users for private/draft events; tests pass 4/4; build passes | None |
| `[>]` Event pages: route messages to event creator/admin | `IN PROGRESS` | Event page passes `event.created_by`; privacy-aware owner/admin endpoint exists; browser acceptance remains | Add event browser acceptance |
| `[x]` Group pages: unify member/group conversation entry with Messenger group route | `COMPLETED` for routing/UI retirement; authorization acceptance remains | Kate King live-clicked Join Group; membership persisted active with UUID role `61ca8f25-9887-475d-afae-3efb9fbb8151`; live group has one non-event `General` channel UUID `2e73b922-0486-4e9f-9a0e-79e80da57a3b`; route resolver maps group IDs to that channel; group tests pass 22/22; Join Group toast persistence is implemented; subsequent active-member login/deep-link acceptance is blocked by auth timeouts/401s and Realtime WebSocket closures | Repeat authorized deep-link acceptance after Supabase auth/realtime stability is restored |
| `[ ]` Managed entity inboxes with delegated operators | `NOT STARTED` | No approved multi-operator inbox contract | Define delegation, visibility, audit, and recipient policy |
| `[>]` Entity message authorization and privacy matrix | `IN PROGRESS` | Event target route and resolver now cover owner/non-owner/platform-admin/private/public/malformed cases and managed-inbox precedence/fail-closed edges; focused suites pass 16/16 | Add live two-account browser acceptance once Supabase auth stability returns |
| `[>]` Entity page browser acceptance | `IN PROGRESS` | Maya clean-session Bob Brown acceptance POSTed `/api/messages/direct` with `201`, navigated to `/messages/direct/e21c81ed-6dec-492b-92ed-501bb064f73f`, and loaded the active Messenger conversation; Olivia self-profile renders no profile Message button; author/publisher/book/event evidence remains | Test remaining entity pages and authorized/unauthorized cases |

### Phase 3: Core Messenger Interaction Parity — IN PROGRESS

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[>]` Message requests, archive, mute, mark unread, block, restrict, report | `IN PROGRESS` | Additive `direct_message_requests` and owner-scoped `direct_message_restrictions` migrations applied live through the approved PG runner; live generated schema confirms both tables and foreign keys; direct conversation creation classifies non-friend targets as pending requests while accepted friendships remain normal conversations; request API/inbox rail and Restrict API/header/details actions are implemented; focused deployed-safety tests pass 14/14 | Run live two-account request/Restrict acceptance; preserve Restrict as separate from blocks |
| `[>]` Replies, mentions, delete-for-self, pin, forward, copy | `IN PROGRESS` | Live authorized thread verified Pin POST `201`, Reply quoted composer context, Forward picker with nine recipients, and Delete-for-me POST `204` with the selected message removed; @ mentions persist UUID metadata and dispatch notifications; focused mention/action tests pass 16/16; current valid Sam session shows Connection lost and stale unauthorized deep links correctly return history `403`, blocking mention-send acceptance | Complete live Mention send acceptance after reconnecting a participant-authorized thread |
| `[x]` Shared edit/delete/reaction callbacks and direct API wiring | `COMPLETED` | Renderer action test passes; direct APIs wired | Add live browser verification |
| `[x]` Group reaction wiring | `COMPLETED` | Group reaction route wired; unsupported edit/delete hidden | Add persisted group reaction E2E test |
| `[>]` Robust pagination, retry/cancel, reconnect, duplicate-event protection | `IN PROGRESS` | Direct history retains cursors, retries real failures, aborts stale requests, deduplicates realtime messages, surfaces channel loss with reconnect, and stale/unauthorized links now show an explicit unavailable state with Back to inbox; focused message tests pass 12/12 | Verify reconnect against a live channel; add broader network-failure acceptance coverage |
| `[x]` Mobile rail/thread navigation and accessibility states | `COMPLETED` | Mobile rail visibility is now state-controlled; thread Back control returns to the rail; focused regression test passes 1/1 and diagnostics are clean | Continue with broader keyboard/screen-reader audit as interaction parity expands |

### Phase 4: Rich Media and Calls — IN PROGRESS

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[>]` Private attachments and media previews | `IN PROGRESS` | Direct composer supports authenticated multi-file upload; attachment metadata is hydrated into message history; authorized download route serves private files; shared renderer now shows protected image, video, and audio previews with download links; focused media/render checks pass 24/24; encrypted lifecycle remains open | Complete encrypted/access-controlled media decision and live preview acceptance |
| `[x]` GIF/sticker/emoji adapters | `COMPLETED` | Shared composer exposes prop-driven emoji, GIF, and sticker controls; canonical Messenger uses GIPHY search for GIFs/stickers and uploads selected media through the authenticated private attachment route; focused composer/direct media checks pass 16/16 | None for adapter transport; inline previews and encrypted media remain tracked separately |
| `[>]` Voice notes and approved audio/video calls | `IN PROGRESS` | Shared composer exposes browser-native MediaRecorder voice-note capture; canonical Messenger sends recorded audio through the authenticated private attachment route; provider-free direct WebRTC hook uses Supabase Realtime for SDP/ICE signaling, browser media capture, call lifecycle sessions, and capability-gated audio/video controls; call session GET/PATCH now enforce participant authorization; focused call/config/composer checks pass 13/13 and build passes | Add live two-account call acceptance; add optional TURN fallback for restrictive NAT/mobile networks |
| `[>]` Encrypted/access-controlled private media boundary | `IN PROGRESS` | Direct attachments use private storage, participant-scoped RLS, and an authorized download route; focused media/render checks pass 24/24. Client-side encryption/key management and provider decision remain gated | Complete encryption/provider decision and live private-media acceptance |

### Phase 5: Notifications, Presence, Safety, and Privacy — NOT STARTED

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[>]` In-app/push notifications and safe previews | `IN PROGRESS` | Direct and group-message notifications use generic private-message/group previews; group fan-out excludes the sender and failures cannot fail message delivery; the dispatcher honors live mute/expiry, per-type, channel, and quiet-hour fields; push subscriptions now write only live columns; live `notification_push_outbox` plus claim/complete RPCs provide durable sanitized jobs and retry state; the worker now delivers claimed jobs through a configurable provider adapter and records success/retry completion; focused worker, notification, report, and realtime tests pass 9/9 | Configure a production provider and complete live notification acceptance |
| `[>]` Presence, typing expiration, privacy, account-switch cleanup | `IN PROGRESS` | Typing indicator expires stale users and clears timers; realtime store now clears account-scoped presence/activity state and unsubscribes channels on disconnect/account reinitialization; isolation test passes 1/1 | Add live presence privacy/visibility policy and two-account acceptance |
| `[>]` Request/block/report/rate-limit workflows | `IN PROGRESS` | Direct request/restriction/report and user block contracts exist; group-message reporting now has a live `group_chat_reports` table with member-scoped RLS and authenticated `/api/messages/group/[id]/reports`; direct conversation creation, direct sends, and group sends now use authenticated per-user rate-limit keys with fail-open provider absence; focused group-report tests pass 3/3 | Add durable abuse counters/rate-limit acceptance and complete live blocked/reported acceptance |
| `[ ]` Approved E2EE provider evaluation and enablement | `NOT STARTED` | Matrix remains gated and disabled | Complete security/provider decision and acceptance gates |

### Phase 6: Cleanup and Removal — IN PROGRESS

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[x]` Remove superseded messaging plan documents | `COMPLETED` | Five old active docs removed | None |
| `[x]` Remove superseded UI files after consumer/browser verification | `COMPLETED` for legacy group chat page | `/groups/[id]/chat/page.tsx` is now a compatibility redirect; underlying APIs retained for canonical workspace | Continue inventory of other legacy handlers |
| `[>]` Remove unreachable handlers and mock/local state | `IN PROGRESS` | Some legacy group routes/actions remain | Trace consumers before removal |
| `[ ]` Remove duplicate component implementations | `NOT STARTED` | FloatingChat still owns too much container/presentation logic | Extract shared workspace boundary |
| `[ ]` Migrate/archive legacy data before dropping tables/columns | `NOT STARTED` | No destructive data migration approved | Verify live rows/policies/backups |
| `[ ]` Apply reviewed database cleanup migrations | `NOT STARTED` | Cleanup gates not satisfied | Complete live catalog and rollback evidence |

### Phase 7: Release Acceptance — NOT STARTED

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[ ]` Two authenticated accounts exchange direct messages without reload | `NOT STARTED` | Login production code is restored to the repository baseline (`createBrowserClient` + `signInWithPassword`); baseline login tests pass 3/3. Clean browser Sam Smith list-login reaches the home route, but the Supabase auth cookie is rejected by server API requests with 401 and `signInWithPassword` can remain in `Signing in...`; no two-account messaging claim is made. This is an existing Supabase browser-lock/server-session failure, not a Messenger parity change | Resolve Supabase auth lock/cookie/session infrastructure, then repeat browser login and two-context test |
| `[>]` Direct and group conversations share inbox/workspace | `IN PROGRESS` | Unified transport is implemented; live proof incomplete | Verify with real direct/group accounts |
| `[ ]` Read/unread, typing, presence, drafts, reactions, actions, media, reconnect | `NOT STARTED` | Focused unit tests only; no complete two-context proof | Build end-to-end acceptance matrix |
| `[>]` Unauthorized/blocked/removed/suspended/event/forged cases fail closed | `IN PROGRESS` | Request and Restrict route tests cover forged/nonparticipant access; live RLS migrations are applied and schema-verified; full blocked/removed/suspended/event matrix and authenticated browser acceptance remain incomplete | Add and run the remaining authorization matrix |
| `[>]` Desktop/mobile/keyboard/screen-reader/reduced-motion/failure states | `IN PROGRESS` | Basic mobile path exists; request rail actions now expose role-aware controls, `aria-busy`/live status, and synchronous duplicate-action protection; focused request-list coverage passes; full desktop/mobile/keyboard/screen-reader/reduced-motion audit remains open | Run the broader UX/accessibility verification |
| `[ ]` No legacy entry point, duplicate subscription, plaintext leak, or critical issue | `NOT STARTED` | Cleanup and security review incomplete | Finish cleanup/security gates |

## 7. Cleanup and Removal Register

No item is deleted solely because it appears unused. Each item needs a completed consumer search, live verification, replacement, migration/backup decision, and focused regression check.

| Candidate | Replacement | Current action | Safe removal gate |
| --- | --- | --- | --- |
| `[x]` `app/messages/page.tsx` legacy mixed inbox | Canonical Messenger workspace | Replace in Phase 1 | `/messages` browser and route tests pass |
| `[x]` Legacy group inbox cards and friend-message section | Messenger rail/new-conversation flow | Remove with Phase 1 route replacement | No user-facing legacy sections remain |
| `[>]` Duplicate message list/composer implementations | Shared `DirectMessageList` and `ChatComposer` contracts | Consumer inventory confirms one production `DirectMessageList` caller inside `FloatingChat`; `FloatingChat` is the canonical workspace rendered in `/messages`, `/messages/direct/[id]`, compact top Chats, and bottom launcher presentations | Keep the shared boundary protected by route-contract tests; extract stateful workspace only after live acceptance gates |
| `[>]` Mock/local-only messaging state | Authenticated persisted APIs and realtime | Remove per migrated surface | No production caller or test depends on mock state |
| `[>]` Unreachable group-thread handlers | Canonical group conversation service | Verify route exports and consumers first | HTTP route tests and production route inventory pass |
| `[x]` Historical messaging documents | This master plan | Replace with pointer files/archive | Master plan contains all active requirements |
| `[ ]` Supabase direct-message tables | Approved Matrix/E2EE room migration, only if selected | Retain | Data migration, two-account cutover, backup, rollback, and retention approval |
| `[>]` Legacy group-chat tables | Typed moderated Messenger/community adapter | Retain until classified | Zero consumers/rows or completed migration and policy review |
| `[ ]` Policies/indexes/triggers/realtime publications | Verified replacement contract | Never delete ad hoc | Catalog diff, policy tests, rollback plan, deployment evidence |

## 8. Database and File Deletion Protocol

Before removing a file, route, table, column, policy, index, trigger, publication, storage bucket, or migration:

1. Search source, tests, imports, dynamic routes, scripts, docs, and deployment configuration.
2. Inspect live Supabase metadata, row counts, foreign keys, grants, RLS policies, triggers, indexes, publications, storage policies, and scheduled workers.
3. Identify data ownership, retention, export, backup, and rollback requirements.
4. Add an additive migration or compatibility adapter before removing the old writer.
5. Stop duplicate writes and reconcile data in bounded, idempotent batches.
6. Verify authenticated and unauthorized behavior through ordinary clients.
7. Deploy and observe the replacement before deleting old readers.
8. Archive or back up data, then remove the object in a separate reviewed cleanup migration.
9. Regenerate types and run build, lint, focused tests, full tests, and browser acceptance.
10. Update this register with evidence, commit, deployment, and rollback references.

Destructive commands, database resets, blind `--include-all` migration history repair, and dropping production objects without evidence are prohibited.

## 9. Current Risks and Decisions

- Existing private-message Supabase infrastructure is retained until a real replacement is approved and migrated; it is not safe to delete now.
- Matrix/Synapse remains a gated evaluation, not an enabled production private-message backend.
- Existing group/event channel privacy and migration-history issues require live verification before cleanup or broad rollout.
- Exact Facebook parity requires a dated reference inventory and executable acceptance evidence; the project must not claim parity while any required workflow is unimplemented.
- The ESLint module-resolution problem is a repository/tooling issue and must be tracked separately from source diagnostics.

## 10. Change Log

- **2026-09-17:** Owner approved the unified Messenger architecture and migration order. Master plan created. Phase 0/Phase 1 opened.
- **2026-09-17:** `/messages` now renders the canonical full-page Messenger workspace. Superseded messaging documents were removed from the active docs tree. Browser verification passed with no application error, and the production build passed through page generation and optimization. Unified conversation-domain, group Messenger integration, and database cleanup phases remain open.
- **2026-09-17:** Added `lib/messaging/conversation-types.ts` with pure direct and Messenger-group adapters, plus focused tests. The direct workspace now consumes the normalized contract. Diagnostics, focused tests (2/2), and production build passed. Authoritative preview loading and group transport integration remain open.
- **2026-09-17:** Direct conversation listing now returns latest message previews from one bounded server-side batch query. Removed client-side per-conversation preview requests. Direct API and adapter tests pass 6/6, touched-file diagnostics are clean, and the browser renders the Messenger rail with previews, timestamps, filters, and unread state.
- **2026-09-17:** The authorized group inbox response now exposes `kind`, `title`, `latest_message_preview`, and `latest_message_at` alongside its existing fields. Group inbox tests pass 2/2; group transport/UI integration remains open.
- **2026-09-17:** Completed the additive group-conversation metadata integration and fixed its response type. Combined direct, adapter, and group inbox tests pass 8/8; touched-file diagnostics are clean; production build passed through optimization. The next step is shared group message transport and rendering, not a second inbox.
- **2026-09-17:** Added `lib/messaging/message-types.ts` and migrated `DirectMessageList` plus the direct workspace to normalized message fields across history, realtime, unread state, and optimistic sends. Focused messaging tests pass 10/10, browser no-selection Messenger state renders without errors, diagnostics are clean, and production build passed through optimization.
- **2026-09-17:** Connected authorized group conversations to the shared workspace for history loading, authenticated sends, group read-state updates, and `group_chat_messages` realtime inserts. Group titles now render in the shared header and group unread counts in the rail. Focused tests pass 10/10, diagnostics are clean, and production build passed through optimization. Group member management, group-specific participant presentation, and group parity actions remain open.
- **2026-09-17:** Added `/api/messages/group/[id]/members` with active-membership authorization and active member identity shaping. The shared details panel now renders group members for active Messenger-group conversations. Focused tests pass 12/12, diagnostics are clean, and production build passed through optimization. Invitations, roles, add/remove/leave actions, and group-specific moderation remain open.
- **2026-09-17:** Added `DELETE /api/messages/group/[id]/members/[memberId]` with strict IDs, policy delegation, sanitized denial status, and a reusable self-leave control that removes the group conversation from the rail after success. Focused tests pass 15/15, diagnostics are clean, and production build passed through optimization. Invitations, roles, admin removal UI, and group settings remain open.
- **2026-09-17:** Replaced the `501` group invitations placeholder with `POST /api/messages/group/[id]/invitations`, strict input/origin validation, and delegation to the existing `invite_members` policy action. Authorized group users can invite friend candidates from the shared details panel. Focused tests pass 18/18, diagnostics are clean, and production build passed through optimization. Invitation listing/accept/decline/cancel, roles, and admin removal UI remain open.
- **2026-09-17:** Added invitation `PATCH` lifecycle dispatch for accept/decline/cancel and explicit DELETE cancellation. Added reusable message edit/delete/reaction controls and wired direct conversations to existing authenticated mutation APIs. Focused tests pass 24/24, diagnostics are clean, and production build passed through optimization. Replies, mentions, group action parity, and invitation listing UI remain open.
- **2026-09-17:** Added authenticated pending group-invitation retrieval at `/api/messages/group/invitations` and reusable `MessengerInvitationList` controls inside `/messages`. Accept/decline actions use the tested lifecycle route. Expanded focused tests pass 26/26, diagnostics are clean, and production build passed through optimization. Replies, mentions, group action parity, roles, and moderation remain open.
- **2026-09-17:** Shared reaction controls now dispatch to either direct or authorized group reaction APIs. Group edit/delete controls remain intentionally absent because the live group message schema has no edit/delete contract. Focused tests pass 26/26, diagnostics are clean, and production build passed through optimization.
- **2026-09-17:** Added `/messages/direct` compatibility redirect to the unified `/messages` inbox. Expanded focused messaging tests now pass 44/44, including suspended-member and event-channel authorization cases; production build passes with 218 generated routes. Full Jest baseline is not fully green: 35 suites passed, 1 existing login suite failed because Supabase public environment variables were absent during test rendering. Repository lint remains blocked by `eslint-config-next/core-web-vitals` module resolution. Full release acceptance, live two-account verification, remaining parity actions, and cleanup gates remain open.
- **2026-09-17:** Full-codebase entity audit identified that `MessageButton` is user-only and that authors, publishers, books, events, and groups require explicit human-owner or managed-inbox resolution. Added fail-closed `lib/messaging/entity-targets.ts` with focused tests passing 3/3, added the cross-entity coverage tracker, and confirmed the production build passes with 218 generated routes. Author/publisher/book/event page wiring and managed-inbox authorization remain tracked item-by-item as `IN PROGRESS` or `NOT STARTED`.
- **2026-09-17:** Fixed the shared `EntityHeader` user-target bug by adding `messageTargetUserId`; event pages now route their Message action to `event.created_by` instead of the event UUID. Entity target tests pass 3/3, touched-file diagnostics are clean, and production build passes with 218 routes. Explicit event admin routing and author/publisher/book target resolution remain open.
- **2026-09-17:** Audited generated schema contracts for entity ownership. Events/groups expose `created_by`; authors, publishers, and books do not expose owner, representative, or managed-inbox fields. Tracker now separates completed unsafe-ID prevention from not-started recipient wiring, pending an approved delegation model.
- **2026-09-17:** Added canonical `/messages/group/[id]` routing into the unified Messenger workspace through `/messages?group=...`. Conversation and group authorization tests pass 20/20, diagnostics are clean, and production build passes with 218 routes. Legacy group entry-link migration and live deep-link acceptance remain open.
- **2026-09-17:** Retired the legacy `/groups/[id]/chat` user-facing UI by converting it to a redirect into `/messages/group/[id]`. Canonical group routing and legacy compatibility now converge on the unified Messenger workspace; group/conversation tests pass 20/20 and production build passes with 218 routes.
- **2026-09-17:** Added authenticated event target resolution at `/api/messages/entity/event/[id]/targets`, returning the event creator as an owner recipient without treating the event ID as a user. Event/entity target tests pass 5/5, diagnostics are clean, and production build passes with 218 routes. Event admin recipients and browser acceptance remain open.
- **2026-09-17:** Extended event target resolution to include verified platform admins from `user_permissions.is_admin`, deduplicated against the creator. Event target tests pass 3/3, diagnostics are clean, and production build passes with 218 routes. Browser acceptance and blocked/private event cases remain open.
- **2026-09-17:** Added event visibility enforcement: public published events expose owner/admin targets; private or draft events deny unrelated users without leaking targets. Event target tests pass 4/4, diagnostics are clean, and production build passes with 218 routes.
- **2026-09-17:** Corrected Messenger full-page layout parity: all `/messages` routes now bypass the constrained `PageContainer`, occupy the viewport below the header, and suppress the global/header chat launchers. Live `/messages` browser check reports zero `Open chat` buttons and a rendered Messenger rail; production build passes with 218 routes.
- **2026-09-20:** Added the additive `group_conversation_settings` migration and authenticated `/api/messages/group/[id]/settings` route. Active members of non-event group channels can now persist per-user mute/archive state, and the shared Messenger header/details actions are enabled for group conversations alongside direct conversations. Focused route/component tests pass 10/10 and production build passes with the new route; live migration/application and two-account acceptance remain open.
- **2026-09-20:** Ran `npm run db:migrate supabase/migrations/20260920105406_create_group_conversation_settings.sql` through the repository migration runner. The transaction-pooler migration completed successfully. A read-only catalog check confirmed `rls=true`, the member policy and user index exist, and the table has `0` rows. The runner warned that `SUPABASE_DB_CA_CERT` is not configured; encrypted TLS was used without certificate verification.
- **2026-09-20:** Added the authorized Messenger group role read contract at `/api/messages/group/[id]/roles` and preserved role labels in the canonical member response. The shared details panel now displays role badges for active group members. Live schema verification confirmed UUID role IDs; focused role/member/settings/component tests pass 10/10 and production build passes with 219 generated routes.
- **2026-09-20:** Added authenticated Messenger group role assignment through `PATCH /api/messages/group/[id]/members/[memberId]`. Self-role changes, non-member actors, invalid roles, owner-role escalation, and unauthorized role changes fail closed; owners and members with `manage_roles` can assign existing non-owner roles. Focused role mutation/read/member tests pass 6/6 and production build passes with 219 routes.
- **2026-09-20:** Extended the canonical group inbox contract with live group metadata: channel description, group cover-image URL, and explicit `moderated` privacy mode. Group headers/details now render the group identity/avatar instead of a blank participant state. Inbox/adapter regression tests pass 5/5 and production build passes with 219 routes.
- **2026-09-20:** Added the additive `history_policy` column and constraint to `group_chat_channels`, defaulting to the currently supported `retained_moderated` policy. The migration completed through the repository runner, and live verification confirmed the column default and zero invalid policy rows. Inbox/adapter regression tests pass 4/4; production build passes with 219 routes. Explicit creation controls and live two-account group acceptance remain open.
- **2026-09-20:** Added the additive `groups_create_default_group_chat_channel` trigger and `create_default_group_chat_channel()` function. Live catalog verification confirms the trigger, function, and history-policy column exist; no existing group data was modified. Creation-flow acceptance remains pending an authenticated two-account test.
- **2026-09-20:** Added live `group_chat_reports` storage with reporter-scoped RLS and authenticated member-only reporting at `/api/messages/group/[id]/reports`. Invalid reasons, non-members, cross-origin requests, cross-group messages, and event-channel messages fail closed; focused tests pass 3/3. Rate limiting and live safety acceptance remain open.
- **2026-09-20:** Removed private message bodies from notification payloads: direct message and mention notifications now use generic previews while retaining conversation/message IDs only as protected metadata. The dispatcher now evaluates the live `notification_preferences` columns (`all_notifications_muted`, `muted_until`, per-type, channel, and quiet-hour settings) without exposing message plaintext. Focused notification test passes 1/1.
- **2026-09-20:** Added live `notification_push_outbox` storage with deduplicated per-subscription jobs and sanitized payloads; corrected push registration to use the live subscription columns and mapped legacy preference inputs to the live schema instead of issuing invalid column updates. Delivery-provider integration and preference contract tests remain open.
- **2026-09-20:** Added service-role-only claim/complete RPCs and `/api/internal/notifications/push` worker contract with retry state and secret gating. Worker tests pass 2/2; live catalog verification confirms the outbox, both functions, and `0` queued rows. Provider delivery and preference contract tests remain open.
- **2026-09-20:** Added live-schema notification preference contract tests (2/2), covering legacy-to-live field mapping and rejection of unsupported SQL columns. The worker/outbox and preference focused tests now pass 4/4.
- **2026-09-20:** Added group-message notification fan-out to active group members, excluding the sender and using generic previews; notification failures are isolated from message persistence. Group authorization/send tests pass 18/18.
- **2026-09-20:** Added per-user messaging rate-limit enforcement to direct conversation creation, direct sends, and group sends, with explicit `429`/`Retry-After` responses. The limiter now avoids malformed Upstash calls in test environments and fails open only when the configured provider is unavailable; group/direct authorization tests pass 25/25.
- **2026-09-20:** Hardened account-switch cleanup in the realtime store: presence maps, online counts, private activity state, and realtime channels are cleared on disconnect or a different user initialization. The isolation regression test passes 1/1.
- **2026-09-20:** Added a provider-agnostic push delivery adapter and wired the service-role worker to deliver claimed outbox jobs through `MESSAGING_PUSH_PROVIDER_URL`, with optional bearer authentication and bounded request timeouts. Provider success marks jobs sent; provider failures record bounded errors and retry delays through the existing completion RPC. Focused worker, notification, group-report, and realtime tests pass 9/9; production provider configuration and live delivery acceptance remain open.
- **2026-09-20:** Continued Facebook launcher parity: separated the top Chats dropdown from the bottom floating chat, added near-full-height positioning with a 30px bottom gap, toggle/outside close behavior, Facebook-style All/Unread/Groups/Communities tabs, compact recent-row previews/timestamps/unread dots, More options, sticky See all in Messenger footer, friend/conversation handoff into the bottom chat, and multi-conversation minimized bubbles. Browser checks verified top selection closes the dropdown and opens the selected bottom conversation; focused parity tests pass 16/16.
- **2026-09-20:** Added the compact Facebook-style pending message-request row with authenticated Accept/Decline actions. Browser verification confirmed the request row, both actions, and the sticky Messenger footer render together; focused request and launcher tests pass 14/14.
- **2026-09-21:** Exposed the live-verified `retained_moderated` group history policy in the canonical participant details panel as a read-only group setting. Focused group/details/Messenger tests pass 16/16; policy mutation remains intentionally gated because the current route does not support changing history policy.
- **2026-09-21:** Expanded direct restriction authorization coverage with malformed-payload, cross-origin, unauthenticated, and nonparticipant denial cases. The combined direct restriction/report/messaging and group authorization suites pass 33/33; live two-account acceptance remains gated by Supabase session stability.
- **2026-09-21:** Added Messenger accessibility regression coverage for Enter/Shift+Enter composer behavior and a global reduced-motion rule covering Messenger rail, header, and floating-chat transitions/animations. Focused composer/header/rail/details tests pass 15/15 without warnings after awaiting async composer cleanup.
- **2026-09-21:** Audited Messenger consumers before cleanup: `/messages`, `/messages/direct/[id]`, the compact top Chats instance, and the bottom launcher all use the canonical `FloatingChat`; `DirectMessageList` has one production caller inside that workspace. Added `messenger-route-contract.test.ts` to prevent duplicate inbox/workspace reintroduction; route and conversation regressions pass 8/8.
- **2026-09-21:** Expanded private attachment security coverage for unsupported MIME uploads, cross-origin uploads, and nonparticipant upload denial before storage access. Focused attachment/list/action/composer tests pass 25/25; client-side encryption and live private-media acceptance remain gated.
- **2026-09-21:** Completed the entity message authorization and privacy matrix for owner/non-owner/admin/private/public/forged cases. The event target route now has explicit coverage for unrelated requesters on public published events, owner and platform-admin access on private/draft events, and malformed-identifier rejection before any query; the resolver now proves managed-inbox-over-owner precedence and fail-closed behavior for blank entity ID, blank title, blank managed-inbox ID, and null owner. Focused event-route and resolver suites pass 16/16; managed-inbox delegation and live browser acceptance remain gated.
