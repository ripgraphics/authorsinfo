// scripts/supabase-comment-audit.mjs
// Read-only Supabase comment audit
// Usage: DATABASE_URL="postgres://user:pass@host:5432/db" node scripts/supabase-comment-audit.mjs [--count]

import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error('ERROR: Set DATABASE_URL (or SUPABASE_DB_URL) to your Postgres connection string');
  process.exit(2);
}

const client = new Client({ connectionString: DATABASE_URL });
const doCount = process.argv.includes('--count');
const outFile = 'supabase-comment-audit.json';

async function safeIdent(name){
  // Quote identifier by doubling quotes
  return '"' + name.replace(/"/g, '""') + '"';
}

(async function main(){
  try{
    await client.connect();

    const objectsRes = await client.query(`
      SELECT c.relname AS name,
             CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized_view' ELSE c.relkind END AS type
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname ILIKE '%comment%'
      ORDER BY c.relname;
    `);

    const results = [];
    for(const row of objectsRes.rows){
      const name = row.name;
      const type = row.type;

      const cols = (await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name = $1
        ORDER BY ordinal_position
      `,[name])).rows;

      const pk = (await client.query(`
        SELECT a.attname AS column
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary
      `,[name])).rows.map(r=>r.column);

      const fks = (await client.query(`
        SELECT
          tc.constraint_name, kcu.column_name, ccu.table_name AS references_table, ccu.column_name AS references_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name = $1
      `,[name])).rows;

      const indexes = (await client.query(`
        SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename = $1
      `,[name])).rows;

      const triggers = (await client.query(`
        SELECT tgname, tgtype::int, tgenabled FROM pg_trigger WHERE tgrelid = $1::regclass
      `,[name])).rows;

      const policies = (await client.query(`
        SELECT policyname, permissive, roles, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename = $1
      `,[name])).rows;

      const estimate = (await client.query(`
        SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = $1
      `,[name])).rows[0]?.estimate || null;

      let count = null;
      if(doCount){
        try{
          const ident = await safeIdent(name);
          const cRes = await client.query(`SELECT COUNT(*)::bigint AS c FROM public.${ident}`);
          count = cRes.rows[0].c;
        }catch(e){
          count = `ERROR: ${e.message}`;
        }
      }

      results.push({ name, type, columns: cols, primary_key: pk, foreign_keys: fks, indexes, triggers, policies, estimate, count });
    }

    const output = { success: true, objects: results, ran_at: new Date().toISOString() };
    fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
    console.log(`Wrote ${outFile} with ${results.length} objects.`);
    await client.end();
    process.exit(0);
  }catch(err){
    console.error('ERROR', err.message || err);
    try{ await client.end(); }catch(e){}
    process.exit(3);
  }
})();
