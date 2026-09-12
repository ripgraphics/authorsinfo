# Application-Wide Chat and Messaging Roadmap

Date: 2026-09-10
Status: Architecture approved by the owner; Phase 0 audit and group-chat API repair underway. Database deployment and E2EE provider approval remain blocked as detailed in Section 13.
Security decision confirmed by the user: end-to-end encryption (E2EE) for private conversations; server-moderated entity channels.

## 1. Outcome and Scope Contract

Build an application-wide messaging experience modeled on Facebook web chat and Messenger workflows, integrated with Authors Info entities and its existing components. Deliver working, persisted, authorized behavior, not demonstration controls, mock users, static messages, or success notifications without completed operations.

An exact, exhaustive Facebook clone cannot be certified from this repository. Facebook behavior varies by account, region, platform, and release, and its private implementation is unavailable. This roadmap is a concrete proposed coverage baseline, not a claim of complete parity. Before parity sign-off, capture a dated, authorized reference inventory of the target web experience and map every observed workflow to an acceptance test. Differences require explicit approval; they must not be silently omitted or called complete.

Retain Authors Info branding. Implement independently; do not copy proprietary source code or unlicensed assets. No paid infrastructure, vendor account, or production rollout is authorized merely by this document.

## 2. Evidence From This Repository

### Code inspected

| Surface | Observed condition | Consequence |
| --- | --- | --- |
| `app/messages/page.tsx` | Empty page containing only a content comment | No working global inbox in this route |
| `app/groups/[id]/chat/page.tsx` | Mock identity; local-only reactions and thread participation; fetch and realtime logic in page | Reuse its role and layout, but replace its mock state and group-specific coupling |
| `app/groups/[id]/chat/thread.tsx` | Mock identity; unbounded fetch; `any` types; group-specific endpoints | Refactor into the shared conversation view, preserving group consumers |
| `app/api/groups/[id]/chat-thread-messages.ts` | Accepts client `user_id`, spreads input into insert, returns raw DB errors | Replace trust model with authenticated, allowlisted writes and sanitized errors |
| Group chat API filenames | Handlers are ordinary `.ts` files, not App Router `route.ts` endpoints | Verify routing and replace with valid route handlers; do not assume exports are reachable APIs |
| `components/entity-comment-composer.tsx` | Existing text/media composition with hardcoded engagement submission | Extend with typed submission and attachment adapters, keeping existing comment behavior |
| `components/ui/comment-composer-toolbar.tsx` | Existing emoji, GIF, image controls; public-style upload integration | Reuse controls, inject private upload behavior; never reuse public attachment URLs for E2EE |
| `lib/stores/realtime-store.ts` | Existing Zustand presence/activity store with shared channel lifecycle | Extend or factor within this ownership boundary; do not add a competing presence store |
| `lib/services/notification-dispatcher.ts` | Existing preference-aware notification creation and queue integration | Reuse after checking workers, deduplication, credentials, and actual delivery |
| `components/client-layout.tsx` | Non-admin application shell; admin bypass | Own the global dock here and explicitly cover authenticated admin layouts too |
| Entity registries | `types/entity.ts`, `lib/engagement/config.ts`, and permalink types differ | Establish one messaging capability mapping without equating entity types with engagement categories |
| `docs/REDUNDANT_COMPONENTS_ANALYSIS.md` | Documents overlapping notification and other components | Verify current consumers before extending a canonical component; no blind deletion |

Recent commits inspected concern comment threading and live engagement counts, not a completed messaging subsystem. The worktree already contains unrelated security and comment changes; preserve them.

### Live-verified schema facts

Read-only `npm run types:check` generated the live public schema during this analysis. A second filtered invocation inspected messaging definitions.

- `group_chat_messages` exposes `channel_id`, `message`, `user_id`, `is_hidden`, `id`, and `created_at`; it does not match the UI's `group_id` and `body` assumptions.
- `group_chat_channels` exposes group/event associations and channel metadata.
- `group_chat_message_attachments` and `group_chat_message_reactions` are present.
- `event_chat_rooms` and `event_chat_messages` are present, including moderation-related fields.
- `blocks` and `entity_types` are present.
- No `group_chat_thread_*` table definitions or direct-conversation table definitions appeared in the targeted public-schema results.

Generated types do not prove RLS policies, grants, realtime publication coverage, storage privacy, indexes, actual row populations, deployment routing, or data quality. Inspect those explicitly before migrations. Entity-type rows and ownership relationships have not been enumerated live. Proposed schema names below are design concepts, not assertions about existing tables.

## 3. Architecture Decision

### Alternatives

1. **Recommended: shared application messaging domain with specialized infrastructure.** Keep Supabase for authenticated metadata, durable events, authorization, and moderated channels. Use a maintained, independently reviewed E2EE implementation for private messages and a proven WebRTC media service for calls. Reuse application UI and entity permissions. This maximizes integration but requires explicit crypto, worker, and media operations.
2. **Hosted full messaging suite.** Can accelerate messaging and calls but requires proof of genuine E2EE, entity authorization integration, exportability, retention guarantees, regional hosting, and reusable UI compatibility. Vendor lock-in and ongoing costs are material.
3. **Separate DM, group, and entity systems.** Avoid. It duplicates unread state, membership checks, notifications, transport, and rendering, and creates inconsistent privacy rules.

### Shared ownership

- Pages and application containers load data and invoke domain operations. Presentational components accept typed data and callbacks.
- One conversation service controls creation, membership, messages, receipts, attachments, settings, and synchronization.
- One message rendering/composition implementation serves full inbox, dock windows, mobile, and entity channels through props.
- Realtime announces durable changes; it is not the authoritative message store. Reconnect always reconciles against persisted sequence cursors.
- A transactional outbox drives notifications and secondary work. Idempotent workers acknowledge outcomes, retry transient errors, and expose dead-letter failures.
- Existing auth, error handling, permissions, notification preferences, and rate limiting are integration points, not replacements to reimplement.

### Two explicit privacy modes

- **Private conversations:** E2EE for text, attachments, reactions, replies, and private presentation metadata where supported. The server stores ciphertext plus necessary routing metadata, never message plaintext or decryption keys.
- **Entity community channels:** server-readable and moderated with clear disclosure. Access follows entity membership and channel permissions.
- **Managed entity inboxes:** authenticated human operators act for an author/publisher/organization only with verified delegated authority. Their privacy mode, operator visibility, and device key membership must be shown before joining. Default managed inboxes to disclosed server-moderated handling unless a reviewed multi-operator E2EE design is approved.
- Never silently downgrade a private conversation or migrate old plaintext into a conversation represented as historically E2EE. Retain legacy provenance and consent-based migration boundaries.
- Private search uses a device-local encrypted index. Server full-text search applies only to authorized moderated channels.
- E2EE abuse reports contain only evidence the reporting user explicitly chooses to decrypt and submit. Administrators cannot otherwise read private ciphertext.
- E2EE does not hide all relationship/timing metadata or protect against a compromised recipient device. Communicate these limits accurately.

## 4. Entity Coverage and Authority

Treat entities as conversation subjects, channels, managed identities, or shareable content. A book or photograph is not an authenticated sender.

| Entity family | Messaging behavior | Authority gate |
| --- | --- | --- |
| Users/profiles/friends | Private direct and group conversations; message requests | Authenticated users; recipient preferences; blocks and restrictions |
| Authors and publishers | Managed inboxes and subject channels; shareable profiles | Verified delegation; record both acting user and represented identity |
| Books | Book discussion channels and shareable book cards | Entity access plus channel membership; no fabricated book account |
| Groups and book clubs | Member channels, private subgroups, announcements, invitations | Existing membership and role permissions, checked on every operation |
| Events and Q&A sessions | Event channels, ticket/member-gated rooms, linked private conversations | Event access, attendance/ticket requirements, moderator permissions |
| Posts/activities, discussions, reviews, comments | Permission-aware rich shares and deep links | Resolve original resource access for each recipient |
| Photos and albums | Shared references or explicitly uploaded message attachments | Original visibility, ownership, private media authorization |
| Reading lists/shelves, challenges, achievements, recommendations | Shareable resources and contextual conversations | Resource owner and visibility rules; avoid exposing private reading activity |
| Additional entity types discovered live | Explicit capability and permission mapping before release | Coverage audit fails on unmapped supported types |

Inventory routes and live entity records during Phase 0 to reconcile aliases and identify any missing family. Cover all application entities; do not claim this initial inventory is exhaustive. Deny unknown entity types by default, and block full launch until every discovered type is classified and tested. Adding a participant must not grant access to previously private shared entities.

## 5. Feature Coverage Baseline

Each row needs persisted backend behavior, permission tests, usable UI, failure states, and cross-session verification. A later phase is planned work, not a placeholder feature shipped to users.

| ID | Required workflows | Delivery phase |
| --- | --- | --- |
| MSG-01 | Full inbox, conversation list, unread filters/counts, search, new conversation, deep links, recent contacts | 2-3 |
| MSG-02 | App-wide header access, multiple docked chats, minimize/restore/close, overflow, navigation persistence, responsive mobile inbox | 3 |
| MSG-03 | Direct/group messaging, deduplicated conversation creation, member list, roles, add/remove/leave, invites and approval | 1-4 |
| MSG-04 | Text, multiline and keyboard composition, drafts, pending/sent/delivered/read states, retry/cancel, reconnect and history pagination | 2-3 |
| MSG-05 | Replies with jump-to-source, mentions, emoji reactions, edit history policy, forward, copy, pin/unpin, delete-for-self and unsend | 4 |
| MSG-06 | Photos, multiple attachments, files, video, voice recording/playback, GIFs, stickers, media gallery, download and upload progress/cancel | 5 |
| MSG-07 | Entity cards, safe links/previews, original visibility enforcement, inaccessible/deleted resource states | 4-5 |
| MSG-08 | Names, avatars, nicknames, themes, default quick reaction, conversation details and system events | 4 |
| MSG-09 | Archive/unarchive, mark unread, mute durations, snooze, notification preferences and browser permission management | 4, 6 |
| MSG-10 | Message requests, accept/decline, spam routing, block/unblock, restrict, report, rate limiting and abuse controls | 1-2, 6 |
| MSG-11 | Presence, last-active visibility, typing expiration, delivery/read preferences, multi-device receipt reconciliation | 2, 6 |
| MSG-12 | One-to-one and group audio/video calls, ringing, accept/decline, missed/busy/ended states and call history | 7 |
| MSG-13 | Device selection, mute/camera, screen sharing, grid/speaker views, participant controls, reconnect and permission-denied handling | 7 |
| MSG-14 | E2EE provisioning, device verification/revocation, key rotation, secure recovery, encrypted attachments and local search | 1-2, 5 |
| MSG-15 | Disappearing messages with explicit policy, expiration across devices, encrypted backups/export, deletion and retention | 2, 8 |
| MSG-16 | Community channels, announcements, moderator actions, polls, member management, reporting and managed inbox assignment | 4, 6 |
| MSG-17 | Accessible navigation, screen-reader announcements, reduced motion, localization-ready timestamps, timezone and RTL behavior | 3-8 |
| MSG-18 | Push/in-app notifications, preference enforcement, deduplication, quiet hours, offline delivery and safe previews | 6 |
| MSG-19 | Reference-dependent features: payments, business automation, bots/AI, games, collaborative media, live location, stories/notes, call effects/captions, region-specific integrations | 0 classification; 9 implementation and parity audit |

MSG-19 is not an exclusion list. Determine actual target-web availability and desired application equivalents with the owner; required features receive dedicated approved subplans, providers, security review, and acceptance tests. Payments require payment-provider and regulatory decisions; automation and AI must not receive E2EE plaintext without explicit user action and disclosure. No unverified integration is represented as working.

## 6. Data and Authorization Contracts

Proposed logical records: conversations, membership periods and roles, entity associations/delegations, devices/key envelopes, messages and versions, attachment manifests, per-user visibility, reactions, read/delivery cursors, requests, invitations, preferences, reports, calls/participants, transactional outbox and audit events. Verify whether existing tables can be extended before creating physical tables.

- Server derives actor identity from verified auth; never trust client sender IDs, role claims, or represented entities.
- Each operation checks conversation membership, privacy mode, active membership period, blocks, entity access, and delegated authority as applicable.
- Private group membership changes require cryptographic epoch/key updates, not only SQL membership changes. Define whether new members receive history before implementing envelopes.
- Atomic message acceptance checks membership and idempotency, allocates an ordered conversation sequence, stores message/envelopes and outbox work together.
- Unique client operation IDs make retries return the original durable result. Sequence cursors and bounded pagination prevent duplicate/gap rendering.
- Read cursors advance monotonically and never claim unread ciphertext was read. Delivery means recipient-device acknowledgement, not a successful sender HTTP request.
- Composite relationships prevent cross-conversation replies, reactions, attachments, and receipts. Clients cannot attach another user's uploaded asset.
- RLS covers SELECT, INSERT, UPDATE, DELETE; realtime channel authorization and storage access enforce equivalent boundaries. Test through ordinary authenticated clients, not only service-role clients.
- Index conversation sequence/history, member inbox lookup, outbox eligibility, reaction uniqueness, and retention queues based on verified query plans.
- Store private files encrypted in private storage with expiring authorized access. No public CDN copies, public transformation URLs, or plaintext media in analytics/logs.
- Server malware scanning cannot inspect E2EE ciphertext. Use bounded formats, encrypted manifests, recipient warnings, and a reviewed client-side safety strategy. Scan moderated-channel uploads before delivery.
- Link previews must resist SSRF, DNS rebinding and private-network fetches. Private previews require explicit privacy-safe client behavior or informed opt-in; never automatically send private text to a preview service.
- Recheck membership for attachment access and realtime rejoin. Revocation prevents future access, but cannot retract already downloaded recipient content.
- Define edit/unsend windows, attachment limits, membership history, retention, and expiration policy in Phase 0. UI and server enforce the same versioned policy.

## 7. Component Reuse Contract

| Existing owner | Planned extension | Required regression proof |
| --- | --- | --- |
| `app/groups/[id]/chat/thread.tsx` | Convert existing conversation rendering into reusable typed content; relocate only if needed and update imports | Existing group entry point and new inbox/dock render the same implementation |
| `app/groups/[id]/chat/threads.tsx` | Generalize list selection and metadata; remove hardcoded transport and mock assumptions | No parallel inbox/thread-list implementation |
| `components/entity-comment-composer.tsx` | Add controlled draft/submission/upload adapters and messaging presentation mode | Existing comment create/reply, cancellation, and upload cleanup remain working |
| `components/ui/comment-composer-toolbar.tsx` | Extend private attachments, GIF/sticker selection and voice controls through capabilities/callbacks | Comment upload path unchanged; private messages never use public upload defaults |
| `components/entity-avatar.tsx`, `components/entity-name.tsx`, `components/entity-hover-cards.tsx` | Reuse identity presentation with authorized data | Entity identity and actor identity remain distinguishable |
| `components/enterprise-photo-viewer.tsx` | Add authenticated/decrypted media adapters if its boundary supports them | Existing photo view/download/delete regressions pass; decrypted object URLs are revoked |
| `components/page-header.tsx`, `components/client-layout.tsx`, `components/entity-header.tsx` | Add message launch actions and persistent shell integration | No duplicate header, provider, or message state on navigation |
| `components/notifications/*`, `components/presence-badge.tsx` | Extend message/call notification and presence presentation | Existing preference behavior retained; no unauthorized activity leak |
| `lib/stores/realtime-store.ts`, `lib/services/notification-dispatcher.ts` | Extend authenticated channel lifecycle, durable catch-up and private notification payloads | No duplicate events; correct logout, reconnect, and account-switch cleanup |
| `hooks/use-upload-lifecycle-manager.ts`, `components/ui/*` | Reuse lifecycle and accessible primitives; adapt storage ownership | No orphan uploads or inaccessible icon controls |

These are reuse candidates, not all fully audited implementations. Before touching each owner, inspect its callers and existing tests. Prefer extending or relocating it over copying it. New modules are allowed for genuinely absent domain logic such as cryptographic integration or call signaling, not competing versions of existing components. Never force unrelated business logic into a UI component merely to avoid a necessary service module.

## 8. Phased Delivery

### Phase 0: Reference Baseline and Safe Foundation Audit

- Freeze a dated target-web feature inventory and classify MSG-19 with the owner; record keyboard, responsive, privacy and failure workflows.
- Enumerate live entity types, ownership/delegation, group/event membership, legacy message populations, RLS/grants, indexes, storage policies, realtime publications and deployed routes.
- Inspect local Next.js 16 docs before implementation. Trace existing auth/security changes without replacing unfinished user work.
- Establish current build/lint/unit/E2E baselines and record unrelated failures separately.
- Approve threat model, E2EE implementation/provider, supported browsers, recovery design, history policy, operational limits, retention, and launch load profile.
- Exit: approved design and feature ledger, live schema/security evidence, component reuse map, and measurable policies. No schema mutation before these checks.

### Phase 1: Authorized Domain and Cryptographic Foundation

- Extend verified schema additively; implement actor/member/entity authorization, requests, blocks, atomic idempotent writes, sequence pagination and outbox contracts.
- Integrate maintained E2EE protocol/library with device enrollment, key storage, device verification, membership epochs and revocation. Do not hand-roll a protocol.
- Replace group handler routing and invalid schema assumptions through the shared service; remove mock identities from the migrated flow.
- Test unauthenticated access, impersonation, cross-entity/thread access, stale membership, RLS bypass attempts, concurrent DM creation and duplicate sends.
- Exit: authorized integration tests and encryption interoperability tests pass; server/network inspection shows no private plaintext; migration is rehearsed with rollback capability.

### Phase 2: Complete Private Messaging Vertical Slice

- Deliver real direct/group conversation creation, request acceptance, encrypted send/history, decrypt/render, persisted receipts, retry and offline catch-up.
- Implement device verification, recovery flow, revocation and explicit failure handling before inviting production private-message users.
- Connect existing conversation UI through typed containers; remove mock/local-only behavior in this slice.
- Implement deletion/expiration semantics and local encrypted search foundation; cleanup decrypted state on logout and account switching.
- Exit: two real test accounts and multiple isolated browser/device contexts exchange encrypted messages across reload, retry, disconnect and membership changes. Verify ciphertext-only persistence and request/block boundaries.

### Phase 3: Application-Wide Inbox and Dock

- Populate `/messages`; extend header and layouts for app-wide access, unread counts, multiple dock windows, minimize/restore and overflow.
- Reuse shared conversation/list/composer for full inbox, group page and dock. Route changes retain authorized drafts and window state, not plaintext in generic persisted stores.
- Add responsive single-pane mobile navigation, scroll anchoring, history loading, keyboard/focus behavior, screen-reader states and reduced motion.
- Cover authenticated profile, author, book, publisher, group, event, settings and admin surfaces; public/auth screens must not leak chat state.
- Exit: desktop/mobile browser tests and screenshots verify persistence, unread correctness, no layout overlap and no duplicate subscriptions.

### Phase 4: Entity Conversations and Rich Interaction

- Implement capability mapping for every inventoried entity, permission-aware sharing and managed-identity delegation.
- Migrate group and event channels through the same domain with explicit moderated privacy mode.
- Persist replies, edits, forwarding, reactions, pins, member/admin workflows, invitations, nicknames/themes, archive/mute and polls.
- Add visibility-safe source navigation and revoked/deleted source states. Audit logs distinguish acting user from managed identity.
- Exit: every mapped entity has positive and denied-path tests; no entity privacy leak, duplicate UI, or local-only mutation.

### Phase 5: Private Media and Voice

- Extend composer/upload/viewer for encrypted images/files/video and voice notes; support progress, cancellation, retries, cleanup and downloads.
- Implement encrypted thumbnail/manifests, recipient decryption and browser format fallbacks. Separate moderated-upload quarantine/scanning from E2EE handling.
- Integrate licensed GIF/sticker providers with real credentials and privacy disclosures; do not depend on sample/fallback keys.
- Exit: unauthorized URLs fail; revoked users cannot fetch new media; reload preserves attachments; cancellations leave no orphan data; plaintext is absent from private storage and telemetry.

### Phase 6: Notifications, Presence and Safety

- Extend existing preferences/dispatcher/store with private-safe push, in-app delivery, quiet hours, deduplication and outbox workers.
- Implement per-device presence aggregation, privacy preferences, expiring typing, message requests, restriction, blocking and report review.
- Prevent private plaintext in push payloads, provider logs, error capture and analytics. Add anti-spam quotas and moderation auditability.
- Exit: real push delivery tested in supported browsers; worker failures/retries and mute/block changes behave correctly; presence does not reveal restricted users.

### Phase 7: Audio and Video Calls

- Integrate a proven WebRTC stack with provisioned TURN and SFU capacity; do not use Vercel request handlers as a long-lived signaling/media server.
- Implement authorized call tokens, call lifecycle/history, multi-device ringing/answer races, group calls, device controls, screen sharing and reconnect.
- Verify actual media E2EE support in supported browsers. Transport encryption alone is not E2EE; unsupported clients must not silently downgrade private calls.
- Exit: tests on separate devices/networks exercise relay-only calls, denied permissions, busy/offline recipients, dropped networks, revoked members, camera/screen-share changes and call teardown.

### Phase 8: Enterprise Operations and Rollout

- Add content-free observability, SLO dashboards, alerts, quota controls, outbox dead-letter handling and incident runbooks.
- Rehearse backup/restore and encrypted recovery separately; implement retention/export/deletion policies without claiming server-side decryption.
- Run security review, accessibility review, load/soak tests, failover drills and migration reconciliation; canary by conversation cohort.
- Exit: required acceptance gates and approved operational targets pass; rollback rehearsed; monitoring and ownership are assigned before general availability.

### Phase 9: Exhaustive Reference Reconciliation

- Compare all reference workflows against MSG-01 through MSG-19 and every entity capability. Record tested parity or an explicitly approved difference.
- Implement remaining reference-dependent integrations as complete subprojects with provider, permission, privacy and operational gates.
- Exit: no required feature unimplemented, no unresolved critical/high security issue, no fake/inactive success controls, and evidence links for every requirement. Until this exit passes, describe delivery by completed phases, not as an exact Facebook clone.

## 9. Migration and Release Safety

1. Refresh live metadata before each migration; inspect actual data, permissions and constraints. Preserve legacy group/event IDs with an explicit mapping.
2. Back up and rehearse additive migrations in staging. Validate row counts, relationships, ordering, visibility and attachment reachability; quarantine unmappable records for review.
3. Use one authoritative write path per migrated conversation. Avoid uncontrolled dual writes and duplicated notifications. Backfill idempotently in bounded batches with checkpoints.
4. Apply reviewed migrations using `npx supabase db push` only after target and approval checks. Do not run reset commands. Regenerate types from the live target, not the repository's currently local-only `types:generate` default.
5. Enable cohorts behind server-side feature flags. Monitor authorization failures, message acceptance/receipt latency and outbox age; disable new entry points if gates regress.
6. Roll back application routing via preserved compatibility mappings; do not drop migrated data or discard acknowledged messages. Reconcile messages accepted during a canary before restoring old writers.

## 10. Verification and Enterprise Acceptance

Every phase starts with a failing focused test where applicable, then implementation, immediate focused verification, and required repository gates. Reuse existing Jest/Playwright test structure; add fixtures only where needed.

- Run `npm run build` and `npm run lint`; run relevant `npm run test` and `npm run test:e2e`. Record actual results and unrelated baseline failures. A successful build alone does not verify messaging.
- Use at least two independent authenticated test accounts, multiple browser contexts/devices, and explicit unauthorized actors. Do not use privileged clients as the only authorization test.
- Check races: send/retry duplication, receipt regression, blocked sender, membership revocation during send/download, two devices answering a call, reconnect gaps and outbox replay.
- Check privacy: SQL/RLS access, storage access, realtime subscriptions, source-entity preview visibility, push/log redaction and local-state account isolation.
- Check cryptography with upstream vectors/interoperability, device compromise/revocation scenarios, key changes, recovery and membership epochs. Independent review is a launch gate.
- Check UX with keyboard-only use, screen readers, 200% zoom, long text/names, attachment-only messages, reduced motion, mobile viewport and browser permission failures.
- Proposed initial targets for approval: 99.9% monthly messaging availability; p95 durable send acknowledgement under 500 ms and online recipient visibility under 1 second in the chosen deployment region; inbox first page under 1 second with 10,000 conversations for the test user; 10,000 concurrent connected clients and 100 accepted messages/second in the agreed load profile.
- Proposed recovery targets for approval: metadata/message RPO no more than 5 minutes and service RTO no more than 60 minutes. Encrypted content recovery additionally depends on the approved user/device key recovery design.
- These are test targets, not measured performance claims. Capacity, hosting tier, regions, budget, browser support and traffic distribution must be approved before benchmarks can certify launch readiness.

## 11. External Dependencies and Design Approval

Required decisions before affected implementation:

- Approve this shared-domain/two-privacy-mode design, managed-inbox disclosure, entity coverage method and phased release contract.
- Select an E2EE implementation with supported web clients, group membership/key rotation, recovery, maintenance and a compatible license. A library name without these verified capabilities is insufficient.
- Approve TURN/SFU hosting and budget, call E2EE/browser support, background worker execution and private object-storage capabilities.
- Provision provider secrets directly in the deployment environment; never put them in this document or chat. Confirm GIF/sticker licensing and push configuration.
- Approve product policies: edit/unsend windows, disappearing-message timing, group history visibility, invitation limits, upload limits, retention and delegated operator access.
- Supply or authorize a target-web reference walkthrough for exhaustive parity assessment. No access to private Facebook implementation is assumed or needed.

Implementation starts after design review and Phase 0 security/provider decisions. Each phase then receives a concrete task-level implementation plan with exact files, migration diffs grounded in current live schema, tests and commands. This roadmap does not fabricate those diffs before their controlling policies and schema are verified.

## 12. Current Delivery Record

- Completed: targeted codebase analysis; live public-schema generation and messaging definition inspection; existing component reuse inventory; user confirmation of private E2EE and moderated entity channels; this phased roadmap.
- Not completed: reference-web parity inventory, RLS/storage audit, provider selection, implementation, migrations, application test baseline, browser verification, load/security review or deployment.
- No application code or database data was changed while initially preparing this roadmap. Subsequent approved Phase 0 work is recorded below; the original analysis above remains a historical baseline.

## 13. Approved Phase 0 Execution Record

### Implemented and verified locally

- Repaired `app/api/groups/[id]/chat.ts` and registered `app/api/groups/[id]/chat/route.ts`, reusing the existing handler rather than creating a competing implementation.
- Migrated `app/groups/[id]/chat/page.tsx` away from the mock identity and unsupported legacy thread path. The page now obtains the authenticated Supabase user, discovers the authorized non-event group channel, reads `channel_id`/`message`, sends only the verified API payload, deduplicates realtime inserts, and fails closed for signed-out or unavailable-channel states. Local reaction buttons remain presentation-only until the persisted reaction contract is migrated.
- Implemented the first real `/messages` inbox slice with `app/api/messages/route.ts` and `app/messages/page.tsx`. It derives active group memberships from the authenticated user, lists only authorized non-event group channels, retrieves each channel's latest visible message, links into the existing group-chat surface, exposes loading/error/empty states, and has focused authorization tests. No fake direct-message rows or placeholder conversations are shown.
- Added persistent group-message reactions through `app/api/groups/[id]/chat/reactions/route.ts`, strict actor-bound POST/DELETE authorization, persisted reaction loading/toggling in the group-chat UI, and migration `20260911000000_group_chat_reactions_write_access.sql`. Live verification confirmed reaction insert/delete policies, uniqueness index, and Supabase Realtime publication.
- Added durable group-channel read state through `app/api/groups/[id]/chat/read-state/route.ts`, authenticated owner-scoped GET/upsert operations, automatic cursor advancement after history load, and migration `20260911000001_group_chat_read_state.sql`. Live verification confirmed the table, owner RLS policy, and lookup index.
- Extended `/api/messages` with durable-cursor-derived `unread_count` values and added an explicit inbox mark-unread action that clears the authenticated channel cursor. The inbox now exposes unread badges without introducing a second read-state model.
- Added migration `20260911000002_group_chat_default_channels.sql` to backfill one idempotent `General` channel for existing groups and create the default channel automatically for future groups. Live verification now reports one existing group and one provisioned channel, with the `ensure_default_group_chat_channel_on_group_created` trigger installed.
- Added live reaction synchronization to the group-chat Supabase channel for persisted reaction INSERT/DELETE events, with a shared pure reducer in `lib/chat-reaction-state.ts` that deduplicates remote events and keeps local/API updates consistent.
- Prepared `docs/MATRIX_PRIVATE_MESSAGING_PILOT.md` for the next private-messaging phase. It defines the Matrix/Synapse integration contract, required deployment configuration, security boundaries, and acceptance gates. Runtime private DMs remain disabled until a real homeserver and OIDC configuration are provisioned.
- Provisioned and health-checked an isolated local Synapse/PostgreSQL pilot via `docker-compose.matrix-pilot.yml`; `/health` and `/_matrix/client/versions` return HTTP 200. This validates local homeserver operations only and does not enable production private messaging or modify Supabase.
- Added a feature-gated Matrix capability contract via `lib/matrix-config.ts`, `app/api/messages/capabilities/route.ts`, and the inbox status state. Private messaging remains visibly unavailable until a real approved homeserver/OIDC deployment is configured and the flag is explicitly enabled; no plaintext fallback is created.
- Extended the capability contract with a bounded server-side Matrix `/_matrix/client/versions` probe. The local pilot advertises Matrix client APIs through v1.12 and E2EE-related features; the application still keeps private rooms disabled until OIDC, browser crypto, recovery, and security gates pass.
- Replaced the service-role client with the existing `requireUser` helper and the caller's RLS-constrained client.
- Enforced active group membership, matching channel/group identity, and exclusion of event channels until their separate access requirements are implemented.
- Replaced invalid `group_id`/`body` message-table assumptions with live `channel_id`/`message` fields. Requests now require `channel_id`; POST accepts only `channel_id` and `message` and derives `user_id` from authentication.
- Added strict validation, hidden-message exclusion, deterministic bounded latest history, no-store successful responses, cross-origin POST rejection and sanitized error responses even in development.
- Added 15 focused tests in `__tests__/group-chat.test.ts`. Initial tests reproduced six pre-fix failures. Final full Jest run: 11 suites, 66 tests passed. Scoped ESLint: zero errors/warnings. HTTP GET and POST without credentials returned 401 on localhost:3034.
- Full repository lint run: zero errors, 33,100 warnings at the time of that run. Build failed with four existing React taint configuration errors in analytics cohorts/segmentation routes; those unrelated files were not changed.

### Additional live facts

The PostgreSQL catalog audit succeeded in a read-only transaction using Supabase's published CA with certificate and hostname validation enabled. No message content, credentials, or personal user records were printed. The first certificate attempts failed with `SELF_SIGNED_CERT_IN_CHAIN`; loading the correct CA resolved connectivity without disabling verification.

- Group messages/channels, group attachments/reactions, and event messages/rooms have a permissive `Allow public read` policy with `USING (true)`.
- Group messages have no ordinary authenticated INSERT policy. The previous service-role helper bypassed this restriction; the repaired handler correctly does not.
- Inspected group/event chat tables have no realtime publication entries. Group channels/messages have primary-key indexes only and no channel/history index or foreign-key constraints.
- Group chat contains zero messages and zero channels; group membership has three rows, all `active`. Counts are a point-in-time observation, not a permanent invariant.
- The entity registry contains content/media variants, not only social actors. Categories include author, book, community, content, entity_header_cover, event, group, photo, publisher, review, system, tag, temporary, user and video; `Post` has a null category. These require capability classification, not treating each image variant as a chat identity.
- Broad SQL grants include TRUNCATE for anon/authenticated on inspected group-chat tables. RLS does not protect TRUNCATE; restrict database grants even where HTTP APIs do not expose that operation.

### Prepared migration, not deployed

`supabase/migrations/20260910000000_group_chat_access_boundary.sql` adds restrictive membership/visibility/sender guards to group channels, messages, attachments and reactions, revokes anonymous grants and selected dangerous authenticated grants, enables authenticated member message insertion, adds lookup indexes, and conditionally publishes group messages to Supabase Realtime.

It intentionally does not drop existing policies or data. Existing permissive read policies are intersected with restrictive guards. Event-only channels are denied until event authorization is implemented. Group creation/channel provisioning, event-room policy repair, rate-limit enforcement, storage privacy, cursor pagination and idempotent writes remain separate required work. Public attachment URLs, if any exist, are not secured by metadata RLS alone.

The migration was applied on 2026-09-10 with `npm run db:migrate supabase/migrations/20260910000000_group_chat_access_boundary.sql`. Certificate-verified read-only verification afterward confirmed RLS on all four target tables, all six restrictive policies plus the authenticated insert policy, both new indexes, and `supabase_realtime` publication of `group_chat_messages`. Live counts remained zero messages and zero channels. The migration has not been tested with real authenticated member/nonmember accounts or staging because no staging environment was available; the application UI must still be canaried before production use.

The repository runner emitted its existing `NODE_TLS_REJECT_UNAUTHORIZED=0` warning during execution. Post-migration verification used the Supabase CA with certificate verification enabled. The runner’s TLS behavior remains a security follow-up and should be corrected before future production migrations.

`npx supabase db push --dry-run` failed with `LegacyDbPushMissingRemoteError`, identifying these local files before the latest remote migration:

- `supabase/migrations/20251228_sprint_13_websocket_infrastructure.sql`
- `supabase/migrations/20251229_add_title_to_reading_challenges.sql`
- `supabase/migrations/20251229_allow_all_users_create_events.sql`
- `supabase/migrations/20251229_group_event_creation_permissions.sql`

No `--include-all`, migration-history repair, database mutation, or unrelated pending migration was executed. Resolve history against actual remote effects in a separate reviewed deployment step; do not mark migrations applied without evidence. The existing migration runner globally disables TLS verification, so it was not used as a workaround.

### E2EE infrastructure evaluation

Official sources inspected on 2026-09-10; documentation claims below are not runtime certification of this application.

| Candidate | Evidence and fit | Decision |
| --- | --- | --- |
| Matrix JS SDK with Rust/WASM crypto | Official browser SDK; `initRustCrypto`, IndexedDB crypto state, cross-signing, recovery/secret storage, backups, room membership, sync and pagination. SDK license is Apache-2.0. Requires a Matrix homeserver; it is not a drop-in Supabase cipher library. | Recommended for an isolated interoperability evaluation, subject to architecture/hosting approval |
| Signal libsignal | Official repository explicitly states use outside Signal is unsupported; TypeScript distribution includes native Node add-ons; AGPLv3. | Do not select as an ordinary browser SDK for this application |
| OpenMLS | Maintained Rust RFC 9420 implementation, MIT license. Its README lists WASM as built but not tested/supported in CI. Application must still supply identity, delivery, persistent device state, recovery and policy integration. | Possible research option, not a production-ready browser messaging product for this phase |
| LiveKit | Official documentation supports media/data E2EE, but signaling/API metadata remains server-readable. Application owns secure key distribution. | Preferred call-infrastructure candidate for later proof; not a durable messaging/recovery replacement |

Sources:

- https://github.com/matrix-org/matrix-js-sdk
- https://github.com/matrix-org/matrix-js-sdk/blob/develop/LICENSE
- https://matrix-org.github.io/matrix-js-sdk/interfaces/crypto-api.CryptoApi.html
- https://matrix.org/docs/matrix-concepts/end-to-end-encryption/ (older conceptual guide; use current SDK APIs for implementation)
- https://github.com/signalapp/libsignal
- https://github.com/openmls/openmls
- https://docs.livekit.io/home/client/tracks/encryption/
- https://supabase.com/docs/guides/platform/ssl-enforcement

**Required architecture amendment before adopting Matrix:** keep one application domain and shared UI, but use a homeserver as the authoritative encrypted-room transport/history/key-distribution service, with Supabase retaining application identity, entity capabilities, delegation and moderated channels. Map identifiers server-side and reconcile authorization changes durably. Do not dual-write private plaintext or build a second inbox. This changes the initial Supabase-first private storage design and needs owner approval.

Matrix evaluation must prove multi-tab single-writer crypto-store ownership, logout/account isolation, verified device onboarding, revoked-device/member handling, recovery without server keys, encrypted attachments, bounded sync, and the application's browser/CSP/WASM build compatibility. The SDK warns that multiple clients sharing one IndexedDB crypto store can corrupt state. Verify upstream audit scope, pinned dependency advisories, homeserver license/operations and hosting region before production selection; none has been certified here.

#### Matrix hosting evaluation result

Synapse is operationally viable for a controlled pilot, but it is a new stateful production service rather than a package added to this Next.js deployment.

- **Runtime:** Linux/POSIX service, normally containerized or installed from official packages; native Windows is not officially supported. The current developer workstation can run a local proof through WSL or Docker, but production must not depend on Windows hosting.
- **State:** dedicated PostgreSQL database with UTF-8/C locale, durable media store, homeserver configuration, server signing key, backups, restore drills and secret management. Do not place Synapse tables in the Authors Info Supabase database unless an explicitly reviewed isolation design accepts schema, backup, RLS and upgrade coupling.
- **Network:** a stable `server_name` is permanent and determines Matrix IDs. Use a separate subdomain such as `matrix.<application-domain>` for the public base URL while delegating the chosen user ID domain with `.well-known` only if that identity experience is approved. Put a reverse proxy in front of client/federation endpoints, preserve request paths, configure HTTPS and do not expose admin or replication listeners publicly.
- **Identity:** prefer OIDC authorization-code flow with PKCE against the approved identity provider. Supabase documents an OAuth 2.1/OIDC server, but this project has not enabled or tested it. Do not use Synapse’s non-standard JWT login as the browser authentication contract; the Synapse docs state client support is expected to be nonexistent. Map the stable Supabase subject to one immutable Matrix localpart; never derive identity from display names or mutable emails. Configure back-channel logout only after testing account/session revocation semantics.
- **Privacy:** disable open registration, guest access and public room discovery by default. Start with federation disabled or a strict allowlist/private federation. Use private invite-only encrypted rooms for private chats; use separate server-readable rooms for moderated entity channels. Set push payloads to event-id-only/no message content. Keep private-room URL previews disabled. If previews are enabled for moderated rooms, configure the full private-network IP blacklist and SSRF tests.
- **Scale:** begin monolithic with PostgreSQL. Workers require Redis, an internal authenticated replication listener, reverse-proxy routing and operational ownership. Add workers only after measured load requires them; never expose unencrypted replication traffic to the Internet.
- **Calls:** reliable Matrix VoIP requires TURN. MatrixRTC/LiveKit is a separate media dependency and needs its own key-distribution, region, capacity, recording and disclosure policy.
- **Licensing/support:** Synapse is dual-licensed AGPL or Element commercial license; Element Server Suite is the supported commercial path. Legal review must choose the license/support route before production use.

**Recommendation:** approve a time-boxed isolated Matrix pilot only after choosing a server-name/domain, Linux deployment owner, separate PostgreSQL/media/backup budget, identity-provider configuration, license path, federation policy and TURN ownership. Do not add `matrix-js-sdk`, Synapse configuration, Docker Compose, or secrets to this repository until those decisions are approved. The pilot should first prove two test accounts, OIDC identity mapping, encrypted room/device recovery, account logout, and no plaintext in homeserver logs/push payloads.

For LiveKit, distribute call keys through the approved E2EE messaging/device channel, not a server-generated room secret if the threat model excludes the application server. Rotate keys on membership changes and refuse unsupported browser downgrade. Recording, transcription and bots require explicit participant disclosure and a separately approved trust model.

### Remaining release gates

1. Approve Matrix homeserver evaluation/hosting direction or choose another supported E2EE provider; no provider packages or paid resources were provisioned.
2. Reconcile remote migration history and approve staging/database policy deployment, then test RLS with member, nonmember, suspended and anonymous roles.
3. Resolve existing build blockers with the owners of the analytics/security changes. A green Jest run is not a production build.
4. Migrate the existing group UI away from mock identities and legacy thread endpoints, implement authorized channel creation/listing, then verify two-account persistent messaging. The group page migration is complete locally, but authenticated live sends remain blocked until the prepared RLS migration is staging-tested and deployed. The empty global inbox and dock remain Phase 2-3 work, not completed functionality.
5. Complete reference-web inventory, storage/event access audit, entity capability mapping, operational limits and E2EE interoperability before declaring Phase 0 closed.

## 14. Read-Only Migration-History Reconciliation

### Live-verified results

The reconciliation used `npm run types:check` followed by verified-TLS, `BEGIN READ ONLY` PostgreSQL catalog queries. No SQL write, migration repair, `db push`, history insertion, or data mutation was performed.

- Remote migration ledger table: `supabase_migrations.schema_migrations(version text, name text, statements text[])`.
- Remote ledger contains `20251229000001 allow_all_users_create_events`, `20251229000002 fix_reading_challenges_schema`, and `20251229000003 group_event_creation_permissions`.
- Remote ledger does not contain a `20251228` websocket migration or a migration named `sprint_13_websocket_infrastructure`.
- Local files use three non-unique `20251229_*` filenames for the changes represented remotely by unique versions. Local migration inventory has 98 files, 71 unique numeric versions, and additional duplicate-version groups (`20260103`, `20260108`, `20260119`, `20260125`). This is a repository-wide history hygiene problem, not only a chat problem.
- Live `reading_challenges.title` exists and is nullable, so the local `20251229_add_title_to_reading_challenges.sql` is not needed for current schema state. The local filename/content differs from the remote ledger name `fix_reading_challenges_schema`.
- Live event policies match the intended authenticated creator policy from the local event migration. The local `group_event_creation_permissions` file’s conditional `group_settings` change was not proven present because live `group_settings.event_creation_permission` was not returned by the targeted column query; it requires a separate, exact live check before claiming applied status.
- Live websocket objects, RLS and helper functions from the local Sprint 13 SQL are present. Their migration is absent from the remote ledger. This is schema/ledger drift; object existence does not prove the local file was the applied source or that its full statement list matches.
- Live group-chat policies remain only `Allow public read` for channels/messages. The prepared `20260910000000_group_chat_access_boundary.sql` remains unapplied.

### Safe deployment decision

Do **not** run `npx supabase db push --include-all`, `supabase migration repair`, the project migration runner, or the four historical files until an owner-approved reconciliation is completed. Replaying the historical event/reading-challenge files is unsafe because their effects already exist; replaying the websocket file is unsafe because it creates broad objects, policies and functions and its live provenance is unknown. Marking an entry applied without exact statement provenance is also unsafe.

1. Export the remote `supabase_migrations.schema_migrations` rows and catalog definitions as an approved, access-controlled artifact. The read-only query already established the relevant names; do not include message content or credentials.
2. Obtain the deployment history or SQL fingerprints for the remote `20251229000001` through `20251229000003` entries and the live websocket objects. Compare the remote `statements` arrays with local file hashes/effects, not only filenames.
3. Create a clean migration-history branch that renames or timestamps all local duplicate-version files without changing SQL, after confirming repository consumers and the Supabase CLI’s version format. Preserve a mapping table from old filename to remote version/name.
4. For each already-applied effect, use the Supabase-supported migration-history repair mechanism only after the remote statement provenance is confirmed and a backup/restore rehearsal exists. A repair records history; it must not execute DDL. Do not fabricate a websocket version if no source provenance can be established; instead create a reviewed reconciliation record outside production history and treat the SQL as legacy drift.
5. Apply only new additive migrations after history is clean. For messaging, first stage `20260910000000_group_chat_access_boundary.sql` in an isolated database clone. Test anonymous, authenticated nonmember, active member, suspended member, channel mismatch, event channel, attachment and reaction cases through RLS and realtime. The local file must be amended if staging reveals existing policy-name or grant conflicts.
6. Compare remote and staging `pg_policies`, grants, indexes, foreign keys and `pg_publication_tables` after the migration. Run a rollback/recovery rehearsal; do not rollback by dropping production policies without an approved recovery plan.
7. Only then apply the staged messaging migration through the approved migration path, regenerate types from the live target, and canary the repaired UI. Keep the API fail-closed until the live policy gate is green.

### Reconciliation status

**Open but resolved enough to choose the safe path:** the historical gap is caused by local filename/version drift plus remote schema/ledger drift, not simply an unrun migration. The next work item is an owner-approved migration-history reconciliation and staging clone. No Matrix service or database migration has been provisioned or applied in this evaluation.