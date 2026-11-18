#!/usr/bin/env node
/**
 * Verify data integrity between Supabase and Convex production
 * Usage: node scripts/verify-supabase-vs-convex.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { runQuery } from 'convex/http';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load Supabase tables from schema
const supabaseTablesModule = await import('./supabaseTables.js').catch(() => null);
const SUPABASE_PUBLIC_TABLES = supabaseTablesModule?.SUPABASE_PUBLIC_TABLES || [];

// Fallback - read from schema.ts directly if import fails
if (SUPABASE_PUBLIC_TABLES.length === 0) {
  const schemaContent = fs.readFileSync(path.join(rootDir, 'convex', 'schema.ts'), 'utf8');
  const matches = schemaContent.match(/"([^"]+)"/g) || [];
  const tableNames = [...new Set(matches.map(m => m.slice(1, -1)))];
  
  // Filter to likely table names
  const knownTables = new Set([
    'authors', 'books', 'book_authors', 'follows', 'friends', 'groups', 'users',
    'profiles', 'reviews', 'bookmarks', 'reading_lists', 'reading_progress',
    'comments', 'likes', 'notifications', 'messages', 'direct_conversations',
    'group_members', 'group_chat_messages', 'enterprise_audit_trail'
  ]);
  
  for (const name of tableNames) {
    if (knownTables.has(name)) SUPABASE_PUBLIC_TABLES.push(name);
  }
}

console.log(`Verifying ${SUPABASE_PUBLIC_TABLES.length} tables...\n`);

// Connect to Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Connect to Convex via CLI
const convex = await import('execa').then(m => m.execa);

async function getSupabaseCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      // Try alternative method with limit
      const { data, error: err2 } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (err2) return { rows: 0, error: err2.message };
      return { rows: count ?? 0, error: null };
    }
    return { rows: count ?? 0, error: null };
  } catch (e) {
    return { rows: 0, error: e.message };
  }
}

async function getConvexCount(tableName) {
  try {
    const { stdout } = await convex('npx', [
      'convex', 'run',
      '--inline-query',
      `export default query(({ handler }) => handler(async (ctx) => { return await ctx.db.query("${tableName}").count(); }))`,
      '--prod'
    ], { cwd: rootDir });
    
    const match = stdout.match(/\d+/);
    return { rows: match ? parseInt(match[0]) : 0, error: null };
  } catch (e) {
    return { rows: 0, error: e.message.split('\n')[0] };
  }
}

async function main() {
  const results = [];
  const batchSize = 10;
  
  console.log('Phase 1: Querying Supabase...');
  for (let i = 0; i < SUPABASE_PUBLIC_TABLES.length; i += batchSize) {
    const batch = SUPABASE_PUBLIC_TABLES.slice(i, i + batchSize);
    console.log(`  ${i + 1}-${Math.min(i + batchSize, SUPABASE_PUBLIC_TABLES.length)}/${SUPABASE_PUBLIC_TABLES.length}`);
    
    const promises = batch.map(async (table) => {
      const result = await getSupabaseCount(table);
      results.push({ table, source: 'supabase', ...result });
    });
    
    await Promise.all(promises);
  }
  
  console.log('\nPhase 2: Querying Convex...');
  const convexResults = [];
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    console.log(`  ${i + 1}-${Math.min(i + batchSize, results.length)}/${results.length}`);
    
    const promises = batch.map(async (r) => {
      const convexResult = await getConvexCount(r.table);
      r.convexRows = convexResult.rows;
      r.convexError = convexResult.error;
      convexResults.push(r);
    });
    
    await Promise.all(promises);
  }
  
  // Generate report
  const mismatches = convexResults.filter(r => 
    r.supabaseRows !== r.convexRows && 
    !(r.supabaseRows === 0 && r.convexRows === 0)
  );
  
  const missingInConvex = convexResults.filter(r => r.supabaseRows > 0 && r.convexError);
  const missingInSupabase = convexResults.filter(r => r.convexRows > 0 && r.supabaseRows === 0);
  
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  console.log(`\nTotal tables checked: ${convexResults.length}`);
  console.log(`Tables with data mismatch: ${mismatches.length}`);
  console.log(`Tables missing in Convex: ${missingInConvex.length}`);
  console.log(`Tables only in Supabase: ${missingInSupabase.length}`);
  
  if (mismatches.length > 0) {
    console.log('\n--- MISMATCHES ---');
    mismatches.forEach(r => {
      console.log(`${r.table.padEnd(40)} | Supabase: ${String(r.supabaseRows).padStart(6)} | Convex: ${String(r.convexRows).padStart(6)}`);
    });
  }
  
  if (missingInConvex.length > 0) {
    console.log('\n--- MISSING IN CONVEX ---');
    missingInConvex.forEach(r => {
      console.log(`${r.table.padEnd(40)} | Supabase: ${String(r.supabaseRows).padStart(6)} | Convex: ERROR`);
    });
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: convexResults.length,
      matched: convexResults.filter(r => r.supabaseRows === r.convexRows).length,
      mismatched: mismatches.length,
      missingInConvex: missingInConvex.length,
    },
    details: convexResults
  };
  
  const reportPath = path.join(rootDir, 'artifacts', 'verification-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\nFull report saved to: ${reportPath}`);
}

main().catch(console.error);
