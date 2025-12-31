import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seedSegmentationData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251228_user_segmentation_seed.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await client.query(migrationSQL);
    console.log('✅ User segmentation data seeded successfully');

    // Verify the data
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_segments,
        SUM(member_count) as total_members,
        ROUND(AVG(member_count)::numeric, 0) as avg_members
      FROM user_segments
      WHERE status = 'active'::segment_status
    `);

    const { total_segments, total_members, avg_members } = result.rows[0];
    console.log(`
📊 Segmentation Data Summary:
  - Total Active Segments: ${total_segments}
  - Total Members: ${total_members}
  - Average Segment Size: ${avg_members}
    `);

    // List all segments
    const segments = await client.query(`
      SELECT 
        name,
        segment_type,
        member_count,
        description
      FROM user_segments
      WHERE status = 'active'::segment_status
      ORDER BY member_count DESC
    `);

    console.log('\n📋 Active Segments:');
    segments.rows.forEach((seg: any) => {
      console.log(
        `  - ${seg.name} (${seg.segment_type}): ${seg.member_count} members - ${seg.description}`
      );
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedSegmentationData();
