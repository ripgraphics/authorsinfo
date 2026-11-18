const fs = require('fs');
const content = fs.readFileSync('follows_output.txt', 'utf8');
const lines = content.split('\n');
const followingIds = new Set();
for (const line of lines) {
  // Match UUIDs in quotes
  const uuids = line.match(/"([a-f0-9-]{36})"/g);
  if (uuids && uuids.length >= 2) {
    // The 2nd UUID is the followingId (index 1): followerId, followingId, supabaseId
    followingIds.add(uuids[1].replace(/"/g, ''));
  }
}
console.log('Unique followingIds:', followingIds.size);
console.log([...followingIds].slice(0, 20));