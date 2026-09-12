# Direct Messaging Core Design

## Goal

Add the first production-oriented private messaging vertical slice without weakening the existing group-chat boundary.

## Scope

- One-to-one conversation creation and discovery.
- Participant-scoped Supabase RLS.
- Authenticated message history and sending.
- Cursor pagination using `(created_at, id)` ordering.
- Durable per-user read state.
- Realtime message publication.
- Blocking enforcement through the existing `blocks` table.

Rich media, typing presence, push notifications, moderation workflows, calls, and end-to-end encryption remain later phases. They will use these conversation and message identifiers rather than creating parallel messaging models.

## Data Model

`direct_conversations` stores one canonical ordered user pair. `direct_conversation_messages` stores server-authored sender IDs and immutable conversation membership. `direct_conversation_read_state` stores an owner-scoped cursor. All three tables are private to authenticated conversation participants.

## Security

Route handlers derive the sender from the authenticated session. Database policies independently enforce participant membership, sender ownership, message length, and reciprocal blocking. No endpoint accepts a caller-supplied sender identity.

## Delivery and Testing

The first implementation uses the existing Supabase route-client and error handling conventions. Tests cover authentication, canonical conversation creation, participant access, sender impersonation rejection, blocked users, cursor validation, and read-state ownership. Live RLS and two-account browser tests remain required deployment gates.

## Delivered Milestone

- Added the `direct_conversations`, `direct_conversation_messages`, and `direct_conversation_read_state` migration.
- Added authenticated conversation creation/reuse at `/api/messages/direct`.
- Added participant-authorized history and message sending at `/api/messages/direct/[id]`.
- Added direct conversation listing to the messages inbox and a realtime private thread UI at `/messages/direct/[id]`.
- Added sender-owned message editing and soft deletion at `/api/messages/direct/[id]/messages/[messageId]`.
- Added deleted-message placeholders and sender-only edit/delete controls in the private thread.
- Added cursor-based history pagination with `before` timestamps and a load-older control.
- Added ephemeral typing indicators and realtime presence on the conversation channel.
- Added durable private message reactions at `/api/messages/direct/[id]/reactions` with per-user uniqueness, participant RLS, and emoji toggles in the thread UI.
- Added participant-scoped full-text message search at `/api/messages/direct/search` with a GIN index and inbox search UI.
- Added private message attachments at `/api/messages/direct/[id]/attachments` using a private Supabase Storage bucket with participant-scoped storage RLS, 10MB limit, and MIME allowlist.
- Added in-app notification dispatch to the other participant on every direct message send, reusing the existing preference-aware `NotificationDispatcher`.
- Added abuse reporting at `/api/messages/direct/[id]/report` with reporter-scoped RLS, per-message deduplication, and a `direct_message_reports` table for moderation review.
- Added voice/video call infrastructure: admin-managed TURN/STUN/signaling settings, secret redaction, participant-scoped call sessions, lifecycle updates, capability gating, and audio/video controls in the private thread.
- Message targets are prop-driven and support either a stable user ID or a user permalink; permalinks are a supported domain identifier and resolve server-side before conversation creation.
- Calls intentionally remain unavailable until an administrator configures the provider values at `/admin/call-settings` and explicitly enables calls. The backend is ready for a WebRTC signaling implementation; no media server is started by Next.js routes.
- Added 10 focused route-contract tests; the full Jest suite passes 93 tests and the production build completes successfully.

This milestone is a real private-messaging foundation with durable read state and message lifecycle controls, not Facebook parity. Attachments, typing/presence, receipts, notifications, moderation, retention, calls, E2EE, and two-account browser testing remain release gates for later phases.