import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SUPABASE_PUBLIC_TABLES } from '../convex/supabaseTables';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const batchSize = 500;
const exportDir = path.resolve(__dirname, '../artifacts/supabase-convex-import-20261109-retry');
const primaryKeyOverrides: Record<string, string[]> = {
  direct_conversation_read_state: ['conversation_id', 'user_id'],
  direct_message_deletions: ['message_id', 'user_id'],
  direct_message_pins: ['message_id'],
  follows: ['follower_id', 'following_id'],
  friends: ['user_id', 'friend_id'],
  group_members: ['group_id', 'user_id'],
  post_analytics: ['post_id'],
};

async function main() {
  if (fs.existsSync(exportDir)) {
    throw new Error(`Refusing to overwrite existing export directory: ${exportDir}`);
  }
  fs.mkdirSync(exportDir, { recursive: true });

  const manifest: Record<string, number> = {};
  let totalRows = 0;

  for (const tableName of SUPABASE_PUBLIC_TABLES) {
    const primaryKeys = primaryKeyOverrides[tableName] ?? ['id'];
    const tableDir = path.join(exportDir, tableName);
    fs.mkdirSync(tableDir, { recursive: true });
    const outputPath = path.join(tableDir, 'documents.jsonl');
    const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    let offset = 0;
    let tableRows = 0;

    const probe = await supabase.from(tableName).select('*').limit(1);
    if (probe.error) {
      output.destroy();
      throw new Error(`Failed to inspect ${tableName}: ${probe.error.message}`);
    }
    if (!probe.data?.length) {
      await new Promise<void>((resolve, reject) => {
        output.end(resolve);
        output.on('error', reject);
      });
      manifest[tableName] = 0;
      console.log(`${tableName}: 0`);
      continue;
    }

    while (true) {
      let request = supabase.from(tableName).select('*');
      for (const key of primaryKeys) {
        request = request.order(key, { ascending: true });
      }
      const { data, error } = await request.range(offset, offset + batchSize - 1);
      if (error) {
        output.destroy();
        throw new Error(`Failed to export ${tableName} at offset ${offset}: ${error.message}`);
      }
      if (!data || data.length === 0) break;

      for (const row of data as unknown as Record<string, unknown>[]) {
        const line = JSON.stringify(row);
        if (line === undefined) {
          output.destroy();
          throw new Error(`Could not serialize a row from ${tableName}`);
        }
        if (!output.write(`${line}\n`)) {
          await new Promise<void>((resolve) => output.once('drain', resolve));
        }
      }
      tableRows += data.length;
      offset += data.length;
      if (data.length < batchSize) break;
    }

    await new Promise<void>((resolve, reject) => {
      output.end(resolve);
      output.on('error', reject);
    });
    manifest[tableName] = tableRows;
    totalRows += tableRows;
    console.log(`${tableName}: ${tableRows}`);
  }

  const report = {
    sourceProjectRef: 'adccinsmmmocxeylisbn',
    tables: manifest,
    totalTables: SUPABASE_PUBLIC_TABLES.length,
    totalRows,
  };
  fs.writeFileSync(path.join(exportDir, 'manifest.json'), JSON.stringify(report, null, 2));
  console.log(`EXPORT_COMPLETE tables=${report.totalTables} rows=${totalRows} path=${exportDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Supabase export failed');
  process.exitCode = 1;
});
