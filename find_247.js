const fs = require('fs');

const content = fs.readFileSync('artifacts/supabase-convex-transformed/follows/documents.jsonl', 'utf8');
const lines = content.split('\n').filter(Boolean);
for (const line of lines) {
  const row = JSON.parse(line);
  if (row.followingId === '2474659f-003e-4faa-8c53-9969c33f20b2') {
    console.log(row);
  }
}
