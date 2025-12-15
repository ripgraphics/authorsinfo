const fs = require('fs');
const env = fs.readFileSync('.env.local.backup', 'utf8');
const match = env.match(/VERCEL_OIDC_TOKEN=["']?([^"']+)["']?/);
if (match) {
  const token = match[1];
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  console.log('User ID:', payload.user_id);
  console.log('Owner:', payload.owner);
  console.log('Owner ID:', payload.owner_id);
}

