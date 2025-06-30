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
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error downloading schema: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Error: Supabase CLI not found. Please install it first using:")
        print("npm install -g supabase")
        return False

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

def main():
    print("🚀 Starting schema download and type generation...")
    
    # Download schema
    if download_schema():
        # Generate types
        generate_types()
        print("🎉 Schema download and type generation completed!")
    else:
        print("💥 Schema download failed. Type generation skipped.")
        sys.exit(1)

if __name__ == "__main__":
    main() 