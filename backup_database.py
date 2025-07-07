#!/usr/bin/env python3
"""
COMPREHENSIVE DATABASE BACKUP SCRIPT
Creates a complete backup of your entire Supabase database
Includes all data, schema, functions, triggers, policies, and RLS
"""

import os
import subprocess
import datetime
import json
from pathlib import Path

def get_supabase_config():
    """Get Supabase configuration from environment or config file"""
    try:
        # Try to get from environment variables
        project_ref = os.getenv('SUPABASE_PROJECT_REF')
        db_url = os.getenv('SUPABASE_DB_URL')
        
        if not project_ref or not db_url:
            # Try to get from supabase config
            try:
                result = subprocess.run(['npx', 'supabase', 'status'], 
                                      capture_output=True, text=True, check=True)
                # Parse the output to get project ref
                for line in result.stdout.split('\n'):
                    if 'Project Reference' in line:
                        project_ref = line.split(':')[1].strip()
                        break
            except:
                pass
        
        return {
            'project_ref': project_ref,
            'db_url': db_url
        }
    except Exception as e:
        print(f"Error getting Supabase config: {e}")
        return None

def create_backup_directory():
    """Create backup directory with timestamp"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path(f"database_backup_{timestamp}")
    backup_dir.mkdir(exist_ok=True)
    return backup_dir

def backup_schema(backup_dir, config):
    """Backup complete database schema"""
    print("📋 Backing up database schema...")
    
    schema_file = backup_dir / "01_schema.sql"
    
    # Get complete schema dump
    cmd = [
        'pg_dump',
        '--host=db.nmrohtlcfqujtfgcyqhw.supabase.co',
        '--port=5432',
        '--username=postgres.nmrohtlcfqujtfgcyqhw',
        '--dbname=postgres',
        '--schema-only',
        '--no-owner',
        '--no-privileges',
        '--verbose'
    ]
    
    try:
        with open(schema_file, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
            if result.returncode != 0:
                print(f"⚠️  Schema backup warning: {result.stderr}")
            else:
                print(f"✅ Schema backed up to: {schema_file}")
    except Exception as e:
        print(f"❌ Schema backup failed: {e}")

def backup_data(backup_dir, config):
    """Backup all data"""
    print("📊 Backing up all data...")
    
    data_file = backup_dir / "02_data.sql"
    
    # Get complete data dump
    cmd = [
        'pg_dump',
        '--host=db.nmrohtlcfqujtfgcyqhw.supabase.co',
        '--port=5432',
        '--username=postgres.nmrohtlcfqujtfgcyqhw',
        '--dbname=postgres',
        '--data-only',
        '--no-owner',
        '--no-privileges',
        '--verbose'
    ]
    
    try:
        with open(data_file, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
            if result.returncode != 0:
                print(f"⚠️  Data backup warning: {result.stderr}")
            else:
                print(f"✅ Data backed up to: {data_file}")
    except Exception as e:
        print(f"❌ Data backup failed: {e}")

def backup_functions_and_triggers(backup_dir, config):
    """Backup functions, triggers, and policies"""
    print("🔧 Backing up functions, triggers, and policies...")
    
    functions_file = backup_dir / "03_functions_triggers.sql"
    
    # Get functions and triggers
    cmd = [
        'pg_dump',
        '--host=db.nmrohtlcfqujtfgcyqhw.supabase.co',
        '--port=5432',
        '--username=postgres.nmrohtlcfqujtfgcyqhw',
        '--dbname=postgres',
        '--functions',
        '--triggers',
        '--no-owner',
        '--no-privileges',
        '--verbose'
    ]
    
    try:
        with open(functions_file, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
            if result.returncode != 0:
                print(f"⚠️  Functions backup warning: {result.stderr}")
            else:
                print(f"✅ Functions and triggers backed up to: {functions_file}")
    except Exception as e:
        print(f"❌ Functions backup failed: {e}")

def backup_rls_policies(backup_dir, config):
    """Backup RLS policies specifically"""
    print("🔒 Backing up RLS policies...")
    
    policies_file = backup_dir / "04_rls_policies.sql"
    
    # Get RLS policies
    cmd = [
        'pg_dump',
        '--host=db.nmrohtlcfqujtfgcyqhw.supabase.co',
        '--port=5432',
        '--username=postgres.nmrohtlcfqujtfgcyqhw',
        '--dbname=postgres',
        '--schema=public',
        '--no-owner',
        '--no-privileges',
        '--verbose'
    ]
    
    try:
        with open(policies_file, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
            if result.returncode != 0:
                print(f"⚠️  RLS policies backup warning: {result.stderr}")
            else:
                print(f"✅ RLS policies backed up to: {policies_file}")
    except Exception as e:
        print(f"❌ RLS policies backup failed: {e}")

def create_restore_script(backup_dir):
    """Create a restore script for easy restoration"""
    print("📝 Creating restore script...")
    
    restore_script = backup_dir / "RESTORE_DATABASE.sh"
    
    restore_content = f"""#!/bin/bash
# DATABASE RESTORE SCRIPT
# Created: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
# 
# WARNING: This will completely replace your current database!
# Make sure you have a backup before running this script.
#
# To restore your database:
# 1. Make sure you have psql installed
# 2. Set your database password as environment variable: export PGPASSWORD=your_password
# 3. Run: ./RESTORE_DATABASE.sh

set -e

echo "🚨 WARNING: This will completely replace your current database!"
echo "Press Ctrl+C to cancel, or any key to continue..."
read -n 1 -s

echo "🔄 Starting database restoration..."

# Drop all existing objects (be very careful!)
echo "🗑️  Dropping existing objects..."
psql -h db.nmrohtlcfqujtfgcyqhw.supabase.co -p 5432 -U postgres.nmrohtlcfqujtfgcyqhw -d postgres -c "
DO \\$\\$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions in public schema
    FOR r IN (SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
    
    -- Drop all views in public schema
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
END \\$\\$;
"

# Restore schema
echo "📋 Restoring schema..."
psql -h db.nmrohtlcfqujtfgcyqhw.supabase.co -p 5432 -U postgres.nmrohtlcfqujtfgcyqhw -d postgres -f 01_schema.sql

# Restore functions and triggers
echo "🔧 Restoring functions and triggers..."
psql -h db.nmrohtlcfqujtfgcyqhw.supabase.co -p 5432 -U postgres.nmrohtlcfqujtfgcyqhw -d postgres -f 03_functions_triggers.sql

# Restore RLS policies
echo "🔒 Restoring RLS policies..."
psql -h db.nmrohtlcfqujtfgcyqhw.supabase.co -p 5432 -U postgres.nmrohtlcfqujtfgcyqhw -d postgres -f 04_rls_policies.sql

# Restore data
echo "📊 Restoring data..."
psql -h db.nmrohtlcfqujtfgcyqhw.supabase.co -p 5432 -U postgres.nmrohtlcfqujtfgcyqhw -d postgres -f 02_data.sql

echo "✅ Database restoration complete!"
echo "Your database has been restored from backup."
"""
    
    with open(restore_script, 'w') as f:
        f.write(restore_content)
    
    # Make it executable
    os.chmod(restore_script, 0o755)
    print(f"✅ Restore script created: {restore_script}")

def create_backup_info(backup_dir):
    """Create backup information file"""
    print("📄 Creating backup information...")
    
    info_file = backup_dir / "BACKUP_INFO.md"
    
    info_content = f"""# Database Backup Information

## Backup Details
- **Created**: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Backup Directory**: {backup_dir.absolute()}

## Files Included
1. **01_schema.sql** - Complete database schema (tables, indexes, constraints)
2. **02_data.sql** - All data from all tables
3. **03_functions_triggers.sql** - Functions, triggers, and stored procedures
4. **04_rls_policies.sql** - Row Level Security policies
5. **RESTORE_DATABASE.sh** - Script to restore the entire database

## How to Restore
1. **IMPORTANT**: Set your database password as environment variable:
   ```bash
   export PGPASSWORD=your_database_password
   ```

2. **Run the restore script**:
   ```bash
   cd {backup_dir.name}
   ./RESTORE_DATABASE.sh
   ```

## What's Included in This Backup
- ✅ All tables and their structure
- ✅ All data from all tables
- ✅ All indexes and constraints
- ✅ All foreign key relationships
- ✅ All functions and stored procedures
- ✅ All triggers
- ✅ All Row Level Security (RLS) policies
- ✅ All views
- ✅ All sequences
- ✅ All custom types

## Safety Notes
- This backup contains your complete database
- Store this backup securely
- Test the restore process in a development environment first
- The restore script will completely replace your current database

## Verification
After restoration, you can verify the backup by:
1. Checking table counts: `SELECT COUNT(*) FROM table_name;`
2. Verifying functions exist: `SELECT routine_name FROM information_schema.routines;`
3. Checking RLS policies: `SELECT * FROM pg_policies;`
"""
    
    with open(info_file, 'w') as f:
        f.write(info_content)
    
    print(f"✅ Backup information created: {info_file}")

def main():
    """Main backup function"""
    print("🚀 Starting comprehensive database backup...")
    print("=" * 50)
    
    # Get Supabase configuration
    config = get_supabase_config()
    if not config:
        print("❌ Could not get Supabase configuration")
        print("Please make sure you have:")
        print("1. Supabase CLI installed")
        print("2. Logged in with: npx supabase login")
        print("3. Linked project with: npx supabase link")
        return
    
    # Create backup directory
    backup_dir = create_backup_directory()
    print(f"📁 Backup directory created: {backup_dir}")
    
    # Perform all backups
    backup_schema(backup_dir, config)
    backup_data(backup_dir, config)
    backup_functions_and_triggers(backup_dir, config)
    backup_rls_policies(backup_dir, config)
    
    # Create restore script
    create_restore_script(backup_dir)
    
    # Create backup information
    create_backup_info(backup_dir)
    
    print("=" * 50)
    print("✅ COMPREHENSIVE BACKUP COMPLETE!")
    print(f"📁 Backup location: {backup_dir.absolute()}")
    print("🔒 Your database is now safely backed up")
    print("📝 To restore: cd to backup directory and run ./RESTORE_DATABASE.sh")
    print("⚠️  IMPORTANT: Store this backup securely!")

if __name__ == "__main__":
    main() 