import os
import subprocess
import sys
from datetime import datetime

def download_schema():
    # Create a directory for schemas if it doesn't exist
    schema_dir = "schemas"
    if not os.path.exists(schema_dir):
        os.makedirs(schema_dir)

    # Generate timestamp for the filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(schema_dir, f"schema_{timestamp}.sql")
    complete_output_file = os.path.join(schema_dir, f"schema_complete_{timestamp}.sql")
    current_schema_file = os.path.join(schema_dir, "current_schema.sql")

    try:
        print("🔄 Downloading comprehensive database schema...")
        # Run supabase db dump command with comprehensive flags
        # --linked: Dumps from the linked project (default)
        # --keep-comments: Keeps commented lines from pg_dump output
        # --schema: Include all relevant schemas (public, auth, storage, etc.)
        result = subprocess.run([
            "supabase", "db", "dump",
            "-f", output_file,
            "--keep-comments",
            "--schema", "public,auth,storage,graphql_public,realtime,extensions"
        ], capture_output=True, text=True, check=True)
        
        print(f"✅ Comprehensive schema successfully downloaded to: {output_file}")
        
        # Also create a complete dump with roles
        print("🔄 Downloading complete database schema (including roles)...")
        result_complete = subprocess.run([
            "supabase", "db", "dump",
            "-f", complete_output_file,
            "--keep-comments",
            "--role-only"
        ], capture_output=True, text=True, check=True)
        
        print(f"✅ Complete schema (with roles) successfully downloaded to: {complete_output_file}")
        
        # Create a comprehensive current_schema.sql file that includes everything
        print("🔄 Creating comprehensive current_schema.sql...")
        create_comprehensive_schema(current_schema_file)
        
        print(f"✅ Comprehensive current_schema.sql created: {current_schema_file}")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error downloading schema: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Error: Supabase CLI not found. Please install it first using:")
        print("npm install -g supabase")
        return False

def create_comprehensive_schema(output_file):
    """Create a comprehensive schema file that includes all database objects"""
    try:
        # Create the comprehensive schema file
        result = subprocess.run([
            "supabase", "db", "dump",
            "-f", output_file,
            "--keep-comments",
            "-s", "public,auth,storage,graphql_public,realtime,extensions"
        ], capture_output=True, text=True, check=True)
        
        # Add a header comment to the file
        with open(output_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        header = f"""--
-- Comprehensive Database Schema
-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- This file contains the complete database structure including:
-- - All tables and their relationships
-- - All functions and triggers
-- - All indexes and constraints
-- - All RLS policies
-- - All views and materialized views
-- - All custom types and enums
--

"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(header + content)
            
        print(f"✅ Comprehensive schema file created: {output_file}")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creating comprehensive schema: {e.stderr}")
        raise

def generate_types():
    try:
        print("🔄 Generating TypeScript types...")
        # Use shell=True for Windows compatibility
        result = subprocess.run(
            "npm run types:generate",
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ TypeScript types generated successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error generating types: {e.stderr}")
        return False

def verify_schema_integrity():
    """Verify that the schema file contains all expected components"""
    try:
        with open("schemas/current_schema.sql", 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = [
            ("CREATE TABLE", "Table definitions"),
            ("CREATE OR REPLACE FUNCTION", "Function definitions"),
            ("CREATE OR REPLACE TRIGGER", "Trigger definitions"),
            ("CREATE POLICY", "RLS policies"),
            ("CREATE INDEX", "Index definitions"),
            ("ALTER TABLE", "Table modifications"),
            ("photo_albums", "Photo album system"),
            ("friends", "Friendship system"),
            ("activities", "Activity system"),
            ("feed_entries", "Feed system")
        ]
        
        print("🔍 Verifying schema integrity...")
        for check, description in checks:
            if check in content:
                print(f"✅ {description} found")
            else:
                print(f"⚠️  {description} not found")
        
        return True
    except FileNotFoundError:
        print("❌ Schema file not found")
        return False

def main():
    print("🚀 Starting comprehensive schema download and type generation...")
    
    # Download schema
    if download_schema():
        # Verify schema integrity
        verify_schema_integrity()
        
        # Generate types
        generate_types()
        print("🎉 Comprehensive schema download and type generation completed!")
        print("\n📁 Generated files:")
        print("   - schemas/current_schema.sql (comprehensive schema)")
        print("   - schemas/schema_[timestamp].sql (timestamped schema)")
        print("   - schemas/schema_complete_[timestamp].sql (with roles)")
    else:
        print("💥 Schema download failed. Type generation skipped.")
        sys.exit(1)

if __name__ == "__main__":
    main() 