const fs = require('fs');

// Check transform file
const content = fs.readFileSync('artifacts/supabase-convex-transformed/follows/documents.jsonl', 'utf8');
const lines = content.split('\n').filter(Boolean);
let count247 = 0;
for (const line of lines) {
  const row = JSON.parse(line);
  if (row.followingId === '2474659f-003e-4faa-8c53-9969c33f20b2') {
    count247++;
  }
}
console.log(`Transform file: ${lines.length} total rows, ${count247} with followingId=2474659f`);
