#!/usr/bin/env node
/**
 * Import missing tables from Supabase to Convex
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env new copy .local' });

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\r\n|\n|\r/g, '').trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\r\n|\n|\r/g, '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Tables that need to be imported
const MISSING_TABLES = [
  'book_subjects',
  'enterprise_audit_trail',
  'engagement_analytics',
  'photo_albums',
  'posts',
  'views',
  'likes',
  'enterprise_data_quality_rules',
  'enterprise_data_lineage',
  'group_invitations'
];

async function exportTable(tableName) {
  const exportDir = path.join(process.cwd(), 'artifacts', 'missing-tables', tableName);
  fs.mkdirSync(exportDir, { recursive: true });
  
  const outputPath = path.join(exportDir, 'documents.jsonl');
  let offset = 0;
  let rowCount = 0;
  const BATCH_SIZE = 500;
  
  // Get count first
  const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
  console.log(`  ${tableName}: ${count || 0} rows to export`);
  
  if (!count) return 0;
  
  const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  
  while (offset < count) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.error(`  Error exporting ${tableName}: ${error.message}`);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    for (const row of data) {
      const line = JSON.stringify(row);
      output.write(`${line}\n`);
      rowCount++;
    }
    
    offset += data.length;
    console.log(`    Exported ${rowCount}/${count}...`);
  }
  
  output.end();
  return rowCount;
}

async function importToConvex(tableName) {
  const inputPath = path.join(process.cwd(), 'artifacts', 'missing-tables', tableName, 'documents.jsonl');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`  No file found for ${tableName}`);
    return 0;
  }
  
  try {
    const result = execSync(
      `npx convex import "${inputPath}" --table ${tableName} --replace --deployment sleek-gerbil-105`,
      { encoding: 'utf8', timeout: 120000 }
    );
    console.log(`  Imported ${tableName}`);
    return 1;
  } catch (e) {
    console.error(`  Failed to import ${tableName}: ${e.message.split('\n')[0]}`);
    return 0;
  }
}

async function main() {
  console.log('=== IMPORTING MISSING TABLES ===\n');
  
  let success = 0;
  let failed = 0;
  
  for (const table of MISSING_TABLES) {
    console.log(`Processing: ${table}`);
    
    // Export from Supabase
    const rows = await exportTable(table);
    
    if (rows > 0) {
      // Import to Convex
      const ok = await importToConvex(table);
      if (ok) success++;
      else failed++;
    } else {
      console.log(`  No data to export for ${table}`);
    }
    
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total rows imported: ${MISSING_TABLES.reduce((sum, t) => sum + (fs.existsSync(path.join(process.cwd(), 'artifacts', 'missing-tables', t, 'documents.jsonl')) ? fs.readFileSync(path.join(process.cwd(), 'artifacts', 'missing-tables', t, 'documents.jsonl'), 'utf8').split('\n').filter(Boolean).length : 0), 0)}`);
}

main().catch(console.error);
