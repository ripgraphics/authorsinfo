#!/usr/bin/env python3
"""
Simplified Enterprise Database Schema Backup
Focused on reliable schema backup with optional data backup.
"""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

class SimpleBackupManager:
    """Simplified database backup focusing on reliability."""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.schemas_dir = self.project_root / "schemas"
        self.backups_dir = self.project_root / "db_backups"
        
        # Ensure directories exist
        for directory in [self.schemas_dir, self.backups_dir]:
            directory.mkdir(exist_ok=True)
            
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def run_command(self, cmd: str, description: str = "") -> str:
        """Execute shell command with proper error handling."""
        try:
            print(f"🔄 {description or cmd}")
            
            result = subprocess.run(
                cmd, 
                shell=True, 
                capture_output=True, 
                text=True,
                encoding='utf-8',
                errors='replace',
                check=True,
                timeout=300
            )
            
            return result.stdout
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Command failed: {cmd}")
            print(f"Error: {e}")
            if e.stderr:
                print(f"Stderr: {e.stderr}")
            raise
        except subprocess.TimeoutExpired:
            print(f"⏰ Command timed out: {cmd}")
            raise

    def backup_schema(self):
        """Create reliable schema backup."""
        print("\n📋 Creating schema backup...")
        
        schema_output = self.run_command(
            "npx supabase db dump",
            "Downloading current database schema"
        )
        
        # Save to multiple locations for reliability
        current_schema = self.project_root / "current_schema.sql"
        timestamped_schema = self.schemas_dir / f"schema_{self.timestamp}.sql"
        
        for schema_file in [current_schema, timestamped_schema]:
            with open(schema_file, 'w', encoding='utf-8') as f:
                f.write(schema_output)
            print(f"   ✅ Saved: {schema_file}")
        
        # Statistics
        lines = len(schema_output.splitlines())
        size_kb = len(schema_output.encode('utf-8')) / 1024
        print(f"   📊 Schema: {lines:,} lines, {size_kb:.1f} KB")
        
        return schema_output

    def backup_data_safe(self):
        """Attempt data backup with fallback."""
        print("\n📊 Attempting data backup...")
        
        try:
            data_output = self.run_command(
                "npx supabase db dump --data-only",
                "Downloading database data"
            )
            
            # Save data backup
            data_file = self.backups_dir / f"data_only_{self.timestamp}.sql"
            main_data_file = self.backups_dir / "data_only_backup.sql"
            
            for file_path in [data_file, main_data_file]:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(data_output)
                print(f"   ✅ Data saved: {file_path}")
            
            lines = len(data_output.splitlines())
            size_kb = len(data_output.encode('utf-8')) / 1024
            print(f"   📊 Data: {lines:,} lines, {size_kb:.1f} KB")
            
            return data_output
            
        except Exception as e:
            print(f"   ⚠️  Data backup failed: {e}")
            print(f"   ℹ️  This is often due to large datasets or special characters")
            print(f"   ℹ️  Schema backup is still complete and usable")
            return None

    def create_recovery_guide(self):
        """Create simple recovery instructions."""
        print("\n📋 Creating recovery guide...")
        
        guide_content = f"""# Database Recovery Guide
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Files Created:
- current_schema.sql (main schema file)
- schemas/schema_{self.timestamp}.sql (timestamped backup)
- db_backups/data_only_{self.timestamp}.sql (if data backup succeeded)

## Recovery Commands:

### Restore Schema Only:
```bash
npx supabase db reset --linked
npx supabase db push
```

### Manual Schema Restore (if needed):
```bash
# Connect to your database and run:
psql -h your-db-host -U postgres -d postgres -f current_schema.sql
```

### Check what was backed up:
- Schema file: current_schema.sql
- Check file size and content before applying
- Always test on development environment first

## Verification:
After restore, verify:
- [ ] All tables exist
- [ ] Application connects
- [ ] Core functionality works
"""
        
        guide_file = self.backups_dir / f"RECOVERY_GUIDE_{self.timestamp}.md"
        with open(guide_file, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        print(f"   ✅ Recovery guide: {guide_file}")

    def execute_backup(self):
        """Execute the backup process."""
        print("🚀 Starting Simple Database Backup")
        print(f"   Timestamp: {self.timestamp}")
        print(f"   Project: {self.project_root}")
        
        try:
            # 1. Schema backup (reliable)
            schema_data = self.backup_schema()
            
            # 2. Data backup (attempt with graceful failure)
            data_data = self.backup_data_safe()
            
            # 3. Recovery guide
            self.create_recovery_guide()
            
            print(f"\n🎉 BACKUP COMPLETED!")
            print(f"   📋 Schema: ✅ Backed up successfully")
            print(f"   📊 Data: {'✅ Backed up' if data_data else '⚠️ Failed (schema backup still valid)'}")
            print(f"   📁 Files in: {self.backups_dir}")
            
        except Exception as e:
            print(f"\n❌ BACKUP FAILED: {e}")
            sys.exit(1)

def main():
    """Main entry point."""
    manager = SimpleBackupManager()
    manager.execute_backup()

if __name__ == "__main__":
    main()