#!/usr/bin/env node
/**
 * Bulk-import ALL Supabase tables that contain data into a Convex deployment.
 *
 * - The Convex schema defines every table with v.any(), so raw rows import fine.
 * - The 11 core tables have hand-written camelCase transforms; use those when present.
 * - Everything else imports raw JSONL from the Supabase export.
 *
 * Usage:
 *   node scripts/import-all-tables.mjs                 # dev deployment
 *   node scripts/import-all-tables.mjs --prod          # prod deployment
 *   node scripts/import-all-tables.mjs --only posts,comments
 */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'artifacts', 'supabase-convex-import-20261109-retry');
const TRANSFORMED_DIR = path.join(ROOT, 'artifacts', 'supabase-convex-transformed');

const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const onlyArg = args.find(a => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice('--only='.length).split(',').map(s => s.trim()) : null;

// 11 tables that have camelCase transforms (must use transformed files)
const TRANSFORMED_TABLES = new Set([
  'authors', 'books', 'book_authors', 'users', 'follows',
  'reading_progress', 'profiles', 'publishers', 'groups',
  'group_members', 'notifications',
]);

const manifestPath = path.join(RAW_DIR, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Tables with data, sorted by row count ascending (small first = fast feedback)
let tables = Object.entries(manifest.tables)
  .filter(([, count]) => count > 0)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => a.count - b.count);

if (only) {
  tables = tables.filter(t => only.includes(t.name));
}

function resolveFile(table) {
  if (TRANSFORMED_TABLES.has(table)) {
    const p = path.join(TRANSFORMED_DIR, table, 'documents.jsonl');
    if (fs.existsSync(p)) return { path: p, transformed: true };
  }
  return { path: path.join(RAW_DIR, table, 'documents.jsonl'), transformed: false };
}

function importTable({ name, count }) {
  const { path: file, transformed } = resolveFile(name);
  if (!fs.existsSync(file)) {
    console.log(`  ⏭ ${name}: source file missing`);
    return { ok: false, name, reason: 'missing file' };
  }

  const rows = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).length;
  const tag = transformed ? 'transformed' : 'raw';
  console.log(`  → ${name} (${rows} rows, ${tag}) ...`);

  const deployFlag = isProd ? ' --prod' : '';
  const cmd = `npx convex import --table ${name} --replace --yes${deployFlag} "${file}"`;

  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const added = /Added (\d+) documents/.exec(out);
    console.log(`    ✓ ${name}: ${added ? added[1] : rows} documents`);
    return { ok: true, name, rows };
  } catch (err) {
    const msg = (err.stdout || '') + (err.stderr || '') + (err.message || '');
    console.log(`    ✗ ${name} FAILED: ${msg.split('\n').slice(0, 3).join(' | ')}`);
    return { ok: false, name, reason: msg.slice(0, 200) };
  }
}

console.log(`\n📦 Target: ${isProd ? 'PRODUCTION' : 'DEV'} deployment`);
console.log(`   Tables with data: ${tables.length}`);
console.log(`   Total rows: ${tables.reduce((a, t) => a + t.count, 0)}\n`);

const results = [];
for (const t of tables) {
  results.push(importTable(t));
}

const ok = results.filter(r => r.ok);
const failed = results.filter(r => !r.ok);
const totalRows = ok.reduce((a, r) => a + (r.rows || 0), 0);

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Imported: ${ok.length}/${results.length} tables, ~${totalRows} rows`);
if (failed.length) {
  console.log(`✗ Failed (${failed.length}):`);
  failed.forEach(f => console.log(`    ${f.name}: ${f.reason}`));
}
console.log('');
process.exitCode = failed.length ? 1 : 0;
