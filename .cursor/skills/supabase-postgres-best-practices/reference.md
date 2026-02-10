# Supabase Postgres Best Practices – Reference

This skill is derived from Supabase's official guidance for AI agents. Use this file for links and deeper context.

## Source

- **Blog**: [Introducing: Postgres Best Practices](https://supabase.com/blog/postgres-best-practices-for-ai-agents) – announcement and overview.
- **Official skill**: [supabase/agent-skills](https://github.com/supabase/agent-skills) – skill `supabase-postgres-best-practices` with full rule set and per-rule reference files.

## Install Official Skill (Optional)

To get the full set of rule files (e.g. `query-missing-indexes`, `schema-partial-indexes`) in addition to this project skill:

```bash
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices
```

## Supabase Documentation

| Topic | URL |
|-------|-----|
| Query optimization | https://supabase.com/docs/guides/database/query-optimization |
| index_advisor | https://supabase.com/docs/guides/database/extensions/index_advisor |
| Database overview | https://supabase.com/docs/guides/database/overview |
| Row-Level Security | https://supabase.com/docs/guides/auth/row-level-security |
| Vector columns (pgvector) | https://supabase.com/docs/guides/ai/vector-columns |
| Automatic embeddings | https://supabase.com/docs/guides/ai/automatic-embeddings |

## PostgreSQL

- [Current docs](https://www.postgresql.org/docs/current/)
- [Index types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Performance Optimization wiki](https://wiki.postgresql.org/wiki/Performance_Optimization)

## Project Alignment

This project uses Supabase and the CLI; see the **supabase-expert** and **supabase-project** skills for project-specific commands, migrations, and type generation.
