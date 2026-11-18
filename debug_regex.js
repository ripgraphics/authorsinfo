const fs = require('fs');
const content = fs.readFileSync('follows_output.txt', 'utf8');
const lines = content.split('\n');
for (const line of lines.slice(1, 5)) {
  const uuids = line.match(/"([a-f0-9-]{36})"/g);
  console.log('Line:', line.substring(0, 100));
  console.log('UUIDs:', uuids);
  console.log('---');
}