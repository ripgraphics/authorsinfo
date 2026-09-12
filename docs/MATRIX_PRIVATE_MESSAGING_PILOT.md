# Matrix Private Messaging Pilot

Status: Local Synapse pilot operational; production deployment credentials, OIDC client, and public homeserver endpoint are still required before runtime integration.

## Decision

Use Matrix/Synapse for private conversations. Keep the Authors Info application as the product UI and authorization system, while Matrix owns encrypted-room transport, encrypted history, device keys, verification, and encrypted media. Keep moderated group/entity channels in Supabase until their privacy and moderation model is separately approved.

Do not store private-message plaintext in Supabase, Next.js logs, push payloads, analytics, or server actions. Do not create a second Supabase-based direct-message implementation that would later need migration to E2EE.

## Required Runtime Configuration

These values must be provisioned through the deployment secret manager, never committed:

```text
MATRIX_HOMESERVER_URL=https://matrix.example.com
MATRIX_SERVER_NAME=example.com
MATRIX_OIDC_CLIENT_ID=...
MATRIX_OIDC_CLIENT_SECRET=...
MATRIX_OIDC_ISSUER=https://auth.example.com
MATRIX_PRIVATE_ROOM_CREATION_ENABLED=false
```

`MATRIX_PRIVATE_ROOM_CREATION_ENABLED` must remain `false` until the acceptance gates below pass. The application also requires `MATRIX_OIDC_ISSUER`, `MATRIX_OIDC_CLIENT_ID`, and `MATRIX_E2EE_SECURITY_APPROVED=true`, plus a successful homeserver version probe. The application must fail closed with a clear unavailable state when any prerequisite is absent; it must not silently create server-readable Supabase conversations.

## Homeserver Requirements

- Synapse runs as a separate Linux/POSIX service or container, not inside a Vercel/Next.js request handler.
- Use a dedicated PostgreSQL database and durable media store. Do not share the Authors Info Supabase schema without an approved isolation design.
- Set an immutable `server_name` and public client URL before creating any pilot users.
- Put HTTPS reverse proxying in front of `/_matrix` and `/_synapse/client`; preserve request paths and configure forwarded headers.
- Disable open registration and guest access. Use OIDC authorization-code flow with PKCE and stable subject-to-MXID mapping.
- Start with federation disabled or a strict private allowlist. Do not expose admin or worker replication listeners.
- Configure encrypted private rooms by default for invite-only rooms. Push notifications must exclude message bodies.
- Keep URL previews disabled until SSRF controls and privacy policy are reviewed.
- Configure backups for the database, media store, configuration, and signing key. Rehearse restoration before pilot data is accepted.
- Configure TURN before calls are enabled. Calls are a later phase and require their own E2EE/key-distribution review.

## Application Integration Contract

1. Resolve the authenticated Authors Info user through the existing Supabase session.
2. Exchange the approved OIDC session for a Matrix client session without exposing provider secrets to the browser.
3. Map the immutable Supabase user ID to one Matrix localpart. Display names and email addresses are not identity keys.
4. Create or resolve a direct Matrix room through a server-side integration boundary. The room must be invite-only and encrypted before its first private message.
5. Initialize the browser Matrix crypto store exactly once per user/device and isolate IndexedDB state on logout or account switch.
6. Initialize Rust/WASM crypto, cross-signing, secret storage, recovery, device verification, and key backup before allowing private sends.
7. Render Matrix timeline events through the shared conversation UI contract. The inbox must not duplicate the group-chat renderer.
8. Reconcile Supabase block/restriction state before room creation, invite, send, and room access. A block must prevent new private-room operations.
9. Report only ciphertext-safe metadata to Supabase analytics. Do not proxy decrypted message bodies through the Next.js server.

## Acceptance Gates

- Two real pilot accounts authenticate through OIDC and map deterministically to their existing Authors Info IDs.
- A private room is encrypted before any message event is sent; downgrade attempts are rejected.
- Messages remain readable after reload and browser restart using the approved recovery flow.
- A second browser/device can be verified and receive keys without the homeserver receiving plaintext.
- Logout and account switching cannot reuse another user’s IndexedDB crypto store.
- Revoked devices cannot receive new room keys; membership changes rotate future encryption sessions.
- The homeserver database, logs, push payloads, Supabase rows, and Next.js server logs contain no private plaintext.
- Blocked users cannot create or access new private conversations.
- Encrypted attachments remain encrypted at rest and can be decrypted only by authorized room devices.
- The pilot works under the application’s CSP, supported browser matrix, and production build.
- Independent security review approves the crypto/provider configuration before enabling the feature flag.

## Local Pilot Status

The isolated local pilot is running through `docker-compose.matrix-pilot.yml`:

- Synapse endpoint: `http://localhost:8008`
- PostgreSQL: dedicated `matrix-db` container with C collation and UTF-8 encoding
- Federation: disabled by configuration
- Registration: disabled by configuration
- Health endpoint: verified HTTP 200
- Matrix client versions endpoint: verified HTTP 200
- TURN pilot: coturn is available on UDP/TCP port 3478 with local-only credentials.
- Production Authors Info Supabase schema: untouched

Start or inspect it with:

```powershell
docker compose -f docker-compose.matrix-pilot.yml up -d
docker compose -f docker-compose.matrix-pilot.yml ps
Invoke-WebRequest http://localhost:8008/health
Invoke-WebRequest http://localhost:8008/_matrix/client/versions
```

The pilot currently validates homeserver/database operations only. It does not yet validate Authors Info OIDC mapping, browser Rust/WASM crypto initialization, device verification, recovery, or private-room creation from the application.

Cloudinary remains the existing Authors Info provider for public/entity media. It is not a substitute for Matrix authenticated media or private E2EE storage because Cloudinary transformation/CDN URLs do not provide device-key access control. The pilot keeps Matrix media storage separate; production private media requires a reviewed encrypted-object storage design.

The application exposes `GET /api/messages/capabilities` for a truthful capability check. It reports private messaging as unavailable unless both `MATRIX_HOMESERVER_URL` and `MATRIX_PRIVATE_ROOM_CREATION_ENABLED=true` are present. The endpoint does not expose secrets, does not create rooms, and does not enable a server-readable fallback.

When `MATRIX_HOMESERVER_URL` is configured, the capability endpoint performs a bounded server-side request to `/_matrix/client/versions` and reports reachability and advertised Matrix versions. It does not enable private rooms; the explicit feature flag and all E2EE acceptance gates remain required.

## Current Production Blocker

No production Matrix homeserver URL, OIDC client, deployment owner, or provider secrets are available in this workspace. The VS Code MCP registry currently contains only `container-use`; no Supabase or Matrix MCP is installed or running. The local pilot is operational, but production integration remains disabled until OIDC/domain/security review and the E2EE acceptance gates pass.