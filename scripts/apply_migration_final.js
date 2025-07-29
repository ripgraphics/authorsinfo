const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Applying missing database function...\n');

// Set the access token
const accessToken = 'sbp_02f5446adc4b7757e60d0c34ca042edeb7a719c3';
const projectRef = 'nmrohtlcfqujtfgcyqhw';

// Check if the SQL file exists
const sqlFile = 'fix_add_image_to_entity_album.sql';
if (!fs.existsSync(sqlFile)) {
  console.error(`❌ SQL file not found: ${sqlFile}`);
  process.exit(1);
}

console.log('✅ SQL file found');

// Read the SQL content
const sqlContent = fs.readFileSync(sqlFile, 'utf8');
console.log(`📄 SQL file size: ${sqlContent.length} characters`);

// Create a temporary migration file
const migrationName = `fix_add_image_to_entity_album_${Date.now()}`;
console.log(`📝 Creating migration: ${migrationName}`);

try {
  // Create the migration
  execSync(`npx supabase migration new ${migrationName}`, {
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });
  console.log('✅ Migration created');
} catch (error) {
  console.error('❌ Failed to create migration:', error.message);
  process.exit(1);
}

// Find the migration file
const migrationsDir = 'supabase/migrations';
const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.includes(migrationName));
if (migrationFiles.length === 0) {
  console.error('❌ Migration file not found');
  process.exit(1);
}

const migrationFile = path.join(migrationsDir, migrationFiles[0]);
console.log(`📄 Migration file: ${migrationFile}`);

// Write the SQL content to the migration file
fs.writeFileSync(migrationFile, sqlContent);
console.log('✅ SQL content written to migration file');

// Apply the migration
try {
  console.log('\n🚀 Applying migration to remote database...');
  const result = execSync('npx supabase db push', {
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
  });
  console.log('✅ Migration applied successfully!');
  console.log(result);
} catch (error) {
  console.error('❌ Failed to apply migration:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure the project is unpaused');
  console.log('2. Check the Supabase dashboard for any errors');
  console.log('3. Try running: npx supabase db push --debug');
  process.exit(1);
}

console.log('\n🎉 Database function added successfully!');
console.log('📝 The "add_image_to_entity_album" function should now be available.');
console.log('🔍 You can test it by trying to upload an image to a book entity.'); 