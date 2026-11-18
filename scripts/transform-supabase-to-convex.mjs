/**
 * Transform Supabase export files from snake_case to Convex camelCase schema format,
 * then re-import them into the deployed Convex instance using `--replace`.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXPORT_DIR = path.join(ROOT, 'artifacts', 'supabase-convex-import-20261109-retry');
const TMP_DIR = path.join(ROOT, 'artifacts', 'supabase-convex-transformed');

const FIELD_MAPS = {
  authors: {
    id: 'supabaseId', name: 'name', bio: 'bio', featured: 'featured',
    birth_date: 'birthDate', nationality: 'nationality', website: 'website',
    author_image_id: 'authorImageId', twitter_handle: 'twitterHandle',
    social_handle: 'socialHandle', instagram_handle: 'instagramHandle',
    goodreads_url: 'goodreadsUrl', cover_image_id: 'coverImageId',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  books: {
    id: 'supabaseId', title: 'title', subtitle: 'subtitle', description: 'description',
    isbn13: 'isbn13', isbn10: 'isbn10', publication_date: 'publishedAt',
    publisher_id: 'publisherId', pages: 'pageCount', language: 'language',
    binding: 'format', list_price: 'price', synopsis: 'synopsis',
    author_id: 'authorId', featured: 'featured',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  book_authors: {
    id: 'supabaseId', book_id: 'bookId', author_id: 'authorId',
    role: 'role', order: 'order',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  reading_progress: {
    id: 'supabaseId', user_id: 'userId', book_id: 'bookId',
    current_page: 'currentPage', total_pages: 'totalPages',
    progress_percentage: 'progressPercent', status: 'status',
    start_date: 'startedAt', finish_date: 'completedAt',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  users: {
    id: 'supabaseId', email: 'email', name: 'name',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  follows: {
    id: 'supabaseId', follower_id: 'followerId', following_id: 'followingId',
    created_at: 'createdAt',
  },
  profiles: {
    id: 'supabaseId', user_id: 'userId', display_name: 'displayName',
    bio: 'bio', location: 'location', website: 'website',
    reading_goal: 'readingGoal',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  reviews: {
    id: 'supabaseId', user_id: 'userId', book_id: 'bookId',
    rating: 'rating', title: 'title', content: 'content',
    is_public: 'isPublic',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  reading_lists: {
    id: 'supabaseId', user_id: 'userId', name: 'name',
    description: 'description', is_public: 'isPublic',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  reading_list_items: {
    id: 'supabaseId', list_id: 'listId', book_id: 'bookId',
    order: 'order', added_at: 'addedAt',
  },
  groups: {
    id: 'supabaseId', name: 'name', description: 'description',
    owner_id: 'ownerId', is_public: 'isPublic', max_members: 'maxMembers',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  group_members: {
    id: 'supabaseId', group_id: 'groupId', user_id: 'userId',
    status: 'status', joined_at: 'joinedAt',
  },
  events: {
    id: 'supabaseId', title: 'title', description: 'description',
    event_type: 'eventType', start_at: 'startAt', end_at: 'endAt',
    location: 'location', virtual_link: 'virtualLink',
    max_attendees: 'maxAttendees', is_public: 'isPublic',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
  notifications: {
    id: 'supabaseId', user_id: 'userId', type: 'type',
    title: 'title', message: 'message', is_read: 'isRead',
    created_at: 'createdAt',
  },
  genres: {
    id: 'supabaseId', name: 'name', slug: 'slug',
    description: 'description', parent_id: 'parentId',
    created_at: 'createdAt',
  },
  publishers: {
    id: 'supabaseId', name: 'name', website: 'website',
    created_at: 'createdAt', updated_at: 'updatedAt',
  },
};

function toTimestamp(val) {
  if (val === null || val === undefined) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.getTime();
}

function transformRow(tableName, row) {
  const out = {};
  const map = FIELD_MAPS[tableName];
  if (!map) return row;
  for (const [src, dst] of Object.entries(map)) {
    const val = row[src];
    if (src === 'id') {
      out.supabaseId = val ?? null; // Store original UUID for lookup; let Convex generate its own _id
    } else if (['createdAt','updatedAt','startedAt','completedAt','publishedAt','joinedAt'].includes(dst)) {
      out[dst] = toTimestamp(val);
    } else if (val !== null && val !== undefined) {
      out[dst] = val;
    }
  }
  return out;
}

async function main() {
  if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'manifest.json'), 'utf8'));
  const tablesWithData = Object.entries(manifest.tables)
    .filter(([, c]) => c > 0)
    .map(([n]) => n);

  console.log(`\nTables with data (${tablesWithData.length}):`);
  tablesWithData.forEach(n => console.log(`  ${n}: ${manifest.tables[n]}`));
  console.log('');

  let totalRows = 0;
  const processed = [];
  for (const tableName of tablesWithData) {
    if (!FIELD_MAPS[tableName]) {
      console.log(`  ⏭ ${tableName}: no schema mapping`);
      continue;
    }
    const srcFile = path.join(EXPORT_DIR, tableName, 'documents.jsonl');
    if (!fs.existsSync(srcFile)) continue;
    const lines = fs.readFileSync(srcFile, 'utf8').trim().split('\n');
    const transformed = lines.map(line => transformRow(tableName, JSON.parse(line)));
    const dstDir = path.join(TMP_DIR, tableName);
    fs.mkdirSync(dstDir, { recursive: true });
    fs.writeFileSync(path.join(dstDir, 'documents.jsonl'),
      transformed.map(d => JSON.stringify(d)).join('\n') + '\n');
    console.log(`  ✓ ${tableName}: ${transformed.length} rows`);
    totalRows += transformed.length;
    processed.push({ table: tableName, rows: transformed.length });
  }

  fs.writeFileSync(path.join(TMP_DIR, 'summary.json'),
    JSON.stringify({ exportedAt: new Date().toISOString(), totalRows, details: processed }, null, 2));
  console.log(`\n✅ Transformed ${processed.length} tables, ${totalRows} rows → ${TMP_DIR}\n`);
}

main().catch(err => { console.error('FAILED:', err); process.exit(1); });
