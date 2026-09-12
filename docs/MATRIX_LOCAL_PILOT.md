# Local Matrix Pilot

This is a non-production Synapse pilot for validating Matrix client/crypto integration. It is isolated from the Authors Info Supabase database and does not enable private messaging in the application.

## Prerequisites

- Docker Desktop running.
- Docker Compose available as `docker compose`.
- No production credentials are required.

## Start

From the repository root:

```powershell
docker compose -f docker-compose.matrix-pilot.yml up -d
```

Health check:

```powershell
Invoke-WebRequest http://localhost:8008/health
Invoke-WebRequest http://localhost:8008/_matrix/client/versions
```

Expected: HTTP 200 responses. The homeserver is local-only at `http://localhost:8008` and uses `server_name: localhost`.

## Stop and remove pilot data

```powershell
docker compose -f docker-compose.matrix-pilot.yml down
```

To remove the local pilot database and media volumes as well:

```powershell
docker compose -f docker-compose.matrix-pilot.yml down -v
```

## Security boundary

- This pilot has no federation listener, no public registration, no guest access, no OIDC provider, and no production secrets.
- Do not point production application configuration at this pilot.
- Do not use this pilot for real user data.
- Before application integration, provision a dedicated production Synapse deployment, OIDC client, HTTPS endpoint, backups, media storage, TURN, license/support path, and independent security review.
- The application feature flag remains disabled until those requirements and the E2EE acceptance gates in `docs/MATRIX_PRIVATE_MESSAGING_PILOT.md` pass.
