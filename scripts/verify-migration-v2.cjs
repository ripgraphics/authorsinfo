const https = require('https');
const fs = require('fs');
const path = require('path');

// Load credentials
let serviceKey = null;
for (const f of ['.env new copy .local', '.env old.local', '.env.local']) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), f), 'utf8');
    const match = content.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/);
    if (match) {
      serviceKey = match[1].replace(/\r/g, '').trim();
      console.log(`Loaded from ${f}`);
      break;
    }
  } catch {}
}

if (!serviceKey) {
  console.error('Could not find SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseUrl = 'adccinsmmmocxeylisbn.supabase.co';

async function getCount(table) {
  return new Promise((resolve) => {
    const options = {
      hostname: supabaseUrl,
      path: `/rest/v1/${table}?select=id&limit=1`,
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'count=exact'
      }
    };
    const req = https.request(options, res => {
      const count = parseInt(res.headers['content-range']?.split('/')[1] || '0');
      resolve(count || 0);
    });
    req.on('error', e => resolve(-1));
    req.end();
  });
}

async function main() {
  // Get Convex counts directly
  console.log('Getting Convex counts from production...\n');
  
  const convexCounts = await new Promise((resolve) => {
    const options = {
      hostname: 'sleek-gerbil-105.convex.cloud',
      path: '/api/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // We'll use CLI instead since we can't call API directly without auth
    resolve(null);
  });
  
  // Use CLI to get counts
  const { execSync } = require('child_process');
  try {
    const output = execSync('npx convex run queries/verification:default "{}" --deployment sleek-gerbil-105', {
      encoding: 'utf8',
      timeout: 60000
    });
    const parsed = JSON.parse(output);
    console.log('Convex counts retrieved via CLI\n');
    
    // Now get Supabase counts
    console.log('Getting Supabase counts...\n');
    
    const tablesFile = path.join(process.cwd(), 'convex', 'supabaseTables.ts');
    const content = fs.readFileSync(tablesFile, 'utf8');
    const matches = content.matchAll(/["']([a-z_]+)["']/g);
    const tables = [...new Set([...matches].map(m => m[1]))].filter(t => t.length > 2 && !t.startsWith('__'));
    
    console.log(`Checking ${tables.length} tables\n`);
    
    const results = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const supabase = await getCount(table);
      const convex = parsed[table] || 0;
      
      results.push({
        table,
        supabase,
        convex,
        matched: supabase === convex || (supabase === 0 && convex === 0)
      });
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${tables.length}`);
      }
    }
    
    // Save report
    const reportPath = path.join(process.cwd(), 'artifacts', 'verification-report-v2.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    // Summary
    const mismatched = results.filter(r => r.supabase >= 0 && !r.matched);
    const withData = results.filter(r => r.supabase > 0 || r.convex > 0);
    const errors = results.filter(r => r.supabase === -1);
    
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total tables checked: ${results.length}`);
    console.log(`Tables with data: ${withData.length}`);
    console.log(`Matched exactly: ${results.filter(r => r.matched).length}`);
    console.log(`Mismatched: ${mismatched.length}`);
    console.log(`Errors: ${errors.length}\n`);
    
    if (mismatched.length > 0) {
      console.log('--- MISMATCHES ---');
      mismatched.sort((a, b) => Math.abs(b.supabase - b.convex) - Math.abs(a.supabase - a.convex));
      for (const r of mismatched.slice(0, 30)) {
        const diff = r.supabase - r.convex;
        console.log(`${r.table.padEnd(45)} | Supabase: ${(r.supabase||'ERR').toString().padStart(6)} | Convex: ${String(r.convex).padStart(6)} | Diff: ${(diff >= 0 ? '+' : '')}${diff}`);
      }
    }
    
    console.log('\n--- Tables WITH Data (Top 50) ---');
    const sorted = withData.filter(r => r.supabase > 0 || r.convex > 0).sort((a, b) => (b.supabase || 0) - (a.supabase || 0));
    for (const r of sorted.slice(0, 50)) {
      const status = r.matched ? '✓' : '✗';
      console.log(`${status} ${r.table.padEnd(45)} | S:${String(r.supabase||'ERR').padStart(6)} C:${String(r.convex).padStart(6)}`);
    }
    
    console.log(`\nReport saved to: ${reportPath}`);
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error);
