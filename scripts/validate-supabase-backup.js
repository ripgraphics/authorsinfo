#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateBackupFile(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      isValid: false,
      fileType: 'missing',
      filePath: absolutePath,
      summary: {
        sizeBytes: 0,
        hasCreateTable: false,
        hasInsert: false,
        hasCopy: false,
        hasAlterTable: false,
        hasCreateIndex: false,
        lineCount: 0,
      },
      errors: [`Backup file not found: ${absolutePath}`],
    };
  }

  const stats = fs.statSync(absolutePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  const normalized = content.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const lineCount = content.split(/\r?\n/).length;

  const hasCreateTable = /CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(?:"?[A-Za-z_][\w$]*"?\.)?"?[A-Za-z_][\w$]*"?/i.test(normalized);
  const hasInsert = /\bINSERT\s+INTO\b/i.test(normalized);
  const hasCopy = /\bCOPY\b/i.test(normalized);
  const hasAlterTable = /\bALTER\s+TABLE\b/i.test(normalized);
  const hasCreateIndex = /\bCREATE\s+(UNIQUE\s+)?INDEX\b/i.test(normalized);

  const detected = [];
  if (hasCreateTable) detected.push('create-table');
  if (hasInsert) detected.push('insert');
  if (hasCopy) detected.push('copy');
  if (hasAlterTable) detected.push('alter-table');
  if (hasCreateIndex) detected.push('create-index');

  const errors = [];
  if (!hasCreateTable && !hasInsert && !hasCopy && !hasAlterTable && !hasCreateIndex) {
    errors.push('No CREATE TABLE, INSERT INTO, or COPY statements were found');
  }

  if (!stats.size) {
    errors.push('Backup file is empty');
  }

  const fileType = hasCreateTable && hasInsert
    ? 'complete'
    : hasCreateTable
      ? 'schema'
      : hasInsert || hasCopy
        ? 'data'
        : 'unknown';

  return {
    isValid: errors.length === 0,
    fileType,
    filePath: absolutePath,
    summary: {
      sizeBytes: stats.size,
      hasCreateTable,
      hasInsert,
      hasCopy,
      hasAlterTable,
      hasCreateIndex,
      lineCount,
      detected,
    },
    errors,
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/validate-supabase-backup.js <path-to-backup.sql>');
    process.exit(args.length === 0 ? 1 : 0);
  }

  const filePath = args[0];
  const result = validateBackupFile(filePath);

  console.log(JSON.stringify(result, null, 2));

  if (!result.isValid) {
    process.exit(1);
  }
}

module.exports = { validateBackupFile };

if (require.main === module) {
  main();
}
