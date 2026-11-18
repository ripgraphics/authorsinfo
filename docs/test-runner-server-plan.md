# E2E Test Runner Server — Architecture & Implementation Plan

**Date:** 2026-10-25  
**Status:** Planning  
**Target:** Deploy to Hostinger VPS or separate cloud service

---

## 1. Problem Statement

The current E2E test runner in `app/admin/settings/test-runner/page.tsx` spawns Playwright via a Next.js Server Action. This works locally but fails on Vercel serverless because:

1. No browser binaries installed (Playwright requires Chromium/Firefox/WebKit)
2. Serverless functions have 60s timeout limits (tests take 30-60s each)
3. No persistent process to manage test state

**Goal:** Build a dedicated test runner server that runs on persistent infrastructure with browsers pre-installed, exposing an API that the admin panel can call from anywhere.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js Admin Panel (Vercel)                         │  │
│  │  - Test Runner UI at /admin/settings/test-runner      │  │
│  │  - Calls API: POST https://test-runner.yourdomain.com  │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Test Runner Server (Node.js)                   │
│  - Express/Fastify API                                      │
│  - Playwright (Chromium only)                               │
│  - Runs tests against production API                        │
│  - Stores results in SQLite/PostgreSQL                      │
│  - Serves test history via WebSocket or polling             │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
│  - authorsinfo.com API (target of E2E tests)                │
│  - Supabase (user creation, fixture management)             │
│  - Optional: GitHub (trigger on push, store artifacts)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Phases

### Phase 1: Core Server (1-2 days)
- [ ] Create `test-runner-server/` directory
- [ ] Set up Express + TypeScript project
- [ ] Install Playwright (Chromium only for now)
- [ ] Create API endpoints:
  - `POST /api/run-test` — run a single test by ID
  - `POST /api/run-all` — run all tests sequentially
  - `GET /api/tests` — get test definitions
  - `GET /api/results/:id` — get result for a specific test run
  - `GET /api/history` — get recent test runs
- [ ] Add API key authentication middleware
- [ ] Write tests for the server itself

### Phase 2: Test Execution Engine (1 day)
- [ ] Port existing Playwright test logic from `tests-e2e/group-chat-production.spec.ts`
- [ ] Create test definition schema (ID, name, grep pattern, timeout)
- [ ] Implement result collection (pass/fail, duration, error message)
- [ ] Add result caching in memory (or SQLite for persistence)

### Phase 3: Security & Access Control (0.5 days)
- [ ] API key rotation mechanism
- [ ] Rate limiting (prevent abuse)
- [ ] CORS configuration for Vercel origin
- [ ] Admin-only access check (verify JWT if needed)

### Phase 4: Integration with Admin Panel (0.5 days)
- [ ] Update `app/actions/run-e2e-test.ts` to call external API instead of local spawn
- [ ] Add environment variable for test server URL
- [ ] Add environment variable for API key
- [ ] Handle errors gracefully (server unavailable, timeout, etc.)

### Phase 5: Deployment (0.5 days)
- [ ] Dockerfile for containerized deployment
- [ ] Railway/Railway configuration (or Hostinger VPS setup)
- [ ] Environment variables setup
- [ ] Health check endpoint

---

## 4. API Design

### POST /api/run-test

Request:
```json
{
  "testId": "auth-read-send",
  "apiKey": "your-secret-key"
}
```

Response (200):
```json
{
  "id": "run-abc123",
  "status": "running",
  "testId": "auth-read-send",
  "startedAt": "2026-10-25T10:30:00Z"
}
```

Polling Response (after completion):
```json
{
  "id": "run-abc123",
  "status": "passed",
  "testId": "auth-read-send",
  "testName": "Active member can read and send",
  "duration": "31.8s",
  "startedAt": "2026-10-25T10:30:00Z",
  "completedAt": "2026-10-25T10:30:32Z",
  "error": null
}
```

### POST /api/run-all

Request:
```json
{
  "apiKey": "your-secret-key"
}
```

Response:
```json
{
  "id": "run-all-xyz789",
  "status": "running",
  "tests": ["auth-read-send", "member-removal", "security-forged", "realtime-delivery"],
  "startedAt": "2026-10-25T10:30:00Z"
}
```

### GET /api/tests

Response:
```json
{
  "tests": [
    {
      "id": "auth-read-send",
      "name": "Active member can read and send",
      "category": "Authorization",
      "description": "Verifies active members get 200/201 while nonmembers and suspended users get 403.",
      "grepPattern": "active member can read"
    }
  ]
}
```

### GET /api/history

Query params: `limit=10`, `testId=auth-read-send`

Response:
```json
{
  "runs": [
    {
      "id": "run-abc123",
      "testId": "auth-read-send",
      "status": "passed",
      "duration": "31.8s",
      "startedAt": "2026-10-25T10:30:00Z"
    }
  ],
  "total": 47
}
```

---

## 5. Environment Variables

### Test Runner Server
```bash
PORT=3000
API_KEY=your-generated-secret-key
NEXT_PUBLIC_SITE_URL=https://authorsinfo.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=sqlite://./test-results.db
LOG_LEVEL=info
CORS_ORIGIN=https://authorsinfo.com
```

### Next.js Admin Panel (Vercel)
```bash
TEST_RUNNER_API_URL=https://test-runner.yourdomain.com
TEST_RUNNER_API_KEY=your-generated-secret-key
```

---

## 6. Deployment Options

### Option A: Railway (Recommended)
- Free tier: 512MB RAM, 512MB storage, 500 execution minutes/month
- Persistent containers (not serverless)
- Auto-deploy from GitHub
- Built-in PostgreSQL support
- Cost: Free for light usage, $5/month for more resources

### Option B: Render
- Free tier: 750 hours/month (enough for 1 small instance)
- Persistent web services
- Auto-deploy from GitHub
- Built-in Postgres (paid)

### Option C: Hostinger VPS
- Already have infrastructure
- Full control
- More setup required
- Cost: Depends on plan

### Option D: Fly.io
- Free allowance: 3 shared CPU instances
- Global edge network
- Good for low-traffic services

---

## 7. Security Considerations

1. **API Key Authentication**: All requests must include a valid API key in header:
   ```
   Authorization: Bearer your-secret-key
   ```

2. **Rate Limiting**: Prevent abuse with rate limits:
   - 10 requests/minute per IP
   - 100 requests/hour per API key

3. **CORS**: Configure to only allow requests from `https://authorsinfo.com`

4. **Test Isolation**: Each test run creates isolated fixtures, never touches production data permanently

5. **Error Handling**: Don't expose internal paths or stack traces in responses

---

## 8. File Structure

```
test-runner-server/
├── src/
│   ├── index.ts                  # Entry point
│   ├── server.ts                 # Express setup
│   ├── routes/
│   │   ├── tests.ts              # GET /api/tests
│   │   ├── run.ts                # POST /api/run-test, POST /api/run-all
│   │   └── history.ts            # GET /api/history
│   ├── services/
│   │   ├── playwright-runner.ts  # Test execution engine
│   │   └── result-store.ts       # In-memory/SQLite storage
│   ├── middleware/
│   │   ├── auth.ts               # API key validation
│   │   ├── rate-limit.ts         # Rate limiting
│   │   └── cors.ts               # CORS configuration
│   └── types.ts                  # TypeScript interfaces
├── tests/
│   └── server.test.ts            # Server unit tests
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 9. Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| Railway Free Tier | $0 | 500 min/month, 512MB RAM |
| Railway Pro | $5/mo | More resources, private domains |
| Render Free | $0 | 750 hours/month |
| Fly.io Free | $0 | 3 shared CPU instances |
| Hostinger VPS | ~$10/mo | If already paid for |

**Recommendation:** Start with Railway free tier. Upgrade to $5/mo if you need more capacity.

---

## 10. Implementation Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core Server | 1-2 days | None |
| Phase 2: Test Engine | 1 day | Phase 1 complete |
| Phase 3: Security | 0.5 days | Phase 2 complete |
| Phase 4: Admin Integration | 0.5 days | Phase 3 complete |
| Phase 5: Deployment | 0.5 days | Phase 4 complete |
| **Total** | **4-5 days** | |

---

## 11. Next Steps

1. **Decide on deployment platform** (Railway vs Render vs Hostinger VPS)
2. **Create repository** for test-runner-server (can be subfolder or separate repo)
3. **Initialize project** with Express + TypeScript + Playwright
4. **Implement Phase 1** (core API endpoints)
5. **Test locally** before deploying
6. **Deploy to chosen platform**
7. **Update Next.js admin panel** to call external API
8. **Add environment variables** to Vercel and test server

---

## 12. Success Criteria

- [ ] Test runner server runs independently of Vercel
- [ ] Admin panel shows test results from server
- [ ] All 4 E2E tests pass against live production
- [ ] Test history is preserved between runs
- [ ] API key authentication prevents unauthorized access
- [ ] Deployment takes < 5 minutes

---

*This plan will be implemented when you're ready to continue.*
