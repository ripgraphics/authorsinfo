# Facebook Messenger Parity Reusable Component Plan

## Purpose

Build a close functional clone of the Facebook Messenger desktop/web messaging experience for both the compact chat launcher and the full direct-message route. The two surfaces must share the same conversation state, message rendering, realtime behavior, read receipts, typing state, presence, unread state, and composer behavior.

The existing floating chat is the closest implementation and becomes the canonical messaging workspace. The direct-message route becomes a full-page presentation of that workspace instead of maintaining a second message implementation. “Parity” means the core user workflows and state transitions must match Facebook Messenger behavior, not merely resemble its colors or layout.

## Non-Negotiable Component Rules

- Every new or expanded component is reusable and receives behavior/data through props.
- No component hardcodes a route, conversation ID, participant, API URL, or user identity.
- There is one implementation for each responsibility. The full page and floating launcher compose the same components with different layout props.
- Container components own data fetching, Supabase subscriptions, and mutations.
- Presentational components receive typed data and callbacks only.
- Existing components are expanded before creating a duplicate. The existing `FloatingChat`, `ChatComposer`, `TypingIndicator`, `Avatar`, `IconButton`, and tooltip primitives are reused.
- No page-specific message markup is maintained separately from the canonical chat workspace.

## Component Ownership

### `DirectMessagingWorkspace`

Canonical stateful container for a direct conversation surface.

Props:

- `conversationId?: string | null`
- `presentation: 'launcher' | 'full-page'`
- `open?: boolean`
- `onOpenChange?: (open: boolean) => void`
- `onClose?: () => void`
- `onConversationChange?: (conversationId: string | null) => void`

Responsibilities:

- Load conversations, friends, messages, read state, and capabilities.
- Own realtime message, presence, and typing subscriptions.
- Own unread polling and read-state mutations.
- Own optimistic send/edit/delete/reaction behavior.
- Pass typed state and callbacks into presentational components.

The current `FloatingChat` logic should be extracted into this container rather than copied into the direct route.

### `ConversationRail`

Reusable conversation selector.

Props:

- `conversations`
- `activeConversationId`
- `unreadByConversation`
- `participantById`
- `onSelect`
- `searchValue`
- `onSearchChange`
- `isLoading`
- `emptyState`

Behavior:

- Search conversations/friends.
- Show participant avatar, name, preview, timestamp, online state, and unread count.
- Desktop: persistent left rail.
- Launcher: recent chats plus friends in a compact list.
- Mobile: full-width conversation list with a back action from the thread.

### `ConversationHeader`

Reusable participant header.

Props:

- `participant`
- `presenceState`
- `onAudioCall`
- `onVideoCall`
- `onMinimize`
- `onClose`
- `showMinimize`
- `showClose`

No route assumptions or direct data fetching.

### `MessageList`

Reusable scrollable message history.

Props:

- `messages`
- `currentUserId`
- `participant`
- `readReceiptForMessage`
- `reactionsByMessage`
- `onEdit`
- `onDelete`
- `onReaction`
- `onLoadOlder`
- `hasOlderMessages`
- `isLoading`
- `typingUserNames`

Responsibilities:

- Sent/received bubble alignment.
- Date separators.
- Message timestamps using the shared seven-day formatter.
- Per-message 14px read receipt beneath the timestamp.
- Tooltip text: `Seen by UserName at ...`.
- Scroll preservation and near-bottom auto-scroll.
- No API calls or hardcoded conversation logic.

### `ChatComposer`

Existing reusable composer remains the single input implementation.

Props continue to control:

- Conversation ID
- Send callback
- Typing callback
- Disabled/loading state
- Placeholder and accessible labels
- Draft persistence

Future attachment/emoji controls should be added through props or slots, not duplicated composer components.

### `ChatSurface`

Presentation-only layout that composes:

- `ConversationRail`
- `ConversationHeader`
- `MessageList`
- `ChatComposer`

Variants:

- `launcher`: fixed compact panel with minimized/close controls.
- `full-page`: full-height Messenger workspace with persistent rail.
- `mobile`: one active view at a time with back navigation.

## Data Flow

1. `DirectMessagingWorkspace` loads the conversation list and selected conversation.
2. The container subscribes once to the selected conversation’s message/presence/typing channels.
3. The container passes state into `ChatSurface`.
4. `MessageList` emits user actions through callbacks.
5. The container performs API mutations and updates state optimistically.
6. Read-state POST calls the secure RPC that records `read_at/read_by` per message.
7. The same state is used by the launcher and full-page route; no duplicated unread or read logic.

## Route Integration

- `/messages/direct/[id]` renders `DirectMessagingWorkspace` with `presentation="full-page"`.
- The global `ClientLayout` does not mount the compact launcher on a direct-message route.
- The global launcher renders `DirectMessagingWorkspace` with `presentation="launcher"`.
- Both surfaces use the same active conversation and can preserve selection via session state where appropriate.

## Facebook/Messenger Parity Requirements

The implementation is not complete until these core workflows work on the deployed site with two separate authenticated users:

- Clicking the chat launcher opens a recent-conversations panel with previews, timestamps, unread counts, participant avatars, online indicators, search, and a new-message entry point.
- Selecting a conversation opens the same conversation state in the launcher and full-page route.
- The full-page route has a persistent conversation rail on desktop and a list/thread navigation model on mobile.
- Sending a message appears optimistically for the sender and arrives in the receiver’s open conversation without reload.
- Realtime reconnects recover message delivery, presence, and typing after temporary disconnects.
- Typing indicators appear for the other user and disappear after a timeout or when the message is sent.
- Unread counts update when messages arrive, clear when the conversation is opened/read, and remain synchronized between launcher, header, and full-page route.
- Read receipts record the actual reader and timestamp for each message and render beneath the latest eligible sent message at 14px by 14px.
- Hovering a read receipt displays the reader name and the shared timestamp format.
- Message timestamps, date separators, previews, and read receipts use the same seven-day timestamp policy.
- The composer supports Enter-to-send, Shift+Enter newline, draft persistence, disabled/sending states, and attachment/emoji action slots without duplicating composer implementations.
- Message editing, deletion, reactions, and older-message pagination remain available from the shared message list.
- Conversation actions include minimize, close, back, participant profile, audio/video capability state, and full-page expansion.
- The interface has loading, empty, offline, reconnecting, error, and retry states that do not silently fail.

These requirements are acceptance criteria, not optional follow-up polish.

## Visual and Interaction Target

The target is a functional Facebook Messenger parity workspace, not a marketing page or a single-thread demo:

- Dense, scannable conversation rail.
- Clear active conversation state.
- Full-height message area with reliable scrolling.
- Composer anchored at the bottom.
- Typing indicator floating above the composer.
- Read receipt beneath the message timestamp.
- Responsive mobile navigation between conversation list and thread.
- Keyboard-accessible controls and tooltips for unfamiliar icons.

## Implementation Sequence

1. Repair the current partial JSX edit and return the build to green.
2. Extract the stateful logic from `FloatingChat` into `DirectMessagingWorkspace` without behavior changes.
3. Extract/expand `ConversationRail`, `ConversationHeader`, `MessageList`, and `ChatSurface` as reusable prop-driven components.
4. Render the compact launcher through the shared workspace.
5. Render the direct-message route through the shared workspace in full-page mode.
6. Add responsive mobile rail/thread navigation.
7. Run focused unit tests, production build, and browser checks with two distinct live accounts.
8. Only commit/deploy after live message delivery, typing, read receipts, unread state, and launcher/page parity are verified.

## Validation Gates

- No duplicate message list, composer, typing indicator, or receipt implementation.
- `get_errors` reports no errors in touched files.
- Focused read-state tests pass.
- Production build passes.
- Local full-page route has a conversation rail beside the active thread.
- Live two-user test verifies sender delivery, receiver delivery without reload, typing, presence, unread state, read timestamp persistence, 14px receipt tooltip, launcher/page state parity, reconnect behavior, and mobile navigation.

## Explicit Scope Decision

This plan intentionally targets Facebook/Messenger parity for the core web messaging workflows. A feature may not be deferred merely because the current foundation did not include it. Any limitation that remains after implementation must be documented as a failed acceptance criterion, not described as parity.
