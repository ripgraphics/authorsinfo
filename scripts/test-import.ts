import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const logFile = path.resolve(process.cwd(), 'script-results.json');

async function testImport() {
  const log: any = {
    step: 'Starting',
    isbndb_api_key: !!process.env.ISBNDB_API_KEY,
    supabase_url: !!process.env.SUPABASE_URL,
    timestamp: new Date().toISOString()
  };
  
  try {
    const { bulkImportBooks } = require('../app/actions/bulk-import-books');
    
    // Example ISBNs
    const isbns = ['9780140449136', '9780143105022'];
    
    log.step = 'Calling bulkImportBooks';
    const result = await bulkImportBooks(isbns);
    log.result = result;
    log.step = 'Completed';
  } catch (error: any) {
    log.step = 'Failed';
    log.error = error.message || String(error);
  }
  
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  console.log('Results written to', logFile);
}

testImport();
