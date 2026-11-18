/**
 * Transform Supabase export files from snake_case to Convex camelCase schema format,
 * then re-import them into the deployed Convex instance using `--replace`.
 *
 * Usage:
 *   node scripts/transform-and-import.js
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXPORT_DIR = path.join(ROOT, 'artifacts', 'supabase-convex-import-20261109-retry');
const TMP_DIR = path.join(ROOT, 'artifacts', 'supabase-convex-transformed');

// ── Field mappings: table → { supabaseKey: convexKey } ──────────────────────
// Only maps keys that exist in BOTH the Supabase export AND the Convex schema.
// Keys not listed are dropped (unknown to Convex schema).
// special transforms are applied via transformRow().

type FieldMap = Record<string, string>;

const FIELD_MAPS: Record<string, FieldMap> = {
  authors: {
    id: '_id',             // keep original UUID as _id so queries still work
    name: 'name',
    bio: 'bio',
    featured: 'featured',
    birth_date: 'birthDate',
    nationality: 'nationality',
    website: 'website',
    author_image_id: 'authorImageId',
    twitter_handle: 'twitterHandle',
    social_handle: 'socialHandle',
    instagram_handle: 'instagramHandle',
    goodreads_url: 'goodreadsUrl',
    cover_image_id: 'coverImageId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  books: {
    id: '_id',
    title: 'title',
    subtitle: 'subtitle',
    description: 'description',
    isbn13: 'isbn13',
    isbn10: 'isbn10',
    publication_date: 'publishedAt',
    publisher_id: 'publisherId',
    pages: 'pageCount',
    language: 'language',
    binding: 'format',
    list_price: 'price',
    synopsis: 'description',        // synopsis overlaps with description; keep both
    author_id: 'authorId',          // supplementary link to authors table
    featured: 'featured',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  book_authors: {
    id: '_id',
    book_id: 'bookId',
    author_id: 'authorId',
    role: 'role',
    order: 'order',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  reading_progress: {
    id: '_id',
    user_id: 'userId',
    book_id: 'bookId',
    current_page: 'currentPage',
    total_pages: 'totalPages',
    progress_percentage: 'progressPercent',
    status: 'status',
    start_date: 'startedAt',
    finish_date: 'completedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  users: {
    id: '_id',
    email: 'email',
    name: 'name',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  follows: {
    id: '_id',
    follower_id: 'followerId',
    following_id: 'followingId',
    created_at: 'createdAt',
  },
  profiles: {
    id: '_id',
    user_id: 'userId',
    display_name: 'displayName',
    bio: 'bio',
    location: 'location',
    website: 'website',
    reading_goal: 'readingGoal',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  reviews: {
    id: '_id',
    user_id: 'userId',
    book_id: 'bookId',
    rating: 'rating',
    title: 'title',
    content: 'content',
    is_public: 'isPublic',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  reading_lists: {
    id: '_id',
    user_id: 'userId',
    name: 'name',
    description: 'description',
    is_public: 'isPublic',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  reading_list_items: {
    id: '_id',
    list_id: 'listId',
    book_id: 'bookId',
    order: 'order',
    added_at: 'addedAt',
  },
  groups: {
    id: '_id',
    name: 'name',
    description: 'description',
    owner_id: 'ownerId',
    is_public: 'isPublic',
    max_members: 'maxMembers',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  group_members: {
    id: '_id',
    group_id: 'groupId',
    user_id: 'userId',
    status: 'status',
    joined_at: 'joinedAt',
  },
  events: {
    id: '_id',
    title: 'title',
    description: 'description',
    event_type: 'eventType',
    start_at: 'startAt',
    end_at: 'endAt',
    location: 'location',
    virtual_link: 'virtualLink',
    max_attendees: 'maxAttendees',
    is_public: 'isPublic',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  notifications: {
    id: '_id',
    user_id: 'userId',
    type: 'type',
    title: 'title',
    message: 'message',
    is_read: 'isRead',
    created_at: 'createdAt',
  },
  genres: {
    id: '_id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    parent_id: 'parentId',
    created_at: 'createdAt',
  },
  publishers: {
    id: '_id',
    name: 'name',
    website: 'website',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
};

// Tables with special transform logic (date→timestamp, etc.)
const SPECIAL_TRANSFORMS = new Set([
  'authors',
  'books',
  'book_authors',
  'reading_progress',
  'users',
  'follows',
  'profiles',
  'reviews',
  'reading_lists',
  'reading_list_items',
  'groups',
  'group_members',
  'events',
  'notifications',
  'genres',
  'publishers',
]);

/** Convert ISO date string to Unix ms timestamp, or return null. */
function toTimestamp(val: string | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.getTime();
}

/** Apply table-specific row transformations. */
function transformRow(tableName: string, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const map = FIELD_MAPS[tableName];
  if (!map) return row; // no mapping — pass through as-is

  for (const [src, dst] of Object.entries(map)) {
    const val = row[src];
    if (dst === '_id') {
      // Keep the original Supabase UUID as _id so existing client queries still resolve
      out._id = val ?? null;
    } else if (['createdAt', 'updatedAt', 'startedAt', 'completedAt', 'publishedAt', 'joinedAt'].includes(dst)) {
      out[dst] = toTimestamp(val as string | null | undefined);
    } else if (val !== null && val !== undefined) {
      out[dst] = val;
    }
  }
  return out;
}

/** Process one table: read JSONL, transform, write to temp dir. */
function processTable(tableName: string): number {
  const srcFile = path.join(EXPORT_DIR, tableName, 'documents.jsonl');
  if (!fs.existsSync(srcFile)) {
    console.log(`  ⏭ ${tableName}: no source file`);
    return 0;
  }

  const lines = fs.readFileSync(srcFile, 'utf8').trim().split('\n');
  if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
    console.log(`  ⏭ ${tableName}: empty`);
    return 0;
  }

  const transformed = lines.map(line => {
    const row = JSON.parse(line) as Record<string, unknown>;
    return transformRow(tableName, row);
  });

  const dstDir = path.join(TMP_DIR, tableName);
  fs.mkdirSync(dstDir, { recursive: true });
  const dstFile = path.join(dstDir, 'documents.jsonl');
  const output = transformed
    .map(doc => JSON.stringify(doc))
    .join('\n') + '\n';
  fs.writeFileSync(dstFile, output, 'utf8');

  console.log(`  ✓ ${tableName}: ${transformed.length} rows → ${dstFile}`);
  return transformed.length;
}

async function main() {
  // Clean and recreate temp dir
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });

  // Read manifest to know which tables have data
  const manifestPath = path.join(EXPORT_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { tables: Record<string, number>; sourceProjectRef?: string };
  const tablesWithData = Object.entries(manifest.tables)
    .filter(([, count]) => count > 0)
    .map(([name]) => name);

  console.log(`\nTables with data (${tablesWithData.length}):`);
  console.log(tablesWithData.map(n => `  ${n}: ${manifest.tables[n]}`).join('\n'));
  console.log('');

  let totalRows = 0;
  const processed = [];

  for (const tableName of tablesWithData) {
    if (!FIELD_MAPS[tableName]) {
      console.log(`  ⏭ ${tableName}: no schema mapping (skipping)`);
      continue;
    }
    const count = processTable(tableName);
    totalRows += count;
    processed.push({ table: tableName, rows: count });
  }

  // Write summary
  const summary = {
    exportedAt: new Date().toISOString(),
    sourceManifest: manifest.sourceProjectRef,
    tablesProcessed: processed.length,
    totalRowsTransformed: totalRows,
    details: processed,
  };
  fs.writeFileSync(
    path.join(TMP_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  console.log(`\n✅ Transformation complete: ${processed.length} tables, ${totalRows} total rows`);
  console.log(`   Output: ${TMP_DIR}`);
  console.log('\nTo import, run for each table:');
  console.log(`   npx convex import --table <name> --replace ${TMP_DIR}/<name>/documents.jsonl`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
