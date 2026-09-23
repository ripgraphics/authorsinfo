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
| `[>]` Inventory event pages/APIs/tables/policies | `IN PROGRESS` | Event pages, public listing, registration, and message-target resolution exist | Produce live route/schema/policy inventory |
| `[>]` Approve event privacy and guest-list matrix | `IN PROGRESS` | Live RLS now gates event participant rows through `can_view_event_participants`; routes require creator/RSVP membership and filter reciprocal blocks; live public participant read returns `200`; isolated non-member private read returns `403` | Run private-event member guest-list browser acceptance |
| `[>]` Complete host/co-host lifecycle | `IN PROGRESS` | Creator-only `PATCH /api/events/[id]/participants/[participantId]` assigns attendee/host/co-host/speaker/moderator roles; creators cannot self-demote; live RLS permits creator role assignment and prevents participant self-promotion; focused suite passes 14/14 | Add role-change audit trail and host removal workflow |
| `[>]` Complete RSVP/capacity/waitlist lifecycle | `IN PROGRESS` | RSVP participant route rejects duplicate/concurrent duplicate RSVPs with stable `400/409`; registration requires private-event access and enforces live `max_participants`/`max_attendees`; live registration RLS is owner/creator scoped | Add waitlist and cancellation rules |
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

Current shared-event evidence: public participant/comment reads hide reciprocal-blocked users per viewer; private participant/comment reads require creator or RSVP membership; private registration requires creator/participant access; public/shared RSVP remains available; event privacy/RSVP suite passes 5/5 and registration route suite passes 2/2; isolated Wendy acceptance returns participant `200` and duplicate RSVP `400` for the seeded public event; isolated Bob non-member access to the seeded private event returns `403` for participants and comments. No authorized member exists for the seeded private event, so member acceptance remains open without mutating live data.

Live database evidence: `event_registrations` no longer has public read access; registration rows are visible only to the registrant or event creator, and inserts/updates require the authenticated owner. Live event capacity fields `max_attendees` and `max_participants` are enforced by application registration/RSVP checks.

Role integrity evidence: live `event_participants_update_rsvp_only` preserves the stored participant role during self-updates, preventing self-promotion to host/co-host/moderator. Host/co-host assignment remains future work and requires an explicit authenticated mutation contract.

Creator role management evidence: authenticated creator-only participant-role PATCH route and live `event_participants_creator_role_update` RLS policy are implemented; focused role/privacy tests pass 14/14 and the production build passes. Audit logging and removal lifecycle remain open.

## 4. Blocking Boundary Acceptance

Facebook-style event behavior requires:

- A blocked user cannot directly invite, message, tag, follow, or call the other user through an event.
- Public event discovery remains governed by event visibility and does not become a private profile bypass.
- Private event details, guest lists, discussions, and attendance remain restricted by event privacy and authorization.
- Group-scoped events inherit group membership and moderation rules.
- Host/co-host moderation can remove or restrict a participant independently of the user block relationship.

**Current evidence:** direct messaging, follows, friend requests, mentions, notifications, feeds, and timelines enforce reciprocal blocks. Event RSVP, guest-list, and shared-event acceptance remain future work and are intentionally not marked complete.
