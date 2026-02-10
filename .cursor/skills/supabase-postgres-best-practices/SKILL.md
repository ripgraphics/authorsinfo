---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices for Supabase, maintained from Supabase's official guidance for AI agents. Covers query performance, indexes, connection management, RLS, schema design, concurrency, and monitoring. Use when writing SQL or designing schemas, adding indexes, reviewing database performance, configuring connection pooling, or working with Row-Level Security (RLS).
task_types: [BUILD, OPTIMIZE, CONSULT, REVIEW]
keywords: [postgres, supabase, query optimization, indexes, RLS, connection pooling, schema, performance, migration]
domains: [supabase, postgresql, database]
always_use: false
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres on Supabase, aligned with [Supabase's Postgres Best Practices for AI Agents](https://supabase.com/blog/postgres-best-practices-for-ai-agents). Apply these rules when writing SQL, designing schemas, or diagnosing performance.

## When to Apply

Reference these guidelines when:

- Writing SQL queries or designing schemas
- Implementing indexes or optimizing queries
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Working with Row-Level Security (RLS)
- Writing or reviewing migrations

## Rule Categories by Priority

| Priority | Category              | Impact      | Focus                    |
|----------|------------------------|------------|--------------------------|
| 1        | Query Performance      | CRITICAL   | EXPLAIN, indexes         |
| 2        | Connection Management  | CRITICAL   | Pooling, limits          |
| 3        | Security & RLS         | CRITICAL   | Policies, least privilege|
| 4        | Schema Design          | HIGH       | Types, constraints       |
| 5        | Concurrency & Locking  | MEDIUM-HIGH| Locks, transactions      |
| 6        | Data Access Patterns   | MEDIUM     | Batching, pagination     |
| 7        | Monitoring & Diagnostics | LOW-MEDIUM| Stats, slow queries    |
| 8        | Advanced Features      | LOW        | Extensions, pgvector     |

## Query Performance (CRITICAL)

### Analyze Before Optimizing

Use `EXPLAIN (ANALYZE, BUFFERS, VERBOSE)` to inspect plans. Look for Sequential Scans on large tables, high cost estimates, and unnecessary nested loops. Supabase provides `index_advisor` for suggesting beneficial indexes.

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT ... ;
```

### Index Strategy

- **WHERE clauses**: Index columns used in filters (e.g. `sign_up_date`, `status`).
- **JOIN columns**: Index foreign keys and join keys; primary keys are already indexed.
- **ORDER BY + LIMIT**: Index sort columns when returning small result sets.

```sql
-- Single column
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_customers_sign_up_date ON customers (sign_up_date);

-- ORDER BY + LIMIT
CREATE INDEX idx_orders_date_of_purchase ON orders (date_of_purchase);
```

### Index Types

Choose the type that fits the data and access pattern:

| Type    | Use case |
|---------|----------|
| B-tree  | Default; equality and range, ORDER BY. |
| BRIN   | Chronologically increasing columns (e.g. `created_at`); often 10x smaller than B-tree. |
| GIN    | JSONB, arrays, full-text. |
| Hash   | Equality only (Postgres 10+). |

```sql
-- BRIN for time-ordered, append-heavy tables
CREATE INDEX idx_orders_created_at ON orders USING BRIN (created_at);
```

### Partial Indexes

Index only the rows that matter. The query's WHERE must match the index predicate.

```sql
CREATE INDEX idx_orders_shipped ON orders (date_of_purchase)
WHERE status = 'shipped';
```

### Composite Indexes

When filtering or joining on multiple columns, one composite index can avoid multiple index lookups. Order columns by selectivity (most selective first) unless the query has ORDER BY on a prefix.

```sql
CREATE INDEX idx_customers_sign_up_priority ON customers (sign_up_date, priority);
```

### Avoid Over-Indexing

Indexes speed reads but slow writes. Only index columns used frequently in WHERE, JOIN, or ORDER BY. Remove indexes that don't improve the query plan.

### Statistics

Keep planner statistics up to date so it can choose indexes correctly. Run `ANALYZE` after bulk changes or periodically.

```sql
ANALYZE customers;
```

## Connection Management (CRITICAL)

- Use connection pooling (Supabase uses PgBouncer). Prefer a single long-lived pool over many short-lived connections.
- Avoid opening a new connection per request in serverless; use a pooled client (e.g. server-side Supabase client with connection reuse).
- Respect `max_connections`; do not assume unlimited connections.

## Security & RLS (CRITICAL)

- Enable Row-Level Security (RLS) on tables that store user-scoped or tenant-scoped data.
- Write policies that express "who can see what" explicitly; avoid permissive policies by default.
- Test policies with different roles; ensure no policy bypass via other operations (e.g. RPC, triggers).
- Prefer RLS over application-only checks for data that is queried directly (e.g. from dashboard or API).

## Schema Design (HIGH)

- Use appropriate types (e.g. `uuid`, `timestamptz`, `numeric` for money).
- Add `NOT NULL` and constraints where the domain requires it.
- Use foreign keys and constraints to preserve integrity; they also help the planner.
- Prefer explicit schema and naming; avoid magic columns or overloaded JSONB for core relational data.

## Concurrency & Locking (MEDIUM-HIGH)

- Keep transactions short; avoid long-running transactions that hold locks.
- Use `SELECT ... FOR UPDATE` only when necessary and with a short transaction.
- Prefer optimistic patterns (e.g. conditional updates, check-and-set) where appropriate to reduce lock contention.

## Data Access Patterns (MEDIUM)

- Use pagination (e.g. `LIMIT` + keyset or offset) for large result sets; avoid unbounded `SELECT *`.
- Batch inserts/updates where practical to reduce round-trips and lock churn.
- Prefer querying only needed columns instead of `SELECT *` when wide tables are involved.

## Monitoring & Diagnostics (LOW-MEDIUM)

- Use `pg_stat_*` views and Supabase dashboard metrics to spot slow queries and connection usage.
- Track long-running queries and lock waits; fix or optimize the heaviest operations first.

## Advanced Features (LOW)

- **pgvector**: Use for embeddings and similarity search; create vector columns with the right dimensions and use appropriate index (e.g. HNSW, IVFFlat).
- **Automatic embeddings**: Supabase supports triggers, pgmq, pg_net, and Edge Functions for generating and storing embeddings; follow Supabase AI docs for patterns.

## References

- **Blog**: [Postgres Best Practices for AI Agents](https://supabase.com/blog/postgres-best-practices-for-ai-agents)
- **Official skill (full rule set)**: [supabase/agent-skills – supabase-postgres-best-practices](https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices)  
  Install via: `npx skills add supabase/agent-skills --skill supabase-postgres-best-practices`
- **Supabase docs**: [Query Optimization](https://supabase.com/docs/guides/database/query-optimization), [Database overview](https://supabase.com/docs/guides/database/overview), [RLS](https://supabase.com/docs/guides/auth/row-level-security)
- **Postgres**: [PostgreSQL docs](https://www.postgresql.org/docs/current/), [Performance Optimization wiki](https://wiki.postgresql.org/wiki/Performance_Optimization)

For per-rule details and more examples, see [reference.md](reference.md) or the official skill references.
