import fs from 'fs';
import os from 'os';
import path from 'path';

const { validateBackupFile } = require('../scripts/validate-supabase-backup.js');

describe('Supabase backup validation', () => {
  it('accepts a valid complete backup dump with schema and data', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-validate-'));
    const file = path.join(dir, 'complete_backup.sql');
    const sql = `-- Dumped from Supabase\nCREATE TABLE public.authors (id uuid PRIMARY KEY, name text);\nINSERT INTO public.authors (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Ada');\n`;

    fs.writeFileSync(file, sql, 'utf8');

    const result = validateBackupFile(file);

    expect(result.isValid).toBe(true);
    expect(result.fileType).toBe('complete');
    expect(result.summary.hasCreateTable).toBe(true);
    expect(result.summary.hasInsert).toBe(true);
    expect(result.summary.sizeBytes).toBeGreaterThan(0);
  });

  it('rejects a file that is not an actual backup dump', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-validate-'));
    const file = path.join(dir, 'not_a_backup.sql');

    fs.writeFileSync(file, 'just some random text\nno sql here\n', 'utf8');

    const result = validateBackupFile(file);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('No CREATE TABLE, INSERT INTO, or COPY statements were found');
  });
});
