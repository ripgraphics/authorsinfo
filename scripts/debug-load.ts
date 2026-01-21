import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Environment loaded');
try {
  const actions = require('../app/actions/bulk-import-books');
  console.log('Actions loaded:', Object.keys(actions));
} catch (error) {
  console.error('Failed to load actions:', error);
}
