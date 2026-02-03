# AGENTS.md

Instructions for AI coding agents working on this codebase.

## Project Overview

Enterprise authors and books platform built with Next.js 16 (App Router), React 19, TypeScript, Supabase, Tailwind CSS, and shadcn/ui. Deployed on Vercel.

---

## Setup Commands

```bash
npm install
npm run dev
```

- Dev server runs on port 3034
- Environment: create `.env.local` with `SUPABASE_DB_*` and other required variables (see docs)

---

## Build and Test Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Jest unit tests |
| `npm run test:watch` | Jest watch mode |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run types:generate` | Regenerate Supabase TypeScript types (run after schema changes) |
| `npm run db:types` | Alias for types:generate |

---

## Database and Migrations

- **Single source of truth:** Use the **live Supabase** project as the source of truth for schema and data. Do not assume or infer schema from local state or outdated docs.
- **Apply migrations:** Use Supabase CLI: `npx supabase db push`
- **Never** run database reset or destructive commands unless explicitly requested and approved
- **Schema changes:** Check actual columns in each table before writing migrations; never assume schema
- **Schema verification:** Verify schema against live Supabase before writing migrations or types. Consider running `npm run types:check` to compare generated types with the live project.
- See [docs/public-docs/CLI_USAGE_GUIDE.md](docs/public-docs/CLI_USAGE_GUIDE.md) for full CLI usage and troubleshooting

---

## Code Style and Conventions

### TypeScript
- Strict mode; no `any`
- camelCase for variables and functions; PascalCase for components and types
- Use path aliases: `@/components`, `@/lib`, `@/hooks`, `@/utils`, `@/types`

### Error Handling
- Use `handleError` from `@/lib/error-handler` in API routes and Server Actions
- Avoid raw `error.message` in client responses (security risk)
- For API routes and Server Actions: use `nextErrorResponse()`, `handleDatabaseError()`, or `handleError()` from `@/lib/error-handler`. Never return raw `error.message` or `error.stack` to clients.

```typescript
import { handleError } from '@/lib/error-handler'

try {
  // ... operation
} catch (error) {
  const { error: message } = handleError(error, 'Operation failed')
  return NextResponse.json({ error: message }, { status: 500 })
}
```

### Server Actions
- Include `'use server'` directive
- Call `revalidatePath` or `revalidateTag` after mutations that affect cached data

---

## Component and UI Conventions

- **Fully reusable components:** Every component must be usable anywhere in the application. No hardcoded routes, page-specific logic, or assumptions about where the component will render.
- **Expand, do not duplicate:** Always extend an existing component rather than creating a new one for the same purpose. Search first; if a similar component exists, refactor and expand it.
- **UI primitives:** Use `components/ui/` (shadcn) before building custom components
- **Before creating components:** Search `components/ui/`, `components/enterprise/`, `components/entity/`, `components/group/` for existing solutions
- **Component consolidation:** Before creating a new component, check [docs/REDUNDANT_COMPONENTS_ANALYSIS.md](docs/REDUNDANT_COMPONENTS_ANALYSIS.md). Consolidate or extend existing components instead of duplicating. If a similar component exists in those directories, refactor and expand it rather than creating a new file.
- **Reusability:** Components accept data via props only; avoid hardcoded API calls or direct data-fetching hooks in presentational components
- **Data fetching:** Prefer passing data via props. Avoid `fetch()` inside presentational components; use container components or page-level data fetching so components remain reusable in any context.

---

## Architecture and Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router: pages, layouts, API routes, Server Actions |
| `components/` | UI components; `components/ui/` = shadcn primitives |
| `lib/` | Utilities, error-handler, logger |
| `hooks/` | Custom React hooks |
| `types/` | TypeScript types; Supabase types in `types/supabase.ts` |
| `utils/` | Helper functions |
| `contexts/` | React contexts |
| `supabase/migrations/` | SQL migrations |

---

## Post-Edit Verification

- **Test after every edit:** After completing any code change, run tests and verify the code works as expected before finishing.
- **Required checks:** Run at minimum: `npm run build`, `npm run lint`. Where applicable: `npm run test` and `npm run test:e2e`. Report the actual output of these commands; do not assume success.
- **Completion summary:** Do **not** assume or state that code works. Run the tests first. In the completion summary, state **facts only** based on actual test output (e.g., "Build passed", "Lint passed", "Tests X and Y passed") or report failures if any occurred.

## What Not to Do

- **No database resets** or destructive migrations without explicit user approval
- **No schema assumptions** in SQL; verify columns exist before writing migrations
- **No `any`**; use proper types
- **No scope expansion**; clarify when requirements are ambiguous instead of guessing
- **No raw error exposure**; use `handleError` for client-facing error responses
- **No assumptions in completion summaries**; verify with tests first, then report facts only

---

## Reference Documentation

- [docs/README_START_HERE.md](docs/README_START_HERE.md) - Project summary and phase overview
- [docs/public-docs/CLI_USAGE_GUIDE.md](docs/public-docs/CLI_USAGE_GUIDE.md) - Supabase CLI usage
- [docs/INDEX.md](docs/INDEX.md) - Code quality, roadmap, and task index
