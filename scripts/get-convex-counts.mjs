#!/usr/bin/env node
/**
 * Get Convex counts using the deployed countTables function
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// First check if countAllTables exists
const specFile = path.join(rootDir, 'func_spec.txt');
const hasCountAll = fs.existsSync(specFile) && fs.readFileSync(specFile, 'utf8').includes('countAllTables');

if (!hasCountAll) {
  console.log('Creating countAllTables function...');
  
  // Create the query function
  const funcContent = `
import { query } from "convex/server";
import { v } from "convex/values";

export default query({
  handler: async (ctx) => {
    const tables = [
      "authors", "books", "book_authors", "follows", "friends", 
      "users", "groups", "reviews", "bookmarks", "reading_lists",
      "reading_progress", "comments", "likes", "notifications",
      "messages", "direct_conversations", "group_members",
      "enterprise_audit_trail", "book_subjects"
    ];
    
    const results = {};
    for (const t of tables) {
      try {
        results[t] = await ctx.db.query(t).count();
      } catch (e) {
        results[t] = 0;
      }
    }
    return results;
  },
});
`.trim();
  
  fs.writeFileSync(path.join(rootDir, 'convex', 'queries', 'verification.ts'), funcContent);
  console.log('Created verification.ts with countAllTables');
}

// Run the query via CLI
try {
  console.log('Getting Convex counts...');
  const output = execFileSync(
    'npx',
    ['convex', 'run', 'queries/verification:countAllTables', '{}', '--prod'],
    { encoding: 'utf8', timeout: 60000 }
  );
  
  console.log('\nConvex counts:');
  console.log(output);
} catch (e) {
  console.error('Error:', e.message.split('\n')[0]);
}
