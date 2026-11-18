const fs = require('fs');

const content = fs.readFileSync('follows_latest.txt', 'utf16le');
const lines = content.split('\n');
console.log('First 5 non-header lines:');
let count = 0;
for (const line of lines) {
  if (line.startsWith('"r')) {
    console.log(line);
    count++;
    if (count >= 5) break;
  }
}
