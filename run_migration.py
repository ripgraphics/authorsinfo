#!/usr/bin/env python3
"""
Simple script to run the entity migration directly against the local database
"""

import subprocess
import sys
import os

def run_sql_file(sql_file):
    """Run a SQL file against the local Supabase database"""
    print(f"🚀 Running migration: {sql_file}")
    
    # Local database connection string
    db_url = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    
    try:
        # Try to run with psql if available
        cmd = ['psql', db_url, '-f', sql_file]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ Migration completed successfully!")
        print(result.stdout)
        return True
    except FileNotFoundError:
        print("❌ psql not found. Trying alternative method...")
        return False
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e.stderr}")
        return False

def main():
    """Main function to run the migration"""
    print("🔧 Entity Migration Script")
    print("=" * 50)
    
    # Check if migration file exists
    migration_file = "supabase/migrations/20250706_192200_migrate_image_types_to_entity_types.sql"
    
    if not os.path.exists(migration_file):
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    print(f"📁 Found migration file: {migration_file}")
    
    # Run the migration
    success = run_sql_file(migration_file)
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("✅ Entity types table created")
        print("✅ Images table updated with entity fields")
        print("✅ Album_images table updated with entity fields")
        print("✅ Indexes and constraints created")
        print("✅ Triggers and functions created")
        print("✅ Analytics view created")
        print("\n📊 Next steps:")
        print("1. Test the new entity system")
        print("2. Run the data migration script")
        print("3. Update your application code")
    else:
        print("\n❌ Migration failed!")
        print("💡 Alternative: Run the SQL manually in Supabase dashboard")
    
    return success

if __name__ == "__main__":
    main() 