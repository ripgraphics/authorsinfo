# Facebook Events Parity Plan

**Status:** Future work, not yet started  
**Dependency:** Groups privacy, notifications, identity, and blocking contracts.

## 1. Product Contract

Events should provide Facebook-style event discovery, participation, hosting, and communication:

- Public, private, and group-scoped event visibility with privacy-safe previews.
- Event discovery, search, recommendations, categories, location/date filters, and shareable links.
- Event creation, editing, cancellation, rescheduling, deletion, and host/co-host management.
- RSVP states: Going, Interested, Not going, Invited, Waitlisted, and declined where capacity applies.
- Guest lists and attendee visibility controlled by event privacy and user settings.
- Event discussions, announcements, comments, reactions, questions, polls, and host moderation.
- Reminders, notification preferences, calendar export, timezone-safe scheduling, and change notifications.
- Group events inherit group membership and moderation rules without exposing private group data.
- Messaging targets resolve only to authorized event owners/co-hosts/admins; event IDs are never treated as user IDs.
- Blocked users cannot directly invite, message, tag, or interact with one another through an event; shared event visibility follows the event privacy contract.

## 2. Phase Tracker

| Item | Status | Evidence | Next action |
| --- | --- | --- | --- |
| `[>]` Inventory event pages/APIs/tables/policies | `IN PROGRESS` | Event pages, registration, and target resolution exist | Produce live route/schema/policy inventory |
| `[ ]` Approve event privacy and guest-list matrix | `NOT STARTED` | Public/private behavior is not fully documented | Define visibility and attendee rules |
| `[ ]` Complete host/co-host lifecycle | `NOT STARTED` | Creator target resolution exists | Add co-host roles, permissions, and audit trail |
| `[ ]` Complete RSVP/capacity/waitlist lifecycle | `NOT STARTED` | Registration button exists | Add durable states, capacity, waitlist, and cancellation rules |
| `[ ]` Complete event discussion and moderation | `NOT STARTED` | Messaging target route exists | Add event feed/comment/report/moderation contract |
| `[ ]` Complete reminders and notifications | `NOT STARTED` | Generic notification infrastructure exists | Add timezone-safe reminders and preference controls |
| `[ ]` Complete group-event integration | `NOT STARTED` | Group event routes exist | Align group membership, visibility, and host permissions |
| `[ ]` Complete calendar/share/accessibility acceptance | `NOT STARTED` | No complete acceptance matrix | Add browser and mobile verification |
| `[ ]` Release with owner/attendee/two-account acceptance | `NOT STARTED` | Focused target tests exist | Add persistent browser suite and evidence ledger |

## 3. Release Gates

- Event privacy is enforced server-side for every read and mutation.
- RSVP and guest-list data do not leak across private boundaries.
- Host/co-host actions are authenticated, role-aware, and auditable.
- Date/time behavior is timezone-safe and tested across browser locales.
- Block, report, and moderation behavior is consistent with the blocking and groups parity plans.
