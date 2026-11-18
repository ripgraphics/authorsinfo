#!/usr/bin/env node
/**
 * Quick verification of row counts between Supabase and Convex
 * Usage: node scripts/quick-verify.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const rootDir = process.cwd();

// Get table list from schema
const schemaPath = path.join(rootDir, 'convex', 'schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Extract table names from SUPABASE_PUBLIC_TABLES array
const tableMatches = schemaContent.matchAll(/["'](\w+)["']/g);
const tables = new Set();
for (const match of tableMatches) {
  const name = match[1];
  if (name && name.length > 1 && !name.startsWith('__')) {
    tables.add(name);
  }
}

const tableList = Array.from(tables).sort();
console.log(`Found ${tableList.length} tables in schema\n`);

// Connect to Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getCounts() {
  const results = [];
  
  console.log('Getting Supabase counts...');
  for (const table of tableList) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      results.push({
        table,
        supabase: error ? null : (count || 0),
        supabaseError: error?.message || null
      });
    } catch (e) {
      results.push({
        table,
        supabase: 0,
        supabaseError: e.message
      });
    }
  }
  
  console.log('\nGetting Convex counts...');
  for (let i = 0; i < results.length; i++) {
    if (i % 10 === 0) {
      console.log(`  ${i}/${results.length}...`);
    }
    
    const table = results[i].table;
    try {
      const query = `export default query(({ handler }) => handler(async (ctx) => { return await ctx.db.query("${table}").count(); }))`;
      
      const output = execFileSync(
        'npx',
        ['convex', 'run', '--inline-query', query, '--prod'],
        { cwd: rootDir, encoding: 'utf8', timeout: 30000 }
      );
      
      const match = output.match(/(\d+)/);
      results[i].convex = match ? parseInt(match[1]) : 0;
    } catch (e) {
      results[i].convex = null;
      results[i].convexError = e.message.split('\n')[0];
    }
  }
  
  return results;
}

async function main() {
  const results = await getCounts();
  
  const matched = results.filter(r => 
    r.supabase !== null && r.convex !== null && r.supabase === r.convex
  );
  const mismatched = results.filter(r => 
    r.supabase !== null && r.convex !== null && r.supabase !== r.convex
  );
  const failed = results.filter(r => r.convex === null);
  
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total tables: ${results.length}`);
  console.log(`Matched: ${matched.length}`);
  console.log(`Mismatched: ${mismatched.length}`);
  console.log(`Failed: ${failed.length}`);
  
  if (mismatched.length > 0) {
    console.log('\n--- MISMATCHES ---');
    mismatched.forEach(r => {
      console.log(`${r.table.padEnd(45)} | Supabase: ${(r.supabase||'ERR').toString().padStart(6)} | Convex: ${r.convex}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n--- FAILURES ---');
    failed.slice(0, 20).forEach(r => {
      console.log(`${r.table.padEnd(45)} | ${r.convexError || 'Unknown error'}`);
    });
    if (failed.length > 20) {
      console.log(`  ... and ${failed.length - 20} more`);
    }
  }
  
  // Save report
  const reportPath = path.join(rootDir, 'artifacts', 'quick-verify-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
